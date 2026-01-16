import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportPreview } from '../ReportPreview';
import { ConcreteTest, Specimen, User } from '../../types';

// Mock data
const mockUser: User = {
  id: 'user1',
  token: 'mock-token',
  username: 'admin',
  role: 'admin',
  isActive: true,
  companyName: 'Test Company',
  address: '123 Test St',
  contact: 'test@example.com',
  siret: '12345678900012',
  apeCode: '7120B',
  legalInfo: 'RCS Paris B 123 456 789',
  logo: 'data:image/png;base64,someBase64String',
};

const mockSpecimens: Specimen[] = [
  {
    number: 1,
    age: 7,
    stress: 25,
    density: 2400,
    force: 500,
    diameter: 160,
    height: 320,
    surface:200,
    castingDate: new Date().toISOString(),
    crushingDate: new Date().toISOString(),
    specimenType: 'Cylindrique 16x32',
  },
  {
    number: 2,
    age: 28,
    stress: 30,
    density: 2400,
    force: 600,
    diameter: 160,
    height: 320,
    surface:200,
    castingDate: new Date().toISOString(),
    crushingDate: new Date().toISOString(),
    specimenType: 'Cylindrique 16x32',
  },
];

const mockTest: ConcreteTest = {
  layers: 0,
  preparation: "",
  pressMachine: "",
  projectId: "1",
  receptionDate: new Date().toISOString(),
  samplingPlace: "Labo",
  specimenCount: 0,
  testType: "Béton",
  vibrationTime: 0,
  _id: 'test1',
  reference: 'TEST-001',
  companyName: 'Client Company',
  projectName: 'Project Name',
  moe: 'MOE',
  moa: 'MOA',
  structureName: 'Structure Name',
  elementName: 'Element Name',
  samplingDate: new Date().toISOString(),
  concreteClass: 'C25/30',
  consistencyClass: 'S3',
  slump: 100,
  mixType: 'CEM II/A 350kg',
  manufacturer: 'Manufacturer',
  manufacturingPlace: 'Manufacturing Place',
  volume: 1,
  deliveryMethod: 'Toupie',
  formulaInfo: 'Formula Info',
  tightening: 'Tightening',
  curing: 'Curing',
  standard: 'NF EN 206/CN',
  specimens: mockSpecimens
};

describe('ReportPreview Component', () => {
  it('renders correctly with initial data', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="PV" onClose={() => {}} />);

    expect(screen.getByText('Aperçu PV 7 Jours')).toBeInTheDocument();
    expect(screen.getByTestId('test-reference')).toHaveTextContent('TEST-001');
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('filters specimens correctly for PV type', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="PV" onClose={() => {}} />);

    expect(screen.getByText('C25/30')).toBeInTheDocument();
    expect(screen.getByText('7j')).toBeInTheDocument();
    expect(screen.queryByText('28j')).not.toBeInTheDocument();
  });

  it('filters specimens correctly for RP type', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="RP" onClose={() => {}} />);

    expect(screen.getByText('C25/30')).toBeInTheDocument();
    expect(screen.getByText('28j')).toBeInTheDocument();
    expect(screen.getByText('7j')).toBeInTheDocument();
  });

  it('displays results correctly', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="PV" onClose={() => {}} />);

    expect(screen.getByText('Résultats des Essais (NF EN 12390-3)')).toBeInTheDocument();
    expect(screen.getByText('N°')).toBeInTheDocument();
    expect(screen.getByText('Âge')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Dim. (mm)')).toBeInTheDocument();
    expect(screen.getByText('Masse Vol. (kg/m³)')).toBeInTheDocument();
    expect(screen.getByText('Force (kN)')).toBeInTheDocument();
    expect(screen.getByText('MPa')).toBeInTheDocument();
  });

  it('displays conformity for 7 days', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="PV" onClose={() => {}} />);

    expect(screen.getByText('Conformité Probable (7j) :')).toBeInTheDocument();
    expect(screen.getByText((content, element) =>
      content.startsWith('Résistance moyenne 7j :'))).toBeInTheDocument();
    expect(screen.getByText('=> RÉSULTAT CONFORME AUX ATTENTES.')).toBeInTheDocument();
  });

  it('displays conformity for 28 days', () => {
    render(<ReportPreview test={mockTest} user={mockUser} type="RP" onClose={() => {}} />);

    expect(screen.getByText('Conformité à 28 jours :')).toBeInTheDocument();
    expect(screen.getByText((content, element) =>
      content.startsWith('Résistance moyenne 28j :'))).toBeInTheDocument();
    expect(screen.getByText('=> BÉTON CONFORME (Résistance caractéristique atteinte).')).toBeInTheDocument();
  });
});