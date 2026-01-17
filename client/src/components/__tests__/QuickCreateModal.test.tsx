import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import QuickCreateModal from '../QuickCreateModal';
import { Company } from '../../types';

describe('QuickCreateModal', () => {
  const companies: Company[] = [
    { _id: '1', name: 'Company A', contactName: 'Contact 1', email: 'contact1@example.com', phone: '123456789' },
    { _id: '2', name: 'Company B', contactName: 'Contact 1', email: 'contact1@example.com', phone: '123456789' }
  ];

  const setQuickCreateTypeMock = jest.fn();
  const setNewProjectDataMock = jest.fn();
  const setNewCompanyDataMock = jest.fn();
  const handleQuickCreateMock = jest.fn();
  const setQuickCreateOpenMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal correctly for project type', () => {
    render(
      <QuickCreateModal
        quickCreateType="project"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    expect(screen.getByText('Nouvelle Affaire')).toBeInTheDocument();
    expect(screen.getByText('Nom de l\'affaire *')).toBeInTheDocument();
    expect(screen.getByText('Entreprise / Client')).toBeInTheDocument();
  });

  it('renders the modal correctly for company type', () => {
    render(
      <QuickCreateModal
        quickCreateType="company"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    expect(screen.getByText('Nouveau Client')).toBeInTheDocument();
    expect(screen.getByText('Nom de l\'entreprise *')).toBeInTheDocument();
    expect(screen.getByText('Contact Principal')).toBeInTheDocument();
  });

  it('changes the quick create type to project', () => {
    render(
      <QuickCreateModal
        quickCreateType="company"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const projectButton = screen.getByText('Affaire');
    fireEvent.click(projectButton);
    expect(setQuickCreateTypeMock).toHaveBeenCalledWith('project');
  });

  it('changes the quick create type to company', () => {
    render(
      <QuickCreateModal
        quickCreateType="project"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const companyButton = screen.getByText('Entreprise');
    fireEvent.click(companyButton);
    expect(setQuickCreateTypeMock).toHaveBeenCalledWith('company');
  });

  it('updates the project data fields correctly', () => {
    render(
      <QuickCreateModal
        quickCreateType="project"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const nameInput = screen.getByPlaceholderText('ex: Chantier École');
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    expect(setNewProjectDataMock).toHaveBeenCalledWith({ name: 'New Project', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' });
  });

  it('updates the company data fields correctly', () => {
    render(
      <QuickCreateModal
        quickCreateType="company"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const nameInput = screen.getByPlaceholderText('ex: Bâtiment SAS');
    fireEvent.change(nameInput, { target: { value: 'New Company' } });
    expect(setNewCompanyDataMock).toHaveBeenCalledWith({ name: 'New Company', contactName: '', email: '', phone: '' });
  });

  it('calls handleQuickCreate when create button is clicked for project', () => {
    render(
      <QuickCreateModal
        quickCreateType="project"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const createButton = screen.getByText('Créer Affaire');
    fireEvent.click(createButton);
    expect(handleQuickCreateMock).toHaveBeenCalled();
  });

  it('calls handleQuickCreate when create button is clicked for company', () => {
    render(
      <QuickCreateModal
        quickCreateType="company"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const createButton = screen.getByText('Créer & Sélectionner');
    fireEvent.click(createButton);
    expect(handleQuickCreateMock).toHaveBeenCalled();
  });

  it('closes the modal when close button is clicked', () => {
    render(
      <QuickCreateModal
        quickCreateType="project"
        setQuickCreateType={setQuickCreateTypeMock}
        newProjectData={{ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' }}
        setNewProjectData={setNewProjectDataMock}
        newCompanyData={{ name: '', contactName: '', email: '', phone: '' }}
        setNewCompanyData={setNewCompanyDataMock}
        companies={companies}
        handleQuickCreate={handleQuickCreateMock}
        setQuickCreateOpen={setQuickCreateOpenMock}
        isQuickCreate={true}
      />
    );
    const closeButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(closeButton);
    expect(setQuickCreateOpenMock).toHaveBeenCalledWith(false);
  });
});