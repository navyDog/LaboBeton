import React, { useState, useEffect } from 'react';
import { X, Hammer, Scale, Save } from 'lucide-react';
import { Specimen } from '../types';

interface SpecimenModalProps {
  specimen: Specimen;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Specimen) => void;
}

const SpecimenModal: React.FC<SpecimenModalProps> = ({ specimen, isOpen, onClose, onSave }) => {
  const [data, setData] = useState<Specimen>(specimen);
  useEffect(() => { setData(specimen); }, [specimen]);

  if (!isOpen) return null;

  const surface = data.specimenType.toLowerCase().includes('cube') ? data.diameter * data.diameter : Math.PI * Math.pow(data.diameter / 2, 2);
  const stress = (data.force && data.force > 0) ? (data.force * 1000) / surface : 0;
  const volume = surface * data.height;
  const density = (data.weight && data.weight > 0) ? (data.weight / volume) * 1000000 : 0;

  const handleChange = (field: keyof Specimen, value: string) => {
    const numValue = Number.parseFloat(value);
    setData({ ...data, [field]: Number.isNaN(numValue) ? undefined : numValue });
  };

  const handleSaveClick = () => {
    const finalSurface = data.specimenType.toLowerCase().includes('cube') ? data.diameter * data.diameter : Math.PI * Math.pow(data.diameter / 2, 2);
    const finalStress = (data.force && data.force > 0) ? (data.force * 1000) / finalSurface : null;
    const finalVolume = finalSurface * data.height;
    const finalDensity = (data.weight && data.weight > 0) ? (data.weight / finalVolume) * 1000000 : null;
    onSave({ ...data, surface: finalSurface, stress: finalStress || undefined, density: finalDensity || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-concrete-200">
        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Hammer className="w-5 h-5 text-safety-orange" /> Saisie Résultats Éprouvette
          </h3>
          <button onClick={onClose} className="text-concrete-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-concrete-50 p-3 rounded-lg border border-concrete-100">
             <div className="text-sm"><span className="block text-concrete-500 text-xs uppercase font-bold">Numéro</span><span className="font-mono font-bold text-lg">#{data.number}</span></div>
             <div className="text-sm text-right"><span className="block text-concrete-500 text-xs uppercase font-bold">Âge</span><span className="font-bold">{data.age} Jours</span></div>
             <div className="text-sm text-right"><span className="block text-concrete-500 text-xs uppercase font-bold">Type</span><span>{data.specimenType}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-concrete-500 uppercase border-b border-concrete-100 pb-1">Géométrie</h4>
               <div>
                 <label htmlFor="diameter" className="block text-sm font-medium mb-1">
                   Diamètre / Côté (mm)<input id="diameter" type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange"
                          value={data.diameter || ''} onChange={e => handleChange('diameter', e.target.value)} />
                 </label>
               </div>
               <div>
                 <label htmlFor="height" className="block text-sm font-medium mb-1">
                   Hauteur (mm)<input id="height" type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange"
                          value={data.height || ''} onChange={e => handleChange('height', e.target.value)} />
                 </label>
               </div>
            </div>
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-safety-orange uppercase border-b border-orange-100 pb-1">Mesures Labo</h4>
               <div><label htmlFor="weight" className="block text-sm font-medium mb-1 flex items-center gap-2"><Scale className="w-4 h-4 text-concrete-400" /> Masse (g)</label><input id="weight" type="number" step="1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900" value={data.weight || ''} onChange={e => handleChange('weight', e.target.value)} /></div>
               <div><label htmlFor="force" className="block text-sm font-medium mb-1 flex items-center gap-2"><Hammer className="w-4 h-4 text-concrete-400" /> Force (kN)</label><input id="force" type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900" value={data.force || ''} onChange={e => handleChange('force', e.target.value)} /></div>
            </div>
          </div>
          <div className="bg-concrete-900 text-white rounded-lg p-4 grid grid-cols-2 gap-4">
             <div><span className="block text-concrete-400 text-xs uppercase">Résistance (MPa)</span><span className="text-2xl font-bold text-safety-orange font-mono">{stress > 0 ? stress.toFixed(1) : '-.--'}</span></div>
             <div className="text-right"><span className="block text-concrete-400 text-xs uppercase">Masse Volumique</span><span className="text-lg font-bold font-mono">{density > 0 ? density.toFixed(0) : '---'} <span className="text-sm text-concrete-500">kg/m³</span></span></div>
          </div>
        </div>
        <div className="p-4 bg-concrete-50 border-t border-concrete-200 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-concrete-600 hover:bg-concrete-200 rounded-lg">Annuler</button><button onClick={handleSaveClick} className="px-6 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold flex items-center gap-2 shadow-sm"><Save className="w-4 h-4" /> Enregistrer</button></div>
      </div>
    </div>
  );
};

export default SpecimenModal;