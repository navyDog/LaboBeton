import React from 'react';
import { ConnectionStatus, User } from '../types';
import { LegalPage } from './LegalPage';
import { CalendarView } from './CalendarView';
import { DashboardHome } from './DashboardHome';
import { CompanyManager } from './CompanyManager';
import { ProjectManager } from './ProjectManager';
import { SettingsManager } from './SettingsManager';
import { UserProfile } from './UserProfile';
import { ConcreteTestManager } from './ConcreteTestManager';

interface MainContentProps {
  currentUser: User;
  dbStatus: ConnectionStatus;
  view: string;
  selectedTestId: string | null;
  onNavigate: (targetView: string, testId?: string) => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  currentUser,
  dbStatus,
  view,
  selectedTestId,
  onNavigate,
  onLogout,
  onUpdateUser,
}) => {
  return (
    <main className="flex-grow flex items-center justify-center p-4 sm:p-8 relative">
      <div className="w-full max-w-7xl">
        {dbStatus === ConnectionStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-red-900 mb-2">Serveur déconnecté</h3>
            <p className="text-red-700">Impossible de joindre la base de données.</p>
          </div>
        )}
        {view === 'legal_cgu' && <LegalPage type="cgu" onBack={() => onNavigate('dashboard')} />}
        {view === 'legal_privacy' && <LegalPage type="privacy" onBack={() => onNavigate('dashboard')} />}
        {view === 'legal_mentions' && <LegalPage type="mentions" onBack={() => onNavigate('dashboard')} />}
        {view === 'calendar' && <CalendarView token={currentUser.token || ''} onNavigate={onNavigate} />}
        {view === 'companies' && <CompanyManager token={currentUser.token || ''} />}
        {view === 'projects' && <ProjectManager token={currentUser.token || ''} />}
        {view === 'settings' && <SettingsManager token={currentUser.token || ''} />}
        {view === 'profile' && <UserProfile token={currentUser.token || ''} currentUser={currentUser} onUpdate={onUpdateUser} />}
        {view === 'fresh_tests' && (
          <ConcreteTestManager
            token={currentUser.token || ''}
            user={currentUser}
            initialTestId={selectedTestId}
            onBack={() => { onNavigate('dashboard'); }}
          />
        )}
        {view === 'dashboard' && dbStatus !== ConnectionStatus.ERROR && (
          <DashboardHome
            token={currentUser.token || ''}
            userDisplayName={currentUser.companyName || currentUser.username}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </main>
  );
};

export default MainContent;