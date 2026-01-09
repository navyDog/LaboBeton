import React, { useState } from 'react';
import { X, Save, Hammer, Scale, Loader2 } from 'lucide-react';
import { ConcreteTest, Specimen } from '../types';
import { authenticatedFetch } from '../utils/api';

interface QuickEntryModalProps {
  testId: string;
  testReference: string;
  projectName: string;
  targetDate: string; // Date d'écrasement ciblée
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ 
  testId, testReference, projectName, targetDate, token, onClose, onSuccess 
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullTest, setFullTest] = useState<ConcreteTest | null>(null);
  const [specimensToEdit, setSpecimensToEdit] = useState<Specimen[]>([]);

  // 1. Charger le test complet au montage
  React.useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await authenticatedFetch(`/api/concrete-tests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const allTests: ConcreteTest[] = await res.json();
          const found = allTests.find(t => t._id === testId);
          if (found) {
            setFullTest(found);
            // Filtrer les éprouvettes qui correspondent à la date cible (ignorant l'heure)
            const targetDateStr = new Date(targetDate).toISOString().split('T')[0];
            const matchingSpecimens = found.specimens.filter(s => {
              if (!s.crushingDate) return false;
              const sDate = new Date(s.crushingDate).toISOString().split('T')[0];
              return sDate === targetDateStr;
            });
            setSpecimensToEdit(matchingSpecimens);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [testId, targetDate, token]);

  // 2. Gérer la saisie locale
  const handleChange = (specimenNumber: number, field: 'weight' | 'force', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setSpecimensToEdit(prev => prev.map(s => {
      if (s.number !== specimenNumber) return s;
      
      const updated = { ...s, [field]: numValue };
      
      // Recalcul live (Optionnel, mais sympa visuellement)
      if (updated.force && updated.surface) {
        updated.stress = (updated.force * 1000) / updated.surface;
      }
      
      return updated;
    }));
  };

  // 3. Sauvegarder
  const handleSave = async () => {
    if (!fullTest) return;
    setSaving(true);

    try {
      // On fusionne les éprouvettes modifiées dans la liste complète
      const updatedSpecimensList = fullTest.specimens.map(originalS => {
        const modified = specimensToEdit.find(mod => mod.number === originalS.number);
        if (modified) {
          // Recalculer proprement les champs dérivés avant envoi
          const surface = modified.surface || 1; // Sécurité div/0
          const stress = (modified.force && modified.force > 0) ? (modified.force * 1000) / surface : null;
          const volume = surface * modified.height;
          const density = (modified.weight && modified.weight > 0) ? (modified.weight / volume) * 1000000 : null;

          return { 
            ...modified, 
            stress: stress || undefined, 
            density: density || undefined 
          };
        }
        return originalS;
      });

      // PATCH simulé via PUT (Object.assign côté serveur)
      const res = await authenticatedFetch(`/api/concrete-tests/${testId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ specimens: updatedSpecimensList })
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      alert("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !fullTest) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-concrete-200">
        
        <div className="bg-concrete-800 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Hammer className="w-5 h-5 text-safety-orange" />
              Saisie Rapide : Écrasements du Jour
            </h3>
            <p className="text-xs text-concrete-300">{testReference} - {projectName}</p>
          </div>
          <button onClick={onClose} className="hover:text-concrete-300"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          {loading ? (
             <div className="py-8 text-center text-concrete-500 flex flex-col items-center">
               <Loader2 className="w-8 h-8 animate-spin mb-2" />
               Chargement des éprouvettes...
             </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-concrete-500 uppercase border-b border-concrete-100 pb-2">
                <div className="col-span-1">N°</div>
                <div className="col-span-2 text-center">Âge</div>
                <div className="col-span-4">Masse (g)</div>
                <div className="col-span-4">Force (kN)</div>
                <div className="col-span-1 text-right">MPa</div>
              </div>

              {specimensToEdit.map((specimen) => (
                <div key={specimen.number} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 font-bold text-concrete-700">#{specimen.number}</div>
                  <div className="col-span-2 text-center font-medium bg-concrete-100 rounded py-1 text-xs">
                    {specimen.age} Jours
                  </div>
                  <div className="col-span-4">
                    <div className="relative">
                      <Scale className="w-4 h-4 absolute left-2 top-2 text-concrete-400" />
                      <input 
                        type="number" 
                        autoFocus={specimen === specimensToEdit[0]}
                        className="w-full pl-8 p-1.5 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900"
                        placeholder="ex: 2400"
                        value={specimen.weight || ''}
                        onChange={(e) => handleChange(specimen.number, 'weight', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-4">
                     <div className="relative">
                      <Hammer className="w-4 h-4 absolute left-2 top-2 text-concrete-400" />
                      <input 
                        type="number" step="0.1"
                        className="w-full pl-8 p-1.5 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900"
                        placeholder="ex: 600.5"
                        value={specimen.force || ''}
                        onChange={(e) => handleChange(specimen.number, 'force', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-mono font-bold text-safety-orange text-sm">
                    {specimen.stress ? specimen.stress.toFixed(1) : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-concrete-50 border-t border-concrete-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-concrete-600 hover:bg-concrete-200 rounded-lg">Annuler</button>
          <button 
            onClick={handleSave} 
            disabled={loading || saving}
            className="px-6 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer les Résultats
          </button>
        </div>

      </div>
    </div>
  );
};
