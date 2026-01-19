import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileMenu from '../MobileMenu';

describe('MobileMenu', () => {
  const onNavigate = jest.fn();
  const onLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the mobile menu with the correct content', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    expect(screen.getByText(/Tableau de Bord/i)).toBeInTheDocument();
    expect(screen.getByText(/Prélèvements/i)).toBeInTheDocument();
    expect(screen.getByText(/Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/Entreprises/i)).toBeInTheDocument();
    expect(screen.getByText(/Affaires/i)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres/i)).toBeInTheDocument();
    expect(screen.getByText(/Mon Profil/i)).toBeInTheDocument();
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();
  });

  it('should call onNavigate with the correct argument when dashboard button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Tableau de Bord/i));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('should call onNavigate with the correct argument when fresh_tests button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Prélèvements/i));
    expect(onNavigate).toHaveBeenCalledWith('fresh_tests');
  });

  it('should call onNavigate with the correct argument when calendar button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Planning/i));
    expect(onNavigate).toHaveBeenCalledWith('calendar');
  });

  it('should call onNavigate with the correct argument when companies button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Entreprises/i));
    expect(onNavigate).toHaveBeenCalledWith('companies');
  });

  it('should call onNavigate with the correct argument when projects button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Affaires/i));
    expect(onNavigate).toHaveBeenCalledWith('projects');
  });

  it('should call onNavigate with the correct argument when settings button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Paramètres/i));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('should call onNavigate with the correct argument when profile button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Mon Profil/i));
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });

  it('should call onLogout when logout button is clicked', () => {
    render(<MobileMenu onNavigate={onNavigate} onLogout={onLogout} />);

    fireEvent.click(screen.getByText(/Déconnexion/i));
    expect(onLogout).toHaveBeenCalled();
  });
});