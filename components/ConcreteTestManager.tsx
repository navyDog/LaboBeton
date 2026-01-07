import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Database, Activity, FileText, Factory, Beaker, ClipboardCheck, ArrowLeft, Search, Calculator, Boxes, Pencil, X, Scale, Hammer, Save } from 'lucide-react';
import { ConcreteTest, Project, Settings, Specimen } from '../types';

interface ConcreteTestManagerProps {
  token: string;
  onBack: () => void;
}

// --- MODALE SAISIE RESULTATS ---
interface SpecimenModalProps {
  specimen: Specimen;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Specimen) => void;
}

const SpecimenModal: React.FC<SpecimenModalProps> = ({ specimen, isOpen, onClose, onSave }) => {
  const [data, setData] = useState<Specimen>(specimen);

  useEffect(() => {
    setData(specimen);
  }, [specimen]);

  if (!isOpen) return null;

  // Calculs dynamiques pour prévisualisation
  const surface = data.specimenType.toLowerCase().includes('cube') 
    ? data.diameter * data.diameter 
    : Math.PI * Math.pow(data.diameter / 2, 2);
    
  const stress = (data.force && data.force > 0) ? (data.force * 1000) / surface : 0;
  const volume = surface * data.height;
  const density = (data.weight && data.weight > 0) ? (data.weight / volume) * 1000000 : 0;

  const handleChange = (field: keyof Specimen, value: string) => {
    const numValue = parseFloat(value);
    setData({ ...data, [field]: isNaN(numValue) ? undefined : numValue });
  };

  const handleSaveClick = () => {
    // On calcule les valeurs dérivées (Stress/Density) AVANT de renvoyer au parent
    // pour que l'affichage dans le tableau soit immédiat
    const finalSurface = data.specimenType.toLowerCase().includes('cube') 
      ? data.diameter * data.diameter 
      : Math.PI * Math.pow(data.diameter / 2, 2);
      
    const finalStress = (data.force && data.force > 0) ? (data.force * 1000) / finalSurface : null;
    
    const finalVolume = finalSurface * data.height;
    const finalDensity = (data.weight && data.weight > 0) ? (data.weight / finalVolume) * 1000000 : null;

    onSave({
      ...data,
      surface: finalSurface,
      stress: finalStress || undefined,
      density: finalDensity || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-concrete-200">
        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Hammer className="w-5 h-5 text-safety-orange" />
            Saisie Résultats Éprouvette
          </h3>
          <button onClick={onClose} className="text-concrete-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-concrete-50 p-3 rounded-lg border border-concrete-100">
             <div className="text-sm">
               <span className="block text-concrete-500 text-xs uppercase font-bold">Numéro</span>
               <span className="font-mono font-bold text-lg">#{data.number}</span>
             </div>
             <div className="text-sm text-right">
               <span className="block text-concrete-500 text-xs uppercase font-bold">Âge</span>
               <span className="font-bold">{data.age} Jours</span>
             </div>
             <div className="text-sm text-right">
               <span className="block text-concrete-500 text-xs uppercase font-bold">Type</span>
               <span>{data.specimenType}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* DIMENSIONS */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-concrete-500 uppercase border-b border-concrete-100 pb-1">Géométrie</h4>
               <div>
                 <label className="block text-sm font-medium mb-1">Diamètre / Côté (mm)</label>
                 <input 
                   type="number" step="0.1"
                   className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange"
                   value={data.diameter || ''}
                   onChange={e => handleChange('diameter', e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Hauteur (mm)</label>
                 <input 
                   type="number" step="0.1"
                   className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange"
                   value={data.height || ''}
                   onChange={e => handleChange('height', e.target.value)}
                 />
               </div>
               <div className="text-right">
                 <span className="text-xs text-concrete-400">Surface: </span>
                 <span className="font-mono text-sm font-bold text-concrete-700">{surface.toFixed(1)} mm²</span>
               </div>
            </div>

            {/* RESULTATS */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-safety-orange uppercase border-b border-orange-100 pb-1">Mesures Labo</h4>
               <div>
                 <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                   <Scale className="w-4 h-4 text-concrete-400" /> Masse (g)
                 </label>
                 <input 
                   type="number" step="1"
                   className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900"
                   value={data.weight || ''}
                   onChange={e => handleChange('weight', e.target.value)}
                   placeholder="ex: 2350"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                   <Hammer className="w-4 h-4 text-concrete-400" /> Force (kN)
                 </label>
                 <input 
                   type="number" step="0.1"
                   className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900"
                   value={data.force || ''}
                   onChange={e => handleChange('force', e.target.value)}
                   placeholder="ex: 650.5"
                 />
               </div>
            </div>
          </div>

          {/* CALCULS PREVISUALISATION */}
          <div className="bg-concrete-900 text-white rounded-lg p-4 grid grid-cols-2 gap-4">
             <div>
               <span className="block text-concrete-400 text-xs uppercase">Résistance (MPa)</span>
               <span className="text-2xl font-bold text-safety-orange font-mono">
                 {stress > 0 ? stress.toFixed(1) : '-.--'}
               </span>
             </div>
             <div className="text-right">
               <span className="block text-concrete-400 text-xs uppercase">Masse Volumique</span>
               <span className="text-lg font-bold font-mono">
                 {density > 0 ? density.toFixed(0) : '---'} <span className="text-sm text-concrete-500">kg/m³</span>
               </span>
             </div>
          </div>
        </div>

        <div className="p-4 bg-concrete-50 border-t border-concrete-200 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-concrete-600 hover:bg-concrete-200 rounded-lg transition-colors">
             Annuler
           </button>
           <button 
             onClick={handleSaveClick}
             className="px-6 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold flex items-center gap-2 shadow-sm"
           >
             <Save className="w-4 h-4" /> Enregistrer
           </button>
        </div>
      </div>
    </div>
  );
};


// --- HELPERS ---
const calculateConsistency = (slump: number): string => {
  if (!slump && slump !== 0) return '';
  if (slump < 10) return 'Indet.';
  if (slump <= 40) return 'S1';
  if (slump <= 90) return 'S2';
  if (slump <= 150) return 'S3';
  if (slump <= 210) return 'S4';
  return 'S5';
};

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// --- MAIN COMPONENT ---
export const ConcreteTestManager: React.FC<ConcreteTestManagerProps> = ({ token, onBack }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Specimen Modal State
  const [selectedSpecimenIdx, setSelectedSpecimenIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Form State
  const initialFormState = {
    projectId: '',
    structureName: '',
    elementName: '',
    receptionDate: new Date().toISOString().split('T')[0],
    samplingDate: new Date().toISOString().split('T')[0],
    volume: 0,
    
    concreteClass: '',      
    mixType: '',            
    
    formulaInfo: '',
    manufacturer: '',
    manufacturingPlace: '',
    deliveryMethod: '',
    
    slump: 0,               
    samplingPlace: '',
    
    tightening: 'Piquage',
    vibrationTime: 0,
    layers: 2,
    curing: '',
    
    testType: '',
    standard: '',
    preparation: '',
    pressMachine: 'Presse 3000kN',
    
    specimens: [] as Specimen[]
  };

  const [formData, setFormData] = useState(initialFormState);
  
  // State pour l'ajout de packs
  const [packAge, setPackAge] = useState(28);
  const [packCount, setPackCount] = useState(3);
  const [packDim, setPackDim] = useState('160x320'); // Simple sélecteur rapide

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, projectsRes, settingsRes] = await Promise.all([
          fetch('/api/concrete-tests', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (testsRes.ok) setTests(await testsRes.json());
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Reset form helper
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setViewMode('list');
    setSelectedSpecimenIdx(null);
    setIsModalOpen(false);
  };

  // Gestion des packs d'éprouvettes
  const handleAddPack = () => {
    if (packCount <= 0) return;

    const currentCount = formData.specimens.length;
    const newSpecimens: Specimen[] = [];
    
    let diameter = 160;
    let height = 320;
    
    if (packDim === '110x220') { diameter = 110; height = 220; }
    if (packDim === '150x150') { diameter = 150; height = 150; } // Cube
    
    // Calcul Surface (mm2)
    const isCube = packDim.includes('Cube') || packDim === '150x150';
    const surface = isCube 
      ? diameter * diameter 
      : Math.PI * Math.pow(diameter / 2, 2);

    for (let i = 0; i < packCount; i++) {
      newSpecimens.push({
        number: currentCount + i + 1,
        age: packAge,
        castingDate: formData.samplingDate,
        crushingDate: addDays(formData.samplingDate, packAge),
        specimenType: isCube ? 'Cubique' : 'Cylindrique',
        diameter,
        height,
        surface: Math.round(surface * 100) / 100
      });
    }

    setFormData({
      ...formData,
      specimens: [...formData.specimens, ...newSpecimens]
    });
  };

  const handleRemoveSpecimen = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture de la modale
    const updated = formData.specimens.filter((_, i) => i !== index);
    const renumbered = updated.map((s, i) => ({ ...s, number: i + 1 }));
    setFormData({ ...formData, specimens: renumbered });
  };

  // Open Modal
  const handleSpecimenClick = (index: number) => {
    setSelectedSpecimenIdx(index);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveSpecimen = (updated: Specimen) => {
    if (selectedSpecimenIdx === null) return;
    
    const updatedSpecimens = [...formData.specimens];
    updatedSpecimens[selectedSpecimenIdx] = updated;
    
    setFormData({ ...formData, specimens: updatedSpecimens });
    setIsModalOpen(false);
    setSelectedSpecimenIdx(null);
  };

  // Prepare Edit
  const handleEdit = (test: ConcreteTest) => {
    // FIX: Le projectId venant du backend est un objet (populate). 
    // Il faut extraire l'_id pour que le select fonctionne.
    const projectValue = (test.projectId && typeof test.projectId === 'object') 
      ? (test.projectId as any)._id 
      : test.projectId;

    setFormData({
      projectId: projectValue || '',
      structureName: test.structureName || '',
      elementName: test.elementName || '',
      receptionDate: test.receptionDate ? new Date(test.receptionDate).toISOString().split('T')[0] : initialFormState.receptionDate,
      samplingDate: test.samplingDate ? new Date(test.samplingDate).toISOString().split('T')[0] : initialFormState.samplingDate,
      volume: test.volume || 0,
      
      concreteClass: test.concreteClass || '',
      mixType: test.mixType || '',
      formulaInfo: test.formulaInfo || '',
      manufacturer: test.manufacturer || '',
      manufacturingPlace: test.manufacturingPlace || '',
      deliveryMethod: test.deliveryMethod || '',
      
      slump: test.slump || 0,
      samplingPlace: test.samplingPlace || '',
      
      tightening: test.tightening || 'Piquage',
      vibrationTime: test.vibrationTime || 0,
      layers: test.layers || 2,
      curing: test.curing || '',
      
      testType: test.testType || '',
      standard: test.standard || '',
      preparation: test.preparation || '',
      pressMachine: test.pressMachine || 'Presse 3000kN',
      
      specimens: test.specimens || []
    });
    setEditingId(test._id);
    setViewMode('create');
  };

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) return alert("Veuillez sélectionner une affaire.");

    const selectedProject = projects.find(p => p._id === formData.projectId);
    
    const payload = {
      ...formData,
      projectName: selectedProject?.name || '',
      companyName: selectedProject?.companyName || '',
      specimenCount: formData.specimens.length 
    };

    try {
      const url = editingId ? `/api/concrete-tests/${editingId}` : '/api/concrete-tests';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedTest = await res.json();
        
        if (editingId) {
          setTests(tests.map(t => t._id === editingId ? updatedTest : t));
        } else {
          setTests([updatedTest, ...tests]);
        }
        
        resetForm();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message || "Impossible d'enregistrer la fiche."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion au serveur.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette fiche de prélèvement ?")) return;
    try {
      await fetch(`/api/concrete-tests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTests(tests.filter(t => t._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredTests = tests.filter(t => 
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.structureName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDER CREATE MODE ---
  if (viewMode === 'create') {
    const calculatedConsistency = calculateConsistency(formData.slump);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-concrete-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
        {/* Modale */}
        {isModalOpen && selectedSpecimenIdx !== null && (
          <SpecimenModal 
            specimen={formData.specimens[selectedSpecimenIdx]}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveSpecimen}
          />
        )}

        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <button type="button" onClick={resetForm} className="text-concrete-400 hover:text-white transition-colors">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-white">
               {editingId ? 'Modifier Prélèvement & Résultats' : 'Nouveau Prélèvement Béton'}
             </h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
           
           {/* SECTION 1: IDENTIFICATION */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2">
                <FileText className="w-5 h-5 text-safety-orange" /> Identification Chantier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="lg:col-span-1">
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Affaire (Client) *</label>
                    <select 
                      required
                      className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange"
                      value={formData.projectId}
                      onChange={e => setFormData({...formData, projectId: e.target.value})}
                    >
                      <option value="">-- Sélectionner --</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.companyName})</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Nom Ouvrage</label>
                    <input 
                      className="w-full p-2 border border-concrete-300 rounded"
                      placeholder="ex: Bâtiment A"
                      value={formData.structureName}
                      onChange={e => setFormData({...formData, structureName: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Partie d'Ouvrage</label>
                    <input 
                      className="w-full p-2 border border-concrete-300 rounded"
                      placeholder="ex: Dalle R+1, Poteaux..."
                      value={formData.elementName}
                      onChange={e => setFormData({...formData, elementName: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Date Réception Béton</label>
                    <input 
                      type="date"
                      className="w-full p-2 border border-concrete-300 rounded"
                      value={formData.receptionDate}
                      onChange={e => setFormData({...formData, receptionDate: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Date Prélèvement</label>
                    <input 
                      type="date"
                      className="w-full p-2 border border-concrete-300 rounded"
                      value={formData.samplingDate}
                      onChange={e => {
                        setFormData({...formData, samplingDate: e.target.value});
                        const updatedSpecimens = formData.specimens.map(s => ({
                           ...s,
                           castingDate: e.target.value,
                           crushingDate: addDays(e.target.value, s.age)
                        }));
                        setFormData(prev => ({ ...prev, specimens: updatedSpecimens, samplingDate: e.target.value }));
                      }}
                    />
                 </div>
              </div>
           </div>

           {/* SECTION 2: BETON & SLUMP */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2">
                <Factory className="w-5 h-5 text-safety-orange" /> Béton & Consistance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Classe Résistance</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white"
                      value={formData.concreteClass}
                      onChange={e => setFormData({...formData, concreteClass: e.target.value})}
                    >
                       <option value="">-- C25/30... --</option>
                       {settings?.concreteClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Slump Mesuré (mm)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        className="w-full p-2 pr-16 border border-concrete-300 rounded font-mono font-bold text-concrete-900"
                        value={formData.slump}
                        onChange={e => setFormData({...formData, slump: parseInt(e.target.value) || 0})}
                        placeholder="ex: 180"
                      />
                      <div className="absolute right-2 top-1.5 px-2 py-0.5 bg-concrete-100 text-concrete-600 rounded text-xs font-bold border border-concrete-200">
                         {calculatedConsistency || '-'}
                      </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Type Mélange / Formulation</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white"
                      value={formData.mixType}
                      onChange={e => setFormData({...formData, mixType: e.target.value})}
                    >
                       <option value="">-- Recette / Dosage --</option>
                       {settings?.mixTypes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Volume Coulé (m³)</label>
                    <input 
                      type="number" step="0.1"
                      className="w-full p-2 border border-concrete-300 rounded"
                      value={formData.volume}
                      onChange={e => setFormData({...formData, volume: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Lieu Fabrication</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white"
                      value={formData.manufacturingPlace}
                      onChange={e => setFormData({...formData, manufacturingPlace: e.target.value})}
                    >
                       <option value="">-- Choisir --</option>
                       {settings?.manufacturingPlaces.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Mode Livraison</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white"
                      value={formData.deliveryMethod}
                      onChange={e => setFormData({...formData, deliveryMethod: e.target.value})}
                    >
                       <option value="">-- Choisir --</option>
                       {settings?.deliveryMethods.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Lieu Prélèvement</label>
                    <input 
                      className="w-full p-2 border border-concrete-300 rounded"
                      placeholder="ex: Sortie goulotte"
                      value={formData.samplingPlace}
                      onChange={e => setFormData({...formData, samplingPlace: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           {/* SECTION 3: PLANIFICATION EPROUVETTES */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2">
                <Boxes className="w-5 h-5 text-safety-orange" /> Planification & Résultats
              </h3>
              
              <div className="bg-concrete-50 p-4 rounded-lg border border-concrete-200">
                <label className="block text-xs font-bold text-concrete-500 mb-2 uppercase">Ajouter un pack (Série)</label>
                <div className="flex flex-wrap items-end gap-3">
                   <div>
                     <span className="text-xs text-concrete-400 mb-1 block">Échéance (Jours)</span>
                     <div className="flex bg-white rounded border border-concrete-300 overflow-hidden">
                       {[7, 28].map(d => (
                         <button 
                           key={d} type="button" 
                           onClick={() => setPackAge(d)}
                           className={`px-3 py-1 text-sm font-medium border-r border-concrete-100 last:border-0 ${packAge === d ? 'bg-concrete-800 text-white' : 'hover:bg-concrete-100 text-concrete-700'}`}
                         >{d}j</button>
                       ))}
                       <input 
                         type="number" 
                         className="w-16 px-2 py-1 text-sm text-center focus:outline-none"
                         value={packAge}
                         onChange={e => setPackAge(parseInt(e.target.value))} 
                       />
                     </div>
                   </div>

                   <div>
                     <span className="text-xs text-concrete-400 mb-1 block">Quantité</span>
                     <input 
                        type="number" min="1"
                        className="w-20 p-1.5 border border-concrete-300 rounded text-center"
                        value={packCount}
                        onChange={e => setPackCount(parseInt(e.target.value))}
                     />
                   </div>

                   <div>
                     <span className="text-xs text-concrete-400 mb-1 block">Dimensions</span>
                     <select 
                        className="p-1.5 border border-concrete-300 rounded bg-white text-sm"
                        value={packDim}
                        onChange={e => setPackDim(e.target.value)}
                     >
                       <option value="160x320">Cyl. 160x320</option>
                       <option value="110x220">Cyl. 110x220</option>
                       <option value="150x150">Cube 150x150</option>
                     </select>
                   </div>

                   <button 
                     type="button"
                     onClick={handleAddPack}
                     className="px-4 py-1.5 bg-concrete-800 text-white text-sm font-medium rounded hover:bg-concrete-700 flex items-center gap-1"
                   >
                     <Plus className="w-3 h-3" /> Ajouter Pack
                   </button>
                </div>
              </div>

              {formData.specimens.length > 0 ? (
                <div className="overflow-x-auto border border-concrete-200 rounded-lg shadow-sm">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-concrete-50 text-concrete-500 font-semibold border-b border-concrete-200">
                      <tr>
                        <th className="px-3 py-2">N°</th>
                        <th className="px-3 py-2">Âge</th>
                        <th className="px-3 py-2">Date Écrasement</th>
                        <th className="px-3 py-2">Dimensions (mm)</th>
                        <th className="px-3 py-2 text-right">Force (kN)</th>
                        <th className="px-3 py-2 text-right">Contrainte (MPa)</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-concrete-100 bg-white">
                      {formData.specimens.map((s, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => handleSpecimenClick(idx)}
                          className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-3 py-2 font-mono text-concrete-600 font-bold group-hover:text-blue-600">#{s.number}</td>
                          <td className="px-3 py-2 font-bold text-concrete-800">{s.age}j</td>
                          <td className="px-3 py-2 text-concrete-600">
                            {new Date(s.crushingDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-3 py-2">{s.diameter} x {s.height}</td>
                          
                          {/* Force */}
                          <td className="px-3 py-2 text-right font-mono">
                            {s.force ? <span className="font-bold text-concrete-900">{s.force}</span> : <span className="text-concrete-300">-</span>}
                          </td>

                          {/* Contrainte (Calculée côté client si dispo, sinon backend) */}
                          <td className="px-3 py-2 text-right font-mono">
                             {s.stress ? (
                               <span className="font-bold text-safety-orange">{s.stress.toFixed(1)}</span>
                             ) : (
                                s.force ? <span className="text-concrete-400 italic">...</span> : <span className="text-concrete-300">-</span>
                             )}
                          </td>

                          <td className="px-3 py-2 text-right">
                             <button type="button" onClick={(e) => handleRemoveSpecimen(idx, e)} className="text-concrete-300 hover:text-red-600 p-1">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-blue-50 px-3 py-2 text-xs text-blue-700 text-center border-t border-blue-100">
                    💡 Cliquez sur une ligne pour saisir la Masse et la Force de rupture.
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-concrete-300 rounded text-concrete-400 text-sm">
                  Aucune éprouvette planifiée. Ajoutez un pack ci-dessus.
                </div>
              )}
           </div>

           {/* SECTION 4: CONTEXTE TECHNIQUE */}
           <div className="space-y-4 pt-4 border-t border-concrete-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Mode Serrage</label>
                    <select 
                       className="w-full p-2 border border-concrete-300 rounded text-sm"
                       value={formData.tightening}
                       onChange={e => setFormData({...formData, tightening: e.target.value})}
                    >
                      <option value="Piquage">Piquage</option>
                      <option value="Vibration Aiguille">Vibration Aiguille</option>
                      <option value="Table Vibrante">Table Vibrante</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Mode Conservation</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white text-sm"
                      value={formData.curing}
                      onChange={e => setFormData({...formData, curing: e.target.value})}
                    >
                       <option value="">-- Choisir --</option>
                       {settings?.curingMethods?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-concrete-500 mb-1">Norme Applicable</label>
                    <select 
                      className="w-full p-2 border border-concrete-300 rounded bg-white text-sm"
                      value={formData.standard}
                      onChange={e => setFormData({...formData, standard: e.target.value})}
                    >
                       <option value="">-- Choisir --</option>
                       {settings?.nfStandards.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           <div className="flex justify-end pt-6">
              <button 
                type="button" 
                onClick={resetForm}
                className="mr-4 px-6 py-3 text-concrete-600 hover:bg-concrete-100 rounded-lg font-medium"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="px-8 py-3 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {editingId ? 'Mettre à jour' : 'Créer la fiche'}
              </button>
           </div>
        </form>
      </div>
    );
  }

  // --- RENDER LIST MODE ---
  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white border border-concrete-200 rounded-lg text-concrete-500 hover:text-concrete-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-concrete-900">Fiches de Prélèvement</h2>
            <p className="text-concrete-500">Registre des éprouvettes et du béton frais (12350)</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setViewMode('create'); }}
          className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Nouveau Prélèvement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-concrete-100 bg-concrete-50 flex items-center gap-3">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input 
              type="text" 
              placeholder="Rechercher (Référence, Chantier, Ouvrage)..." 
              className="w-full pl-9 pr-4 py-2 border border-concrete-300 rounded-lg text-sm focus:border-concrete-500 focus:ring-1 focus:ring-concrete-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
           <div className="p-12 text-center text-concrete-400">Chargement...</div>
        ) : filteredTests.length === 0 ? (
           <div className="p-12 text-center text-concrete-400 italic">Aucune fiche trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-concrete-50 text-concrete-500 font-semibold border-b border-concrete-200">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Date Prélèv.</th>
                  <th className="px-4 py-3">Affaire / Client</th>
                  <th className="px-4 py-3">Ouvrage</th>
                  <th className="px-4 py-3">Béton</th>
                  <th className="px-4 py-3 text-center">Éprouvettes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-100">
                {filteredTests.map(test => (
                  <tr key={test._id} className="hover:bg-concrete-50 group transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-concrete-900">{test.reference}</td>
                    <td className="px-4 py-3 text-concrete-600">
                      {new Date(test.samplingDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-concrete-800">{test.projectName}</div>
                      <div className="text-xs text-concrete-400">{test.companyName}</div>
                    </td>
                    <td className="px-4 py-3 text-concrete-600">
                      {test.structureName} <span className="text-concrete-400">- {test.elementName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                          {test.concreteClass}
                        </span>
                        {test.consistencyClass && (
                           <span className="text-xs text-concrete-400">Slump: {test.consistencyClass}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-concrete-700">{test.specimenCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <button 
                         onClick={() => handleEdit(test)}
                         className="text-concrete-300 hover:text-safety-orange transition-colors p-1"
                         title="Modifier"
                       >
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(test._id)}
                         className="text-concrete-300 hover:text-red-500 transition-colors p-1"
                         title="Supprimer"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};