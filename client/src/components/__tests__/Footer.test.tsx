import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('should render the footer with the correct content', () => {
    render(<Footer onNavigate={jest.fn()} />);

    expect(screen.getByText(/LaboBéton v0.2.0-beta.2 - Normes NF EN/i)).toBeInTheDocument();
    expect(screen.getByText(/Developed by/i)).toBeInTheDocument();
    expect(screen.getByText(/VBM Solutions/i)).toBeInTheDocument();
    expect(screen.getByText(/CGU/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidentialité/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentions/i)).toBeInTheDocument();
  });

  it('should call onNavigate with the correct argument when CGU button is clicked', () => {
    const onNavigate = jest.fn();
    render(<Footer onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText(/CGU/i));
    expect(onNavigate).toHaveBeenCalledWith('legal_cgu');
  });

  it('should call onNavigate with the correct argument when Confidentialité button is clicked', () => {
    const onNavigate = jest.fn();
    render(<Footer onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText(/Confidentialité/i));
    expect(onNavigate).toHaveBeenCalledWith('legal_privacy');
  });

  it('should call onNavigate with the correct argument when Mentions button is clicked', () => {
    const onNavigate = jest.fn();
    render(<Footer onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText(/Mentions/i));
    expect(onNavigate).toHaveBeenCalledWith('legal_mentions');
  });
});