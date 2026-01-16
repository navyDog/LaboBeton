import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LegalPage } from '../LegalPage';

describe('LegalPage', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CGU content correctly', () => {
    render(<LegalPage type="cgu" onBack={mockOnBack} />);

    expect(screen.getByText('Conditions Générales d\'Utilisation (CGU)')).toBeInTheDocument();
    expect(screen.getByText('1. Objet')).toBeInTheDocument();
    expect(screen.getByText('2. Responsabilité & Avertissement Technique')).toBeInTheDocument();
    expect(screen.getByText('3. Accès au service')).toBeInTheDocument();
    expect(screen.getByText('4. Propriété Intellectuelle')).toBeInTheDocument();
  });

  it('renders Privacy Policy content correctly', () => {
    render(<LegalPage type="privacy" onBack={mockOnBack} />);

    expect(screen.getByText('Politique de Confidentialité')).toBeInTheDocument();
    expect(screen.getByText('1. Collecte des données')).toBeInTheDocument();
    expect(screen.getByText('2. Utilisation des données')).toBeInTheDocument();
    expect(screen.getByText('3. Sécurité')).toBeInTheDocument();
  });

  it('renders Mentions Légales content correctly', () => {
    render(<LegalPage type="mentions" onBack={mockOnBack} />);

    expect(screen.getByText('Mentions Légales')).toBeInTheDocument();
    expect(screen.getByText('1. Éditeur')).toBeInTheDocument();
    expect(screen.getByText('2. Hébergement')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LegalPage type="cgu" onBack={mockOnBack} />);

    const backButton = screen.getByText('Retour au tableau de bord');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('displays the correct update date', () => {
    const currentDate = new Date().toLocaleDateString('fr-FR');

    render(<LegalPage type="cgu" onBack={mockOnBack} />);

    expect(screen.getByText(`Dernière mise à jour : ${currentDate}`)).toBeInTheDocument();
  });
});