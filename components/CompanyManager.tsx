import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Building, Phone, Mail, User as UserIcon, Search, Pencil } from 'lucide-react';
import { Company } from '../types';
import { authenticatedFetch } from '../utils/api';

interface CompanyManagerProps {
  token: string;
}

export const CompanyManager: React.FC<CompanyManagerProps> = ({ token }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: ''
  });

  const fetchCompanies = async () => {
    try {
      const res = await authenticatedFetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [token]);

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      contactName: company.contactName || '',
      email: company.email || '',
      phone: company.phone || ''
    });
    setEditingId(company._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', contactName: '', email: '', phone: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
      const method = editingId ? 'PUT' : 'POST';

      const res = await authenticatedFetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        resetForm();
        fetchCompanies();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette entreprise ?')) return;
    try {
      await authenticatedFetch(`/api/companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-concrete-900">Mes Entreprises</h2>
          <p className="text-concrete-500">Gérez votre liste de clients et partenaires.</p>
        </div>
        <button 
          onClick={() => {
            if(showForm) resetForm();
            else setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-safety-orange text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium"
        >
          {showForm ? <UserIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Annuler' : 'Nouvelle Entreprise'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-concrete-800">
            {editingId ? 'Modifier l\'entreprise' : 'Ajouter une entreprise'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Nom de l'entreprise *</label>
              <input 
                required 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="ex: Béton SA"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Contact Principal</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.contactName}
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                placeholder="ex: M. Martin"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Email</label>
              <input 
                type="email"
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="contact@betonsa.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-concrete-500 mb-1">Téléphone</label>
              <input 
                className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 border border-concrete-300 text-concrete-600 rounded hover:bg-concrete-50 transition-colors"
              >
                Annuler
              </button>
              <button type="submit" className="px-6 py-2 bg-concrete-800 text-white rounded hover:bg-concrete-700 transition-colors">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-concrete-400">Chargement...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-concrete-200 border-dashed">
          <Building className="w-12 h-12 text-concrete-300 mx-auto mb-3" />
          <h3 className="text-concrete-500 font-medium">Aucune entreprise enregistrée</h3>
          <p className="text-sm text-concrete-400">Commencez par en ajouter une ci-dessus.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-concrete-50 border-b border-concrete-200 text-xs font-semibold text-concrete-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Coordonnées</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-100">
                {companies.map(company => (
                  <tr key={company._id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-concrete-100 flex items-center justify-center text-concrete-500">
                          <Building className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-concrete-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-concrete-600">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3 h-3 text-concrete-400" />
                        {company.contactName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-concrete-600 space-y-1">
                      {company.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-concrete-400" />
                          {company.email}
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-concrete-400" />
                          {company.phone}
                        </div>
                      )}
                      {!company.email && !company.phone && <span className="text-concrete-300 text-xs italic">Aucune donnée</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(company)}
                          className="text-concrete-400 hover:text-safety-orange transition-colors p-2 hover:bg-orange-50 rounded-full"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(company._id)}
                          className="text-concrete-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};