import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';
import { StatusBadge } from '../StatusBadge';
import { ConnectionStatus } from '../../types';

describe('StatusBadge Component', () => {
  test('affiche l\'état de chargement', () => {
    render(<StatusBadge status={ConnectionStatus.CHECKING} />);
    const badge = screen.getByText(/Connexion.../i);
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-blue-50');
  });

  test('affiche l\'état connecté', () => {
    render(<StatusBadge status={ConnectionStatus.CONNECTED} />);
    const badge = screen.getByText(/Système Connecté/i);
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-green-50');
  });

  test('affiche l\'état d\'erreur', () => {
    render(<StatusBadge status={ConnectionStatus.ERROR} />);
    const badge = screen.getByText(/Erreur Connexion/i);
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-red-50');
  });
});