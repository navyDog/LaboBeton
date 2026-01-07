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

export interface ConcreteTest {
  _id: string;
  reference: string; // 2025-B-0001
  projectId: string;
  projectName?: string;
  companyName?: string;
  structureName: string; // Ouvrage
  elementName: string;   // Partie d'ouvrage
  
  receptionDate: string;
  samplingDate: string;
  volume: number;

  concreteClass: string;
  mixType: string;
  formulaInfo: string;
  manufacturer: string;
  manufacturingPlace: string;
  deliveryMethod: string;

  slump: number;
  samplingPlace: string;
  specimenType: string;
  specimenCount: number;
  
  tightening: string;
  vibrationTime: number;
  layers: number;
  curing: string;

  testType: string;
  standard: string;
  preparation: string;
  pressMachine: string;
  
  createdAt?: string;
}

export interface Settings {
  _id: string;
  specimenTypes: string[];
  deliveryMethods: string[];
  manufacturingPlaces: string[];
  mixTypes: string[];
  concreteClasses: string[];
  consistencyClasses: string[];
  nfStandards: string[];
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  standard: string;
}