import React, { useState } from 'react';
import { User, Lock, AlertCircle, Loader2, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-concrete-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-concrete-200">
        
        {/* Header */}
        <div className="bg-concrete-900 p-8 text-center">
          <div className="inline-flex p-3 bg-concrete-800 rounded-xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">LaboBéton</h1>
          <p className="text-concrete-400 text-sm">Authentification Requise</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">Identifiant</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-concrete-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-colors text-concrete-900 placeholder-concrete-400 sm:text-sm"
                  placeholder="ex: labo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-concrete-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-concrete-300 rounded-lg focus:ring-2 focus:ring-safety-orange focus:border-safety-orange transition-colors text-concrete-900 placeholder-concrete-400 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-safety-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safety-orange disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-xs text-concrete-400">
               Accès restreint au personnel autorisé.<br/>
               Comptes par défaut : <strong>admin / admin123</strong> ou <strong>labo / labo123</strong>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};