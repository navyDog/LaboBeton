import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hammer, Factory, X, FileText, Download, ArrowRight } from 'lucide-react';
import { ConcreteTest } from '../types';
import { authenticatedFetch } from '../utils/api';

interface CalendarViewProps {
  token: string;
  onNavigate?: (view: string, testId?: string) => void;
}

interface CalendarEvent {
  id: string;
  testId: string;
  dateStr: string;
  type: 'reception' | 'sampling' | 'crushing';
  title: string;
  details: string;
}

interface EventModalProps {
  test: ConcreteTest;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (testId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ test, isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-concrete-200 flex flex-col">
        {/* Header Simple */}
        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold text-lg">Détails de l'événement</h3>
          <button onClick={onClose} className="text-concrete-400 hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
           <div className="inline-flex p-3 bg-concrete-100 rounded-full mb-2">
              <FileText className="w-8 h-8 text-safety-orange" />
           </div>

           <div>
             <h2 className="text-xl font-bold text-concrete-900">{test.reference}</h2>
             <p className="text-sm text-concrete-500 font-medium mt-1">{test.projectName}</p>
             <p className="text-xs text-concrete-400">{test.companyName}</p>
           </div>

           <div className="bg-concrete-50 rounded-lg p-3 text-sm text-left border border-concrete-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-concrete-500">Date Prélèvement:</span>
                <span className="font-bold">{new Date(test.samplingDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-concrete-500">Ouvrage:</span>
                <span className="font-bold">{test.structureName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-concrete-500">Éprouvettes:</span>
                <span className="font-bold">{test.specimens.length}</span>
              </div>
           </div>

           {onNavigate && (
            <button
              onClick={() => onNavigate(test._id)}
              className="w-full py-3 bg-safety-orange text-white hover:bg-orange-600 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-md mt-4"
            >
              Accéder à la fiche complète <ArrowRight className="w-4 h-4" />
            </button>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Calendar Day Component ---

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  onEventClick: (event: React.MouseEvent, testId: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, isToday, events, onEventClick }) => {
  return (
    <div className={`border-r border-b border-concrete-200 min-h-[120px] bg-white hover:bg-concrete-50 transition-colors p-2 flex flex-col gap-1 ${isToday ? 'bg-blue-50/30' : ''}`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-safety-orange text-white shadow-sm' : 'text-concrete-700'}`}>{day}</span>
        {events.length > 0 && <span className="text-[10px] bg-concrete-100 text-concrete-500 px-1.5 rounded-full font-medium">{events.length}</span>}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
        {events.map(ev => (
          <div
            key={ev.id}
            onClick={(e) => onEventClick(e, ev.testId)}
            className={`text-[10px] px-2 py-1 rounded border shadow-sm flex flex-col cursor-pointer ${
              ev.type === 'crushing' ? 'bg-orange-100 text-orange-900 border-orange-200' :
              ev.type === 'sampling' ? 'bg-blue-100 text-blue-900 border-blue-200' :
              'bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1 font-bold truncate">
              {ev.type === 'crushing' && <Hammer className="w-3 h-3" />}
              {ev.type === 'sampling' && <Factory className="w-3 h-3" />}
              <span>{ev.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const CalendarView: React.FC<CalendarViewProps> = ({ token, onNavigate }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTest, setSelectedTest] = useState<ConcreteTest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventVisibility, setEventVisibility] = useState({
    reception: true,
    sampling: true,
    crushing: true,
  });

  // --- Refactored helpers for event generation ---

  const createCrushingEvents = (test: ConcreteTest): CalendarEvent[] => {
      if (!test.specimens) return [];

      const crushingGroups = test.specimens.reduce((groups, specimen) => {
          if (specimen.crushingDate) {
              const dateStr = new Date(specimen.crushingDate).toISOString().split('T')[0];
              groups[dateStr] = (groups[dateStr] || 0) + 1;
          }
          return groups;
      }, {} as Record<string, number>);

      return Object.entries(crushingGroups).map(([dateStr, count]) => ({
          id: `${test._id}-crush-${dateStr}`,
          testId: test._id,
          dateStr: dateStr,
          type: 'crushing',
          title: `Écrasement ${test.reference}`,
          details: `${count} ép.`,
      }));
  };

  const createTestEvents = (test: ConcreteTest): CalendarEvent[] => {
      const events: CalendarEvent[] = [];
      if (test.receptionDate) {
          events.push({
              id: `${test._id}-rec`,
              testId: test._id,
              dateStr: new Date(test.receptionDate).toISOString().split('T')[0],
              type: 'reception',
              title: `Réception ${test.reference}`,
              details: test.projectName || '',
          });
      }
      if (test.samplingDate) {
          events.push({
              id: `${test._id}-samp`,
              testId: test._id,
              dateStr: new Date(test.samplingDate).toISOString().split('T')[0],
              type: 'sampling',
              title: `Prélèvement ${test.reference}`,
              details: `${test.structureName} (${test.concreteClass})`,
          });
      }
      return [...events, ...createCrushingEvents(test)];
  };
  
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await authenticatedFetch('/api/concrete-tests', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setTests(await res.json());
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchTests();
  }, [token]);

  const events = useMemo(() => {
    return tests.flatMap(createTestEvents)
      .filter(event => eventVisibility[event.type]);
  }, [tests, eventVisibility]);

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LaboBeton//NONSGML v1.0//EN\n";
    events.forEach(ev => {
      const start = ev.dateStr.replaceAll('-', '');
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART;VALUE=DATE:${start}\n`;
      icsContent += `SUMMARY:${ev.title}\n`;
      icsContent += `DESCRIPTION:${ev.details}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'planning_labo.ics');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleNavigateToTest = (testId: string) => {
    setIsModalOpen(false);
    if (onNavigate) onNavigate('fresh_tests', testId);
  };

  const handleEventClick = (event: React.MouseEvent, testId: string) => {
    event.stopPropagation();
    const test = tests.find(t => t._id === testId);
    if (test) {
      setSelectedTest(test);
      setIsModalOpen(true);
    }
  };

  // Calendar rendering logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(<div key={`empty-${i}`} className="bg-concrete-50/50 border-r border-b border-concrete-100 min-h-[120px]"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.dateStr === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        days.push(
            <CalendarDay 
                key={d} 
                day={d} 
                isToday={isToday} 
                events={dayEvents} 
                onEventClick={handleEventClick} 
            />
        );
    }
    return days;
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  if (loading) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      {selectedTest && <EventModal test={selectedTest} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onNavigate={handleNavigateToTest} />}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-concrete-200 shadow-sm gap-4">
        <div><h2 className="text-2xl font-bold text-concrete-900 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-concrete-500" />Planning Laboratoire</h2></div>
        <div className="flex items-center gap-2">
           <button onClick={handleExportICS} className="flex items-center gap-2 px-3 py-1.5 border border-concrete-300 rounded text-sm hover:bg-concrete-50"><Download className="w-4 h-4" /> Export .ics</button>
           <div className="flex items-center bg-concrete-100 rounded-lg p-1 gap-1">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-md" aria-label="Previous Month"><ChevronLeft className="w-5 h-5" /></button>
             <div className="px-4 py-1 font-bold text-concrete-800 min-w-[140px] text-center">{monthNames[month]} {year}</div>
             <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-md" aria-label="Next Month"><ChevronRight className="w-5 h-5" /></button>
             <button onClick={handleToday} className="ml-2 px-3 py-1 text-xs font-medium uppercase hover:text-safety-orange">Aujourd'hui</button>
           </div>
        </div>
      </div>

      <div className="flex gap-4 text-xs font-bold px-2 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eventVisibility.reception} onChange={e => setEventVisibility({...eventVisibility, reception: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500" />
          <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
          <span>Réception</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eventVisibility.sampling} onChange={e => setEventVisibility({...eventVisibility, sampling: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
          <span>Prélèvement</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eventVisibility.crushing} onChange={e => setEventVisibility({...eventVisibility, crushing: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
          <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded"></div>
          <span>Écrasement</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
         <div className="grid grid-cols-7 bg-concrete-800 text-white border-b border-concrete-700">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-2 text-center text-sm font-semibold uppercase">{d}</div>)}</div>
         <div className="grid grid-cols-7 bg-concrete-100 gap-px border-l border-t border-concrete-200">{renderCalendarDays()}</div>
      </div>
    </div>
  );
};

