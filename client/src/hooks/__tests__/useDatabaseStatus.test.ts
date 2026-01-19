import useDatabaseStatus from '../useDatabaseStatus';
import { ConnectionStatus } from '../../types';
import { waitFor,renderHook } from '@testing-library/react';

// Mock de la fonction fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'CONNECTED' }),
  })
) as jest.Mock;

describe('useDatabaseStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initially set the status to CHECKING', () => {
    const { result } = renderHook(() => useDatabaseStatus());
    expect(result.current).toBe(ConnectionStatus.CHECKING);
  });

  it('should set the status to CONNECTED if the API returns CONNECTED', async () => {
    const { result } = renderHook(() => useDatabaseStatus());
    await waitFor(() => expect(result.current).toBe(ConnectionStatus.CONNECTED));
  });

  it('should set the status to ERROR if the API returns an error', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ status: 'ERROR' }),
      })
    );

    const { result } = renderHook(() => useDatabaseStatus());
    await waitFor(() => expect(result.current).toBe(ConnectionStatus.ERROR));
  });

  it('should set the status to ERROR if the API call fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const { result } = renderHook(() => useDatabaseStatus());
    await waitFor(() => expect(result.current).toBe(ConnectionStatus.ERROR));
  });
});