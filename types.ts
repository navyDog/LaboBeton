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
  companyName?: string;
  address?: string;
  contact?: string;
}

export interface Company {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface Project {
  _id: string;
  companyId?: string;
  companyName?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  moa: string;
  moe: string;
}

export interface Settings {
  _id: string;
  specimenTypes: string[];
  deliveryMethods: string[];
  manufacturingPlaces: string[];
  mixTypes: string[];
  concreteClasses: string[];
  nfStandards: string[];
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  standard: string;
}