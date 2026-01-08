import React, { useState, useEffect } from 'react';
import { ConnectionStatus, User } from './types';
import { StatusBadge } from './components/StatusBadge';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard'; 
import { SettingsManager } from './components/SettingsManager';
import { ConcreteTestManager } from './components/ConcreteTestManager';
import { CalendarView } from './components/CalendarView'; 
import { DashboardHome } from './components/DashboardHome';
import { CompanyManager } from './components/CompanyManager';
import { ProjectManager } from './components/ProjectManager';
import { UserProfile } from './components/UserProfile';
import { LegalPage } from './components/LegalPage';
import { BugReporter } from './components/BugReporter';
import { Building2, FlaskConical, LogOut, ShieldCheck, Building, Settings, Calendar, Briefcase, User as UserIcon, Menu, X, Rocket } from 'lucide-react';

const App: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(ConnectionStatus.CHECKING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation State (Deep linking)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // --- PERSISTANCE SESSION STORAGE ---
  useEffect(() => {
    const storedUser = sessionStorage.getItem('labobeton_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        sessionStorage.removeItem('labobeton_user');
      }
    }
  }, []);

  // --- GESTION DECONNEXION AUTOMATIQUE (401) ---
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

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

  const handleLogin = (user: User, token: string) => {
    const userWithToken = { ...user, token };
    sessionStorage.setItem('labobeton_user', JSON.stringify(userWithToken));
    setCurrentUser(userWithToken); 
  };

  const handleLogout = () => {
    sessionStorage.removeItem('labobeton_user');
    setCurrentUser(null);
    setView('dashboard');
    setMobileMenuOpen(false);
  };

  const handleUserUpdate = (updatedUser: User) => {
    sessionStorage.setItem('labobeton_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const handleDeepNavigate = (targetView: string, testId?: string) => {
    // Si on navigue vers fresh_tests sans ID spécifié, on reset l'ID pour avoir la liste
    if (targetView === 'fresh_tests' && !testId) {
        setSelectedTestId(null);
    } else if (testId) {
        setSelectedTestId(testId);
    }
    setView(targetView);
    setMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // --- ADMIN VIEW ---
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-concrete-100 flex flex-col">
        <header className="bg-concrete-900 border-b border-concrete-800 sticky top-0 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 text-white p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                 <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white">LaboBéton</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-safety-orange text-white border border-orange-500 uppercase tracking-widest shadow-sm">
                      ADMIN
                    </span>
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-xs text-concrete-400"><strong>{currentUser.username}</strong></span>
              <button onClick={handleLogout} className="p-2 text-concrete-400 hover:text-white rounded-full">
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

  // --- STANDARD USER VIEW ---
  return (
    <div className="min-h-screen bg-concrete-50 flex flex-col">
      {/* Header Standard */}
      <header className="bg-white border-b border-concrete-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Zone (Left) */}
          <div className="flex items-center gap-3">
            <div 
               className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3" 
               onClick={() => setView('dashboard')}
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
                    Alpha v0.1.0-alpha2
                  </span>
                </div>
                {currentUser.companyName && (
                  <p className="text-xs text-concrete-500 font-medium truncate max-w-[200px]">{currentUser.companyName}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop Nav (Center/Right) */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
             {view !== 'dashboard' && (
               <div className="flex items-center bg-concrete-100 rounded-lg p-1 gap-1 animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => handleDeepNavigate('fresh_tests')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'fresh_tests' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                    <FlaskConical className="w-4 h-4" /> Prélèvements
                  </button>
                  <button onClick={() => handleDeepNavigate('calendar')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'calendar' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                    <Calendar className="w-4 h-4" /> Planning
                  </button>
                  <button onClick={() => handleDeepNavigate('companies')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'companies' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                    <Building className="w-4 h-4" /> Entreprises
                  </button>
                  <button onClick={() => handleDeepNavigate('projects')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'projects' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                    <Briefcase className="w-4 h-4" /> Affaires
                  </button>
                  <button onClick={() => handleDeepNavigate('settings')} className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${view === 'settings' ? 'bg-white text-concrete-900 shadow-sm' : 'text-concrete-500 hover:text-concrete-900'}`}>
                    <Settings className="w-4 h-4" /> Paramètres
                  </button>
               </div>
             )}

             <div className="flex items-center gap-4 border-l border-concrete-200 pl-4">
               {/* Status Badge moved inside nav */}
               <StatusBadge status={dbStatus} />
               
               <div className="flex items-center gap-1">
                 <button onClick={() => handleDeepNavigate('profile')} className="p-2 text-concrete-500 hover:bg-concrete-100 rounded-full" title="Mon Profil">
                    <UserIcon className="w-5 h-5" />
                 </button>
                 <button onClick={handleLogout} className="p-2 text-concrete-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Déconnexion">
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
             </div>
          </div>

          {/* Mobile Burger (Right) */}
          <div className="md:hidden flex items-center gap-2">
            <div className="scale-75">
              <StatusBadge status={dbStatus} />
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-concrete-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-concrete-200 animate-in slide-in-from-top-5">
            <nav className="p-4 space-y-2">
              <button onClick={() => handleDeepNavigate('dashboard')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <Building2 className="w-5 h-5" /> Tableau de Bord
              </button>
              <button onClick={() => handleDeepNavigate('fresh_tests')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <FlaskConical className="w-5 h-5" /> Prélèvements
              </button>
              <button onClick={() => handleDeepNavigate('calendar')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <Calendar className="w-5 h-5" /> Planning
              </button>
              <button onClick={() => handleDeepNavigate('companies')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <Building className="w-5 h-5" /> Entreprises
              </button>
              <button onClick={() => handleDeepNavigate('projects')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <Briefcase className="w-5 h-5" /> Affaires
              </button>
              <button onClick={() => handleDeepNavigate('settings')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                 <Settings className="w-5 h-5" /> Paramètres
              </button>
              <div className="border-t border-concrete-100 pt-2 mt-2">
                <button onClick={() => handleDeepNavigate('profile')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-concrete-50 font-medium text-concrete-700 flex items-center gap-3">
                   <UserIcon className="w-5 h-5" /> Mon Profil
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 font-medium text-red-600 flex items-center gap-3">
                   <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-7xl">
          
          {dbStatus === ConnectionStatus.ERROR && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mb-8">
              <h3 className="text-xl font-bold text-red-900 mb-2">Serveur déconnecté</h3>
              <p className="text-red-700">Impossible de joindre la base de données.</p>
            </div>
          )}

          {view === 'legal_cgu' && <LegalPage type="cgu" onBack={() => setView('dashboard')} />}
          {view === 'legal_privacy' && <LegalPage type="privacy" onBack={() => setView('dashboard')} />}
          {view === 'legal_mentions' && <LegalPage type="mentions" onBack={() => setView('dashboard')} />}

          {/* Passage de handleDeepNavigate au calendar pour qu'il puisse ouvrir un test */}
          {view === 'calendar' && <CalendarView token={currentUser.token || ''} onNavigate={handleDeepNavigate} />}
          {view === 'companies' && <CompanyManager token={currentUser.token || ''} />}
          {view === 'projects' && <ProjectManager token={currentUser.token || ''} />}
          {view === 'settings' && <SettingsManager token={currentUser.token || ''} />}
          {view === 'profile' && <UserProfile token={currentUser.token || ''} currentUser={currentUser} onUpdate={handleUserUpdate} />}
          
          {view === 'fresh_tests' && (
            <ConcreteTestManager 
              token={currentUser.token || ''} 
              user={currentUser}
              initialTestId={selectedTestId} // Pour ouvrir directement un test
              onBack={() => { setSelectedTestId(null); setView('dashboard'); }} 
            />
          )}

          {view === 'dashboard' && dbStatus !== ConnectionStatus.ERROR && (
             <DashboardHome 
               token={currentUser.token || ''} 
               userDisplayName={currentUser.companyName || currentUser.username}
               onNavigate={handleDeepNavigate}
             />
          )}
        </div>
      </main>

      {/* Floating Bug Reporter */}
      <BugReporter token={currentUser.token || ''} username={currentUser.username} />

      {/* Footer */}
      <footer className="bg-white border-t border-concrete-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-xs text-concrete-400">&copy; {new Date().getFullYear()} LaboBéton - Normes NF EN</p>
             
             <div className="flex items-center gap-2">
               <span className="text-[10px] text-concrete-400 font-medium">Developed by</span>
               <div className="flex items-center gap-1 bg-concrete-100 px-2 py-0.5 rounded text-concrete-600 font-bold text-[10px]">
                 <Rocket className="w-3 h-3 text-blue-500" /> VBM Solutions
               </div>
             </div>

             <div className="flex justify-center gap-4 text-[10px] font-medium text-concrete-500">
                <button onClick={() => setView('legal_cgu')} className="hover:text-safety-orange hover:underline">CGU</button>
                <button onClick={() => setView('legal_privacy')} className="hover:text-safety-orange hover:underline">Confidentialité</button>
                <button onClick={() => setView('legal_mentions')} className="hover:text-safety-orange hover:underline">Mentions</button>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;