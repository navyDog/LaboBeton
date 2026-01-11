import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Factory, ArrowLeft, Search, Boxes, Pencil, X, Scale, Hammer, Save, Briefcase, User as UserIcon } from 'lucide-react';
import { ConcreteTest, Project, Company, Settings, Specimen, User } from '../types';
import { ReportPreview } from './ReportPreview';
import { authenticatedFetch } from '../utils/api';

interface ConcreteTestManagerProps {
  token: string;
  user?: User; 
  initialTestId?: string | null;
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
  useEffect(() => { setData(specimen); }, [specimen]);

  if (!isOpen) return null;

  const surface = data.specimenType.toLowerCase().includes('cube') ? data.diameter * data.diameter : Math.PI * Math.pow(data.diameter / 2, 2);
  const stress = (data.force && data.force > 0) ? (data.force * 1000) / surface : 0;
  const volume = surface * data.height;
  const density = (data.weight && data.weight > 0) ? (data.weight / volume) * 1000000 : 0;

  const handleChange = (field: keyof Specimen, value: string) => {
    const numValue = parseFloat(value);
    setData({ ...data, [field]: isNaN(numValue) ? undefined : numValue });
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
        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center"><h3 className="text-white font-bold text-lg flex items-center gap-2"><Hammer className="w-5 h-5 text-safety-orange" /> Saisie Résultats Éprouvette</h3><button onClick={onClose} className="text-concrete-400 hover:text-white"><X className="w-6 h-6" /></button></div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-concrete-50 p-3 rounded-lg border border-concrete-100">
             <div className="text-sm"><span className="block text-concrete-500 text-xs uppercase font-bold">Numéro</span><span className="font-mono font-bold text-lg">#{data.number}</span></div>
             <div className="text-sm text-right"><span className="block text-concrete-500 text-xs uppercase font-bold">Âge</span><span className="font-bold">{data.age} Jours</span></div>
             <div className="text-sm text-right"><span className="block text-concrete-500 text-xs uppercase font-bold">Type</span><span>{data.specimenType}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-concrete-500 uppercase border-b border-concrete-100 pb-1">Géométrie</h4>
               <div><label className="block text-sm font-medium mb-1">Diamètre / Côté (mm)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange" value={data.diameter || ''} onChange={e => handleChange('diameter', e.target.value)} /></div>
               <div><label className="block text-sm font-medium mb-1">Hauteur (mm)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange" value={data.height || ''} onChange={e => handleChange('height', e.target.value)} /></div>
            </div>
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-safety-orange uppercase border-b border-orange-100 pb-1">Mesures Labo</h4>
               <div><label className="block text-sm font-medium mb-1 flex items-center gap-2"><Scale className="w-4 h-4 text-concrete-400" /> Masse (g)</label><input type="number" step="1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900" value={data.weight || ''} onChange={e => handleChange('weight', e.target.value)} /></div>
               <div><label className="block text-sm font-medium mb-1 flex items-center gap-2"><Hammer className="w-4 h-4 text-concrete-400" /> Force (kN)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange font-bold text-concrete-900" value={data.force || ''} onChange={e => handleChange('force', e.target.value)} /></div>
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
export const ConcreteTestManager: React.FC<ConcreteTestManagerProps> = ({ token, user, initialTestId, onBack }) => {
  const [tests, setTests] = useState<ConcreteTest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSpecimenIdx, setSelectedSpecimenIdx] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportState, setReportState] = useState<{ test: ConcreteTest, type: 'PV'|'RP' } | null>(null);
  
