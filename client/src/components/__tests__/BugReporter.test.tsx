import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BugReporter } from '../BugReporter';
import { authenticatedFetch } from '../../../utils/api';

jest.mock('../../../utils/api');

describe('BugReporter', () => {
  const token = 'test-token';
  const username = 'test-user';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the report button initially', () => {
    render(<BugReporter token={token} username={username} />);
    expect(screen.getByTitle('Signaler un problème')).toBeInTheDocument();
  });

  it('opens the form when the button is clicked', () => {
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));
    expect(screen.getByText('Support & Bugs')).toBeInTheDocument();
  });

  it('closes the form when the close button is clicked', () => {
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Support & Bugs')).not.toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({});
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test bug' } });
    fireEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => {
      expect(screen.getByText('Merci ! Message envoyé.')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Support & Bugs')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles submission failure', async () => {
    (authenticatedFetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test bug' } });
    fireEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Erreur lors de l'envoi");
    });
  });

  it('changes the message type', () => {
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));

    const select = screen.getByLabelText('Type de message');
    fireEvent.change(select, { target: { value: 'feature' } });

    expect(select).toHaveValue('feature');
  });

  it('disables the submit button while sending', async () => {
    (authenticatedFetch as jest.Mock).mockResolvedValueOnce({});
    render(<BugReporter token={token} username={username} />);
    fireEvent.click(screen.getByTitle('Signaler un problème'));

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test bug' } });
    fireEvent.click(screen.getByText('Envoyer'));

    expect(screen.getByText('Envoi...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Merci ! Message envoyé.')).toBeInTheDocument();
    });
  });
});