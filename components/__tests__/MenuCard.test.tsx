import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest } from '@jest/globals';
import { MenuCard } from '../MenuCard';
import { Settings } from 'lucide-react';

describe('MenuCard Component', () => {
  test('rend le titre et la description correctement', () => {
    render(
      <MenuCard 
        title="Test Titre" 
        description="Test Description" 
        icon={Settings} 
        onClick={() => {}} 
      />
    );
    expect(screen.getByText('Test Titre')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('appelle la fonction onClick quand on clique', () => {
    const handleClick = jest.fn();
    render(
      <MenuCard 
        title="Click Me" 
        description="Click Description" 
        icon={Settings} 
        onClick={handleClick} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applique la classe de variante correcte (orange par défaut)', () => {
    render(
      <MenuCard 
        title="Orange Card" 
        description="Desc" 
        icon={Settings} 
        onClick={() => {}} 
      />
    );
    // On vérifie indirectement via la classe de texte ou de bg qui est spécifique à la variante
    const iconContainer = screen.getAllByRole('img', { hidden: true })[0].parentElement?.parentElement;
    // Note: Lucide icons are SVGs, testing strict styling depends on implementation structure
    // Ici on vérifie simplement que le rendu ne crash pas et contient les éléments
    expect(screen.getByText('Orange Card')).toHaveClass('group-hover:text-safety-orange');
  });
});