import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsManager } from '../SettingsManager';
import { authenticatedFetch } from '../../utils/api';
import { Settings } from '../../types';

// Mock the authenticatedFetch function
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn(),
}));

const mockToken = 'test-token';

const mockSettings: Settings = {
  _id: "123",
  concreteClasses: ['C25/30', 'C30/37'],
  consistencyClasses: ['S3', 'S4'],
  mixTypes: ['CEM II/A 350kg'],
  specimenTypes: ['Cylindrique 16x32'],
  curingMethods: ['Eau 20°C'],
  testTypes: ['Compression'],
  preparations: ['Surfaçage Soufre'],
  deliveryMethods: ['Toupie'],
  manufacturingPlaces: ['Centrale BPE'],
  nfStandards: ['NF EN 206/CN'],
};

describe('SettingsManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (authenticatedFetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<SettingsManager token={mockToken} />);
    expect(screen.getByText('Chargement des configurations...')).toBeInTheDocument();
  });

  it('renders error state when settings fail to load', async () => {
    (authenticatedFetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement des données.')).toBeInTheDocument();
    });
  });

  it('renders correctly with loaded settings', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    });
    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Réglages Laboratoire')).toBeInTheDocument();
      expect(screen.getByText('Classes de Résistance')).toBeInTheDocument();
      expect(screen.getByText('C25/30')).toBeInTheDocument();
    });
  });

  it('adds a new item to a list', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    });
    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Classes de Résistance')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('ex: C25/30'), {
      target: { value: 'C35/45' },
    });
    fireEvent.click(screen.getByTestId('add-concrete-classes'));

    expect(screen.getByText('C35/45')).toBeInTheDocument();
  });

  it('removes an item from a list', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    });
    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('C25/30')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('remove-concrete-classes-0'));

    expect(screen.queryByText('C25/30')).not.toBeInTheDocument();
  });

  it('saves settings successfully', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Classes de Résistance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Enregistrer tout'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(mockSettings),
      });
      expect(screen.getByText('Réglages enregistrés avec succès.')).toBeInTheDocument();
    });
  });

  it('handles save failure', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Classes de Résistance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Enregistrer tout'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(mockSettings),
      });
      expect(screen.getByText('Erreur lors de l\'enregistrement.')).toBeInTheDocument();
    });
  });

  it('reloads settings when refresh button is clicked', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    });

    render(<SettingsManager token={mockToken} />);
    await waitFor(() => {
      expect(screen.getByText('Classes de Résistance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Recharger'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledTimes(2);
    });
  });
});