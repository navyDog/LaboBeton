import React, { useState, useEffect } from 'react';
import { User, Building, MapPin, Phone, Save, Loader2, Lock } from 'lucide-react';
import { User as UserType } from '../types';

interface UserProfileProps {
  token: string;
  currentUser: UserType;
  onUpdate: (updatedUser: UserType) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ token, currentUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    companyName: currentUser.companyName || '',
    address: currentUser.address || '',
    contact: currentUser.contact || '',
    password: '' // Optional password change
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Mettre à jour le formulaire si l'utilisateur change (props)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      companyName: currentUser.companyName || '',
      address: currentUser.address || '',
      contact: currentUser.contact || ''
    }));
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedData = await res.json();
        // Mettre à jour le contexte global
        onUpdate({ ...currentUser, ...updatedData });
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        setFormData(prev => ({ ...prev, password: '' })); // Clear password field
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion serveur.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6 border-b border-concrete-100 pb-4">
          <div className="bg-concrete-100 p-3 rounded-full text-concrete-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-concrete-900">Mon Profil</h2>
            <p className="text-concrete-500">Ces informations apparaîtront sur vos rapports PDF (En-tête).</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-concrete-400" /> Nom de votre structure / Laboratoire
            </label>
            <input
              type="text"
              className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
              placeholder="Ex: Mon Labo BTP Expert"
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
            />
            <p className="text-xs text-concrete-400 mt-1">Apparaîtra en gros titre sur les PV.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-concrete-400" /> Adresse Complète
            </label>
            <input
              type="text"
              className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
              placeholder="Ex: 12 Avenue des Champs, 75000 Paris"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-concrete-400" /> Contact (Tél / Email)
            </label>
            <input
              type="text"
              className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
              placeholder="Ex: 01 02 03 04 05 | contact@monlabo.com"
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-concrete-100">
            <h4 className="font-bold text-concrete-800 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-concrete-500" /> Sécurité
            </h4>
            <label className="block text-sm text-concrete-600 mb-2">
              Nouveau mot de passe (Laisser vide pour ne pas changer)
            </label>
            <input
              type="password"
              className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all bg-concrete-50"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-concrete-900 text-white rounded-lg hover:bg-black transition-colors font-bold shadow-lg disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Mettre à jour mon profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
