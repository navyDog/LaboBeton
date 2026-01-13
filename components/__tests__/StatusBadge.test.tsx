import React from 'react';
import { render } from '@testing-library/react';
import { ConnectionStatus } from '../../types';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders checking status correctly', () => {
    const { getByText, getByTestId } = render(<StatusBadge status={ConnectionStatus.CHECKING} />);
    expect(getByText('Connexion...')).toBeInTheDocument();
    expect(getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('renders connected status correctly', () => {
    const { getByText, getByTestId } = render(<StatusBadge status={ConnectionStatus.CONNECTED} />);
    expect(getByText('Système Connecté')).toBeInTheDocument();
    expect(getByTestId('wifi-icon')).toBeInTheDocument();
  });

  it('renders disconnected status correctly', () => {
    const { getByText, getByTestId } = render(<StatusBadge status={ConnectionStatus.ERROR} />);
    expect(getByText('Erreur Connexion')).toBeInTheDocument();
    expect(getByTestId('wifi-off-icon')).toBeInTheDocument();
  });
});