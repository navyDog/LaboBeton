import useAuth from '../useAuth';
import { User } from '../../types';
import {act, renderHook} from "@testing-library/react";

// Mock de sessionStorage
const mockSessionStorage = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

const mockUser: User = {
  id: '1',
  username: 'testuser',
  role:'standard',
  token: 'token123'
};

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('useAuth', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with null currentUser and kickedOut false', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.currentUser).toBeNull();
    expect(result.current.kickedOut).toBe(false);
  });

  it('should load user from sessionStorage on mount', () => {
    mockSessionStorage.setItem('labobeton_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it('should handle session replaced event and set kickedOut to true', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      globalThis.dispatchEvent(new Event('auth:session_replaced'));
    });

    expect(result.current.kickedOut).toBe(true);
  });

  it('should login user and update sessionStorage', () => {
    const { result } = renderHook(() => useAuth());
    const token = 'token123';

    act(() => {
      result.current.handleLogin(mockUser, token);
    });

    expect(result.current.currentUser).toEqual({ ...mockUser, token });
    expect(mockSessionStorage.getItem('labobeton_user')).toBe(JSON.stringify({ ...mockUser, token }));
  });

  it('should logout user and clear sessionStorage', () => {
    const { result } = renderHook(() => useAuth());
    mockSessionStorage.setItem('labobeton_user', JSON.stringify(mockUser));

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.currentUser).toBeNull();
    expect(mockSessionStorage.getItem('labobeton_user')).toBeNull();
  });

  it('should update user and update sessionStorage', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.handleUserUpdate(mockUser);
    });

    expect(result.current.currentUser).toEqual(mockUser);
    expect(mockSessionStorage.getItem('labobeton_user')).toBe(JSON.stringify(mockUser));
  });
});