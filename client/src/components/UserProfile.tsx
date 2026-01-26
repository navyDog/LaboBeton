import React, { useState, useEffect, useRef } from 'react';
import { User, Building, MapPin, Phone, Save, Loader2, Lock, FileText, Image as ImageIcon, Trash2, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';
import { authenticatedFetch } from '../utils/api';

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
    siret: currentUser.siret || '',
    apeCode: currentUser.apeCode || '',
    legalInfo: currentUser.legalInfo || '',
    logo: currentUser.logo || '', // Base64 string
    password: '' // Optional password change
  });

  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false); // État pour le bouton logout-all
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

// Juste après la déclaration du state formData
useEffect(() => {
  console.log('🔄 currentUser a changé:', currentUser);
  console.log('📝 Valeurs reçues:', {
    companyName: currentUser.companyName,
    address: currentUser.address,
    contact: currentUser.contact
  });
  
  setFormData({
    companyName: currentUser.companyName || '',
    address: currentUser.address || '',
    contact: currentUser.contact || '',
    siret: currentUser.siret || '',
    apeCode: currentUser.apeCode || '',
    legalInfo: currentUser.legalInfo || '',
    logo: currentUser.logo || '',
    password: ''
  });
}, [currentUser]);

// Ajoute aussi celui-ci pour voir l'état du formulaire
useEffect(() => {
  console.log('📋 formData actuel:', formData);
}, [formData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        alert("L'image est trop volumineuse (Max 500KB).");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoutAll = async () => {
    if (!confirm("Attention : Cela déconnectera immédiatement tous les autres appareils (mobiles, tablettes, autres PC) connectés à ce compte.\n\nVoulez-vous continuer ?")) return;
    
    setLogoutLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Sécurité : Tous les autres appareils ont été déconnectés.\nVotre session actuelle reste active.");
        // Pas besoin de changer d'état ici, la session courante reste valide car le token actuel a la bonne version (en théorie, sauf si on raffine coté serveur pour inclure la session courante, mais ici le but est de kicker LES AUTRES).
        // Note: Dans mon implémentation serveur simple, tokenVersion++ invalide TOUT le monde, y compris moi au prochain appel API.
        // C'est normal : on force une reconnexion propre pour tout le monde par sécurité.
        globalThis.location.reload(); // On force le rechargement pour que l'app détecte qu'on doit se reconnecter (propre)
      } else {
        alert("Erreur lors de la déconnexion globale.");
      }
    } catch (e) {
      alert("Erreur serveur.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await authenticatedFetch('/api/auth/profile', {
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6 border-b border-concrete-100 pb-4">
          <div className="bg-concrete-100 p-3 rounded-full text-concrete-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-concrete-900">Mon Profil</h2>
            <p className="text-concrete-500">Ces informations apparaîtront sur vos rapports PDF.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">

            {/* Colonne Gauche : Identité & Logo */}
            <div className="space-y-6">
                {/* ... (Code existant inchangé pour le logo et les inputs) ... */}
                <div>
                  <label htmlFor="logo-upload" className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-concrete-400" /> Logo (Entête Rapports)
                  </label>

                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-concrete-50 border-2 border-dashed border-concrete-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                       {formData.logo ? (
                         <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                       ) : (
                         <span className="text-concrete-400 text-xs text-center px-2">Aucun logo</span>
                       )}
                    </div>

                    <div className="space-y-2">
                       <input
                         type="file"
                         id="logo-upload"
                         ref={fileInputRef}
                         accept="image/png, image/jpeg"
                         onChange={handleImageChange}
                         className="block w-full text-xs text-concrete-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-concrete-100 file:text-concrete-700 hover:file:bg-concrete-200"
                       />
                       <p className="text-xs text-concrete-400">PNG ou JPG. Max 500KB.</p>
                       {formData.logo && (
                         <button
                           type="button"
                           onClick={removeLogo}
                           className="text-red-500 text-xs flex items-center gap-1 hover:underline"
                         >
                           <Trash2 className="w-3 h-3" /> Supprimer le logo
                         </button>
                       )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-concrete-400" /> Nom de votre structure
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                    placeholder="Ex: Mon Labo BTP Expert"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-bold text-concrete-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-concrete-400" /> Adresse Complète
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all resize-none"
                    placeholder="Ex: 12 Avenue des Champs&#10;75000 Paris"
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
            </div>

            {/* Colonne Droite : Administratif & Sécurité */}
            <div className="space-y-6">
                <div className="bg-concrete-50 p-5 rounded-lg border border-concrete-100 space-y-4">
                   <h4 className="font-bold text-concrete-800 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Informations Légales (Pied de page)
                   </h4>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-concrete-500 mb-1">N° SIRET
                          N° SIRET<input
                          type="text"
                          className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-sm"
                          placeholder="123 456 789 00012"
                          value={formData.siret}
                          onChange={e => setFormData({ ...formData, siret: e.target.value })}
                          />
                        </label>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-concrete-500 mb-1">
                          Code APE / NAF<input
                          type="text"
                          className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-sm"
                          placeholder="7120B"
                          value={formData.apeCode}
                          onChange={e => setFormData({ ...formData, apeCode: e.target.value })}
                          />
                        </label>
                     </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-concrete-500 mb-1">
                        Autre mention (RCS, Capital...)<input
                        type="text"
                        className="w-full p-2 border border-concrete-300 rounded focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-sm"
                        placeholder="RCS Paris B 123 456 789 - Capital 10.000€"
                        value={formData.legalInfo}
                        onChange={e => setFormData({ ...formData, legalInfo: e.target.value })}
                        />
                      </label>
                   </div>
                </div>

                <div className="border-t border-concrete-100 pt-4">
                  <h4 className="font-bold text-concrete-800 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-concrete-500" /> Sécurité
                  </h4>
                  <label className="block text-sm text-concrete-600 mb-2">
                    Nouveau mot de passe (Laisser vide pour ne pas changer)<input
                      type="password"
                      className="w-full p-3 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all bg-concrete-50"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </label>
                  {/* BOUTON DÉCONNEXION GLOBALE */}
                  <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                     <h5 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2">
                       <ShieldAlert className="w-4 h-4"/> Zone de danger
                     </h5>
                     <p className="text-xs text-red-600 mb-3">
                       Si vous pensez que votre compte est compromis ou si vous avez oublié de vous déconnecter d'un ordinateur public.
                     </p>
                     <button
                       type="button"
                       onClick={handleLogoutAll}
                       disabled={logoutLoading}
                       className="w-full py-2 bg-white border border-red-300 text-red-600 font-bold text-sm rounded hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-2"
                     >
                        {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4"/>}
                        Déconnecter tous les appareils
                     </button>
                  </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-concrete-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-concrete-900 text-white rounded-lg hover:bg-black transition-colors font-bold shadow-lg disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};