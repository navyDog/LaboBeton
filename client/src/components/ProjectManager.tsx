import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Phone, Mail, User as UserIcon, HardHat, Crown, Building, Pencil, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Project, Company, ConcreteTest } from '../types';
import { authenticatedFetch } from '../../utils/api';
import { GlobalProjectReport } from './GlobalProjectReport';

interface ProjectManagerProps {
  token: string;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ token }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State for Global Report
  const [reportData, setReportData] = useState<{project: Project, tests: ConcreteTest[]} | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // To pass logo etc to report

  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    contactName: '',
    email: '',
    phone: '',
    moa: '',
    moe: ''
  });

  const fetchData = async () => {
    try {
      const [projectsRes, companiesRes, profileRes] = await Promise.all([
        authenticatedFetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
        authenticatedFetch('/api/companies', { headers: { 'Authorization': `Bearer ${token}` } }),
        authenticatedFetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (profileRes.ok) setUserProfile(await profileRes.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      companyId: project.companyId || '',
      contactName: project.contactName || '',
      email: project.email || '',
      phone: project.phone || '',
      moa: project.moa || '',
      moe: project.moe || ''
    });
    setEditingId(project._id);
    setShowForm(true);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedCompany = companies.find(c => c._id === selectedId);
    if (selectedCompany) {
        setFormData({
            ...formData,
            companyId: selectedId,
            contactName: selectedCompany.contactName || formData.contactName,
            email: selectedCompany.email || formData.email,
            phone: selectedCompany.phone || formData.phone
        });
    } else {
        setFormData({ ...formData, companyId: selectedId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCompany = companies.find(c => c._id === formData.companyId);
      const payload = { ...formData, companyName: selectedCompany ? selectedCompany.name : '' };
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';

      const res = await authenticatedFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setFormData({ name: '', companyId: '', contactName: '', email: '', phone: '', moa: '', moe: '' });
        setEditingId(null);
        setShowForm(false);
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette affaire ?')) return;
    try {
      await authenticatedFetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleExportCsv = async (projectId: string) => {
     try {
       const res = await authenticatedFetch(`/api/projects/${projectId}/export/csv`, {
         headers: { 'Authorization': `Bearer ${token}` }
       });
       if (res.ok) {
         const blob = await res.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `export_affaire_${projectId}.csv`;
         document.body.appendChild(a);
         a.click();
         a.remove();
       }
     } catch (e) { alert("Erreur lors de l'export"); }
  };

  const handleGlobalReport = async (projectId: string) => {
    try {
      const res = await authenticatedFetch(`/api/projects/${projectId}/full-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch(e) { alert("Erreur chargement rapport global"); }
  };

  return (
    <div className="space-y-6">
      {reportData && (
        <GlobalProjectReport 
          project={reportData.project} 
          tests={reportData.tests} 
          user={userProfile}
          onClose={() => setReportData(null)} 
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-concrete-900">Mes Affaires</h2>
          <p className="text-concrete-500">Gérez vos chantiers et projets.</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if(!showForm) setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
        >
          {showForm ? 'Annuler' : <><Plus className="w-4 h-4" /> Nouvelle Affaire</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-concrete-500 mb-1">Nom de l'affaire *</label>
              <input 
                required 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
               <label className="block text-xs font-medium text-concrete-500 mb-1">Entreprise liée</label>
               <select
                  className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange bg-white"
                  value={formData.companyId}
                  onChange={handleCompanyChange}
               >
                  <option value="">-- Aucune entreprise --</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
               </select>
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-concrete-400 uppercase mt-2">Contact Affaire</label></div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Nom Contact</label>
              <input className="w-full p-2 border border-concrete-300 rounded" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Email</label>
              <input type="email" className="w-full p-2 border border-concrete-300 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-concrete-500 mb-1">Téléphone</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded" 
                value={formData.phone} 
                onChange={e => {
                  const val = e.target.value;
                  if (/^[\d\s+\-.]*$/.test(val)) setFormData({...formData, phone: val});
                }}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-concrete-400 uppercase mt-2">Intervenants</label></div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Maître d'Ouvrage (MOA)</label>
              <input className="w-full p-2 border border-concrete-300 rounded" value={formData.moa} onChange={e => setFormData({...formData, moa: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Maître d'Oeuvre (MOE)</label>
              <input className="w-full p-2 border border-concrete-300 rounded" value={formData.moe} onChange={e => setFormData({...formData, moe: e.target.value})} />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="submit" className="px-6 py-2 bg-concrete-800 text-white rounded hover:bg-concrete-700 transition-colors">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-concrete-400">Chargement...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-concrete-200 border-dashed">
          <Briefcase className="w-12 h-12 text-concrete-300 mx-auto mb-3" />
          <h3 className="text-concrete-500 font-medium">Aucune affaire en cours</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project._id} className="bg-white rounded-xl border border-concrete-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-concrete-100 flex items-center justify-center text-concrete-600">
                      <Briefcase className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-concrete-900 leading-tight">{project.name}</h4>
                     {project.companyName && (
                       <div className="flex items-center gap-1 mt-1">
                          <Building className="w-3 h-3 text-concrete-400" />
                          <span className="text-xs text-concrete-500 font-medium">{project.companyName}</span>
                       </div>
                     )}
                   </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleGlobalReport(project._id)} className="text-concrete-300 hover:text-blue-600 p-1" title="PV Global Affaire">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleExportCsv(project._id)} className="text-concrete-300 hover:text-green-600 p-1" title="Exporter CSV">
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(project)} className="text-concrete-300 hover:text-safety-orange p-1" title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(project._id)} className="text-concrete-300 hover:text-red-500 p-1" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4 flex-grow">
                 {(project.contactName || project.email || project.phone) && (
                   <div className="bg-concrete-50 p-3 rounded-lg space-y-1">
                      <p className="text-xs font-bold text-concrete-400 uppercase mb-1">Contact Affaire</p>
                      {project.contactName && <div className="flex items-center gap-2 text-sm text-concrete-700"><UserIcon className="w-3 h-3" /> {project.contactName}</div>}
                      {project.email && <div className="flex items-center gap-2 text-sm text-concrete-600"><Mail className="w-3 h-3" /> {project.email}</div>}
                      {project.phone && <div className="flex items-center gap-2 text-sm text-concrete-600"><Phone className="w-3 h-3" /> {project.phone}</div>}
                   </div>
                 )}
                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                       <div className="flex items-center gap-1.5 mb-1"><Crown className="w-3 h-3 text-safety-orange" /><span className="text-[10px] font-bold text-concrete-500 uppercase">MOA</span></div>
                       <p className="text-xs text-concrete-800 font-medium truncate" title={project.moa}>{project.moa || '-'}</p>
                    </div>
                    <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                       <div className="flex items-center gap-1.5 mb-1"><HardHat className="w-3 h-3 text-concrete-600" /><span className="text-[10px] font-bold text-concrete-500 uppercase">MOE</span></div>
                       <p className="text-xs text-concrete-800 font-medium truncate" title={project.moe}>{project.moe || '-'}</p>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};