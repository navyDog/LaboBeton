import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickEntryModal } from '../QuickEntryModal';
import { authenticatedFetch } from '../../utils/api';

// Mock de la fonction authenticatedFetch
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn()
}));

describe('QuickEntryModal', () => {
  const mockProps = {
    testId: 'test-id-123',
    testReference: 'REF-123',
    projectName: 'Projet Test',
    targetDate: '2023-10-01',
    token: 'test-token-123',
    onClose: jest.fn(),
    onSuccess: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    render(<QuickEntryModal {...mockProps} />);

    expect(screen.getByText('Saisie Rapide : Écrasements du Jour')).toBeInTheDocument();
    expect(screen.getByText('Chargement des éprouvettes...')).toBeInTheDocument();
  });

  it('loads test data and displays specimens', async () => {
    const mockTestData = {
      _id: 'test-id-123',
      specimens: [
        { number: 1, age: 7, weight: 2400, force: 600.5, crushingDate: '2023-10-01T10:00:00Z' },
        { number: 2, age: 7, weight: 2450, force: 610.0, crushingDate: '2023-10-01T10:00:00Z' }
      ]
    };

    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTestData]
    });

    render(<QuickEntryModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  it('handles input changes correctly', async () => {
    const mockTestData = {
      _id: 'test-id-123',
      specimens: [
        { number: 1, age: 7, weight: 2400, force: 600.5, crushingDate: '2023-10-01T10:00:00Z' }
      ]
    };

    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTestData]
    });

    render(<QuickEntryModal {...mockProps} />);

    await waitFor(() => {
      const weightInput = screen.getByPlaceholderText('ex: 2400');
      fireEvent.change(weightInput, { target: { value: '2500' } });
      expect(weightInput).toHaveValue(2500);
    });
  });

  it('saves data correctly', async () => {
    const mockTestData = {
      _id: 'test-id-123',
      specimens: [
        { number: 1, age: 7, weight: 2400, force: 600.5, crushingDate: '2023-10-01T10:00:00Z' }
      ]
    };

    // Mock initial fetch for loading test data
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTestData]
    });

    // Mock save request
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true
    });

    render(<QuickEntryModal {...mockProps} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Enregistrer les Résultats');
    fireEvent.click(saveButton);

    // Wait for save operation to complete
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('closes modal correctly', () => {
    render(<QuickEntryModal {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: /annuler/i });
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });
});