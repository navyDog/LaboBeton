import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginScreen } from '../LoginScreen';
import { User as UserType } from '../../types';

// Mock de la fonction fetch
global.fetch = jest.fn();

describe('LoginScreen', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    expect(screen.getByPlaceholderText('votre_identifiant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Accéder à l\'espace')).toBeInTheDocument();
  });

  it('updates username and password fields correctly', () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('votre_identifiant');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('handles successful login', async () => {
    const mockUser: UserType = { id: '1', username: 'Test User', role: 'standard' };
    const mockToken = 'fake-token';

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken })
    });

    render(<LoginScreen onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('votre_identifiant');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Accéder à l\'espace');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(mockUser, mockToken);
    });
  });

  it('handles failed login', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' })
    });

    render(<LoginScreen onLogin={mockOnLogin} />);

    const usernameInput = screen.getByPlaceholderText('votre_identifiant');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Accéder à l\'espace');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});