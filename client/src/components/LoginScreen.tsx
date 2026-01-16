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
      {/* Grille technique de fond */}
      <div className="absolute inset-0 z-0 opacity-5" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      {/* Effets de lumière (Glows) */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-safety-orange rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* --- LOGIN CARD --- */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 z-10 transition-all duration-700 ease-out transform translate-y-0 opacity-100">
        
        {/* Header Stylisé */}
        <div className="relative bg-gradient-to-br from-concrete-800 to-concrete-900 p-8 text-center overflow-hidden group border-b border-concrete-700">
          {/* Effet de brillance au survol */}
          <div className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 transition-transform duration-1000 group-hover:translate-x-full"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-inner">
              <Building2 className="w-10 h-10 text-safety-orange" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">LaboBéton</h1>
            
            {/* BADGE ALPHA */}
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-safety-orange text-white border border-orange-500 shadow-lg shadow-orange-500/20 uppercase tracking-widest">
                Alpha v0.2.0-alpha.1
              </span>
              <span className="text-concrete-400 text-xs font-medium border-l border-concrete-700 pl-3">
                Accès Professionnel
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-concrete-300 group-focus-within:text-safety-orange transition-colors" />
                </div>
                <label className="block text-xs font-bold text-concrete-500 uppercase tracking-wide ml-1">
                  Identifiant<input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange/50 focus:border-safety-orange transition-all text-concrete-900 placeholder-concrete-300 text-sm font-medium bg-concrete-50/50 focus:bg-white outline-none"
                  placeholder="votre_identifiant"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-concrete-300 group-focus-within:text-safety-orange transition-colors" />
                </div>
                <label className="block text-xs font-bold text-concrete-500 uppercase tracking-wide ml-1">
                  Mot de passe<input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-concrete-200 rounded-xl focus:ring-2 focus:ring-safety-orange/50 focus:border-safety-orange transition-all text-concrete-900 placeholder-concrete-300 text-sm font-medium bg-concrete-50/50 focus:bg-white outline-none"
                  placeholder="••••••••"
                  />
                </label>
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

          {/* Footer Card */}
          <div className="mt-8 pt-6 border-t border-concrete-100 text-center">
             <div className="flex justify-center gap-8 text-concrete-400 opacity-60 hover:opacity-100 transition-opacity">
               <div className="flex flex-col items-center gap-1">
                 <HardHat className="w-5 h-5" />
                 <span className="text-[10px] font-medium">Sécurisé</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <Building2 className="w-5 h-5" />
                 <span className="text-[10px] font-medium">Norme NF</span>
               </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-concrete-600 text-[10px] opacity-40">
        &copy; {new Date().getFullYear()} LaboBéton Solutions
      </div>
    </div>
  );
};