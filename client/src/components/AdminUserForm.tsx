import React, { useState } from 'react';
import { UserPlus, Save, X, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import { authenticatedFetch } from '../utils/api';

interface AdminUserFormProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminUserForm: React.FC<AdminUserFormProps> = ({ currentUser, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'standard',
    isActive: true,
    companyName: '',
    address: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await authenticatedFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Utilisateur créé avec succès !' });
        setTimeout(() => { onSuccess(); }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la création.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-concrete-200 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="bg-concrete-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <UserPlus className="text-white w-5 h-5" />
          <h3 className="text-lg font-bold text-white">Nouveau Compte Client</h3>
        </div>
        <button onClick={onClose} className="text-concrete-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {message && (
          <div className={`md:col-span-2 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="md:col-span-2"><h4 className="text-sm font-bold text-concrete-500 uppercase tracking-wider mb-4 border-b border-concrete-100 pb-2">Identifiants</h4></div>

        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium text-concrete-700">Nom d'utilisateur *</label>
          <input id="username" type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2" />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-concrete-700">Mot de passe *</label>
          <input id="password" type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2" />
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-concrete-700">Rôle</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2 bg-white">
            <option value="standard">Client / Standard</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div className="space-y-1 flex items-center pt-6">
          <label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
            <input id="isActive" type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-safety-orange rounded border-concrete-300 focus:ring-safety-orange" />
            <span className="text-sm font-medium text-concrete-700">Compte Actif (Connexion autorisée)</span>
          </label>
        </div>

        <div className="md:col-span-2 mt-2"><h4 className="text-sm font-bold text-concrete-500 uppercase tracking-wider mb-4 border-b border-concrete-100 pb-2">Informations Entreprise</h4></div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="companyName" className="block text-sm font-medium text-concrete-700">Nom de l'entreprise</label>
          <input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-concrete-700">Adresse</label>
          <input id="address" type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="contact" className="block text-sm font-medium text-concrete-700">Contact</label>
          <input id="contact" type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full rounded-md border-concrete-300 shadow-sm border p-2" />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-concrete-100 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-concrete-700 bg-white border border-concrete-300 rounded-md hover:bg-concrete-50">Annuler</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-safety-orange rounded-md hover:bg-orange-600 disabled:opacity-50">
            {loading ? <Loader2 data-testid="loader" className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Créer l'utilisateur
          </button>
        </div>
      </form>
    </div>
  );
};