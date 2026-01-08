import React, { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle2, Clock, ArrowRight, Zap } from 'lucide-react';
import { ConcreteTest } from '../types';
import { MenuCard } from './MenuCard';
import { QuickEntryModal } from './QuickEntryModal';
import { authenticatedFetch } from '../utils/api';

interface DashboardHomeProps {
  token: string;
  userDisplayName: string;
  onNavigate: (view: string) => void;
}

interface NotificationTask {
  id: string;
  type: 'overdue' | 'today' | 'upcoming';
  testId: string; // Ajout de l'ID réel pour l'édition
  testRef: string;
  projectName: string;
  count: number; 
  age: number;
  date: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ token, userDisplayName, onNavigate }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Entry State
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

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleTaskClick = (task: NotificationTask) => {
    // Si c'est aujourd'hui ou en retard, on ouvre la saisie rapide
    if (task.type === 'today' || task.type === 'overdue') {
      setQuickEntryTask(task);
    } else {
      // Sinon on navigue vers la liste
      onNavigate('fresh_tests');
    }
  };

  const handleQuickEntrySuccess = () => {
    setQuickEntryTask(null);
    fetchData(); // Recharger les données pour mettre à jour les compteurs
  };

  // --- LOGIQUE DE NOTIFICATION ---
  const tasks = useMemo(() => {
    const list: NotificationTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tests.forEach(test => {
      // Regrouper les éprouvettes par date d'écrasement pour ce test
      const groups: Record<string, { count: number, age: number }> = {};

      test.specimens.forEach(s => {
        // Si pas de résultat (stress) et date définie
        if ((!s.stress && s.stress !== 0) && s.crushingDate) {
          const cDate = new Date(s.crushingDate);
          cDate.setHours(0, 0, 0, 0);
          
          const dateStr = cDate.toISOString();

          // On ne traite que les dates <= aujourd'hui (Urgent) ou Demain (A venir)
          const diffTime = cDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          let type: 'overdue' | 'today' | 'upcoming' | null = null;
          
          if (diffDays < 0) type = 'overdue';
          else if (diffDays === 0) type = 'today';
          else if (diffDays === 1) type = 'upcoming';

          if (type) {
             list.push({
               id: `${test._id}-${s.number}`,
               type,
               testId: test._id,
               testRef: test.reference,
               projectName: test.projectName || 'Projet Inconnu',
               count: 1, 
               age: s.age,
               date: s.crushingDate // Full date string
             });
          }
        }
      });
    });

    // Consolider par Test + Date + Type
    const consolidated: NotificationTask[] = [];
    list.forEach(item => {
      // On groupe par TestID + Date exacte (pour éditer le bon groupe d'éprouvettes)
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      const existing = consolidated.find(c => 
        c.testId === item.testId && 
        new Date(c.date).toISOString().split('T')[0] === dateKey
      );

      if (existing) {
        existing.count += item.count;
      } else {
        consolidated.push(item);
      }
    });

    // Tri : En retard d'abord, puis Aujourd'hui, puis Demain
    return consolidated.sort((a, b) => {
      const priority = { overdue: 0, today: 1, upcoming: 2 };
      return priority[a.type] - priority[b.type];
    });

  }, [tests]);

  const overdueCount = tasks.filter(t => t.type === 'overdue').length;
  const todayCount = tasks.filter(t => t.type === 'today').length;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* MODALE SAISIE RAPIDE */}
      {quickEntryTask && (
        <QuickEntryModal 
          testId={quickEntryTask.testId}
          testReference={quickEntryTask.testRef}
          projectName={quickEntryTask.projectName}
          targetDate={quickEntryTask.date}
          token={token}
          onClose={() => setQuickEntryTask(null)}
          onSuccess={handleQuickEntrySuccess}
        />
      )}

      {/* HEADER BIENVENUE */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-concrete-900">
          Bonjour, <span className="text-safety-orange">{userDisplayName}</span>
        </h2>
        <p className="text-concrete-500 text-lg">
          Voici le récapitulatif des activités de laboratoire pour aujourd'hui.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        
        {/* COLONNE GAUCHE : CENTRE DE NOTIFICATIONS */}
        <div className="space-y-4 flex flex-col h-full">
          
          <h3 className="font-bold text-concrete-500 uppercase text-sm tracking-wider flex items-center gap-2 h-6">
            <Bell className="w-4 h-4" /> Centre de Tâches
          </h3>

          <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="px-6 py-4 border-b border-concrete-100 bg-concrete-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-concrete-800">Échéances & Rappels</span>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                 {overdueCount > 0 && (
                   <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> {overdueCount} En retard
                   </span>
                 )}
                 {todayCount > 0 && (
                   <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {todayCount} Pour ce jour
                   </span>
                 )}
              </div>
            </div>

            <div className="p-0 flex-grow relative">
              {loading ? (
                <div className="p-8 text-center text-concrete-400">Analyse des échéances...</div>
              ) : tasks.length === 0 ? (
                <div className="absolute inset-0 p-12 text-center flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-8 h-8 text-green-600" />
                   </div>
                   <h4 className="text-lg font-bold text-concrete-800">Tout est à jour !</h4>
                   <p className="text-concrete-500 text-sm">Aucun écrasement prévu pour aujourd'hui ou en retard.</p>
                </div>
              ) : (
                <div className="divide-y divide-concrete-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {tasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleTaskClick(task)}
                      className={`p-4 flex items-center gap-4 hover:bg-concrete-50 transition-colors cursor-pointer group border-l-4 ${
                        task.type === 'overdue' ? 'border-l-red-500 bg-red-50/10' : 
                        task.type === 'today' ? 'border-l-safety-orange bg-orange-50/10' : 
                        'border-l-blue-400'
                      }`}
                      title={task.type === 'upcoming' ? "Voir la fiche" : "Saisie Rapide des Résultats"}
                    >
                      {/* Icône Statut */}
                      <div className="shrink-0">
                        {task.type === 'overdue' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                        {task.type === 'today' && <Clock className="w-6 h-6 text-safety-orange" />}
                        {task.type === 'upcoming' && <Calendar className="w-6 h-6 text-blue-400" />}
                      </div>

                      {/* Contenu */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-concrete-800 text-sm flex items-center gap-2">
                             {task.type === 'overdue' ? 'En Retard' : 
                              task.type === 'today' ? 'À faire Aujourd\'hui' : 
                              'Demain'}
                              {/* Badge Saisie Rapide */}
                              {(task.type === 'today' || task.type === 'overdue') && (
                                <span className="bg-white border border-concrete-200 text-[10px] px-1.5 py-0.5 rounded text-concrete-500 uppercase tracking-wide flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-yellow-500" /> Saisie Rapide
                                </span>
                              )}
                           </h4>
                           <span className="text-xs font-mono text-concrete-400">{task.testRef}</span>
                        </div>
                        <p className="text-sm text-concrete-600">
                          <span className="font-bold">{task.count} éprouvette(s)</span> de {task.age} jours à tester.
                        </p>
                        <p className="text-xs text-concrete-400 mt-1 flex items-center gap-1">
                          Projet: {task.projectName}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-white border border-concrete-200 rounded-full shadow-sm text-concrete-500 hover:text-safety-orange">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : ACTIONS RAPIDES (MENU) */}
        <div className="flex flex-col gap-4 h-full">
           <h3 className="font-bold text-concrete-500 uppercase text-sm tracking-wider h-6 flex items-center">
             Accès Rapides
           </h3>
           
           <div className="flex-grow">
             <MenuCard 
                title="Prélèvements" 
                standard="NF EN 12350"
                description="Saisie béton frais et fabrication."
                iconType="fresh"
                onClick={() => onNavigate('fresh_tests')}
              />
           </div>
        </div>

      </div>
    </div>
  );
};