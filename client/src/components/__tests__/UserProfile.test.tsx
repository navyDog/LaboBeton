import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../UserProfile';
import { authenticatedFetch } from '../../utils/api';
import {User} from "../../types";

// Mock the authenticatedFetch function
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn(),
}));

const mockUser: User = {
  id: 'user1',
  token: 'mock-token',
  username: 'admin',
  role: 'admin',
  isActive: true,
  companyName: 'Test Company',
  address: '123 Test St',
  contact: 'test@example.com',
  siret: '12345678900012',
  apeCode: '7120B',
  legalInfo: 'RCS Paris B 123 456 789',
  logo: '',
};

const mockToken = 'test-token';
const mockOnUpdate = jest.fn();

describe('UserProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial data', () => {
    render(<UserProfile token={mockToken} currentUser={mockUser} onUpdate={mockOnUpdate} />);

    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678900012')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7120B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('RCS Paris B 123 456 789')).toBeInTheDocument();
  });

  it('updates form data on input change', () => {
    render(<UserProfile token={mockToken} currentUser={mockUser} onUpdate={mockOnUpdate} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: Mon Labo BTP Expert'), {
      target: { value: 'New Company Name' },
    });
    expect(screen.getByDisplayValue('New Company Name')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Adresse Complète/i), {
      target: { value: 'New Address' },
    });
    expect(screen.getByDisplayValue('New Address')).toBeInTheDocument();
  });

  it('handles image upload correctly', () => {
    render(<UserProfile token={mockToken} currentUser={mockUser} onUpdate={mockOnUpdate} />);

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Logo/i), { target: { files: [file] } });

    const reader = new FileReader();
    reader.onloadend = jest.fn().mockImplementation(() => {
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });
    reader.readAsDataURL(file);
  });

  it('removes logo when remove button is clicked', () => {
    const userWithLogo = { ...mockUser, logo: 'data:image/png;base64,someBase64String' };
    render(<UserProfile token={mockToken} currentUser={userWithLogo} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByText('Supprimer le logo'));
    expect(screen.queryByAltText('Logo')).not.toBeInTheDocument();
  });

  it('handles form submission failure', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Update failed' }),
    });

    render(<UserProfile token={mockToken} currentUser={mockUser} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByText('Enregistrer les modifications'));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });
});