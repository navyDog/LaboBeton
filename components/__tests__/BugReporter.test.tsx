import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { BugReporter } from '../BugReporter';

// Mock de fetch pour window.fetch puisque authenticatedFetch utilise window.fetch
const mockFetch = jest.fn();
window.fetch = mockFetch;

describe('BugReporter Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('ne s\'affiche que sous forme de bouton flottant initialement', () => {
    render(<BugReporter token="test-token" username="tester" />);
    // Le bouton avec l'icône Bug (title "Signaler un problème")
    expect(screen.getByTitle('Signaler un problème')).toBeInTheDocument();
    // Le formulaire ne doit pas être visible
    expect(screen.queryByText('Type de message')).not.toBeInTheDocument();
  });

  test('ouvre le formulaire au clic', () => {
    render(<BugReporter token="test-token" username="tester" />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));
    expect(screen.getByText('Support & Bugs')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Décrivez le problème...')).toBeInTheDocument();
  });

  test('envoie le rapport et affiche le succès', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Signalement reçu' })
    });

    render(<BugReporter token="test-token" username="tester" />);
    
    // Ouvrir
    fireEvent.click(screen.getByTitle('Signaler un problème'));
    
    // Remplir
    fireEvent.change(screen.getByPlaceholderText('Décrivez le problème...'), { target: { value: 'Ceci est un bug test' } });
    
    // Envoyer
    fireEvent.click(screen.getByText('Envoyer'));

    // Vérifier l'état d'envoi
    expect(screen.getByText('Envoi...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/bugs', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify({
          type: 'bug',
          description: 'Ceci est un bug test',
          user: 'tester'
        })
      }));
    });

    // Vérifier message de succès
    await waitFor(() => {
        expect(screen.getByText('Merci ! Message envoyé.')).toBeInTheDocument();
    });
  });
});