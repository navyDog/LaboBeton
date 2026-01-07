import React, { useState } from 'react';
import { UserPlus, Save, X, Building, MapPin, Phone, User, Lock, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

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
      const response = await fetch('/api/users', {
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
        setFormData({
          username: '',
          password: '',
          role: 'standard',
          companyName: '',
          address: '',
          contact: ''
        });
        // Notifier le parent après un court délai pour laisser lire le message
        setTimeout(() => {
          onSuccess();
        }, 1500);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

        {/* Section Identifiants */}
        <div className="md:col-span-2">
           <h4 className="text-sm font-bold text-concrete-500 uppercase tracking-wider mb-4 border-b border-concrete-100 pb-2">Identifiants de connexion</h4>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-concrete-700">Nom d'utilisateur <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="pl-9 block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
              placeholder="ex: entreprise_abc"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-concrete-700">Mot de passe <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="pl-9 block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium text-concrete-700">Rôle</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
          >
            <option value="standard">Client / Standard (Accès limité)</option>
            <option value="admin">Administrateur (Accès total)</option>
          </select>
        </div>

        {/* Section Entreprise */}
        <div className="md:col-span-2 mt-2">
           <h4 className="text-sm font-bold text-concrete-500 uppercase tracking-wider mb-4 border-b border-concrete-100 pb-2">Informations Entreprise</h4>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium text-concrete-700">Nom de l'entreprise</label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="pl-9 block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
              placeholder="ex: BTP Construction SA"
            />
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium text-concrete-700">Adresse</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="pl-9 block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
              placeholder="ex: 12 Rue du Béton, 75000 Paris"
            />
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium text-concrete-700">Contact (Tel / Email)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="pl-9 block w-full rounded-md border-concrete-300 shadow-sm focus:border-safety-orange focus:ring-safety-orange sm:text-sm py-2 border"
              placeholder="ex: M. Dupont - 06 12 34 56 78"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-concrete-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-concrete-700 bg-white border border-concrete-300 rounded-md hover:bg-concrete-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-safety-orange rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Créer l'utilisateur
          </button>
        </div>

      </form>
    </div>
  );
};