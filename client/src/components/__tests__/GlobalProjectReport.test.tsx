import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalProjectReport } from '../GlobalProjectReport';
import { ConcreteTest, Project, User, Specimen } from '../../types';

// Mock de window.open pour tester l'impression
const mockWindowOpen = jest.fn();
global.window.open = mockWindowOpen;

describe('GlobalProjectReport', () => {
  const mockProject: Project = {
    _id: 'project-1',
    name: 'Projet Test',
    companyName: 'Entreprise Test',
    contactName: 'Élément Test',
    email: 'boite@geo.fr',
    phone: '0606606006',
    moa: 'MOA',
    moe: 'MOE'
  };

  const mockUser: User = {
    id: 'user-1',
    username: 'Utilisateur Test',
    role: 'standard'
  };

  const mockTests: ConcreteTest[] = [
    {
      _id: 'test-1',
      reference: 'REF-001',
      projectId: 'project-1',
      samplingDate: '2023-01-01T00:00:00Z',
      receptionDate: '2023-01-01T00:00:00Z',
      structureName: 'Structure 1',
      elementName: 'Élément 1',
      concreteClass: 'C25/30',
      consistencyClass: 'S3',
      slump: 120,
      mixType: 'Type A',
      formulaInfo: 'Formule standard',
      manufacturer: 'Fabricant A',
      manufacturingPlace: 'Usine A',
      deliveryMethod: 'Camion',
      volume: 1.5,
      samplingPlace: 'Chantier A',
      tightening: 'Vibration',
      vibrationTime: 30,
      layers: 3,
      curing: 'Humide',
      testType: 'Compression',
      standard: 'NF EN 12390-3',
      preparation: 'Standard',
      pressMachine: 'Presse A',
      specimens: [
        {
          number: 1,
          age: 7,
          dryWeight: 2400,
          force: 600,
          crushingDate: '2023-01-08T00:00:00Z',
          stress: 25,
          castingDate: '2023-01-01T00:00:00Z',
          specimenType: 'cylinder',
          diameter: 150,
          height: 300,
          surface: 17671.46
        },
        {
          number: 2,
          age: 7,
          dryWeight: 2450,
          force: 610,
          crushingDate: '2023-01-08T00:00:00Z',
          stress: 25.5,
          castingDate: '2023-01-01T00:00:00Z',
          specimenType: 'cylinder',
          diameter: 150,
          height: 300,
          surface: 17671.46
        }
      ],
      specimenCount: 2
    },
    {
      _id: 'test-2',
      reference: 'REF-002',
      projectId: 'project-1',
      samplingDate: '2023-01-15T00:00:00Z',
      receptionDate: '2023-01-15T00:00:00Z',
      structureName: 'Structure 2',
      elementName: 'Élément 2',
      concreteClass: 'C30/37',
      consistencyClass: 'S4',
      slump: 140,
      mixType: 'Type B',
      formulaInfo: 'Formule renforcée',
      manufacturer: 'Fabricant B',
      manufacturingPlace: 'Usine B',
      deliveryMethod: 'Camion',
      volume: 2.0,
      samplingPlace: 'Chantier B',
      tightening: 'Vibration',
      vibrationTime: 30,
      layers: 3,
      curing: 'Humide',
      testType: 'Compression',
      standard: 'NF EN 12390-3',
      preparation: 'Standard',
      pressMachine: 'Presse B',
      specimens: [
        {
          number: 1,
          age: 28,
          dryWeight: 2500,
          force: 700,
          crushingDate: '2023-02-12T00:00:00Z',
          stress: 28,
          castingDate: '2023-01-15T00:00:00Z',
          specimenType: 'cylinder',
          diameter: 150,
          height: 300,
          surface: 17671.46
        }
      ],
      specimenCount: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with provided props', () => {
    render(<GlobalProjectReport project={mockProject} tests={mockTests} user={mockUser} onClose={() => {}} />);

    expect(screen.getByText('PV Global d\'Affaire')).toBeInTheDocument();
    expect(screen.getByTestId('header-name')).toHaveTextContent('Nom du Laboratoire');
    expect(screen.getByTestId('project-name')).toHaveTextContent('Projet Test');
  });

  it('sorts tests by date correctly', () => {
    render(<GlobalProjectReport project={mockProject} tests={mockTests} user={mockUser} onClose={() => {}} />);

    const testElements = screen.getAllByText(/RÉF: REF-/);
    expect(testElements[0]).toHaveTextContent('RÉF: REF-001');
    expect(testElements[1]).toHaveTextContent('RÉF: REF-002');
  });

  it('groups specimens by age correctly', () => {
    render(<GlobalProjectReport project={mockProject} tests={mockTests} user={mockUser} onClose={() => {}} />);

    // Check first test (REF-001) has specimens grouped by 7 days
    expect(screen.getByText('7 Jours')).toBeInTheDocument();
    expect(screen.getAllByText('#1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('#2')[0]).toBeInTheDocument();

    // Check second test (REF-002) has specimens grouped by 28 days
    expect(screen.getByText('28 Jours')).toBeInTheDocument();
    expect(screen.getAllByText('#1')[1]).toBeInTheDocument();
  });

  it('calls handlePrint when print button is clicked', () => {
    render(<GlobalProjectReport project={mockProject} tests={mockTests} user={mockUser} onClose={() => {}} />);

    const printButton = screen.getByText('Imprimer');
    fireEvent.click(printButton);

    expect(mockWindowOpen).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<GlobalProjectReport project={mockProject} tests={mockTests} user={mockUser} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /Fermer/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays no tests message when tests array is empty', () => {
    render(<GlobalProjectReport project={mockProject} tests={[]} user={mockUser} onClose={() => {}} />);

    expect(screen.getByText('Aucun prélèvement enregistré pour cette affaire.')).toBeInTheDocument();
  });
});