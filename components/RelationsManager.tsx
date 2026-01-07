import React, { useState, useEffect } from 'react';
import { Briefcase, Building, Plus, Trash2, Pencil, Phone, Mail, User as UserIcon, X, ChevronRight, MapPin, HardHat } from 'lucide-react';
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

  const deleteCompany = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Supprimer cette affaire ?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-center py-12 text-concrete-400">Chargement...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
      
      {/* --- COLONNE GAUCHE : CLIENTS (4/12) --- */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-bold text-concrete-900">Clients</h2>
          <button 
            onClick={() => { resetCompanyForm(); setShowCompanyForm(!showCompanyForm); }}
            className="text-xs font-bold text-safety-orange hover:text-orange-600 transition-colors uppercase tracking-wide"
          >
            {showCompanyForm ? 'Fermer' : '+ Ajouter'}
          </button>
        </div>

        {/* FORMULAIRE CLIENT (ÉPURÉ) */}
        {showCompanyForm && (
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-concrete-100 z-10 relative">
            <form onSubmit={submitCompany} className="space-y-4">
              <div>
                <input required className="w-full text-lg font-bold border-none border-b border-concrete-200 p-0 py-2 focus:ring-0 focus:border-safety-orange placeholder:text-concrete-300 transition-colors" placeholder="Nom de l'entreprise" 
                  value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} autoFocus />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                 <input className="w-full text-sm bg-concrete-50 rounded-lg px-3 py-2 border-none focus:ring-1 focus:ring-safety-orange" placeholder="Nom du contact" 
                  value={companyForm.contactName} onChange={e => setCompanyForm({...companyForm, contactName: e.target.value})} />
                 <input className="w-full text-sm bg-concrete-50 rounded-lg px-3 py-2 border-none focus:ring-1 focus:ring-safety-orange" placeholder="Email" 
                  value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} />
                 <input className="w-full text-sm bg-concrete-50 rounded-lg px-3 py-2 border-none focus:ring-1 focus:ring-safety-orange" placeholder="Téléphone" 
                  value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                 <button type="submit" className="px-4 py-2 text-sm bg-concrete-900 text-white rounded-lg font-medium hover:bg-black transition-colors">{editingCompanyId ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        )}

        {/* LISTE CLIENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-concrete-100 overflow-hidden min-h-[500px]">
           {companies.length === 0 ? (
             <div className="p-8 text-center text-concrete-300 text-sm">Aucun client enregistré.</div>
           ) : (
             <div className="divide-y divide-concrete-50">
               {companies.map(c => (
                 <div 
                    key={c._id} 
                    onClick={() => handleEditCompany(c)}
                    className="p-4 hover:bg-concrete-50 transition-all cursor-pointer group flex items-center justify-between"
                 >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-concrete-100 flex items-center justify-center text-concrete-400 font-bold text-sm shrink-0">
                           {c.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-concrete-800 text-sm leading-tight">{c.name}</h4>
                          <div className="text-xs text-concrete-400 mt-0.5 truncate max-w-[150px]">
                             {c.contactName || c.email || "Sans contact"}
                          </div>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => deleteCompany(c._id, e)} 
                        className="p-2 text-concrete-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* --- COLONNE DROITE : AFFAIRES (8/12) --- */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-bold text-concrete-900">Affaires</h2>
          <button 
            onClick={() => { resetProjectForm(); setShowProjectForm(!showProjectForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm text-sm font-bold"
          >
            {showProjectForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showProjectForm ? 'Annuler' : 'Nouvelle Affaire'}
          </button>
        </div>

        {/* FORMULAIRE AFFAIRE (ÉPURÉ) */}
        {showProjectForm && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-concrete-100 mb-6 animate-in slide-in-from-top-4">
             <form onSubmit={submitProject} className="flex flex-col gap-6">
                
                {/* Ligne Principale */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-concrete-400 uppercase mb-1 block">Nom du Projet</label>
                        <input required className="w-full text-xl font-bold border-none border-b border-concrete-200 p-0 py-2 focus:ring-0 focus:border-safety-orange placeholder:text-concrete-300" placeholder="ex: Résidence Les Pins" 
                        value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} autoFocus />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-concrete-400 uppercase mb-1 block">Client</label>
                        <select className="w-full bg-concrete-50 rounded-lg p-2.5 text-sm font-medium border-none focus:ring-1 focus:ring-safety-orange" value={projectForm.companyId} onChange={e => setProjectForm({...projectForm, companyId: e.target.value})}>
                            <option value="">-- Sélectionner un client --</option>
                            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                
                {/* Détails Secondaires (Grid propre) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-concrete-50">
                    <div className="col-span-2 md:col-span-1">
                         <label className="text-[10px] font-bold text-concrete-400 uppercase mb-1 block">Contact Site</label>
                         <input className="w-full text-sm bg-concrete-50 rounded px-2 py-1.5 border-none" placeholder="Nom..." value={projectForm.contactName} onChange={e => setProjectForm({...projectForm, contactName: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                         <label className="text-[10px] font-bold text-concrete-400 uppercase mb-1 block">MOA</label>
                         <input className="w-full text-sm bg-concrete-50 rounded px-2 py-1.5 border-none" placeholder="Maître d'Ouvrage" value={projectForm.moa} onChange={e => setProjectForm({...projectForm, moa: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                         <label className="text-[10px] font-bold text-concrete-400 uppercase mb-1 block">MOE</label>
                         <input className="w-full text-sm bg-concrete-50 rounded px-2 py-1.5 border-none" placeholder="Maître d'Oeuvre" value={projectForm.moe} onChange={e => setProjectForm({...projectForm, moe: e.target.value})} />
                    </div>
                     <div className="col-span-2 md:col-span-1 flex items-end">
                        <button type="submit" className="w-full py-2 bg-concrete-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">
                            {editingProjectId ? 'Sauvegarder' : 'Créer'}
                        </button>
                    </div>
                </div>
             </form>
          </div>
        )}

        {/* GRILLE AFFAIRES */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-concrete-200">
            <Briefcase className="w-10 h-10 text-concrete-200 mb-3" />
            <h3 className="text-concrete-400 font-medium">Aucune affaire en cours</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
             {projects.map(project => (
                <div 
                    key={project._id} 
                    onClick={() => handleEditProject(project)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-concrete-100 hover:shadow-md hover:border-concrete-200 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                >
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-concrete-900 leading-tight mb-1">{project.name}</h4>
                        {project.companyName ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-concrete-50 text-concrete-600 text-xs font-medium">
                             <Building className="w-3 h-3 mr-1.5 opacity-50" /> {project.companyName}
                          </div>
                        ) : (
                          <span className="text-xs text-concrete-300 italic">Aucun client lié</span>
                        )}
                      </div>
                      
                      <button onClick={(e) => deleteProject(project._id, e)} className="text-concrete-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="mt-4 pt-4 border-t border-concrete-50 flex gap-4 text-xs text-concrete-500">
                      {(project.moa || project.moe) ? (
                          <>
                            {project.moa && <div title="MOA" className="flex items-center gap-1"><UserIcon className="w-3 h-3 text-concrete-300"/> <span className="truncate max-w-[100px]">{project.moa}</span></div>}
                            {project.moe && <div title="MOE" className="flex items-center gap-1"><HardHat className="w-3 h-3 text-concrete-300"/> <span className="truncate max-w-[100px]">{project.moe}</span></div>}
                          </>
                      ) : (
                          <span className="text-concrete-300 italic">Aucune info technique</span>
                      )}
                      
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-safety-orange font-bold flex items-center">
                          Modifier <ChevronRight className="w-3 h-3" />
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
