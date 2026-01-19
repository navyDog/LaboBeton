import { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';

const useDatabaseStatus = () => {
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(ConnectionStatus.CHECKING);

  useEffect(() => {
    const checkConnection = async () => {
      setDbStatus(ConnectionStatus.CHECKING);
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (response.ok && data.status === 'CONNECTED') {
          setDbStatus(ConnectionStatus.CONNECTED);
        } else {
          setDbStatus(ConnectionStatus.ERROR);
        }
      } catch (error) {
        setDbStatus(ConnectionStatus.ERROR);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return dbStatus;
};

export default useDatabaseStatus;