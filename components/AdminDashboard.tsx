import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldCheck, User as UserIcon, Building, Clock, Users, Trash2 } from 'lucide-react';
import { User } from '../types';
import { AdminUserForm } from './AdminUserForm';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleUserCreated = () => {
    setShowCreateForm(false);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur "${username}" ?\nCette action est irréversible.`)) {
      return;
    }

    try {
      // Optimistic update pour éviter le scintillement du chargement complet
      const previousUsers = [...users];
      setUsers(users.filter(u => u._id !== userId));

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      
      if (!res.ok) {
        // Rollback en cas d'erreur
        const data = await res.json();
        alert(data.message || "Erreur lors de la suppression.");
        setUsers(previousUsers);
      } else {
        // Optionnel : on peut re-fetch pour être sûr à 100% mais l'optimistic suffit souvent
        // fetchUsers(); 
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion serveur.");
      fetchUsers(); // Rollback via fetch
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-concrete-900 mb-2">Administration</h2>
          <p className="text-concrete-500">Gestion des utilisateurs et des accès à la plateforme.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className={`flex items-center gap-2 px-6 py-3 bg-concrete-900 text-white rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl font-semibold ${showCreateForm ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={showCreateForm}
        >
          <UserPlus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      {showCreateForm && (
        <AdminUserForm 
          currentUser={currentUser} 
          onClose={() => setShowCreateForm(false)} 
          onSuccess={handleUserCreated}
        />
      )}

      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-concrete-100 flex items-center gap-3 bg-concrete-50">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..." 
              className="w-full pl-9 pr-4 py-2 border border-concrete-300 rounded-lg text-sm focus:border-concrete-500 focus:ring-1 focus:ring-concrete-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-concrete-500 ml-auto font-medium">
            {filteredUsers.length} utilisateur(s)
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs font-semibold text-concrete-400 uppercase tracking-wider border-b border-concrete-200">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Dernière Connexion</th>
                <th className="px-6 py-4">Inscrit le</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-concrete-400">Chargement...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-concrete-400">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-concrete-100 text-concrete-600'}`}>
                          {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-concrete-900">{user.username}</p>
                          {user.contact && <p className="text-xs text-concrete-500">{user.contact}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-concrete-700 text-sm">
                        <Building className="w-4 h-4 text-concrete-400" />
                        {user.companyName || <span className="text-concrete-300 italic">Non renseigné</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrateur' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-concrete-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-concrete-400" />
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                          : <span className="text-concrete-300 italic">Jamais</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-concrete-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user._id !== currentUser.id && (
                        <button 
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          className="text-concrete-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};