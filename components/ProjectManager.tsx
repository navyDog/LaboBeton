import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Phone, Mail, User as UserIcon, HardHat, Crown } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerProps {
  token: string;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ token }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    moa: '',
    moe: ''
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setFormData({ name: '', contactName: '', email: '', phone: '', moa: '', moe: '' });
        setShowForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette affaire ?')) return;
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-concrete-900">Mes Affaires</h2>
          <p className="text-concrete-500">Gérez vos chantiers et projets en cours.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Fermer' : 'Nouvelle Affaire'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-concrete-800">Créer une nouvelle affaire</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-concrete-500 mb-1">Nom de l'affaire (Projet) *</label>
              <input 
                required 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="ex: Résidence Les Lilas - Bâtiment B"
              />
            </div>

            <div className="border-t border-concrete-100 md:col-span-2 my-2 pt-2">
               <span className="text-xs font-bold text-concrete-400 uppercase">Contact Affaire</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Nom Contact</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.contactName}
                onChange={e => setFormData({...formData, contactName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Email</label>
              <input 
                type="email"
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
             <div className="md:col-span-2">
              <label className="block text-xs font-medium text-concrete-500 mb-1">Téléphone</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="border-t border-concrete-100 md:col-span-2 my-2 pt-2">
               <span className="text-xs font-bold text-concrete-400 uppercase">Intervenants</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Maître d'Ouvrage (MOA)</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.moa}
                onChange={e => setFormData({...formData, moa: e.target.value})}
                placeholder="ex: Mairie de Paris"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Maître d'Oeuvre (MOE)</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.moe}
                onChange={e => setFormData({...formData, moe: e.target.value})}
                placeholder="ex: Architectes Associés"
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" className="px-6 py-2 bg-concrete-800 text-white rounded hover:bg-concrete-700 transition-colors">
                Enregistrer l'affaire
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
          <p className="text-sm text-concrete-400">Créez votre première affaire ci-dessus.</p>
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
                     <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">En cours</span>
                   </div>
                </div>
                <button 
                  onClick={() => handleDelete(project._id)}
                  className="text-concrete-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4 flex-grow">
                 {/* Contact Principal */}
                 {(project.contactName || project.email || project.phone) && (
                   <div className="bg-concrete-50 p-3 rounded-lg space-y-1">
                      <p className="text-xs font-bold text-concrete-400 uppercase mb-1">Contact Affaire</p>
                      {project.contactName && (
                        <div className="flex items-center gap-2 text-sm text-concrete-700">
                           <UserIcon className="w-3 h-3" /> {project.contactName}
                        </div>
                      )}
                      {project.email && (
                        <div className="flex items-center gap-2 text-sm text-concrete-600">
                           <Mail className="w-3 h-3" /> {project.email}
                        </div>
                      )}
                      {project.phone && (
                        <div className="flex items-center gap-2 text-sm text-concrete-600">
                           <Phone className="w-3 h-3" /> {project.phone}
                        </div>
                      )}
                   </div>
                 )}

                 {/* MOA / MOE */}
                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <Crown className="w-3 h-3 text-safety-orange" />
                          <span className="text-[10px] font-bold text-concrete-500 uppercase">MOA</span>
                       </div>
                       <p className="text-xs text-concrete-800 font-medium truncate" title={project.moa}>{project.moa || '-'}</p>
                    </div>
                    <div className="bg-concrete-50 p-2 rounded border border-concrete-100">
                       <div className="flex items-center gap-1.5 mb-1">
                          <HardHat className="w-3 h-3 text-concrete-600" />
                          <span className="text-[10px] font-bold text-concrete-500 uppercase">MOE</span>
                       </div>
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