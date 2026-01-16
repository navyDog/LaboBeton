import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldCheck, User as UserIcon, Building, Trash2, Lock, Unlock, Bug, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { AdminUserForm } from './AdminUserForm';
import { authenticatedFetch } from '../../utils/api';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [view, setView] = useState<'users' | 'bugs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, bugsRes] = await Promise.all([
        authenticatedFetch('/api/users', { headers: { 'Authorization': `Bearer ${currentUser.token}` } }),
        authenticatedFetch('/api/admin/bugs', { headers: { 'Authorization': `Bearer ${currentUser.token}` } })
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (bugsRes.ok) setBugs(await bugsRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleUserCreated = () => {
    setShowCreateForm(false);
    fetchData();
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
      const res = await authenticatedFetch(`/api/users/${userId}/toggle-access`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
      }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur "${username}" ?\nCette action est irréversible.`)) {
      return;
    }
      setUsers(users.filter(u => u._id !== userId));
      await authenticatedFetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
  };

  const handleResolveBug = async (bugId: string) => {
      const res = await authenticatedFetch(`/api/admin/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      if(res.ok) {
        setBugs(bugs.map(b => b._id === bugId ? { ...b, status: 'resolved' } : b));
      }
  };

  const handleDeleteBug = async (bugId: string) => {
    if(!confirm("Supprimer définitivement ce signalement ?")) return;
    await authenticatedFetch(`/api/admin/bugs/${bugId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    setBugs(bugs.filter(b => b._id !== bugId));
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-concrete-900 mb-2">Administration</h2>
          <p className="text-concrete-500">Gestion globale de la plateforme.</p>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => setView('users')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${view === 'users' ? 'bg-concrete-900 text-white' : 'bg-white text-concrete-600 hover:bg-concrete-100'}`}>Utilisateurs</button>
           <button onClick={() => setView('bugs')} className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${view === 'bugs' ? 'bg-concrete-900 text-white' : 'bg-white text-concrete-600 hover:bg-concrete-100'}`}>
             <Bug className="w-4 h-4" /> Support / Bugs
             {bugs.some(b => b.status === 'open') && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{bugs.filter(b => b.status === 'open').length}</span>
             )}
           </button>
        </div>
      </div>

      {view === 'users' && (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowCreateForm(true)}
              className={`flex items-center gap-2 px-6 py-3 bg-safety-orange text-white rounded-xl hover:bg-orange-600 transition-all shadow-md font-semibold ${showCreateForm ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={showCreateForm}
            >
              <UserPlus className="w-5 h-5" />
              Nouveau Client
            </button>
          </div>

          {showCreateForm && <AdminUserForm currentUser={currentUser} onClose={() => setShowCreateForm(false)} onSuccess={handleUserCreated} />}

          <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-concrete-100 flex items-center gap-3 bg-concrete-50">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-concrete-400" />
                <input type="text" placeholder="Rechercher un utilisateur..." className="w-full pl-9 pr-4 py-2 border border-concrete-300 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-xs font-semibold text-concrete-400 uppercase tracking-wider border-b border-concrete-200">
                    <th className="px-6 py-4">Utilisateur</th>
                    <th className="px-6 py-4">Entreprise</th>
                    <th className="px-6 py-4">État</th>
                    <th className="px-6 py-4">Dernière Connexion</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-concrete-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-concrete-100 text-concrete-600'}`}>
                            {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                          </div>
                          <div><p className="font-bold text-concrete-900">{user.username}</p>{user.contact && <p className="text-xs text-concrete-500">{user.contact}</p>}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2 text-concrete-700 text-sm"><Building className="w-4 h-4 text-concrete-400" />{user.companyName || <span className="text-concrete-300 italic">Non renseigné</span>}</div></td>
                      <td className="px-6 py-4">
                        {user.isActive ? 
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3"/> Actif</span> : 
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><Lock className="w-3 h-3"/> Désactivé</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-concrete-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : <span className="text-concrete-300 italic">Jamais</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user._id !== currentUser.id && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleToggleActive(user._id, user.isActive)} className={`p-2 rounded-full transition-colors ${user.isActive ? 'text-concrete-400 hover:text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={user.isActive ? "Désactiver le compte (Licence)" : "Réactiver le compte"}>
                              {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteUser(user._id, user.username)} className="text-concrete-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full" title="Supprimer définitivement">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'bugs' && (
        <div className="space-y-4">
           {bugs.length === 0 ? <div className="text-center py-12 bg-white rounded-xl text-concrete-500">Aucun signalement.</div> : (
             bugs.map(bug => (
               <div key={bug._id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-start ${bug.status === 'resolved' ? 'border-green-200 opacity-70' : 'border-concrete-200'}`}>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bug.type === 'bug' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{bug.type}</span>
                        <span className="text-xs text-concrete-400">{new Date(bug.createdAt).toLocaleString()}</span>
                        <span className="text-xs font-bold text-concrete-600">par {bug.user}</span>
                     </div>
                     <p className="text-sm text-concrete-800 whitespace-pre-wrap">{bug.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {bug.status === 'open' ? (
                      <button onClick={() => handleResolveBug(bug._id)} className="px-3 py-1 bg-concrete-100 hover:bg-green-100 text-concrete-600 hover:text-green-700 rounded text-xs font-bold transition-colors">Marquer Résolu</button>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle className="w-3 h-3" /> Résolu</span>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteBug(bug._id)}
                      className="text-concrete-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer ce rapport"
                      data-testid={`delete-bug-${bug._id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};