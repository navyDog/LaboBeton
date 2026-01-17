import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CompanyManager } from '../CompanyManager';
import { authenticatedFetch } from '../../utils/api';

jest.mock('../../utils/api');

describe('CompanyManager', () => {
  const token = 'test-token';
  const mockCompanies = [
    {
      _id: '1',
      name: 'Company 1',
      contactName: 'Contact 1',
      email: 'contact1@company.com',
      phone: '123456789'
    },
    {
      _id: '2',
      name: 'Company 2',
      contactName: 'Contact 2',
      email: 'contact2@company.com',
      phone: '987654321'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCompanies
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the initial view with title and add button', async () => {
    render(<CompanyManager token={token} />);
    await waitFor(() => {
      expect(screen.getByText('Mes Entreprises')).toBeInTheDocument();
      expect(screen.getByText('Nouvelle Entreprise')).toBeInTheDocument();
    });
  });

  it('opens the add form when the add button is clicked', async () => {
    render(<CompanyManager token={token} />);
    fireEvent.click(screen.getByText('Nouvelle Entreprise'));
    expect(screen.getByText('Ajouter une entreprise')).toBeInTheDocument();
  });

  it('closes the form when the cancel button is clicked', async () => {
    render(<CompanyManager token={token} />);
    fireEvent.click(screen.getByText('Nouvelle Entreprise'));
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Annuler formulaire'));
    });
    expect(screen.queryByText('Ajouter une entreprise')).not.toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });
    render(<CompanyManager token={token} />);
    fireEvent.click(screen.getByText('Nouvelle Entreprise'));

    fireEvent.change(screen.getByLabelText('Nom de l\'entreprise *'), { target: { value: 'New Company' } });
    fireEvent.change(screen.getByLabelText('Contact Principal'), { target: { value: 'New Contact' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newcontact@company.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '123456789' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Enregistrer'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Ajouter une entreprise')).not.toBeInTheDocument();
    });
  });

  it('handles form submission failure', async () => {
    (authenticatedFetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<CompanyManager token={token} />);
    fireEvent.click(screen.getByText('Nouvelle Entreprise'));

    fireEvent.change(screen.getByLabelText('Nom de l\'entreprise *'), { target: { value: 'New Company' } });
    fireEvent.change(screen.getByLabelText('Contact Principal'), { target: { value: 'New Contact' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newcontact@company.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '123456789' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Enregistrer'));
    });

    await waitFor(() => {
      expect(screen.getByText('Ajouter une entreprise')).toBeInTheDocument();
    });
  });

  it('opens the edit form with correct data', async () => {
    render(<CompanyManager token={token} />);
    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Modifier')[0]);
      expect(screen.getByText('Modifier l\'entreprise')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom de l\'entreprise *')).toHaveValue('Company 1');
      expect(screen.getByLabelText('Contact Principal')).toHaveValue('Contact 1');
      expect(screen.getByLabelText('Email')).toHaveValue('contact1@company.com');
      expect(screen.getByLabelText('Téléphone')).toHaveValue('123456789');
    });
  });
});