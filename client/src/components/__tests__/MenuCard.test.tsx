import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuCard } from '../MenuCard';
import { Home } from 'lucide-react';

describe('MenuCard', () => {
  const mockProps = {
    title: 'Test Title',
    description: 'Test Description',
    icon: Home,
    onClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<MenuCard {...mockProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Ouvrir')).toBeInTheDocument();
  });

  it('applies orange variant styles correctly', () => {
    render(<MenuCard {...mockProps} variant="orange" />);

    const button = screen.getByRole('button');
    const iconCircle = screen.getByTestId('icon-circle');
    const title = screen.getByText('Test Title');
    const openText = screen.getByText('Ouvrir');

    expect(button).toHaveClass('hover:border-safety-orange');
    expect(iconCircle).toHaveClass('bg-orange-50');
    expect(iconCircle).toHaveClass('text-safety-orange');
    expect(title).toHaveClass('group-hover:text-safety-orange');
    expect(openText).toHaveClass('group-hover:text-safety-orange');
  });

  it('applies blue variant styles correctly', () => {
    render(<MenuCard {...mockProps} variant="blue" />);

    const button = screen.getByRole('button');
    const iconCircle = screen.getByTestId('icon-circle');
    const title = screen.getByText('Test Title');
    const openText = screen.getByText('Ouvrir');

    expect(button).toHaveClass('hover:border-blue-500');
    expect(iconCircle).toHaveClass('bg-blue-50');
    expect(iconCircle).toHaveClass('text-blue-600');
    expect(title).toHaveClass('group-hover:text-blue-600');
    expect(openText).toHaveClass('group-hover:text-blue-600');
  });

  it('applies concrete variant styles correctly', () => {
    render(<MenuCard {...mockProps} variant="concrete" />);

    const button = screen.getByRole('button');
    const iconCircle = screen.getByTestId('icon-circle');
    const title = screen.getByText('Test Title');
    const openText = screen.getByText('Ouvrir');

    expect(button).toHaveClass('hover:border-concrete-600');
    expect(iconCircle).toHaveClass('bg-concrete-100');
    expect(iconCircle).toHaveClass('text-concrete-600');
    expect(title).toHaveClass('group-hover:text-concrete-800');
    expect(openText).toHaveClass('group-hover:text-concrete-800');
  });

  it('applies purple variant styles correctly', () => {
    render(<MenuCard {...mockProps} variant="purple" />);

    const button = screen.getByRole('button');
    const iconCircle = screen.getByTestId('icon-circle');
    const title = screen.getByText('Test Title');
    const openText = screen.getByText('Ouvrir');

    expect(button).toHaveClass('hover:border-purple-500');
    expect(iconCircle).toHaveClass('bg-purple-50');
    expect(iconCircle).toHaveClass('text-purple-600');
    expect(title).toHaveClass('group-hover:text-purple-600');
    expect(openText).toHaveClass('group-hover:text-purple-600');
  });

  it('calls onClick when clicked', () => {
    render(<MenuCard {...mockProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });
});