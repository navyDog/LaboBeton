import React, { useState } from 'react';
import { User, Lock, AlertCircle, Loader2, Building2, HardHat, ArrowRight } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserType, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Petit délai artificiel pour laisser l'utilisateur voir l'animation de succès si besoin (optionnel)
        onLogin(data.user, data.token);
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-concrete-900">
      
      {/* --- BACKGROUND ANIMATION --- */}
      {/* Grille de fond */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
      
      {/* Formes floues animées (Glow effects) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-safety-orange rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* --- CARD CONTENT --- */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 z-10 animate-in slide-in-from-bottom-8 fade-in duration-700">
        
        {/* Header Stylisé */}
        <div className="relative bg-gradient-to-br from-concrete-800 to-concrete-900 p-8 text-center overflow-hidden group">
          {/* Effet de brillance au survol */}
          <div className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_2s_infinite]"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex p-4 bg-white/10 rounded-2xl mb-4 border border-white/10 shadow-inner">
              <Building2 className="w-10 h-10 text-safety-orange" />
            </div>
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">LaboBéton</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-safety-orange/20 text-safety-orange text-[10px] font-bold border border-safety-orange/30 uppercase tracking-wider">
                Alpha v0.1.0
              </span>
              <span className="text-concrete-400 text-xs border-l border-concrete-700 pl-2">Accès Pro</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold animate-in shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-concrete-500 uppercase tracking-wide ml-1">Identifiant</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-concrete-400 group-focus-within:text-safety-orange transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange/50 focus:border-safety-orange transition-all text-concrete-900 placeholder-concrete-300 text-sm font-medium bg-concrete-50/50 focus:bg-white"
                  placeholder="votre_identifiant"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-concrete-500 uppercase tracking-wide ml-1">Mot de passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-concrete-400 group-focus-within:text-safety-orange transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange/50 focus:border-safety-orange transition-all text-concrete-900 placeholder-concrete-300 text-sm font-medium bg-concrete-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-500/20 text-sm font-bold text-white bg-gradient-to-r from-safety-orange to-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safety-orange disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...
                </>
              ) : (
                <>
                  Accéder à l'espace
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-concrete-100 text-center">
             <div className="flex justify-center gap-8 text-concrete-400">
               <div className="flex flex-col items-center gap-1">
                 <HardHat className="w-5 h-5 opacity-50" />
                 <span className="text-[10px] font-medium">Sécurisé</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <Building2 className="w-5 h-5 opacity-50" />
                 <span className="text-[10px] font-medium">Norme NF</span>
               </div>
             </div>
             
             <p className="mt-6 text-[10px] text-concrete-300">
               Comptes démo : <strong>admin/admin123</strong> ou <strong>labo/labo123</strong>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};