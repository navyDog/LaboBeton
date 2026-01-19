import React from 'react';
import { render, screen, act } from '@testing-library/react';
import MainContent from '../MainContent';
import { ConnectionStatus, User } from '../../types';

describe('MainContent', () => {
  const currentUser: User = {
    id: '1',
    username: 'testuser',
    role: 'standard',
    companyName: 'Test Company',
    token: 'token123',
  };
  const onNavigate = jest.fn();
  const onLogout = jest.fn();
  const onUpdateUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the server disconnected message when dbStatus is ERROR', () => {
    render(
      <MainContent
        currentUser={currentUser}
        dbStatus={ConnectionStatus.ERROR}
        view="dashboard"
        selectedTestId={null}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
    );

    expect(screen.getByText(/Serveur déconnecté/i)).toBeInTheDocument();
    expect(screen.getByText(/Impossible de joindre la base de données/i)).toBeInTheDocument();
  });

  it('should render LegalPage with type "cgu" when view is "legal_cgu"', () => {
    render(
      <MainContent
        currentUser={currentUser}
        dbStatus={ConnectionStatus.CONNECTED}
        view="legal_cgu"
        selectedTestId={null}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
    );

    expect(screen.getByText(/Conditions Générales d'Utilisation/i)).toBeInTheDocument();
  });

  it('should render LegalPage with type "privacy" when view is "legal_privacy"', () => {
    render(
      <MainContent
        currentUser={currentUser}
        dbStatus={ConnectionStatus.CONNECTED}
        view="legal_privacy"
        selectedTestId={null}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
    );

    expect(screen.getByText(/Politique de Confidentialité/i)).toBeInTheDocument();
  });

  it('should render LegalPage with type "mentions" when view is "legal_mentions"', () => {
    render(
      <MainContent
        currentUser={currentUser}
        dbStatus={ConnectionStatus.CONNECTED}
        view="legal_mentions"
        selectedTestId={null}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
    );

    expect(screen.getByText(/Mentions Légales/i)).toBeInTheDocument();
  });

  it('should render DashboardHome when view is "dashboard" and dbStatus is not ERROR', () => {
    render(
      <MainContent
        currentUser={currentUser}
        dbStatus={ConnectionStatus.CONNECTED}
        view="dashboard"
        selectedTestId={null}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
    );

    expect(screen.getByText(/Tableau de Bord/i)).toBeInTheDocument();
  });
});