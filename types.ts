export enum ConnectionStatus {
  CHECKING = 'CHECKING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export type UserRole = 'admin' | 'standard';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  token?: string;
  // Nouveaux champs
  companyName?: string;
  address?: string;
  contact?: string;
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  standard: string;
}