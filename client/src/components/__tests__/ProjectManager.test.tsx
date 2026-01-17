import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectManager } from '../ProjectManager';
import { authenticatedFetch } from '../../utils/api';

// Mock de l'API
jest.mock('../../utils/api', () => ({
  authenticatedFetch: jest.fn()
}));

describe('ProjectManager', () => {
  const mockToken = 'mock-token';
  const mockProjects = [
    { _id: '1', name: 'Projet 1', companyName: 'Entreprise 1', contactName: 'Contact 1', email: 'contact1@example.com', phone: '123456789', moa: 'MOA 1', moe: 'MOE 1' },
    { _id: '2', name: 'Projet 2', companyName: 'Entreprise 2', contactName: 'Contact 2', email: 'contact2@example.com', phone: '987654321', moa: 'MOA 2', moe: 'MOE 2' }
  ];

  const mockCompanies = [
    { _id: '1', name: 'Entreprise 1', contactName: 'Contact 1', email: 'contact1@example.com', phone: '123456789' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock de createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
  });

  afterEach(() => {
    // Nettoyer le mock après chaque test
    delete (global.URL as any).createObjectURL;
  });

  it('affiche "Chargement..." lors du chargement initial', () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('affiche "Aucune affaire en cours" lorsqu\'il n\'y a pas de projets', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Aucune affaire en cours')).toBeInTheDocument();
    });
  });

  it('affiche la liste des projets une fois chargés', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Projet 1')).toBeInTheDocument();
      expect(screen.getByText('Projet 2')).toBeInTheDocument();
    });
  });

  it('affiche et cache le formulaire correctement', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Nouvelle Affaire'));
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Annuler'));
    expect(screen.queryByText('Enregistrer')).not.toBeInTheDocument();
  });

  it('remplit les champs du formulaire lors de l\'édition d\'un projet', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Modifier')[0]);
      expect(screen.getByDisplayValue('Projet 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Contact 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('contact1@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MOA 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MOE 1')).toBeInTheDocument();
    });
  });

  it('supprime un projet après confirmation', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      window.confirm = jest.fn().mockReturnValue(true);
      fireEvent.click(screen.getAllByTitle('Supprimer')[0]);
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects/1', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${mockToken}` }
      });
    });
  });

  it('exporte un projet en CSV', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob()) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Exporter CSV')[0]);
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects/1/export/csv', {
        headers: { 'Authorization': `Bearer ${mockToken}` }
      });
    });
  });

  it('génère un rapport global pour un projet', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ project: {}, tests: [] }) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('PV Global Affaire')[0]);
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects/1/full-report', {
        headers: { 'Authorization': `Bearer ${mockToken}` }
      });
    });
  });

  it('met à jour les champs de formulaire avec les informations du projet sélectionné', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Modifier')[0]);
    });

    // Vérifiez que le formulaire est affiché
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument();

    // Vérifiez que les champs de formulaire sont mis à jour avec les informations du projet sélectionné
    expect(screen.getByText('Projet 1')).toBeInTheDocument();
    expect(screen.getByText('Contact 1')).toBeInTheDocument();
    expect(screen.getByText('contact1@example.com')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('MOA 1')).toBeInTheDocument();
    expect(screen.getByText('MOE 1')).toBeInTheDocument();
  });

  it('met à jour les champs de formulaire avec les informations de l\'entreprise sélectionnée', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Nouvelle Affaire'));
    });

    // Vérifiez que le formulaire est affiché
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();

    // Utilisez un sélecteur plus précis pour trouver le sélecteur d'entreprise
    const companySelect = screen.getByLabelText('Entreprise liée');
    fireEvent.change(companySelect, { target: { value: '1' } });

    // Vérifiez que les champs de formulaire sont mis à jour avec les informations de l'entreprise sélectionnée
    expect(screen.getByText('Contact 1')).toBeInTheDocument();
    expect(screen.getByText('contact1@example.com')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('met à jour uniquement le champ companyId si l\'entreprise n\'existe pas', async () => {
    const mockProjects = [
      {
        _id: '2',
        name: 'Projet 2',
        companyName: 'Entreprise 2',
        contactName: 'Contact 2',
        email: 'contact2@example.com',
        phone: '0987654321',
        moa: 'MOA 2',
        moe: 'MOE 2'
      }
    ];
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Nouvelle Affaire'));
    });

    // Vérifiez que le formulaire est affiché
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();

    // Utilisez un sélecteur plus précis pour trouver le sélecteur d'entreprise
    const companySelect = screen.getByLabelText('Entreprise liée');
    fireEvent.change(companySelect, { target: { value: 'non-existent-id' } });

    // Vérifiez que la valeur du sélecteur a été mise à jour
    //expect(companySelect).toHaveValue('non-existent-id');

    // Vérifiez que les autres champs n'ont pas été modifiés
    expect(screen.queryByDisplayValue('Contact 1')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('contact1@example.com')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('1234567890')).not.toBeInTheDocument();
  });

  it('soumet un nouveau projet avec succès', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Nouvelle Affaire'));
    });

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Nom de l\'affaire *'), { target: { value: 'Nouveau Projet' } });
    fireEvent.change(screen.getByLabelText('Entreprise liée'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Nom Contact'), { target: { value: 'Nouveau Contact' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nouveau@email.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Ouvrage (MOA)'), { target: { value: 'Nouveau MOA' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Oeuvre (MOE)'), { target: { value: 'Nouveau MOE' } });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Enregistrer'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mockToken}` },
        body: JSON.stringify({
          name: 'Nouveau Projet',
          companyId: '1',
          contactName: 'Nouveau Contact',
          email: 'nouveau@email.com',
          phone: '123456789',
          moa: 'Nouveau MOA',
          moe: 'Nouveau MOE',
          companyName: 'Entreprise 1'
        })
      });
    });

    // Vérifiez que les états sont réinitialisés
    expect(screen.queryByDisplayValue('Nouveau Projet')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Nouveau Contact')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('nouveau@email.com')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('123456789')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Nouveau MOA')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Nouveau MOE')).not.toBeInTheDocument();
  });

  it('met à jour un projet existant avec succès', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Modifier')[0]);
    });

    // Modifier le formulaire
    fireEvent.change(screen.getByLabelText('Nom de l\'affaire *'), { target: { value: 'Projet Modifié' } });
    fireEvent.change(screen.getByLabelText('Entreprise liée'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Nom Contact'), { target: { value: 'Contact Modifié' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'modifie@email.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '987654321' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Ouvrage (MOA)'), { target: { value: 'MOA Modifié' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Oeuvre (MOE)'), { target: { value: 'MOE Modifié' } });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Mettre à jour'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mockToken}` },
        body: JSON.stringify({
          name: 'Projet Modifié',
          companyId: '1',
          contactName: 'Contact Modifié',
          email: 'modifie@email.com',
          phone: '987654321',
          moa: 'MOA Modifié',
          moe: 'MOE Modifié',
          companyName: 'Entreprise 1'
        })
      });
    });

    // Vérifiez que les états sont réinitialisés
    expect(screen.queryByDisplayValue('Projet Modifié')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Contact Modifié')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('modifie@email.com')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('987654321')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('MOA Modifié')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('MOE Modifié')).not.toBeInTheDocument();
  });

  it('gère les erreurs lors de la soumission du formulaire', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProjects) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCompanies) });
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    (authenticatedFetch as jest.Mock).mockRejectedValueOnce(new Error('Erreur de soumission'));

    render(<ProjectManager token={mockToken} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Nouvelle Affaire'));
    });

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Nom de l\'affaire *'), { target: { value: 'Nouveau Projet' } });
    fireEvent.change(screen.getByLabelText('Entreprise liée'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Nom Contact'), { target: { value: 'Nouveau Contact' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nouveau@email.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Ouvrage (MOA)'), { target: { value: 'Nouveau MOA' } });
    fireEvent.change(screen.getByLabelText('Maître d\'Oeuvre (MOE)'), { target: { value: 'Nouveau MOE' } });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Enregistrer'));

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mockToken}` },
        body: JSON.stringify({
          name: 'Nouveau Projet',
          companyId: '1',
          contactName: 'Nouveau Contact',
          email: 'nouveau@email.com',
          phone: '123456789',
          moa: 'Nouveau MOA',
          moe: 'Nouveau MOE',
          companyName: 'Entreprise 1'
        })
      });
    });

    // Vérifiez que les états ne sont pas réinitialisés en cas d'erreur
    expect(screen.getByDisplayValue('Nouveau Projet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nouveau Contact')).toBeInTheDocument();
    expect(screen.getByDisplayValue('nouveau@email.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nouveau MOA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nouveau MOE')).toBeInTheDocument();
  });
});