import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RelationsManager } from '../RelationsManager';
import { CompanyManager } from '../CompanyManager';
import { ProjectManager } from '../ProjectManager';

// Mock child components
jest.mock('../CompanyManager', () => ({
  CompanyManager: jest.fn(() => <div>Mocked CompanyManager</div>)
}));
jest.mock('../ProjectManager', () => ({
  ProjectManager: jest.fn(() => <div>Mocked ProjectManager</div>)
}));

describe('RelationsManager', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<RelationsManager token={mockToken} />);

    // Check tab buttons are rendered
    expect(screen.getByText('Entreprises (Clients)')).toBeInTheDocument();
    expect(screen.getByText('Affaires (Chantiers)')).toBeInTheDocument();

    // Check default active tab is companies
    expect(screen.getByText('Entreprises (Clients)')).toHaveClass('bg-white text-concrete-900');
    expect(screen.getByText('Affaires (Chantiers)')).toHaveClass('text-concrete-500');

    // Check CompanyManager is rendered by default
    expect(CompanyManager).toHaveBeenCalledWith({ token: mockToken }, {});
    expect(ProjectManager).not.toHaveBeenCalled();
  });

  it('switches to projects tab when clicked', () => {
    render(<RelationsManager token={mockToken} />);

    // Click on projects tab
    fireEvent.click(screen.getByText('Affaires (Chantiers)'));

    // Check projects tab is active
    expect(screen.getByText('Affaires (Chantiers)')).toHaveClass('bg-white text-concrete-900');
    expect(screen.getByText('Entreprises (Clients)')).toHaveClass('text-concrete-500');

    // Check ProjectManager is rendered
    expect(ProjectManager).toHaveBeenCalledWith({ token: mockToken }, {});
    // Check CompanyManager is not called after switching to projects
    expect(CompanyManager).toHaveBeenCalledTimes(1);
  });

  it('switches back to companies tab when clicked', () => {
    render(<RelationsManager token={mockToken} />);

    // First switch to projects
    fireEvent.click(screen.getByText('Affaires (Chantiers)'));

    // Then switch back to companies
    fireEvent.click(screen.getByText('Entreprises (Clients)'));

    // Check companies tab is active again
    expect(screen.getByText('Entreprises (Clients)')).toHaveClass('bg-white text-concrete-900');
    expect(screen.getByText('Affaires (Chantiers)')).toHaveClass('text-concrete-500');

    // Check CompanyManager is rendered again
    expect(CompanyManager).toHaveBeenCalledTimes(2);
    expect(CompanyManager).toHaveBeenLastCalledWith({ token: mockToken }, {});
  });

  it('passes token prop correctly to child components', () => {
    render(<RelationsManager token={mockToken} />);

    // Check token is passed to CompanyManager by default
    expect(CompanyManager).toHaveBeenCalledWith(expect.objectContaining({
      token: mockToken
    }), {});

    // Switch to projects tab
    fireEvent.click(screen.getByText('Affaires (Chantiers)'));

    // Check token is passed to ProjectManager
    expect(ProjectManager).toHaveBeenCalledWith(expect.objectContaining({
      token: mockToken
    }), {});
  });
});