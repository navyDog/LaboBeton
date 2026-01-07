import React, { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { ConcreteTest, Specimen } from '../types';
import { MenuCard } from './MenuCard';

interface DashboardHomeProps {
  token: string;
  userDisplayName: string;
  onNavigate: (view: string) => void;
}

interface NotificationTask {
  id: string;
  type: 'overdue' | 'today' | 'upcoming';
  testRef: string;
  projectName: string;
  count: number; // Nombre d'éprouvettes concernées
  age: number;
  date: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ token, userDisplayName, onNavigate }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/concrete-tests', {
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
    fetchData();
  }, [token]);

  // --- LOGIQUE DE NOTIFICATION ---
  const tasks = useMemo(() => {
    const list: NotificationTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tests.forEach(test => {
      // Regrouper les éprouvettes par date d'écrasement pour ce test
      const groups: Record<string, { count: number, age: number, dateStr: string }> = {};

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
             if (!groups[dateStr]) {
               groups[dateStr] = { count: 0, age: s.age, dateStr: s.crushingDate };
             }
             groups[dateStr].count++;
             list.push({
               id: `${test._id}-${s.number}`,
               type,
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

    // Consolider par Test + Date + Type
    const consolidated: NotificationTask[] = [];
    list.forEach(item => {
      const existing = consolidated.find(c => c.testRef === item.testRef && c.type === item.type && c.age === item.age);
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
                      onClick={() => onNavigate('fresh_tests')} 
                      className={`p-4 flex items-center gap-4 hover:bg-concrete-50 transition-colors cursor-pointer group border-l-4 ${
                        task.type === 'overdue' ? 'border-l-red-500 bg-red-50/10' : 
                        task.type === 'today' ? 'border-l-safety-orange bg-orange-50/10' : 
                        'border-l-blue-400'
                      }`}
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
                           <h4 className="font-bold text-concrete-800 text-sm">
                             {task.type === 'overdue' ? 'Écrasement en Retard' : 
                              task.type === 'today' ? 'Écrasement à faire Aujourd\'hui' : 
                              'Prévu pour demain'}
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