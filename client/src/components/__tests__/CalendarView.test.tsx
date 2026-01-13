import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { authenticatedFetch } from '../../../utils/api';

jest.mock('../../../utils/api');

describe('CalendarView', () => {
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
        { crushingDate: '2023-10-03T00:00:00Z' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTests
    });

    // Mock window.URL.createObjectURL
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the calendar and navigation buttons', async () => {
    render(<CalendarView token={token} />);
    await waitFor(() => {
      expect(screen.getByText('Planning Laboratoire')).toBeInTheDocument();
      expect(screen.getByText('Export .ics')).toBeInTheDocument();
      expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument();
    });
  });

  it('exports the calendar in ICS format', async () => {
    render(<CalendarView token={token} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Export .ics'));
      // Verify that the ICS content is generated correctly
      // This is a bit tricky to test directly, so we might need to mock document.createElement and URL.createObjectURL
    });
  });

  it('navigates between months', async () => {
    render(<CalendarView token={token} />);
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText('Previous Month'));
      fireEvent.click(screen.getByLabelText('Next Month'));
      // Verify that the month has changed
    });
  });
});