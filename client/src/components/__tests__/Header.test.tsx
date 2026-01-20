import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { ConnectionStatus, User } from '../../types';

describe('Header', () => {
  const currentUser: User = {
    id: '1',
    username: 'testuser',
    role:'standard',
    companyName: 'Test Company',
    logo: 'logo-url',
  };
  const dbStatus: ConnectionStatus = ConnectionStatus.CONNECTED;
  const view = 'dashboard';
  const onNavigate = jest.fn();
  const onLogout = jest.fn();
  const mobileMenuOpen = false;
  const onToggleMobileMenu = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header with the correct content', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={view}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    expect(screen.getByText(/LaboBéton/i)).toBeInTheDocument();
    expect(screen.getByText(/v0.2.1-beta.1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Company/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Mon Profil/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Déconnexion/i)).toBeInTheDocument();
  });

  it('should call onNavigate with the correct argument when dashboard logo is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={view}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/LaboBéton/i));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('should call onNavigate with the correct argument when fresh_tests button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={'fresh_tests'}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/Prélèvements/i));
    expect(onNavigate).toHaveBeenCalledWith('fresh_tests');
  });

  it('should call onNavigate with the correct argument when calendar button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={'calendar'}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/Planning/i));
    expect(onNavigate).toHaveBeenCalledWith('calendar');
  });

  it('should call onNavigate with the correct argument when companies button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={'companies'}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/Entreprises/i));
    expect(onNavigate).toHaveBeenCalledWith('companies');
  });

  it('should call onNavigate with the correct argument when projects button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={'projects'}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/Affaires/i));
    expect(onNavigate).toHaveBeenCalledWith('projects');
  });

  it('should call onNavigate with the correct argument when settings button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={'settings'}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByText(/Paramètres/i));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('should call onNavigate with the correct argument when profile button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={view}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByTitle(/Mon Profil/i));
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });

  it('should call onLogout when logout button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={view}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByTitle(/Déconnexion/i));
    expect(onLogout).toHaveBeenCalled();
  });

  it('should call onToggleMobileMenu when mobile menu button is clicked', () => {
    render(
      <Header
        currentUser={currentUser}
        dbStatus={dbStatus}
        view={view}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(onToggleMobileMenu).toHaveBeenCalled();
  });
});