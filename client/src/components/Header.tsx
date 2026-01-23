import React from 'react';
import { Building2, FlaskConical, LogOut, Building, Settings, Calendar, Briefcase, User as UserIcon, Menu, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ConnectionStatus, User } from '../types';

interface HeaderProps {
  currentUser: User;
  dbStatus: ConnectionStatus;
  view: string;
  onNavigate: (targetView: string, testId?: string) => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  dbStatus,
  view,
  onNavigate,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white border-b border-concrete-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3"
            onClick={() => onNavigate('dashboard')}
          >
            {currentUser.logo ? (
              <img src={currentUser.logo} alt="Logo" className="h-10 w-auto object-contain max-w-[120px]" />
            ) : (
              <div className="bg-concrete-900 text-white p-2 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-concrete-900 leading-tight">LaboBéton</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-safety-orange border border-orange-200 uppercase tracking-widest">
                  v0.2.0-beta.1
                </span>
              </div>
              {currentUser.companyName && (
                <p className="text-xs text-concrete-500 font-medium truncate max-w-[200px]">{currentUser.companyName}</p>
              )}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 md:gap-4">
          {view !== 'dashboard' && (
            <div className="flex items-center bg-concrete-100 rounded-lg p-1 gap-1 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => onNavigate('fresh_tests')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'fresh_tests' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <FlaskConical className="w-4 h-4" /> Prélèvements
              </button>
              <button onClick={() => onNavigate('calendar')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'calendar' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <Calendar className="w-4 h-4" /> Planning
              </button>
              <button onClick={() => onNavigate('companies')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'companies' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <Building className="w-4 h-4" /> Entreprises
              </button>
              <button onClick={() => onNavigate('projects')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'projects' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <Briefcase className="w-4 h-4" /> Affaires
              </button>
              <button onClick={() => onNavigate('settings')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'settings' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <Settings className="w-4 h-4" /> Paramètres
              </button>
              <button onClick={() => onNavigate('profile')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'profile' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                <UserIcon className="w-4 h-4" /> Mon Profil
              </button>
            </div>
          )}
          <div className="flex items-center gap-4 border-l border-concrete-200 pl-4">
            <StatusBadge status={dbStatus} />
            <div className="flex items-center gap-1">
              <button onClick={() => onNavigate('profile')} className="p-2 text-concrete-500 hover:bg-concrete-100 rounded-full" title="Mon Profil">
                <UserIcon className="w-5 h-5" />
              </button>
              <button onClick={onLogout} className="p-2 text-concrete-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Déconnexion">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <div className="scale-75"><StatusBadge status={dbStatus} /></div>
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-concrete-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;