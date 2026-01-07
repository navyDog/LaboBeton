import React, { useState, useEffect } from 'react';
import { Briefcase, Building, Plus, Trash2, Pencil, Phone, Mail, User as UserIcon, Crown, HardHat, Search } from 'lucide-react';
import { Company, Project } from '../types';

interface RelationsManagerProps {
  token: string;
}

export const RelationsManager: React.FC<RelationsManagerProps> = ({ token }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ETATS CLIENTS (GAUCHE) ---
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', contactName: '', email: '', phone: '' });

  // --- ETATS AFFAIRES (DROITE) ---
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({ 
    name: '', companyId: '', contactName: '', email: '', phone: '', moa: '', moe: '' 
  });

  const fetchData = async () => {
    try {
      const [compRes, projRes] = await Promise.all([
        fetch('/api/companies', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (compRes.ok) setCompanies(await compRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // --- LOGIQUE CLIENTS ---
  const handleEditCompany = (c: Company) => {
    setCompanyForm({ name: c.name, contactName: c.contactName || '', email: c.email || '', phone: c.phone || '' });
    setEditingCompanyId(c._id);
    setShowCompanyForm(true);
  };

  const resetCompanyForm = () => {
    setCompanyForm({ name: '', contactName: '', email: '', phone: '' });
    setEditingCompanyId(null);
    setShowCompanyForm(false);
  };

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCompanyId ? `/api/companies/${editingCompanyId}` : '/api/companies';
      const method = editingCompanyId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(companyForm)
      });
      if (res.ok) {
        resetCompanyForm();
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const deleteCompany = async (id: string) => {
    if(!confirm("Supprimer ce client ?")) return;
    try {
      await fetch(`/api/companies/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // --- LOGIQUE AFFAIRES ---
  const handleEditProject = (p: Project) => {
    setProjectForm({
      name: p.name, companyId: p.companyId || '', contactName: p.contactName || '',
      email: p.email || '', phone: p.phone || '', moa: p.moa || '', moe: p.moe || ''
    });
    setEditingProjectId(p._id);
    setShowProjectForm(true);
  };

  const resetProjectForm = () => {
    setProjectForm({ name: '', companyId: '', contactName: '', email: '', phone: '', moa: '', moe: '' });
    setEditingProjectId(null);
    setShowProjectForm(false);
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCompany = companies.find(c => c._id === projectForm.companyId);
      const payload = { ...projectForm, companyName: selectedCompany ? selectedCompany.name : '' };
      
      const url = editingProjectId ? `/api/projects/${editingProjectId}` : '/api/projects';
      const method = editingProjectId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        resetProjectForm();
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const deleteProject = async (id: string) => {
    if(!confirm("Supprimer cette affaire ?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-center py-12 text-concrete-400">Chargement des données...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* --- COLONNE GAUCHE : CLIENTS (4/12) --- */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-concrete-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-concrete-500" /> Clients
          </h2>
          <button 
            onClick={() => { resetCompanyForm(); setShowCompanyForm(!showCompanyForm); }}
            className="p-2 bg-white border border-concrete-300 rounded hover:bg-concrete-50 text-concrete-600 transition-colors"
          >
            {showCompanyForm ? <UserIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* FORMULAIRE CLIENT */}
        {showCompanyForm && (
          <div className="bg-white p-4 rounded-xl border border-concrete-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-sm mb-3 text-concrete-800">{editingCompanyId ? 'Modifier Client' : 'Nouveau Client'}</h3>
            <form onSubmit={submitCompany} className="space-y-3">
              <input required className="w-full p-2 text-sm border border-concrete-300 rounded" placeholder="Nom Entreprise *" 
                value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} />
              <input className="w-full p-2 text-sm border border-concrete-300 rounded" placeholder="Contact" 
                value={companyForm.contactName} onChange={e => setCompanyForm({...companyForm, contactName: e.target.value})} />
              <div className="flex gap-2">
                 <button type="button" onClick={resetCompanyForm} className="flex-1 py-1.5 text-xs border border-concrete-300 rounded text-concrete-600">Annuler</button>
                 <button type="submit" className="flex-1 py-1.5 text-xs bg-concrete-800 text-white rounded">{editingCompanyId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        )}

        {/* LISTE CLIENTS */}
        <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar">
           {companies.length === 0 ? (
             <div className="p-8 text-center text-concrete-400 text-sm">Aucun client.</div>
           ) : (
             <div className="divide-y divide-concrete-100">
               {companies.map(c => (
                 <div key={c._id} className="p-4 hover:bg-concrete-50 transition-colors group">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-concrete-900 text-sm">{c.name}</h4>
                          <div className="text-xs text-concrete-500 mt-1 space-y-0.5">
                             {c.contactName && <div className="flex items-center gap-1"><UserIcon className="w-3 h-3"/> {c.contactName}</div>}
                             {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3"/> {c.email}</div>}
                             {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> {c.phone}</div>}
                          </div>
                       </div>
                       <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditCompany(c)} className="p-1 text-concrete-400 hover:text-safety-orange"><Pencil className="w-3 h-3"/></button>
                          <button onClick={() => deleteCompany(c._id)} className="p-1 text-concrete-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* --- COLONNE DROITE : AFFAIRES (8/12) --- */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-concrete-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-concrete-500" /> Affaires (Chantiers)
          </h2>
          <button 
            onClick={() => { resetProjectForm(); setShowProjectForm(!showProjectForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium text-sm"
          >
            {showProjectForm ? 'Annuler' : 'Nouvelle Affaire'} <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* FORMULAIRE AFFAIRE */}
        {showProjectForm && (
          <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm animate-in fade-in slide-in-from-top-4 mb-6">
             <h3 className="font-bold text-lg mb-4 text-concrete-800">{editingProjectId ? 'Modifier Affaire' : 'Créer une Affaire'}</h3>
             <form onSubmit={submitProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                   <label className="block text-xs font-bold text-concrete-500 mb-1">Nom Affaire *</label>
                   <input required className="w-full p-2 border border-concrete-300 rounded" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="ex: Résidence Les Pins" />
                </div>
                <div className="md:col-span-1">
                   <label className="block text-xs font-bold text-concrete-500 mb-1">Client lié</label>
                   <select className="w-full p-2 border border-concrete-300 rounded bg-white" value={projectForm.companyId} onChange={e => setProjectForm({...projectForm, companyId: e.target.value})}>
                      <option value="">-- Aucun --</option>
                      {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                   </select>
                </div>
                
                <div className="md:col-span-2 pt-2 border-t border-concrete-100 flex gap-4">
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-concrete-500 mb-1">MOA</label>
                      <input className="w-full p-2 border border-concrete-300 rounded" value={projectForm.moa} onChange={e => setProjectForm({...projectForm, moa: e.target.value})} placeholder="Maître d'Ouvrage" />
                   </div>
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-concrete-500 mb-1">MOE</label>
                      <input className="w-full p-2 border border-concrete-300 rounded" value={projectForm.moe} onChange={e => setProjectForm({...projectForm, moe: e.target.value})} placeholder="Maître d'Oeuvre" />
                   </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                   <button type="button" onClick={resetProjectForm} className="px-4 py-2 border border-concrete-300 text-concrete-600 rounded">Annuler</button>
                   <button type="submit" className="px-6 py-2 bg-concrete-800 text-white rounded hover:bg-concrete-700">{editingProjectId ? 'Mettre à jour' : 'Enregistrer'}</button>
                </div>
             </form>
          </div>
        )}

        {/* LISTE AFFAIRES (GRID) */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-concrete-200 border-dashed">
            <Briefcase className="w-12 h-12 text-concrete-300 mx-auto mb-3" />
            <h3 className="text-concrete-500 font-medium">Aucune affaire en cours</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
             {projects.map(project => (
                <div key={project._id} className="bg-white rounded-xl border border-concrete-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col group relative">
                   
                   <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditProject(project)} className="p-1.5 bg-concrete-50 rounded hover:bg-safety-orange hover:text-white text-concrete-400"><Pencil className="w-3 h-3"/></button>
                      <button onClick={() => deleteProject(project._id)} className="p-1.5 bg-concrete-50 rounded hover:bg-red-500 hover:text-white text-concrete-400"><Trash2 className="w-3 h-3"/></button>
                   </div>

                   <div className="flex items-start gap-3 mb-3 pr-10">
                      <div className="w-10 h-10 rounded-lg bg-concrete-100 flex items-center justify-center text-concrete-600 shrink-0">
                         <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-concrete-900 leading-tight">{project.name}</h4>
                        {project.companyName && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-concrete-500 font-medium">
                             <Building className="w-3 h-3" /> {project.companyName}
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                         <div className="font-bold text-concrete-400 uppercase mb-0.5 flex items-center gap-1"><Crown className="w-3 h-3"/> MOA</div>
                         <div className="truncate font-medium text-concrete-700">{project.moa || '-'}</div>
                      </div>
                      <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                         <div className="font-bold text-concrete-400 uppercase mb-0.5 flex items-center gap-1"><HardHat className="w-3 h-3"/> MOE</div>
                         <div className="truncate font-medium text-concrete-700">{project.moe || '-'}</div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
};
