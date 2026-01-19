import { useState, useEffect } from 'react';
import { User } from '../types';

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [kickedOut, setKickedOut] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('labobeton_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        sessionStorage.removeItem('labobeton_user');
      }
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!kickedOut) handleLogout();
    };

    const handleSessionReplaced = () => {
      setKickedOut(true);
    };

    globalThis.addEventListener('auth:unauthorized', handleUnauthorized);
    globalThis.addEventListener('auth:session_replaced', handleSessionReplaced);

    return () => {
      globalThis.removeEventListener('auth:unauthorized', handleUnauthorized);
      globalThis.removeEventListener('auth:session_replaced', handleSessionReplaced);
    };
  }, [kickedOut]);

  const handleLogin = (user: User, token: string) => {
    const userWithToken = { ...user, token };
    sessionStorage.setItem('labobeton_user', JSON.stringify(userWithToken));
    setCurrentUser(userWithToken);
    setKickedOut(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('labobeton_user');
    setCurrentUser(null);
    setKickedOut(false);
  };

  const handleUserUpdate = (updatedUser: User) => {
    sessionStorage.setItem('labobeton_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  return { currentUser, kickedOut, handleLogin, handleLogout, handleUserUpdate };
};

export default useAuth;