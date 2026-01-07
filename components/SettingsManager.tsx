import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, X, Save, RotateCcw, Box, Truck, Factory, FlaskConical, Gauge, BookOpen, Waves, Thermometer, Hammer, Layers } from 'lucide-react';
import { Settings } from '../types';

interface SettingsManagerProps {
  token: string;
}

// Sous-composant pour gérer une liste de strings
const ListEditor: React.FC<{
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  icon: React.ReactNode;
  placeholder: string;
}> = ({ title, items, onChange, icon, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-concrete-200 shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-concrete-100 bg-concrete-50 rounded-t-xl flex items-center gap-3">
        <div className="text-concrete-500">
          {icon}
        </div>
        <h3 className="font-bold text-concrete-800">{title}</h3>
      </div>
      
      <div className="p-4 flex-grow flex flex-col gap-3">
        {/* Zone d'ajout */}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-grow p-2 text-sm border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleAdd}
            className="p-2 bg-concrete-800 text-white rounded hover:bg-concrete-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-grow overflow-y-auto max-h-48 space-y-2 pr-1 custom-scrollbar">
          {(!items || items.length === 0) && (
            <p className="text-xs text-concrete-400 italic text-center py-4">Aucune donnée configurée.</p>
          )}
          {items && items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-concrete-50 px-3 py-2 rounded text-sm group border border-transparent hover:border-concrete-200">
              <span className="text-concrete-700 font-medium">{item}</span>
              <button 
                onClick={() => handleRemove(idx)}
                className="text-concrete-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsManager: React.FC<SettingsManagerProps> = ({ token }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Réglages enregistrés avec succès.' });
        // Disparaître le message après 3s
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion serveur.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-concrete-400">Chargement des configurations...</div>;
  if (!settings) return <div className="text-center py-12 text-red-500">Erreur de chargement des données.</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-concrete-200 shadow-sm sticky top-20 z-10">
        <div>
          <h2 className="text-2xl font-bold text-concrete-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-concrete-500" /> 
            Réglages Laboratoire
          </h2>
          <p className="text-concrete-500 text-sm">Configurez les listes déroulantes pour vos rapports d'essais.</p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
             <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'} animate-in fade-in`}>
               {message.text}
             </span>
          )}
          <button 
            onClick={fetchSettings}
            className="p-2 text-concrete-500 hover:text-concrete-800 bg-concrete-100 rounded-lg transition-colors"
            title="Recharger"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-bold disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <ListEditor 
          title="Classes de Résistance"
          icon={<Gauge className="w-5 h-5" />}
          items={settings.concreteClasses}
          placeholder="ex: C25/30"
          onChange={(items) => setSettings({...settings, concreteClasses: items})}
        />

        <ListEditor 
          title="Classes de Consistance (Slump)"
          icon={<Waves className="w-5 h-5" />}
          items={settings.consistencyClasses || []}
          placeholder="ex: S3"
          onChange={(items) => setSettings({...settings, consistencyClasses: items})}
        />

        <ListEditor 
          title="Types de Mélange / Composition"
          icon={<FlaskConical className="w-5 h-5" />}
          items={settings.mixTypes}
          placeholder="ex: CEM II/A 350kg"
          onChange={(items) => setSettings({...settings, mixTypes: items})}
        />

        <ListEditor 
          title="Types d'Éprouvette"
          icon={<Box className="w-5 h-5" />}
          items={settings.specimenTypes}
          placeholder="ex: Cylindrique 16x32"
          onChange={(items) => setSettings({...settings, specimenTypes: items})}
        />

        <ListEditor 
          title="Modes de Conservation"
          icon={<Thermometer className="w-5 h-5" />}
          items={settings.curingMethods || []}
          placeholder="ex: Eau 20°C"
          onChange={(items) => setSettings({...settings, curingMethods: items})}
        />

        <ListEditor 
          title="Types d'Essai"
          icon={<Hammer className="w-5 h-5" />}
          items={settings.testTypes || []}
          placeholder="ex: Compression"
          onChange={(items) => setSettings({...settings, testTypes: items})}
        />

        <ListEditor 
          title="Préparation / Surfaçage"
          icon={<Layers className="w-5 h-5" />}
          items={settings.preparations || []}
          placeholder="ex: Surfaçage Soufre"
          onChange={(items) => setSettings({...settings, preparations: items})}
        />

        <ListEditor 
          title="Modes de Livraison"
          icon={<Truck className="w-5 h-5" />}
          items={settings.deliveryMethods}
          placeholder="ex: Toupie"
          onChange={(items) => setSettings({...settings, deliveryMethods: items})}
        />

        <ListEditor 
          title="Lieux de Fabrication"
          icon={<Factory className="w-5 h-5" />}
          items={settings.manufacturingPlaces}
          placeholder="ex: Centrale BPE"
          onChange={(items) => setSettings({...settings, manufacturingPlaces: items})}
        />

        <ListEditor 
          title="Normes NF Applicables"
          icon={<BookOpen className="w-5 h-5" />}
          items={settings.nfStandards}
          placeholder="ex: NF EN 206/CN"
          onChange={(items) => setSettings({...settings, nfStandards: items})}
        />

      </div>
    </div>
  );
};