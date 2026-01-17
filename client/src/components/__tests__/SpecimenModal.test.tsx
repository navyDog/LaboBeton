import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import SpecimenModal from '../SpecimenModal';
import { Specimen } from '../../types';

describe('SpecimenModal', () => {
  const defaultSpecimen: Specimen = {
    number: 1,
    age: 28,
    specimenType: 'Cube',
    diameter: 150,
    height: 300,
    weight: 2400,
    force: 25,
    castingDate: '2023-10-01',
    crushingDate: '2023-10-01',
    surface:100
  };

  const onCloseMock = jest.fn();
  const onSaveMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    expect(screen.getByText('Saisie Résultats Éprouvette')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('28 Jours')).toBeInTheDocument();
    expect(screen.getByText('Cube')).toBeInTheDocument();
  });

  it('updates the diameter field correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const diameterInput = screen.getByLabelText('Diamètre / Côté (mm)');
    fireEvent.change(diameterInput, { target: { value: '160' } });
    expect((diameterInput as HTMLInputElement).value).toBe('160');
  });

  it('updates the height field correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const heightInput = screen.getByLabelText('Hauteur (mm)');
    fireEvent.change(heightInput, { target: { value: '310' } });
    expect((heightInput as HTMLInputElement).value).toBe('310');
  });

  it('updates the weight field correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const weightInput = screen.getByLabelText('Masse (g)');
    fireEvent.change(weightInput, { target: { value: '2500' } });
    expect((weightInput as HTMLInputElement).value).toBe('2500');
  });

  it('updates the force field correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const forceInput = screen.getByLabelText('Force (kN)');
    fireEvent.change(forceInput, { target: { value: '26' } });
    expect((forceInput as HTMLInputElement).value).toBe('26');
  });

  it('calculates stress correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    expect(screen.getByText('1.1')).toBeInTheDocument();
  });

  it('calculates density correctly', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    expect(screen.getByText('356')).toBeInTheDocument();
  });

  it('calls onSave with correct values', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const saveButton = screen.getByText('Enregistrer');
    fireEvent.click(saveButton);
    expect(onSaveMock).toHaveBeenCalledWith({
      ...defaultSpecimen,
      surface: 22500,
      stress: 1.1111111111111112,
      density: 355.5555555555556,
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<SpecimenModal specimen={defaultSpecimen} isOpen={true} onClose={onCloseMock} onSave={onSaveMock} />);
    const closeButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});