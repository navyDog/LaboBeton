import React, { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { BugReporter } from './components/BugReporter';
import { AlertOctagon, Lock } from 'lucide-react';
import useAuth from './hooks/useAuth';
import useDatabaseStatus from './hooks/useDatabaseStatus';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileMenu from './components/MobileMenu';
import MainContent from './components/MainContent';

const App: React.FC = () => {
  const { currentUser, kickedOut, handleLogin, handleLogout, handleUserUpdate } = useAuth();
  const dbStatus = useDatabaseStatus();
  const [view, setView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const handleDeepNavigate = (targetView: string, testId?: string) => {
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

  const renderMainContent = () => {
    if (currentUser.role === 'admin') {
      return (
        <div className="min-h-screen bg-concrete-100 flex flex-col">
          <Header
            currentUser={currentUser}
            dbStatus={dbStatus}
            view={view}
            onNavigate={handleDeepNavigate}
            onLogout={handleLogout}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <main className="flex-grow flex p-6 md:p-10">
            <AdminDashboard currentUser={currentUser} />
          </main>
          <Footer onNavigate={handleDeepNavigate} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-concrete-50 flex flex-col">
        <Header
          currentUser={currentUser}
          dbStatus={dbStatus}
          view={view}
          onNavigate={handleDeepNavigate}
          onLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        {mobileMenuOpen && (
          <MobileMenu onNavigate={handleDeepNavigate} onLogout={handleLogout} />
        )}
        <MainContent
          currentUser={currentUser}
          dbStatus={dbStatus}
          view={view}
          selectedTestId={selectedTestId}
          onNavigate={handleDeepNavigate}
          onLogout={handleLogout}
          onUpdateUser={handleUserUpdate}
        />
        <BugReporter token={currentUser.token || ''} username={currentUser.username} />
        <Footer onNavigate={handleDeepNavigate} />
      </div>
    );
  };

  return (
    <>
      {kickedOut && (
        <div className="fixed inset-0 z-[100] bg-concrete-900/80 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8 animate-in zoom-in-95 duration-300 border border-concrete-300">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertOctagon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-concrete-900 mb-2">Session Interrompue</h2>
            <p className="text-concrete-600 mb-2">
              Une nouvelle connexion a été détectée sur un autre appareil.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 text-xs text-orange-800 text-left">
              <strong>Attention :</strong> La sauvegarde est désactivée. Si vous étiez en train de saisir des données, vous pouvez les voir en arrière-plan pour les noter, mais vous ne pouvez plus les envoyer au serveur.
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-concrete-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4" /> Retour à la connexion
            </button>
          </div>
        </div>
      )}
      {renderMainContent()}
    </>
  );
};

export default App;