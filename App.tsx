import React, { useState, useEffect } from 'react';
import { ConnectionStatus, User } from './types';
import { StatusBadge } from './components/StatusBadge';
import { MenuCard } from './components/MenuCard';
import { LoginScreen } from './components/LoginScreen';
import { AdminUserForm } from './components/AdminUserForm';
import { Building2, FlaskConical, LogOut, ShieldCheck, Users, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(ConnectionStatus.CHECKING);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');

  // Vérification connexion DB
  useEffect(() => {
    const checkConnection = async () => {
      setDbStatus(ConnectionStatus.CHECKING);
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (response.ok && data.status === 'CONNECTED') {
          setDbStatus(ConnectionStatus.CONNECTED);
          setLastChecked(new Date(data.timestamp));
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
    console.log(`Navigation vers le module : ${module}`);
  };

  // Si pas connecté, afficher Login
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-concrete-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-concrete-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-concrete-900 text-white p-2 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-concrete-900 leading-tight">LaboBéton</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-concrete-500 font-medium">Connecté en tant que <strong>{currentUser.username}</strong></span>
                {currentUser.role === 'admin' && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-200">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Bouton Admin Dashboard */}
             {currentUser.role === 'admin' && view === 'dashboard' && (
               <button 
                onClick={() => setView('admin')}
                className="flex items-center gap-2 px-3 py-1.5 bg-concrete-800 text-white text-xs font-semibold rounded hover:bg-concrete-700 transition-colors"
               >
                 <Users className="w-4 h-4" />
                 Gestion Clients
               </button>
             )}

            {/* Bouton Retour Dashboard */}
            {view === 'admin' && (
               <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-concrete-300 text-concrete-700 text-xs font-semibold rounded hover:bg-concrete-50 transition-colors"
               >
                 <ChevronLeft className="w-4 h-4" />
                 Retour Menu
               </button>
             )}

             <div className="hidden md:block text-xs text-concrete-400 border-l border-concrete-200 pl-4">
               {lastChecked && `Synchro: ${lastChecked.toLocaleTimeString()}`}
             </div>
             <StatusBadge status={dbStatus} />
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
        <div className="w-full max-w-5xl">
          
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

          {/* View: ADMIN PANEL */}
          {view === 'admin' && currentUser.role === 'admin' && (
             <AdminUserForm currentUser={currentUser} onClose={() => setView('dashboard')} />
          )}

          {/* View: DASHBOARD */}
          {view === 'dashboard' && dbStatus !== ConnectionStatus.ERROR && (
             <>
               <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-bold text-concrete-900 mb-4">Tableau de Bord Laboratoire</h2>
                  <p className="text-concrete-500 max-w-2xl mx-auto text-lg">
                    Bienvenue, {currentUser.companyName ? currentUser.companyName : currentUser.username}. Sélectionnez un module ci-dessous.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <MenuCard 
                    title="Essais Béton Frais" 
                    standard="NF EN 12350"
                    description="Saisie des essais sur béton frais : affaissement (slump), teneur en air, masse volumique..."
                    iconType="fresh"
                    onClick={() => handleModuleClick('fresh')}
                  />
                  
                  <MenuCard 
                    title="Essais Béton Durci" 
                    standard="NF EN 12390"
                    description="Suivi de la cure, surfaçage et essais de résistance à la compression."
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