  // Quick Create State
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'project' | 'company'>('project');
  
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    companyId: '',
    moa: '',
    moe: '',
    contactName: '',
    email: '',
    phone: ''
  });

  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: ''
  });

  const initialFormState = {
    projectId: '', structureName: '', elementName: '', receptionDate: new Date().toISOString().split('T')[0], samplingDate: new Date().toISOString().split('T')[0], volume: 0,
    concreteClass: '', mixType: '', formulaInfo: '', manufacturer: '', manufacturingPlace: '', deliveryMethod: '',
    slump: 0, samplingPlace: '', externalTemp: 0, concreteTemp: 0, tightening: 'Piquage', vibrationTime: 0, layers: 2, curing: '',
    testType: '', standard: '', preparation: '', pressMachine: 'Presse 3000kN', specimens: [] as Specimen[]
  };
  const [formData, setFormData] = useState(initialFormState);
  const [packAge, setPackAge] = useState(28);
  const [packCount, setPackCount] = useState(3);
  const [packDim, setPackDim] = useState('160x320');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, projectsRes, companiesRes, settingsRes] = await Promise.all([
          authenticatedFetch('/api/concrete-tests', { headers: { 'Authorization': `Bearer ${token}` } }),
          authenticatedFetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
          authenticatedFetch('/api/companies', { headers: { 'Authorization': `Bearer ${token}` } }),
          authenticatedFetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (testsRes.ok) {
            const loadedTests = await testsRes.json();
            setTests(loadedTests);
            if (initialTestId) {
                const found = loadedTests.find((t: ConcreteTest) => t._id === initialTestId);
                if (found) handleEdit(found);
            }
        }
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (companiesRes.ok) setCompanies(await companiesRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [token, initialTestId]);

  const resetForm = () => { setFormData(initialFormState); setEditingId(null); setViewMode('list'); setSelectedSpecimenIdx(null); setIsModalOpen(false); };

  const handleAddPack = () => {
    if (packCount <= 0) return;
    const currentCount = formData.specimens.length;
    const newSpecimens: Specimen[] = [];
    let diameter = 160; let height = 320;
    if (packDim === '110x220') { diameter = 110; height = 220; }
    if (packDim === '150x150') { diameter = 150; height = 150; } 
    const isCube = packDim.includes('Cube') || packDim === '150x150';
    const surface = isCube ? diameter * diameter : Math.PI * Math.pow(diameter / 2, 2);
    for (let i = 0; i < packCount; i++) {
      newSpecimens.push({
        number: currentCount + i + 1, age: packAge, castingDate: formData.samplingDate, crushingDate: addDays(formData.samplingDate, packAge),
        specimenType: isCube ? 'Cubique' : 'Cylindrique', diameter, height, surface: Math.round(surface * 100) / 100
      });
    }
    setFormData({ ...formData, specimens: [...formData.specimens, ...newSpecimens] });
  };

  const handleRemoveSpecimen = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = formData.specimens.filter((_, i) => i !== index).map((s, i) => ({ ...s, number: i + 1 }));
    setFormData({ ...formData, specimens: updated });
  };
  const handleSpecimenClick = (index: number) => { setSelectedSpecimenIdx(index); setIsModalOpen(true); };
  const handleInlineChange = (index: number, field: keyof Specimen, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const updatedSpecimens = [...formData.specimens];
    const specimen = { ...updatedSpecimens[index], [field]: numValue };
    if (specimen.force && specimen.surface) specimen.stress = (specimen.force * 1000) / specimen.surface;
    else specimen.stress = undefined;
    const volume = specimen.surface * specimen.height;
    if (specimen.weight && volume) specimen.density = (specimen.weight / volume) * 1000000;
    else specimen.density = undefined;
    updatedSpecimens[index] = specimen;
    setFormData({ ...formData, specimens: updatedSpecimens });
  };
  const handleSaveSpecimen = (updated: Specimen) => {
    if (selectedSpecimenIdx === null) return;
    const updatedSpecimens = [...formData.specimens];
    updatedSpecimens[selectedSpecimenIdx] = updated;
    setFormData({ ...formData, specimens: updatedSpecimens });
    setIsModalOpen(false); setSelectedSpecimenIdx(null);
  };

  const handleEdit = (test: ConcreteTest) => {
    const projectValue = (test.projectId && typeof test.projectId === 'object') ? (test.projectId as any)._id : test.projectId;
    setFormData({
      projectId: projectValue || '', structureName: test.structureName || '', elementName: test.elementName || '',
      receptionDate: test.receptionDate ? new Date(test.receptionDate).toISOString().split('T')[0] : initialFormState.receptionDate,
      samplingDate: test.samplingDate ? new Date(test.samplingDate).toISOString().split('T')[0] : initialFormState.samplingDate,
      volume: test.volume || 0, concreteClass: test.concreteClass || '', mixType: test.mixType || '', formulaInfo: test.formulaInfo || '',
      manufacturer: test.manufacturer || '', manufacturingPlace: test.manufacturingPlace || '', deliveryMethod: test.deliveryMethod || '',
      slump: test.slump || 0, samplingPlace: test.samplingPlace || '', externalTemp: (test as any).externalTemp || 0, concreteTemp: (test as any).concreteTemp || 0,
      tightening: test.tightening || 'Piquage', vibrationTime: test.vibrationTime || 0, layers: test.layers || 2, curing: test.curing || '',
      testType: test.testType || '', standard: test.standard || '', preparation: test.preparation || '', pressMachine: test.pressMachine || 'Presse 3000kN',
      specimens: test.specimens || []
    });
    setEditingId(test._id); setViewMode('create');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) return alert("Veuillez sélectionner une affaire.");
    const selectedProject = projects.find(p => p._id === formData.projectId);
    const payload = { ...formData, projectName: selectedProject?.name || '', companyName: selectedProject?.companyName || '', moe: selectedProject?.moe || '', moa: selectedProject?.moa || '', specimenCount: formData.specimens.length };
    try {
      const url = editingId ? `/api/concrete-tests/${editingId}` : '/api/concrete-tests';
      const method = editingId ? 'PUT' : 'POST';
      const res = await authenticatedFetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updatedTest = await res.json();
        if (editingId) setTests(tests.map(t => t._id === editingId ? updatedTest : t));
        else setTests([updatedTest, ...tests]);
        resetForm();
      } else { alert("Erreur d'enregistrement."); }
    } catch (error) { alert("Erreur serveur."); }
  };

  const handleQuickCreate = async () => {
    if (quickCreateType === 'company') {
       if(!newCompanyData.name.trim()) return;
       try {
         const res = await authenticatedFetch('/api/companies', {
           method: 'POST',
           headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
           body: JSON.stringify(newCompanyData)
         });
         if(res.ok) {
           const newCompany = await res.json();
           setCompanies([...companies, newCompany]);
           setNewProjectData({...newProjectData, companyId: newCompany._id});
           setQuickCreateType('project'); // Basculer vers la création de projet avec l'entreprise pré-remplie
           setNewCompanyData({ name: '', contactName: '', email: '', phone: '' });
         }
       } catch(e) { alert("Erreur Création Entreprise"); }
    } else {
       if(!newProjectData.name.trim()) return;
       try {
         // Récupérer le nom de l'entreprise si un ID est sélectionné
         const selectedCompany = companies.find(c => c._id === newProjectData.companyId);
         const payload = { ...newProjectData, companyName: selectedCompany ? selectedCompany.name : '' };

         const res = await authenticatedFetch('/api/projects', {
             method: 'POST',
             headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
             body: JSON.stringify(payload)
         });
         if(res.ok) {
             const newP = await res.json();
             setProjects([newP, ...projects]);
             setFormData({...formData, projectId: newP._id});
             setQuickCreateOpen(false); 
             setNewProjectData({ name: '', companyId: '', moa: '', moe: '', contactName: '', email: '', phone: '' });
         }
       } catch(e) { alert("Erreur Création Affaire"); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette fiche ?")) return;
    try {
      await authenticatedFetch(`/api/concrete-tests/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setTests(tests.filter(t => t._id !== id));
    } catch (error) { console.error(error); }
  };

  const filteredTests = tests.filter(t => t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || t.structureName?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (viewMode === 'create') {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-concrete-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
        {isModalOpen && selectedSpecimenIdx !== null && <SpecimenModal specimen={formData.specimens[selectedSpecimenIdx]} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSpecimen} />}
        
        {/* Quick Create Modal - DUAL MODE */}
        {quickCreateOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                       <h4 className="font-bold text-lg flex items-center gap-2">
                         {quickCreateType === 'project' ? <Briefcase className="w-5 h-5 text-safety-orange"/> : <UserIcon className="w-5 h-5 text-blue-600"/>}
                         {quickCreateType === 'project' ? 'Nouvelle Affaire' : 'Nouveau Client'}
                       </h4>
                       <button onClick={()=>setQuickCreateOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-4 bg-concrete-100 p-1 rounded-lg">
                       <button 
                         onClick={() => setQuickCreateType('project')}
                         className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${quickCreateType === 'project' ? 'bg-white shadow text-concrete-900' : 'text-concrete-500'}`}
                       >
                         Affaire
                       </button>
                       <button 
                         onClick={() => setQuickCreateType('company')}
                         className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${quickCreateType === 'company' ? 'bg-white shadow text-concrete-900' : 'text-concrete-500'}`}
                       >
                         Entreprise
                       </button>
                    </div>

                    {quickCreateType === 'project' ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
                         <div>
                            <label className="text-xs font-bold text-gray-500">Nom de l'affaire *</label>
                            <input autoFocus className="w-full border p-2 rounded text-sm mt-1" placeholder="ex: Chantier École" value={newProjectData.name} onChange={e=>setNewProjectData({...newProjectData, name: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500">Entreprise / Client</label>
                            <select className="w-full border p-2 rounded text-sm mt-1 bg-white" value={newProjectData.companyId} onChange={e => setNewProjectData({...newProjectData, companyId: e.target.value})}>
                               <option value="">-- Sélectionner ou créer --</option>
                               {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            <button onClick={() => setQuickCreateType('company')} className="text-[10px] text-blue-600 font-bold mt-1 hover:underline">+ Créer une entreprise</button>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs font-bold text-gray-500">MOA</label><input className="w-full border p-2 rounded text-sm mt-1" value={newProjectData.moa} onChange={e=>setNewProjectData({...newProjectData, moa: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-gray-500">MOE</label><input className="w-full border p-2 rounded text-sm mt-1" value={newProjectData.moe} onChange={e=>setNewProjectData({...newProjectData, moe: e.target.value})} /></div>
                         </div>
                         <div><label className="text-xs font-bold text-gray-500">Contact</label><input className="w-full border p-2 rounded text-sm mt-1" value={newProjectData.contactName} onChange={e=>setNewProjectData({...newProjectData, contactName: e.target.value})} /></div>
                         <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs font-bold text-gray-500">Email</label><input className="w-full border p-2 rounded text-sm mt-1" value={newProjectData.email} onChange={e=>setNewProjectData({...newProjectData, email: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-gray-500">Tél</label><input className="w-full border p-2 rounded text-sm mt-1" value={newProjectData.phone} onChange={e=>setNewProjectData({...newProjectData, phone: e.target.value})} /></div>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
                         <div>
                            <label className="text-xs font-bold text-gray-500">Nom de l'entreprise *</label>
                            <input autoFocus className="w-full border p-2 rounded text-sm mt-1" placeholder="ex: Bâtiment SAS" value={newCompanyData.name} onChange={e=>setNewCompanyData({...newCompanyData, name: e.target.value})} />
                         </div>
                         <div><label className="text-xs font-bold text-gray-500">Contact Principal</label><input className="w-full border p-2 rounded text-sm mt-1" value={newCompanyData.contactName} onChange={e=>setNewCompanyData({...newCompanyData, contactName: e.target.value})} /></div>
                         <div><label className="text-xs font-bold text-gray-500">Email</label><input className="w-full border p-2 rounded text-sm mt-1" value={newCompanyData.email} onChange={e=>setNewCompanyData({...newCompanyData, email: e.target.value})} /></div>
                         <div><label className="text-xs font-bold text-gray-500">Téléphone</label><input className="w-full border p-2 rounded text-sm mt-1" value={newCompanyData.phone} onChange={e=>setNewCompanyData({...newCompanyData, phone: e.target.value})} /></div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={()=>setQuickCreateOpen(false)} className="px-4 py-2 bg-gray-100 rounded text-sm font-medium">Annuler</button>
                        <button onClick={handleQuickCreate} className="px-4 py-2 bg-safety-orange text-white rounded text-sm font-bold shadow-sm">
                          {quickCreateType === 'project' ? 'Créer Affaire' : 'Créer & Sélectionner'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-concrete-900 px-6 py-4 flex justify-between items-center sticky top-16 z-20">
          <div className="flex items-center gap-3">
             <button type="button" onClick={resetForm} className="text-concrete-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
             <h2 className="text-xl font-bold text-white">{editingId ? 'Modifier Prélèvement' : 'Nouveau Prélèvement'}</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2"><FileText className="w-5 h-5 text-safety-orange" /> Identification Chantier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="lg:col-span-1">
                    <label className="block text-xs font-bold text-concrete-500 mb-1 flex justify-between">
                        Affaire (Client) * 
                        <button type="button" onClick={() => { setQuickCreateType('project'); setQuickCreateOpen(true); }} className="text-safety-orange hover:underline text-[10px] flex items-center gap-1"><Plus className="w-3 h-3"/> Créer</button>
                    </label>
                    <select required className="w-full p-2 border border-concrete-300 rounded focus:ring-1 focus:ring-safety-orange" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                      <option value="">-- Sélectionner --</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.companyName})</option>)}
                    </select>
                 </div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Nom Ouvrage</label><input className="w-full p-2 border border-concrete-300 rounded" placeholder="ex: Bâtiment A" value={formData.structureName} onChange={e => setFormData({...formData, structureName: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Partie d'Ouvrage</label><input className="w-full p-2 border border-concrete-300 rounded" placeholder="ex: Dalle R+1" value={formData.elementName} onChange={e => setFormData({...formData, elementName: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Date Prélèvement</label><input type="date" className="w-full p-2 border border-concrete-300 rounded" value={formData.samplingDate} onChange={e => { setFormData({...formData, samplingDate: e.target.value}); const updated = formData.specimens.map(s => ({ ...s, castingDate: e.target.value, crushingDate: addDays(e.target.value, s.age) })); setFormData(prev => ({ ...prev, specimens: updated, samplingDate: e.target.value })); }} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Date Réception</label><input type="date" className="w-full p-2 border border-concrete-300 rounded" value={formData.receptionDate} onChange={e => setFormData({...formData, receptionDate: e.target.value})} /></div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2"><Factory className="w-5 h-5 text-safety-orange" /> Béton & Contexte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Classe Résistance</label><select className="w-full p-2 border border-concrete-300 rounded bg-white" value={formData.concreteClass} onChange={e => setFormData({...formData, concreteClass: e.target.value})}><option value="">-- Choisir --</option>{settings?.concreteClasses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Slump (mm)</label><div className="relative"><input type="number" className="w-full p-2 pr-16 border border-concrete-300 rounded font-mono font-bold" value={formData.slump} onChange={e => setFormData({...formData, slump: parseInt(e.target.value) || 0})} /><div className="absolute right-2 top-1.5 px-2 py-0.5 bg-concrete-100 text-xs font-bold rounded">{calculateConsistency(formData.slump) || '-'}</div></div></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Type Mélange</label><select className="w-full p-2 border border-concrete-300 rounded bg-white" value={formData.mixType} onChange={e => setFormData({...formData, mixType: e.target.value})}><option value="">-- Choisir --</option>{settings?.mixTypes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Volume (m³)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded" value={formData.volume} onChange={e => setFormData({...formData, volume: parseFloat(e.target.value)})} /></div>
                 <div className="lg:col-span-2"><label className="block text-xs font-bold text-concrete-500 mb-1">Fabricant</label><input className="w-full p-2 border border-concrete-300 rounded" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Lieu Fab.</label><select className="w-full p-2 border border-concrete-300 rounded" value={formData.manufacturingPlace} onChange={e => setFormData({...formData, manufacturingPlace: e.target.value})}><option value="">-- Choisir --</option>{settings?.manufacturingPlaces.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">Livraison</label><select className="w-full p-2 border border-concrete-300 rounded" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value})}><option value="">-- Choisir --</option>{settings?.deliveryMethods.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 <div className="lg:col-span-2"><label className="block text-xs font-bold text-concrete-500 mb-1">Info Formule</label><input className="w-full p-2 border border-concrete-300 rounded" value={formData.formulaInfo} onChange={e => setFormData({...formData, formulaInfo: e.target.value})} /></div>
                 <div className="lg:col-span-2"><label className="block text-xs font-bold text-concrete-500 mb-1">Lieu Prélèvement</label><input className="w-full p-2 border border-concrete-300 rounded" value={formData.samplingPlace} onChange={e => setFormData({...formData, samplingPlace: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1">T° Ext (°C)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded" value={formData.externalTemp} onChange={e => setFormData({...formData, externalTemp: parseFloat(e.target.value)})} /></div>
                 <div><label className="block text-xs font-bold text-concrete-500 mb-1 text-red-500">T° Béton (°C)</label><input type="number" step="0.1" className="w-full p-2 border border-concrete-300 rounded" value={formData.concreteTemp} onChange={e => setFormData({...formData, concreteTemp: parseFloat(e.target.value)})} /></div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-lg font-bold text-concrete-800 flex items-center gap-2 border-b border-concrete-200 pb-2"><Boxes className="w-5 h-5 text-safety-orange" /> Planification & Résultats</h3>
              
              {/* Add Pack Bar - REPOSITIONED */}
              <div className="bg-concrete-100 p-3 rounded-lg border border-concrete-200 flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-bold text-concrete-700">Ajouter des éprouvettes :</span>
                <div className="flex items-center gap-2">
                   <div className="flex bg-white rounded border border-concrete-300 overflow-hidden shadow-sm">{[7, 28].map(d => <button key={d} type="button" onClick={() => setPackAge(d)} className={`px-3 py-1.5 text-xs font-medium border-r border-concrete-100 last:border-0 transition-colors ${packAge === d ? 'bg-concrete-800 text-white' : 'hover:bg-concrete-100'}`}>{d}j</button>)}<input type="number" className="w-12 px-1 py-1 text-xs text-center font-bold" value={packAge} onChange={e => setPackAge(parseInt(e.target.value))} title="Âge personnalisé" /></div>
                   <span className="text-xs text-concrete-400">x</span>
                   <input type="number" min="1" className="w-12 py-1.5 px-2 border border-concrete-300 rounded text-center text-xs font-bold shadow-sm" value={packCount} onChange={e => setPackCount(parseInt(e.target.value))} />
                   <select className="py-1.5 px-2 border border-concrete-300 rounded bg-white text-xs font-medium shadow-sm" value={packDim} onChange={e => setPackDim(e.target.value)}><option value="160x320">Cyl. 160x320</option><option value="110x220">Cyl. 110x220</option><option value="150x150">Cube 150x150</option></select>
                   <button type="button" onClick={handleAddPack} className="ml-2 px-3 py-1.5 bg-concrete-800 text-white text-xs font-bold rounded hover:bg-concrete-700 flex items-center gap-1 shadow-sm"><Plus className="w-3 h-3" /> Ajouter</button>
                </div>
              </div>

              {formData.specimens.length > 0 && (
                <div className="overflow-x-auto border border-concrete-200 rounded-lg shadow-sm">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-concrete-50 text-concrete-500 font-semibold border-b border-concrete-200"><tr><th className="px-3 py-2">N°</th><th className="px-3 py-2">Âge</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Dim.</th><th className="px-3 py-2 text-right">Masse</th><th className="px-3 py-2 text-right">Force</th><th className="px-3 py-2 text-right">MPa</th><th className="px-3 py-2"></th></tr></thead>
                    <tbody className="divide-y divide-concrete-100 bg-white">
                      {formData.specimens.map((s, idx) => (
                        <tr key={idx} onClick={() => handleSpecimenClick(idx)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-concrete-600">#{s.number}</td><td className="px-3 py-2 font-bold">{s.age}j</td><td className="px-3 py-2 text-xs">{new Date(s.crushingDate).toLocaleDateString()}</td><td className="px-3 py-2 text-xs">{s.diameter}x{s.height}</td>
                          <td className="px-3 py-2 text-right"><input type="number" className="w-20 p-1 text-right border-transparent hover:border-concrete-300 bg-transparent" onClick={e=>e.stopPropagation()} value={s.weight||''} onChange={e=>handleInlineChange(idx,'weight',e.target.value)}/></td>
                          <td className="px-3 py-2 text-right"><input type="number" className="w-20 p-1 text-right border-transparent hover:border-concrete-300 bg-transparent" onClick={e=>e.stopPropagation()} value={s.force||''} onChange={e=>handleInlineChange(idx,'force',e.target.value)}/></td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-safety-orange">{s.stress?.toFixed(1) || '-'}</td>
                          <td className="px-3 py-2 text-right"><button onClick={e=>handleRemoveSpecimen(idx,e)} className="text-concrete-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
           </div>

           <div className="flex justify-end pt-6"><button type="button" onClick={resetForm} className="mr-4 px-6 py-3 text-concrete-600 hover:bg-concrete-100 rounded-lg font-medium">Annuler</button><button type="submit" className="px-8 py-3 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold shadow-lg">{editingId ? 'Mettre à jour' : 'Créer la fiche'}</button></div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {reportState && <ReportPreview test={reportState.test} user={user} type={reportState.type} onClose={() => setReportState(null)} />}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 bg-white border border-concrete-200 rounded-lg"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-2xl font-bold text-concrete-900">Fiches de Prélèvement</h2><p className="text-concrete-500">Registre des éprouvettes (12350)</p></div></div>
        <button onClick={() => { resetForm(); setViewMode('create'); }} className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 font-bold"><Plus className="w-4 h-4" /> Nouveau</button>
      </div>
      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-concrete-100 bg-concrete-50 flex items-center gap-3"><div className="relative flex-grow max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" /><input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 border border-concrete-300 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
        {loading ? <div className="p-12 text-center text-concrete-400">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-concrete-50 text-concrete-500 font-semibold border-b border-concrete-200"><tr><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Affaire</th><th className="px-4 py-3">Ouvrage</th><th className="px-4 py-3 text-center">Rapports</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-concrete-100">
                {filteredTests.map(test => (
                  <tr key={test._id} className="hover:bg-concrete-50 group transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-concrete-900">{test.reference}</td>
                    <td className="px-4 py-3 text-concrete-600">{new Date(test.samplingDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{test.projectName}</td>
                    <td className="px-4 py-3 text-concrete-600">{test.structureName}</td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => setReportState({ test, type: 'PV' })} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-200">PV</button><button onClick={() => setReportState({ test, type: 'RP' })} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-200">RP</button></div></td>
                    <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => handleEdit(test)} className="text-concrete-400 hover:text-safety-orange p-1.5"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(test._id)} className="text-concrete-400 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button></div></td>
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