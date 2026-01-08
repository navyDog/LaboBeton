import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hammer, Factory, Truck, X, FileText, MapPin, Beaker, Download, ArrowRight } from 'lucide-react';
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-concrete-200 flex flex-col max-h-[90vh]">
        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center shrink-0">
          <div>
             <h3 className="text-white font-bold text-lg flex items-center gap-2">
               <FileText className="w-5 h-5 text-safety-orange" />
               {test.reference}
             </h3>
             <p className="text-concrete-400 text-xs">{test.projectName} - {test.companyName}</p>
          </div>
          <button onClick={onClose} className="text-concrete-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="bg-concrete-50 p-4 rounded-lg border border-concrete-100">
                <h4 className="text-xs font-bold text-concrete-500 uppercase mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Localisation
                </h4>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span className="text-concrete-500">Ouvrage:</span><span className="font-semibold text-concrete-900">{test.structureName}</span></div>
                   <div className="flex justify-between"><span className="text-concrete-500">Partie:</span><span className="font-semibold text-concrete-900">{test.elementName}</span></div>
                   <div className="flex justify-between"><span className="text-concrete-500">Prélèvement:</span><span className="font-semibold text-concrete-900">{new Date(test.samplingDate).toLocaleDateString()}</span></div>
                </div>
             </div>
             <div className="bg-concrete-50 p-4 rounded-lg border border-concrete-100">
                <h4 className="text-xs font-bold text-concrete-500 uppercase mb-3 flex items-center gap-2">
                  <Beaker className="w-4 h-4" /> Caractéristiques
                </h4>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span className="text-concrete-500">Classe:</span><span className="inline-block px-2 py-0.5 bg-white border border-concrete-200 rounded text-xs font-bold">{test.concreteClass}</span></div>
                   <div className="flex justify-between"><span className="text-concrete-500">Slump:</span><span className="font-semibold text-concrete-900">{test.slump} mm</span></div>
                   <div className="flex justify-between"><span className="text-concrete-500">Volume:</span><span className="font-semibold text-concrete-900">{test.volume} m³</span></div>
                </div>
             </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-concrete-500 uppercase mb-3 flex items-center gap-2"><Hammer className="w-4 h-4" /> Éprouvettes</h4>
            <div className="overflow-x-auto border border-concrete-200 rounded-lg">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-concrete-100 text-concrete-600 font-semibold">
                  <tr><th className="px-3 py-2">N°</th><th className="px-3 py-2">Âge</th><th className="px-3 py-2">Date Écrasement</th><th className="px-3 py-2 text-right">Résultat (MPa)</th></tr>
                </thead>
                <tbody className="divide-y divide-concrete-100">
                  {test.specimens.map((s, idx) => (
                    <tr key={idx} className="hover:bg-concrete-50">
                      <td className="px-3 py-2 font-mono font-bold">#{s.number}</td>
                      <td className="px-3 py-2">{s.age}j</td>
                      <td className="px-3 py-2">{new Date(s.crushingDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.stress ? <span className="font-bold text-safety-orange">{s.stress.toFixed(1)}</span> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-4 bg-concrete-50 border-t border-concrete-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-concrete-200 text-concrete-700 hover:bg-concrete-300 rounded font-medium transition-colors">Fermer</button>
          {onNavigate && (
            <button 
              onClick={() => onNavigate(test._id)} 
              className="px-4 py-2 bg-concrete-800 text-white hover:bg-black rounded font-medium flex items-center gap-2"
            >
              Accéder à la fiche <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
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
    const list: CalendarEvent[] = [];
    tests.forEach(test => {
      const ref = test.reference;
      if (test.receptionDate) list.push({ id: `${test._id}-rec`, testId: test._id, dateStr: new Date(test.receptionDate).toISOString().split('T')[0], type: 'reception', title: `Réception ${ref}`, details: test.projectName || '' });
      if (test.samplingDate) list.push({ id: `${test._id}-samp`, testId: test._id, dateStr: new Date(test.samplingDate).toISOString().split('T')[0], type: 'sampling', title: `Prélèvement ${ref}`, details: `${test.structureName} (${test.concreteClass})` });
      if (test.specimens) {
        const crushingGroups: Record<string, number> = {};
        test.specimens.forEach(s => {
          if (s.crushingDate) {
            const d = new Date(s.crushingDate).toISOString().split('T')[0];
            crushingGroups[d] = (crushingGroups[d] || 0) + 1;
          }
        });
        Object.entries(crushingGroups).forEach(([dateStr, count]) => {
          list.push({ id: `${test._id}-crush-${dateStr}`, testId: test._id, dateStr: dateStr, type: 'crushing', title: `Écrasement ${ref}`, details: `${count} ép.` });
        });
      }
    });
    return list;
  }, [tests]);

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LaboBeton//NONSGML v1.0//EN\n";
    events.forEach(ev => {
      const start = ev.dateStr.replace(/-/g, '');
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART;VALUE=DATE:${start}\n`;
      icsContent += `SUMMARY:${ev.title}\n`;
      icsContent += `DESCRIPTION:${ev.details}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'planning_labo.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNavigateToTest = (testId: string) => {
    setIsModalOpen(false);
    if (onNavigate) onNavigate('fresh_tests', testId);
  };

  // Logic rendering...
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(<div key={`empty-${i}`} className="bg-concrete-50/50 border-r border-b border-concrete-100 min-h-[120px]"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.dateStr === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div key={d} className={`border-r border-b border-concrete-200 min-h-[120px] bg-white hover:bg-concrete-50 transition-colors p-2 flex flex-col gap-1 ${isToday ? 'bg-blue-50/30' : ''}`}>
          <div className="flex justify-between items-start mb-1">
             <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-safety-orange text-white shadow-sm' : 'text-concrete-700'}`}>{d}</span>
             {dayEvents.length > 0 && <span className="text-[10px] bg-concrete-100 text-concrete-500 px-1.5 rounded-full font-medium">{dayEvents.length}</span>}
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
            {dayEvents.map(ev => (
              <div 
                key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedTest(tests.find(t => t._id === ev.testId) || null); setIsModalOpen(true); }} 
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
             <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-md"><ChevronLeft className="w-5 h-5" /></button>
             <div className="px-4 py-1 font-bold text-concrete-800 min-w-[140px] text-center">{monthNames[month]} {year}</div>
             <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-md"><ChevronRight className="w-5 h-5" /></button>
             <button onClick={handleToday} className="ml-2 px-3 py-1 text-xs font-medium uppercase hover:text-safety-orange">Aujourd'hui</button>
           </div>
        </div>
      </div>

      <div className="flex gap-4 text-xs font-bold px-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div><span>Réception</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div><span>Prélèvement</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded"></div><span>Écrasement</span></div>
      </div>

      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
         <div className="grid grid-cols-7 bg-concrete-800 text-white border-b border-concrete-700">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-2 text-center text-sm font-semibold uppercase">{d}</div>)}</div>
         <div className="grid grid-cols-7 bg-concrete-100 gap-px border-l border-t border-concrete-200">{renderCalendarDays()}</div>
      </div>
    </div>
  );
};