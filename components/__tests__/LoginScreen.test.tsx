import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { LoginScreen } from '../LoginScreen';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LoginScreen Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('rend le formulaire de connexion', () => {
    render(<LoginScreen onLogin={() => {}} />);
    expect(screen.getByPlaceholderText('votre_identifiant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accéder à l'espace/i })).toBeInTheDocument();
  });

  test('gère la soumission réussie', async () => {
    const handleLogin = jest.fn();
    const mockUser = { id: '1', username: 'testuser', role: 'standard' };
    const mockToken = 'fake-jwt-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    render(<LoginScreen onLogin={handleLogin} />);

    fireEvent.change(screen.getByPlaceholderText('votre_identifiant'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button'));

    // Vérifie l'état de chargement
    expect(screen.getByText(/Connexion.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      }));
      expect(handleLogin).toHaveBeenCalledWith(mockUser, mockToken);
    });
  });

  test('affiche une erreur en cas d\'échec de connexion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Identifiants incorrects' }),
    });

    render(<LoginScreen onLogin={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('votre_identifiant'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
    });
  });
});