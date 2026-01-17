import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminUserForm } from '../AdminUserForm';
import { authenticatedFetch } from '../../utils/api';
import { User } from "../../types";

// Mock the authenticatedFetch function
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn(),
}));

const mockCurrentUser: User = {
  id: 'user1',
  token: 'mock-token',
  username: 'admin',
  role: 'admin',
  isActive: true,
};

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

describe('AdminUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Nouveau Compte Client')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom d\'utilisateur *')).toHaveValue('');
    expect(screen.getByLabelText('Mot de passe *')).toHaveValue('');
    expect(screen.getByLabelText('Rôle')).toHaveValue('standard');
    expect(screen.getByLabelText('Compte Actif (Connexion autorisée)')).toBeChecked();
  });

  it('updates form data on input change', () => {
    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Nom d\'utilisateur *'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Mot de passe *'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Rôle'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Compte Actif (Connexion autorisée)'), { target: { checked: false } });

    expect(screen.getByLabelText('Nom d\'utilisateur *')).toHaveValue('testuser');
    expect(screen.getByLabelText('Mot de passe *')).toHaveValue('password123');
    expect(screen.getByLabelText('Rôle')).toHaveValue('admin');
    expect(screen.getByLabelText('Compte Actif (Connexion autorisée)')).not.toBeChecked();
  });

  it('handles successful form submission', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User created successfully' }),
    });

    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Nom d\'utilisateur *'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Mot de passe *'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByTestId('admin-user-form'));

    await waitFor(() => {
      expect(screen.getByText('Utilisateur créé avec succès !')).toBeInTheDocument();
    });

    // Attendre que onSuccess soit appelé après le délai de 1500ms
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    }, { timeout: 2000 }); // Augmenter le timeout pour s'assurer que le délai est respecté
  });

  it('handles failed form submission', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error creating user' }),
    });

    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Nom d\'utilisateur *'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Mot de passe *'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByTestId('admin-user-form'));

    await waitFor(() => {
      expect(screen.getByText('Error creating user')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (authenticatedFetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => ({ message: 'User created successfully' }),
    }), 500)));

    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Nom d\'utilisateur *'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Mot de passe *'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByTestId('admin-user-form'));

    expect(screen.getByRole('button', { name: /créer l'utilisateur/i })).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Utilisateur créé avec succès !')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<AdminUserForm currentUser={mockCurrentUser} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByText('Annuler'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});