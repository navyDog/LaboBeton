import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardHome } from '../DashboardHome';
import { authenticatedFetch } from '../../utils/api';

// Helper function to classify task types based on date difference
const getTaskTypeFromDateDiff = (diffTime: number): 'overdue' | 'today' | 'upcoming' | 'week' | null => {
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let type: 'overdue' | 'today' | 'upcoming' | 'week' | null = null;

  if (diffDays < 0) type = 'overdue';
  else if (diffDays === 0) type = 'today';
  else if (diffDays === 1) type = 'upcoming';
  else if (diffDays > 1 && diffDays <= 7) type = 'week';

  return type;
};

// Mock the authenticatedFetch function
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn(),
}));

const mockAuthenticatedFetch = authenticatedFetch as jest.MockedFunction<typeof authenticatedFetch>;

describe('DashboardHome', () => {
  const token = 'test-token';
  const userDisplayName = 'Test User';
  const onNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<DashboardHome token={token} userDisplayName={userDisplayName} onNavigate={onNavigate} />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders empty state when no tasks are available', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<DashboardHome token={token} userDisplayName={userDisplayName} onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Tout est à jour !')).toBeInTheDocument();
      expect(screen.getByText('Aucun écrasement prévu prochainement.')).toBeInTheDocument();
    });
  });

  it('navigates to fresh_tests when clicking on upcoming task', async () => {
    const mockTests = [
      {
        _id: '1',
        reference: 'TEST-001',
        projectName: 'Project A',
        specimens: [
          {
            stress: null,
            crushingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            age: 28,
            number: 1,
          },
        ],
      },
    ];

    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTests,
    } as Response);

    render(<DashboardHome token={token} userDisplayName={userDisplayName} onNavigate={onNavigate} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cette Semaine'));
    });

    expect(onNavigate).toHaveBeenCalledWith('fresh_tests', '1');
  });

  it('displays error message when API call fails', async () => {
    mockAuthenticatedFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<DashboardHome token={token} userDisplayName={userDisplayName} onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
    });
  });

  it('classifies task types correctly based on date differences', () => {
    // Test overdue (past date)
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const diffTimePast = pastDate.getTime() - Date.now();
    expect(getTaskTypeFromDateDiff(diffTimePast)).toBe('overdue');

    // Test today (same day)
    const todayDate = new Date();
    const diffTimeToday = todayDate.getTime() - Date.now();
    expect(getTaskTypeFromDateDiff(diffTimeToday)).toBe('today');

    // Test upcoming (tomorrow)
    const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const diffTimeTomorrow = tomorrowDate.getTime() - Date.now();
    expect(getTaskTypeFromDateDiff(diffTimeTomorrow)).toBe('upcoming');

    // Test week (3 days from now)
    const weekDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    const diffTimeWeek = weekDate.getTime() - Date.now();
    expect(getTaskTypeFromDateDiff(diffTimeWeek)).toBe('week');

    // Test null (more than a week away)
    const futureDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 days from now
    const diffTimeFuture = futureDate.getTime() - Date.now();
    expect(getTaskTypeFromDateDiff(diffTimeFuture)).toBeNull();
  });

  it('displays task counts correctly', async () => {
    const mockTests = [
      {
        _id: '1',
        reference: 'TEST-001',
        projectName: 'Project A',
        specimens: [
          {
            stress: null,
            crushingDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday (overdue)
            age: 28,
            number: 1,
          },
          {
            stress: null,
            crushingDate: new Date().toISOString(), // Today
            age: 28,
            number: 2,
          },
          {
            stress: null,
            crushingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
            age: 28,
            number: 3,
          },
        ],
      },
    ];

    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTests,
    } as Response);

    render(<DashboardHome token={token} userDisplayName={userDisplayName} onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('1 Retard')).toBeInTheDocument();
      expect(screen.getByText('1 Auj.')).toBeInTheDocument();
      expect(screen.getByText('1 Semaine')).toBeInTheDocument();
    });
  });
});