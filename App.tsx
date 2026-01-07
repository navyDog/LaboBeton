import React, { useState, useEffect } from 'react';
import { ConnectionStatus, User } from './types';
import { StatusBadge } from './components/StatusBadge';
import { MenuCard } from './components/MenuCard';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard'; // Import du Dashboard Admin
import { CompanyManager } from './components/CompanyManager';
import { ProjectManager } from './components/ProjectManager';
import { SettingsManager } from './components/SettingsManager';
import { ConcreteTestManager } from './components/ConcreteTestManager';
import { Building2, FlaskConical, LogOut, ShieldCheck, ChevronLeft, Building, Briefcase, LayoutGrid, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(ConnectionStatus.CHECKING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Vue principale pour utilisateur standard : 'dashboard' | 'companies' | 'projects' | 'settings' | 'fresh_tests'
  // Changement demandé : Vue par défaut sur les fiches de prélèvement
  const [view, setView] = useState<string>('fresh_tests');

  // Vérification connexion DB
  useEffect(() => {
    const checkConnection = async () => {
      setDbStatus(ConnectionStatus.CHECKING);
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (response.ok && data.status === 'CONNECTED') {
          setDbStatus(ConnectionStatus.CONNECTED);
        } else {
          setDbStatus(ConnectionStatus.ERROR);
        }
      } catch (error) {
        setDbStatus(ConnectionStatus.ERROR);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Gestion Connexion / Déconnexion
  const handleLogin = (user: User, token: string) => {
    setCurrentUser({ ...user, token }); 
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleModuleClick = (module: string) => {
    if (module === 'fresh') {
      setView('fresh_tests');
    } else {
      console.log(`Module ${module} non implémenté pour l'instant`);
    }
  };

  // 1. Si pas connecté, afficher Login
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // 2. Si ADMIN : Affichage spécifique Admin
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-concrete-100 flex flex-col">
        <header className="bg-concrete-900 border-b border-concrete-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 text-white p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">LaboBéton <span className="text-concrete-400 font-normal">| Administration</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-concrete-400">Connecté en tant que <strong>{currentUser.username}</strong></span>
              <button 
                onClick={handleLogout}
                className="p-2 text-concrete-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow flex p-6 md:p-10">
           <AdminDashboard currentUser={currentUser} />
        </main>
      </div>
    );
  }

  // 3. Si UTILISATEUR STANDARD : Affichage Application
  return (
    <div className="min-h-screen bg-concrete-50 flex flex-col">
      {/* Header Standard */}
      <header className="bg-white border-b border-concrete-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-concrete-900 text-white p-2 rounded-lg cursor-pointer" onClick={() => setView('dashboard')}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-concrete-900 leading-tight cursor-pointer" onClick={() => setView('dashboard')}>LaboBéton</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-concrete-500 font-medium"><strong>{currentUser.companyName || currentUser.username}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {/* Navigation Menu */}
             <div className="hidden md:flex items-center bg-concrete-100 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setView('fresh_tests')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'fresh_tests' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}
                >
                  <FlaskConical className="w-4 h-4" /> Prélèvements
                </button>
                <button 
                  onClick={() => setView('projects')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'projects' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}
                >
                  <Briefcase className="w-4 h-4" /> Mes Affaires
                </button>
                <button 
                  onClick={() => setView('companies')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'companies' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}
                >
                  <Building className="w-4 h-4" /> Mes Entreprises
                </button>
             </div>

             {/* Bouton Settings */}
             <button
               onClick={() => setView('settings')}
               className={`p-2 rounded-full transition-colors ${view === 'settings' ? 'bg-concrete-800 text-white' : 'text-concrete-500 hover:bg-concrete-100 hover:text-concrete-900'}`}
               title="Réglages"
             >
               <Settings className="w-5 h-5" />
             </button>

             <div className="hidden lg:block text-xs text-concrete-400 border-l border-concrete-200 pl-4">
               <StatusBadge status={dbStatus} />
             </div>
             
             <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-concrete-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Déconnexion"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl">
          
          {/* Connection Error State */}
          {dbStatus === ConnectionStatus.ERROR && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mb-8">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Serveur déconnecté</h3>
              <p className="text-red-700 mb-6">Impossible de joindre la base de données.</p>
            </div>
          )}

          {/* View: ENTREPRISES */}
          {view === 'companies' && (
            <CompanyManager token={currentUser.token || ''} />
          )}

          {/* View: AFFAIRES */}
          {view === 'projects' && (
            <ProjectManager token={currentUser.token || ''} />
          )}

          {/* View: SETTINGS */}
          {view === 'settings' && (
            <SettingsManager token={currentUser.token || ''} />
          )}

          {/* View: FRESH CONCRETE TESTS (PRÉLÈVEMENTS) */}
          {view === 'fresh_tests' && (
            <ConcreteTestManager token={currentUser.token || ''} onBack={() => setView('dashboard')} />
          )}

          {/* View: DASHBOARD */}
          {view === 'dashboard' && dbStatus !== ConnectionStatus.ERROR && (
             <>
               <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-bold text-concrete-900 mb-4">Tableau de Bord Laboratoire</h2>
                  <p className="text-concrete-500 max-w-2xl mx-auto text-lg">
                    Gestion des essais et rapports.
                  </p>
                  
                  {/* Mobile Navigation Links */}
                  <div className="md:hidden flex justify-center gap-4 mt-6 flex-wrap">
                    <button onClick={() => setView('fresh_tests')} className="text-sm font-semibold text-concrete-600 hover:text-safety-orange flex items-center gap-1">
                      <FlaskConical className="w-4 h-4" /> Prélèvements
                    </button>
                    <button onClick={() => setView('projects')} className="text-sm font-semibold text-concrete-600 hover:text-safety-orange flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> Mes Affaires
                    </button>
                    <button onClick={() => setView('companies')} className="text-sm font-semibold text-concrete-600 hover:text-safety-orange flex items-center gap-1">
                      <Building className="w-4 h-4" /> Mes Entreprises
                    </button>
                    <button onClick={() => setView('settings')} className="text-sm font-semibold text-concrete-600 hover:text-safety-orange flex items-center gap-1">
                      <Settings className="w-4 h-4" /> Réglages
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
                  <MenuCard 
                    title="Prélèvements & Béton Frais" 
                    standard="NF EN 12350"
                    description="Créer une nouvelle fiche : Identification, Formulation, Slump et Fabrication des éprouvettes."
                    iconType="fresh"
                    onClick={() => handleModuleClick('fresh')}
                  />
                  
                  <MenuCard 
                    title="Essais Béton Durci" 
                    standard="NF EN 12390"
                    description="Saisie des résultats de rupture (Compression) pour les fiches existantes."
                    iconType="hardened"
                    onClick={() => handleModuleClick('hardened')}
                  />
                </div>
             </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-concrete-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-concrete-400">
          <p>&copy; {new Date().getFullYear()} LaboBéton - Conformité Normes NF EN</p>
        </div>
      </footer>
    </div>
  );
};

export default App;