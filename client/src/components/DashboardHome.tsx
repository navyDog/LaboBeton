import React, { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle2, Clock, ArrowRight, Zap, FlaskConical, Building, Briefcase, Settings, User } from 'lucide-react';
import { ConcreteTest } from '../types';
import { MenuCard } from './MenuCard';
import { QuickEntryModal } from './QuickEntryModal';
import { authenticatedFetch } from '../utils/api';

interface DashboardHomeProps {
  token: string;
  userDisplayName: string;
  onNavigate: (view: string, testId?: string) => void;
}

interface NotificationTask {
  id: string;
  type: 'overdue' | 'today' | 'upcoming' | 'week';
  testId: string; 
  testRef: string;
  projectName: string;
  count: number; 
  age: number;
  date: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ token, userDisplayName, onNavigate }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickEntryTask, setQuickEntryTask] = useState<NotificationTask | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/concrete-tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTests(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleTaskClick = (task: NotificationTask) => {
    if (task.type === 'today' || task.type === 'overdue') {
      setQuickEntryTask(task);
    } else {
      onNavigate('fresh_tests', task.testId);
    }
  };

  const tasks = useMemo(() => {
    const list: NotificationTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tests.forEach(test => {
      test.specimens.forEach(s => {
        if ((!s.stress && s.stress !== 0) && s.crushingDate) {
          const cDate = new Date(s.crushingDate);
          cDate.setHours(0, 0, 0, 0);
          
          const diffTime = cDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          let type: 'overdue' | 'today' | 'upcoming' | 'week' | null = null;
          
          if (diffDays < 0) type = 'overdue';
          else if (diffDays === 0) type = 'today';
          else if (diffDays === 1) type = 'upcoming';
          else if (diffDays > 1 && diffDays <= 7) type = 'week';

          if (type) {
             list.push({
               id: `${test._id}-${s.number}`,
               type,
               testId: test._id,
               testRef: test.reference,
               projectName: test.projectName || 'Projet Inconnu',
               count: 1, 
               age: s.age,
               date: s.crushingDate 
             });
          }
        }
      });
    });

    // Consolidation
    const consolidated: NotificationTask[] = [];
    list.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      const existing = consolidated.find(c => 
        c.testId === item.testId && 
        new Date(c.date).toISOString().split('T')[0] === dateKey
      );
      if (existing) existing.count += item.count;
      else consolidated.push(item);
    });

    return consolidated.sort((a, b) => {
      const priority = { overdue: 0, today: 1, upcoming: 2, week: 3 };
      return priority[a.type] - priority[b.type];
    });
  }, [tests]);

  const overdueCount = tasks.filter(t => t.type === 'overdue').length;
  const todayCount = tasks.filter(t => t.type === 'today').length;
  const weekCount = tasks.filter(t => t.type === 'week').length;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {quickEntryTask && (
        <QuickEntryModal 
          testId={quickEntryTask.testId}
          testReference={quickEntryTask.testRef}
          projectName={quickEntryTask.projectName}
          targetDate={quickEntryTask.date}
          token={token}
          onClose={() => setQuickEntryTask(null)}
          onSuccess={() => { setQuickEntryTask(null); fetchData(); }}
        />
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-concrete-900">
          Bonjour, <span className="text-safety-orange">{userDisplayName}</span>
        </h2>
        <p className="text-concrete-500 text-lg">Tableau de bord de pilotage du laboratoire.</p>
        <p className="text-sm text-concrete-500 mt-2">
          Besoin d'aide ?{' '}
          <a href="/user-guide.pdf" download className="text-safety-orange hover:underline">
            Télécharger le guide utilisateur
          </a>
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
          <h3 className="font-bold text-concrete-500 uppercase text-sm tracking-wider flex items-center gap-2 h-6">
            <Bell className="w-4 h-4" /> Centre de Tâches
          </h3>

          <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="px-6 py-4 border-b border-concrete-100 bg-concrete-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="font-bold text-concrete-800">Échéances</span>
              <div className="flex gap-2 text-xs font-bold flex-wrap">
                 {overdueCount > 0 && (
                   <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> {overdueCount} Retard
                   </span>
                 )}
                 {todayCount > 0 && (
                   <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {todayCount} Auj.
                   </span>
                 )}
                 {weekCount > 0 && (
                   <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                     <Calendar className="w-3 h-3" /> {weekCount} Semaine
                   </span>
                 )}
              </div>
            </div>

            <div className="p-0 relative">
              {loading ? (
                <div className="p-8 text-center text-concrete-400">Chargement...</div>
              ) : tasks.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center mt-10">
                   <CheckCircle2 className="w-16 h-16 text-green-200 mb-4" />
                   <h4 className="text-lg font-bold text-concrete-800">Tout est à jour !</h4>
                   <p className="text-concrete-500 text-sm mt-2">Aucun écrasement prévu prochainement.</p>
                </div>
              ) : (
                <div className="divide-y divide-concrete-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {tasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleTaskClick(task)}
                      className={`p-4 flex items-center gap-4 hover:bg-concrete-50 transition-colors cursor-pointer group border-l-4 ${
                        task.type === 'overdue' ? 'border-l-red-500 bg-red-50/10' : 
                        task.type === 'today' ? 'border-l-safety-orange bg-orange-50/10' : 
                        task.type === 'upcoming' ? 'border-l-blue-400' :
                        'border-l-concrete-300'
                      }`}
                    >
                      <div className="shrink-0">
                        {task.type === 'overdue' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                        {task.type === 'today' && <Clock className="w-6 h-6 text-safety-orange" />}
                        {(task.type === 'upcoming' || task.type === 'week') && <Calendar className="w-6 h-6 text-concrete-400" />}
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-concrete-800 text-sm flex items-center gap-2">
                             {task.type === 'overdue' ? 'En Retard' : 
                              task.type === 'today' ? 'À faire Aujourd\'hui' : 
                              task.type === 'upcoming' ? 'Demain' : 'Cette Semaine'}
                              
                              {(task.type === 'today' || task.type === 'overdue') && (
                                <span className="bg-white border border-concrete-200 text-[10px] px-1.5 py-0.5 rounded text-concrete-500 uppercase tracking-wide flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-yellow-500" /> Rapide
                                </span>
                              )}
                           </h4>
                           <span className="text-xs font-mono text-concrete-400">{task.testRef}</span>
                        </div>
                        <p className="text-sm text-concrete-600">
                          <span className="font-bold">{task.count} éprouvette(s)</span> de {task.age} jours.
                        </p>
                        <p className="text-xs text-concrete-400 mt-1">Projet: {task.projectName}</p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-concrete-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4 h-full">
           <h3 className="font-bold text-concrete-500 uppercase text-sm tracking-wider h-6 flex items-center">
             Accès Rapides & Modules
           </h3>

           <div className="flex flex-col gap-y-8 mt-2">
              <div>
                  <h4 className="font-bold text-concrete-800 mb-3 text-base">Laboratoire</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <MenuCard title="Prélèvements" description="Saisie béton frais, fabrication et résultats." icon={FlaskConical} variant="orange" onClick={() => onNavigate('fresh_tests')} />
                      <MenuCard title="Planning" description="Calendrier des écrasements." icon={Calendar} variant="blue" onClick={() => onNavigate('calendar')} />
                  </div>
              </div>
              <div>
                  <h4 className="font-bold text-concrete-800 mb-3 text-base">Gestion</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <MenuCard title="Entreprises" description="Annuaire des clients." icon={Building} variant="concrete" onClick={() => onNavigate('companies')} />
                      <MenuCard title="Affaires" description="Gestion des chantiers." icon={Briefcase} variant="purple" onClick={() => onNavigate('projects')} />
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};