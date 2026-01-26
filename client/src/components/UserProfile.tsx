import React, { useState, useEffect, useRef } from 'react';
import { User, Building, MapPin, Phone, Save, Loader2, Lock, FileText, Image, Trash2, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';
import { authenticatedFetch } from '../utils/api';

interface UserProfileProps {
  token: string;
  currentUser: UserType;
  onUpdate: (updatedUser: UserType) => void;
}

interface MessageType {
  type: 'success' | 'error';
  text: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ token, currentUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    companyName: currentUser.companyName || '',
    address: currentUser.address || '',
    contact: currentUser.contact || '',
    siret: currentUser.siret || '',
    apeCode: currentUser.apeCode || '',
    legalInfo: currentUser.legalInfo || '',
    logo: currentUser.logo || ''
  });

  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [message, setMessage] = useState<MessageType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour la modale de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setFormData({
      companyName: currentUser.companyName || '',
      address: currentUser.address || '',
      contact: currentUser.contact || '',
      siret: currentUser.siret || '',
      apeCode: currentUser.apeCode || '',
      legalInfo: currentUser.legalInfo || '',
      logo: currentUser.logo || ''
    });
  }, [currentUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
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

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
        setShowPasswordModal(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      setPasswordError('Erreur de connexion serveur');
    } finally {
      setLoading(false);
    }
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
        globalThis.location.reload();
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
        onUpdate({ ...currentUser, ...updatedData });
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
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
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-concrete-900 to-concrete-700 text-white p-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <User className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
              <p className="text-white/80">Gérez vos informations professionnelles</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Colonne 1 : Logo et Identité */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-concrete-200 space-y-6">
              <h3 className="text-xl font-bold text-concrete-900 flex items-center gap-2 pb-4 border-b">
                <Image className="w-5 h-5 text-safety-orange" />
                Logo & Identité
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 p-6 bg-concrete-50 rounded-xl">
                  <div className="w-40 h-40 bg-white border-2 border-dashed border-concrete-300 rounded-xl flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-3" />
                    ) : (
                      <span className="text-concrete-400 text-sm text-center px-4">Aucun logo</span>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  
                  <div className="flex gap-2 w-full">
                    <label
                      htmlFor="logo-upload"
                      className="flex-1 py-2 px-4 bg-concrete-900 text-white rounded-lg text-sm font-semibold text-center cursor-pointer hover:bg-black transition-colors"
                    >
                      Choisir
                    </label>
                    {formData.logo && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="py-2 px-4 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-concrete-500">PNG ou JPG • Max 500KB</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    Nom de la structure
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-5 h-5 text-concrete-400" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                      placeholder="Mon Entreprise BTP"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Coordonnées */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-concrete-200 space-y-6">
              <h3 className="text-xl font-bold text-concrete-900 flex items-center gap-2 pb-4 border-b">
                <MapPin className="w-5 h-5 text-safety-orange" />
                Coordonnées
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    Adresse complète
                  </label>
                  <textarea
                    rows={4}
                    className="w-full p-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all resize-none"
                    placeholder="12 Avenue des Champs&#10;75000 Paris"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    Contact
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-concrete-400" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                      placeholder="01 23 45 67 89 | email@exemple.fr"
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 3 : Informations légales */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-concrete-200 space-y-6">
              <h3 className="text-xl font-bold text-concrete-900 flex items-center gap-2 pb-4 border-b">
                <FileText className="w-5 h-5 text-safety-orange" />
                Informations légales
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    N° SIRET
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                    placeholder="123 456 789 00012"
                    value={formData.siret}
                    onChange={e => setFormData({ ...formData, siret: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    Code APE / NAF
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                    placeholder="7120B"
                    value={formData.apeCode}
                    onChange={e => setFormData({ ...formData, apeCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-concrete-700 mb-2">
                    Mentions légales
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all resize-none"
                    placeholder="RCS Paris B 123 456 789&#10;Capital 10.000€"
                    value={formData.legalInfo}
                    onChange={e => setFormData({ ...formData, legalInfo: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Sécurité */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-concrete-200 mt-6">
            <h3 className="text-xl font-bold text-concrete-900 flex items-center gap-2 mb-6 pb-4 border-b">
              <Lock className="w-5 h-5 text-safety-orange" />
              Sécurité
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 bg-concrete-50 rounded-xl border border-concrete-200">
                <h4 className="font-bold text-concrete-800 mb-2">Mot de passe</h4>
                <p className="text-sm text-concrete-600 mb-4">Modifiez votre mot de passe de connexion</p>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 bg-concrete-900 text-white rounded-lg font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Changer le mot de passe
                </button>
              </div>

              <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Zone de danger
                </h4>
                <p className="text-sm text-red-600 mb-4">Déconnecter tous vos appareils en cas de doute</p>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={logoutLoading}
                  className="w-full py-3 bg-white border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Déconnecter tous les appareils
                </button>
              </div>
            </div>
          </div>

          {/* Bouton Enregistrer */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 px-8 py-4 bg-safety-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modale Changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-concrete-900 flex items-center gap-2">
                <Lock className="w-6 h-6 text-safety-orange" />
                Nouveau mot de passe
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }}
                className="p-2 hover:bg-concrete-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-concrete-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-concrete-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full pl-11 pr-11 py-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-concrete-400 hover:text-concrete-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-concrete-500 mt-1">Minimum 8 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-concrete-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-concrete-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-11 pr-11 py-3 border-2 border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-all"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-concrete-400 hover:text-concrete-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }}
                className="flex-1 py-3 border-2 border-concrete-300 text-concrete-700 rounded-xl font-semibold hover:bg-concrete-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex-1 py-3 bg-safety-orange text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};