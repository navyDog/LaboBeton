
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

export interface Specimen {
  _id?: string;
  number: number;
  reference?: string;
  age: number;
  castingDate: string;
  crushingDate: string;
  specimenType: string;
  diameter: number;
  height: number;
  surface: number;
  weight?: number; // null si pas encore pesé
  force?: number;  // null si pas encore écrasé
  stress?: number;
  density?: number;
}

export interface ConcreteTest {
  _id: string;
  reference: string; // 2025-B-0001
  projectId: string;
  projectName?: string;
  companyName?: string;
  moe?: string;
  moa?: string;
  structureName: string;
  elementName: string;
  
  receptionDate: string;
  samplingDate: string;
  volume: number;

  concreteClass: string;
  consistencyClass?: string; // S3, S4... (Calculé)
  mixType: string;
  formulaInfo: string;
  manufacturer: string;
  manufacturingPlace: string;
  deliveryMethod: string;

  slump: number;
  samplingPlace: string;
  
  // Info Prélèvement
  tightening: string;
  vibrationTime: number;
  layers: number;
  curing: string;

  // Info Essai
  testType: string;
  standard: string;
  preparation: string;
  pressMachine: string;

  // Liste des éprouvettes
  specimens: Specimen[];
  specimenCount: number; // Total count cached
  
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
  curingMethods: string[];
  testTypes: string[];
  preparations: string[];
  nfStandards: string[];
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  standard: string;
}