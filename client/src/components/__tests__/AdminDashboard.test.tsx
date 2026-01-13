import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard';
import { authenticatedFetch } from '../../../utils/api';
import { User } from '../../types';

jest.mock('../../../utils/api');

const mockCurrentUser: User = {
  id: 'user1',
  token: 'mock-token',
  username: 'admin',
  role: 'admin',
  isActive: true,
};

const mockUsers = [
  { _id: 'user2', username: 'user', role: 'user', companyName: 'Company B', contact: 'contact@company.com', lastLogin: new Date().toISOString(), isActive: true },
];

const mockBugs = [
  { _id: 'bug1', type: 'bug', status: 'open', description: 'Bug description', createdAt: new Date().toISOString(), user: 'user1' },
  { _id: 'bug2', type: 'issue', status: 'resolved', description: 'Issue description', createdAt: new Date().toISOString(), user: 'user2' },
];

describe('AdminDashboard', () => {
  beforeEach(() => {
    (authenticatedFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the users view by default', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs });

    const { getByText, getByPlaceholderText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(getByText('Administration')).toBeInTheDocument();
      expect(getByText('Utilisateurs')).toBeInTheDocument();
      expect(getByPlaceholderText('Rechercher un utilisateur...')).toBeInTheDocument();
    });
  });

  it('switches to bugs view when button is clicked', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs });

    const { getByText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByText('Support / Bugs'));
      expect(getByText('Support / Bugs')).toBeInTheDocument();
    });
  });

  it('opens and closes the create user form', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs });

    const { getByText, queryByText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByText('Nouveau Client'));
      expect(getByText((content, element) => content.startsWith('Créer l\'utilisateur'))).toBeInTheDocument();

      fireEvent.click(getByText('Annuler'));
      expect(queryByText((content, element) => content.startsWith('Créer l\'utilisateur'))).not.toBeInTheDocument();
    });
  });

  it('filters users based on search term', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs });

    const { getByPlaceholderText, getByText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.change(getByPlaceholderText('Rechercher un utilisateur...'), { target: { value: 'user' } });
      expect(getByText('user')).toBeInTheDocument();
    });
  });

  it('toggles user active status', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs })
      .mockResolvedValueOnce({ ok: true });

    const { getByTitle } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByTitle('Désactiver le compte (Licence)'));
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/users/user2/toggle-access', expect.any(Object));
    });
  });

  it('deletes a user', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs })
      .mockResolvedValueOnce({ ok: true });

    window.confirm = jest.fn().mockReturnValue(true);

    const { getByTitle } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByTitle('Supprimer définitivement'));
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/users/user2', expect.any(Object));
    });
  });

  it('resolves a bug', async () => {
    (authenticatedFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBugs })
      .mockResolvedValueOnce({ ok: true });

    const { getByText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByText('Support / Bugs'));
      fireEvent.click(getByText('Marquer Résolu'));
      expect(authenticatedFetch).toHaveBeenCalledWith('/api/admin/bugs/bug1', expect.any(Object));
    });
  });

  it('renders bugs correctly', async () => {
    (authenticatedFetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockUsers })
        .mockResolvedValueOnce({ ok: true, json: async () => mockBugs });

    const { getByText } = render(<AdminDashboard currentUser={mockCurrentUser} />);

    await waitFor(() => {
      fireEvent.click(getByText('Support / Bugs'));
      expect(getByText('Bug description')).toBeInTheDocument();
      expect(getByText('Issue description')).toBeInTheDocument();
    });
  });
});