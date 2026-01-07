import React from 'react';
import { ArrowRight, Beaker, Hammer } from 'lucide-react';

interface MenuCardProps {
  title: string;
  standard: string;
  description: string;
  iconType: 'fresh' | 'hardened';
  onClick: () => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ title, standard, description, iconType, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="group relative flex flex-col items-start p-8 bg-white border border-concrete-200 rounded-xl shadow-sm hover:shadow-md hover:border-safety-orange transition-all duration-300 w-full text-left"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {iconType === 'fresh' ? (
          <Beaker className="w-24 h-24 text-concrete-600" />
        ) : (
          <Hammer className="w-24 h-24 text-concrete-600" />
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${iconType === 'fresh' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-safety-orange'}`}>
          {iconType === 'fresh' ? (
            <Beaker className="w-6 h-6" />
          ) : (
            <Hammer className="w-6 h-6" />
          )}
        </div>
        <span className="text-sm font-semibold text-concrete-500 uppercase tracking-wider">Norme {standard}</span>
      </div>

      <h3 className="text-2xl font-bold text-concrete-900 mb-2 group-hover:text-safety-orange transition-colors">
        {title}
      </h3>
      
      <p className="text-concrete-500 mb-8 max-w-sm">
        {description}
      </p>

      <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-concrete-600 group-hover:text-safety-orange group-hover:translate-x-1 transition-all">
        Accéder au module <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};