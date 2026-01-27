
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
  // Champs de sécurité et état
  isActive?: boolean;
  tokenVersion?: number;
  lastLogin?: string;
  // Champs profil entreprise
  companyName?: string;
  address?: string;
  contact?: string;
  siret?: string;
  apeCode?: string;
  legalInfo?: string; // Pour RCS, Capital Social...
  logo?: string;      // Base64 string
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
  dryWeight?: number; // (masse sèche) null si pas encore pesé
  force?: number;  // null si pas encore écrasé
  stress?: number;
  density?: number;
  freshWeightWithMold?: number; // (masse fraîche + moule)
  slumpTime?: string; // (heure d'affaissement)
}

export interface ConcreteTest {
  _id: string;
  __v?: number; // Versionning Optimiste MongoDB
  userId?: string; // ID du propriétaire
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
  
  // Températures
  externalTemp?: number;
  concreteTemp?: number;
  
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
