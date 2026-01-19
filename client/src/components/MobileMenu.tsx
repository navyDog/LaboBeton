import React from 'react';
import { Building2, FlaskConical, Calendar, Building, Settings, Briefcase, User as UserIcon, LogOut } from 'lucide-react';

interface MobileMenuProps {
  onNavigate: (targetView: string) => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onNavigate, onLogout }) => {
  return (
    <div className="md:hidden bg-white border-b border-concrete-200 animate-in slide-in-from-top-5">
      <nav className="p-4 space-y-2">
        <button onClick={() => onNavigate('dashboard')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><Building2 className="w-5 h-5" /> Tableau de Bord</button>
        <button onClick={() => onNavigate('fresh_tests')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><FlaskConical className="w-5 h-5" /> Prélèvements</button>
        <button onClick={() => onNavigate('calendar')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><Calendar className="w-5 h-5" /> Planning</button>
        <button onClick={() => onNavigate('companies')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><Building className="w-5 h-5" /> Entreprises</button>
        <button onClick={() => onNavigate('projects')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><Briefcase className="w-5 h-5" /> Affaires</button>
        <button onClick={() => onNavigate('settings')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><Settings className="w-5 h-5" /> Paramètres</button>
        <div className="border-t border-concrete-100 pt-2 mt-2">
          <button onClick={() => onNavigate('profile')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3"><UserIcon className="w-5 h-5" /> Mon Profil</button>
          <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 font-medium text-red-600 flex items-center gap-3"><LogOut className="w-5 h-5" /> Déconnexion</button>
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;