import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ConflictModal from '../ConflictModal';
import { ConcreteTest, User } from '../../types';

describe('ConflictModal', () => {
  const conflictData: ConcreteTest = {
    _id: '1',
    __v: 1,
    reference: '2025-B-0001',
    projectId: 'project1',
    projectName: 'Project Name',
    companyName: 'Company Name',
    moe: 'MOE',
    moa: 'MOA',
    structureName: 'Structure Name',
    elementName: 'Element Name',
    receptionDate: '2023-10-01',
    samplingDate: '2023-10-01',
    volume: 1000,
    concreteClass: 'C25/30',
    consistencyClass: 'S4',
    mixType: 'Mix Type',
    formulaInfo: 'Formula Info',
    manufacturer: 'Manufacturer',
    manufacturingPlace: 'Manufacturing Place',
    deliveryMethod: 'Delivery Method',
    slump: 50,
    samplingPlace: 'Sampling Place',
    externalTemp: 20,
    concreteTemp: 25,
    tightening: 'Tightening',
    vibrationTime: 30,
    layers: 2,
    curing: 'Curing',
    testType: 'Test Type',
    standard: 'Standard',
    preparation: 'Preparation',
    pressMachine: 'Press Machine',
    specimens: [
      {
        number: 1,
        age: 28,
        castingDate: '2023-10-01',
        crushingDate: '2023-10-01',
        specimenType: 'Cube',
        diameter: 150,
        height: 300,
        surface: 22500,
        dryWeight: 2400,
        force: 25,
        stress: 1.11,
        density: 356,
      },
    ],
    specimenCount: 1,
    createdAt: '2023-10-01T00:00:00Z',
    userId: 'user1',
  };

  const user: User = {
    id: 'user1',
    username: 'John Doe',
    role:'standard'
  };

  const onReloadMock = jest.fn();
  const onForceOverwriteMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal correctly', () => {
    render(<ConflictModal conflictData={conflictData} user={user} onReload={onReloadMock} onForceOverwrite={onForceOverwriteMock} />);
    expect(screen.getByText('Conflit de modification')).toBeInTheDocument();
    expect(screen.getByText(/Un autre utilisateur a modifié cette fiche pendant que vous travailliez dessus./)).toBeInTheDocument();
    expect(screen.getByText(/Vos versions ne sont plus synchronisées./)).toBeInTheDocument();
  });

  it('displays conflict information correctly when modified by another user', () => {
    const otherUserConflictData: ConcreteTest = {
      ...conflictData,
      userId: 'user2',
    };
    render(<ConflictModal conflictData={otherUserConflictData} user={user} onReload={onReloadMock} onForceOverwrite={onForceOverwriteMock} />);
    expect(screen.getByTestId('conflict-info')).toHaveTextContent('Serveur: 1 éprouvettes, Modifié par Autrui.');
  });

  it('calls onReload when reload button is clicked', () => {
    render(<ConflictModal conflictData={conflictData} user={user} onReload={onReloadMock} onForceOverwrite={onForceOverwriteMock} />);
    const reloadButton = screen.getByTestId('reload-button');
    fireEvent.click(reloadButton);
    expect(onReloadMock).toHaveBeenCalled();
  });

  it('calls onForceOverwrite when overwrite button is clicked', () => {
    render(<ConflictModal conflictData={conflictData} user={user} onReload={onReloadMock} onForceOverwrite={onForceOverwriteMock} />);
    const overwriteButton = screen.getByTestId('overwrite-button');
    fireEvent.click(overwriteButton);
    expect(onForceOverwriteMock).toHaveBeenCalled();
  });
});