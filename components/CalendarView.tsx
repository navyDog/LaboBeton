import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hammer, Factory, Truck } from 'lucide-react';
import { ConcreteTest } from '../types';

interface CalendarViewProps {
  token: string;
}

type EventType = 'reception' | 'sampling' | 'crushing';

interface CalendarEvent {
  id: string;
  dateStr: string; // YYYY-MM-DD
  type: EventType;
  title: string;
  details: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ token }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Chargement des données
  useEffect(() => {
    const fetchTests = async () => {
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
    fetchTests();
  }, [token]);

  // Transformation des Tests en Evénements Calendrier
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    tests.forEach(test => {
      const ref = test.reference;
      
      // 1. Réception
      if (test.receptionDate) {
        list.push({
          id: `${test._id}-rec`,
          dateStr: new Date(test.receptionDate).toISOString().split('T')[0],
          type: 'reception',
          title: `Réception ${ref}`,
          details: test.projectName || ''
        });
      }

      // 2. Prélèvement (souvent identique à réception mais pas toujours)
      if (test.samplingDate) {
        // On évite le doublon visuel si c'est exactement la même date que réception, on peut prioriser Prélèvement
        // Mais affichons les deux pour être rigoureux
        list.push({
          id: `${test._id}-samp`,
          dateStr: new Date(test.samplingDate).toISOString().split('T')[0],
          type: 'sampling',
          title: `Prélèvement ${ref}`,
          details: `${test.structureName} (${test.concreteClass})`
        });
      }

      // 3. Ecrasements (Basé sur les éprouvettes)
      if (test.specimens) {
        // On regroupe par date pour ne pas avoir 3 lignes pour 3 éprouvettes du même jour
        const crushingGroups: Record<string, number> = {};
        
        test.specimens.forEach(s => {
          if (s.crushingDate) {
            const d = new Date(s.crushingDate).toISOString().split('T')[0];
            crushingGroups[d] = (crushingGroups[d] || 0) + 1;
          }
        });

        Object.entries(crushingGroups).forEach(([dateStr, count]) => {
          list.push({
            id: `${test._id}-crush-${dateStr}`,
            dateStr: dateStr,
            type: 'crushing',
            title: `Écrasement ${ref}`,
            details: `${count} éprouvette(s)`
          });
        });
      }
    });

    return list;
  }, [tests]);

  // --- Logique Calendrier ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Dimanche, 1 = Lundi. On veut Lundi en premier (France)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 à 6 (Lundi à Dimanche)

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Génération de la grille
  const renderCalendarDays = () => {
    const days = [];
    
    // Cellules vides avant le 1er du mois
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="bg-concrete-50/50 border-r border-b border-concrete-100 min-h-[120px]"></div>);
    }

    // Jours du mois
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.dateStr === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div key={d} className={`border-r border-b border-concrete-200 min-h-[120px] bg-white hover:bg-concrete-50 transition-colors p-2 flex flex-col gap-1 ${isToday ? 'bg-blue-50/30' : ''}`}>
          <div className="flex justify-between items-start mb-1">
             <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-safety-orange text-white shadow-sm' : 'text-concrete-700'}`}>
               {d}
             </span>
             {dayEvents.length > 0 && (
               <span className="text-[10px] bg-concrete-100 text-concrete-500 px-1.5 rounded-full font-medium">
                 {dayEvents.length}
               </span>
             )}
          </div>
          
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                className={`text-[10px] px-2 py-1 rounded border shadow-sm flex flex-col ${
                  ev.type === 'crushing' ? 'bg-orange-50 text-orange-800 border-orange-100' :
                  ev.type === 'sampling' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}
                title={`${ev.title} - ${ev.details}`}
              >
                <div className="flex items-center gap-1 font-bold truncate">
                  {ev.type === 'crushing' && <Hammer className="w-3 h-3 flex-shrink-0" />}
                  {ev.type === 'sampling' && <Factory className="w-3 h-3 flex-shrink-0" />}
                  {ev.type === 'reception' && <Truck className="w-3 h-3 flex-shrink-0" />}
                  <span>{ev.title}</span>
                </div>
                <div className="truncate opacity-80">{ev.details}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  if (loading) return <div className="text-center py-12 text-concrete-400">Chargement du planning...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-concrete-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-concrete-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-concrete-500" />
            Planning Laboratoire
          </h2>
        </div>

        <div className="flex items-center bg-concrete-100 rounded-lg p-1 gap-1">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-md text-concrete-600 transition-all shadow-sm">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <div className="px-4 py-1 font-bold text-concrete-800 min-w-[140px] text-center">
             {monthNames[month]} {year}
           </div>
           <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-md text-concrete-600 transition-all shadow-sm">
             <ChevronRight className="w-5 h-5" />
           </button>
           <button onClick={handleToday} className="ml-2 px-3 py-1 text-xs font-medium text-concrete-600 hover:text-safety-orange uppercase">
             Aujourd'hui
           </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs font-medium px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
          <span>Réception</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-50 border border-blue-100 rounded"></div>
          <span>Prélèvement</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-50 border border-orange-100 rounded"></div>
          <span>Écrasement (Urgent)</span>
        </div>
      </div>

      {/* Calendrier Grid */}
      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
         {/* En-tête Jours */}
         <div className="grid grid-cols-7 bg-concrete-800 text-white border-b border-concrete-700">
           {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
             <div key={d} className="py-2 text-center text-sm font-semibold uppercase tracking-wider opacity-90">
               {d}
             </div>
           ))}
         </div>
         {/* Corps */}
         <div className="grid grid-cols-7 bg-concrete-100 gap-px border-l border-t border-concrete-200">
            {renderCalendarDays()}
         </div>
      </div>
    </div>
  );
};
