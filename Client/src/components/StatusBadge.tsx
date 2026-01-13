import React from 'react';
import { ConnectionStatus } from '../types';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: ConnectionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === ConnectionStatus.CHECKING) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connexion...</span>
      </div>
    );
  }

  if (status === ConnectionStatus.CONNECTED) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
        <Wifi className="w-4 h-4" />
        <span>Système Connecté</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
      <WifiOff className="w-4 h-4" />
      <span>Erreur Connexion</span>
    </div>
  );
};