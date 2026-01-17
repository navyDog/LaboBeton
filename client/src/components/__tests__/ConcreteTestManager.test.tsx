import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConcreteTestManager } from '../ConcreteTestManager';
import { authenticatedFetch } from '../../utils/api';

jest.mock('../../utils/api');

describe('ConcreteTestManager', () => {
  const token = 'test-token';
  const mockTests = [
    {
      _id: '1',
      reference: 'Test 1',
      projectName: 'Project 1',
      companyName: 'Company 1',
      structureName: 'Structure 1',
      concreteClass: 'Class 1',
      receptionDate: '2023-10-01T00:00:00Z',
      samplingDate: '2023-10-02T00:00:00Z',
      specimens: [
        { number: 1, age: 28, castingDate: '2023-10-02T00:00:00Z', crushingDate: '2023-10-30T00:00:00Z', specimenType: 'Cylindrique', diameter: 160, height: 320, surface: 20106.19, weight: 8000, force: 300, stress: 14.92, density: 2400 }
      ]
    }
  ];

  const mockProjects = [
    {
      _id: '1',
      name: 'Project 1',
      companyName: 'Company 1',
      moa: 'MOA 1',
      moe: 'MOE 1',
      contactName: 'Contact 1',
      email: 'contact1@company.com',
      phone: '123456789'
    }
  ];

  const mockCompanies = [
    {
      _id: '1',
      name: 'Company 1',
      contactName: 'Contact 1',
      email: 'contact1@company.com',
      phone: '123456789'
    }
  ];

  const mockSettings = {
    concreteClasses: ['Class 1', 'Class 2'],
    mixTypes: ['Type 1', 'Type 2'],
    manufacturingPlaces: ['Place 1', 'Place 2'],
    deliveryMethods: ['Method 1', 'Method 2']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTests
    });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects
    });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCompanies
    });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the initial view with title and add button', async () => {
    render(<ConcreteTestManager token={token} onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Fiches de Prélèvement')).toBeInTheDocument();
      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });
  });

  it('opens the add form when the add button is clicked', async () => {
    render(<ConcreteTestManager token={token} onBack={() => {}} />);
    fireEvent.click(screen.getByText('Nouveau'));
    expect(screen.getByText('Nouveau Prélèvement')).toBeInTheDocument();
  });

  it('closes the form when the cancel button is clicked', async () => {
    render(<ConcreteTestManager token={token} onBack={() => {}} />);
    fireEvent.click(screen.getByText('Nouveau'));
    await act(async () => {
      fireEvent.click(screen.getByText('Annuler'));
    });
    expect(screen.queryByText('Nouveau Prélèvement')).not.toBeInTheDocument();
  });
});