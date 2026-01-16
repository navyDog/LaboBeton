import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: 'orange' | 'blue' | 'concrete' | 'purple';
  onClick: () => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon: Icon, variant = 'orange', onClick }) => {
  
  const styles = {
    orange: {
      hoverBorder: 'hover:border-safety-orange',
      text: 'text-safety-orange',
      bg: 'bg-orange-50',
      groupHoverText: 'group-hover:text-safety-orange'
    },
    blue: {
      hoverBorder: 'hover:border-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      groupHoverText: 'group-hover:text-blue-600'
    },
    concrete: {
      hoverBorder: 'hover:border-concrete-600',
      text: 'text-concrete-600',
      bg: 'bg-concrete-100',
      groupHoverText: 'group-hover:text-concrete-800'
    },
    purple: {
      hoverBorder: 'hover:border-purple-500',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      groupHoverText: 'group-hover:text-purple-600'
    }
  };

  const style = styles[variant];

  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-start p-6 bg-white border border-concrete-200 rounded-xl shadow-sm hover:shadow-lg ${style.hoverBorder} transition-all duration-300 w-full text-left h-full`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
         <Icon className="w-24 h-24 text-concrete-900" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 rounded-lg ${style.bg} ${style.text} transition-colors`} data-testid="icon-circle">
           <Icon className="w-6 h-6" />
        </div>
      </div>

      <h3 className={`text-xl font-bold text-concrete-900 mb-1 ${style.groupHoverText} transition-colors`}>
        {title}
      </h3>
      
      <p className="text-concrete-500 text-sm mb-6 max-w-xs leading-relaxed">
        {description}
      </p>

      <div className={`mt-auto flex items-center gap-2 text-sm font-bold text-concrete-400 ${style.groupHoverText} group-hover:translate-x-1 transition-all`}>
        Ouvrir <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};