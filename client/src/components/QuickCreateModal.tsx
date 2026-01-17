import React from 'react';
import { Briefcase, User as UserIcon, X } from 'lucide-react';
import { Company } from '../types';

interface QuickCreateModalProps {
  quickCreateType: 'project' | 'company';
  setQuickCreateType: (type: 'project' | 'company') => void;
  newProjectData: {
    name: string;
    companyId: string;
    moa: string;
    moe: string;
    contactName: string;
    email: string;
    phone: string;
  };
  setNewProjectData: React.Dispatch<React.SetStateAction<{
    name: string;
    companyId: string;
    moa: string;
    moe: string;
    contactName: string;
    email: string;
    phone: string;
  }>>;
  newCompanyData: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
  };
  setNewCompanyData: React.Dispatch<React.SetStateAction<{
    name: string;
    contactName: string;
    email: string;
    phone: string;
  }>>;
  companies: Company[];
  handleQuickCreate: () => void;
  setQuickCreateOpen: (open: boolean) => void;
  isQuickCreate: boolean;
}

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  quickCreateType,
  setQuickCreateType,
  newProjectData,
  setNewProjectData,
  newCompanyData,
  setNewCompanyData,
  companies,
  handleQuickCreate,
  setQuickCreateOpen, isQuickCreate
}) => {
  if (!isQuickCreate) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-lg flex items-center gap-2">
            {quickCreateType === 'project' ? <Briefcase className="w-5 h-5 text-safety-orange" /> : <UserIcon className="w-5 h-5 text-blue-600" />}
            {quickCreateType === 'project' ? 'Nouvelle Affaire' : 'Nouveau Client'}
          </h4>
          <button onClick={() => setQuickCreateOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex mb-4 bg-concrete-100 p-1 rounded-lg">
          <button onClick={() => setQuickCreateType('project')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${quickCreateType === 'project' ? 'bg-white shadow text-concrete-900' : 'text-concrete-500'}`}>Affaire</button>
          <button onClick={() => setQuickCreateType('company')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${quickCreateType === 'company' ? 'bg-white shadow text-concrete-900' : 'text-concrete-500'}`}>Entreprise</button>
        </div>
        {quickCreateType === 'project' ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
            <div>
              <label className="text-xs font-bold text-gray-500">
                Nom de l'affaire *<input autoFocus className="w-full border p-2 rounded text-sm mt-1" placeholder="ex: Chantier École"
                  value={newProjectData.name}
                  onChange={e => setNewProjectData({ ...newProjectData, name: e.target.value })} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">
                Entreprise / Client<select className="w-full border p-2 rounded text-sm mt-1 bg-white"
                  value={newProjectData.companyId}
                  onChange={e => setNewProjectData({ ...newProjectData, companyId: e.target.value })}>
                  <option value="">-- Sélectionner ou créer --</option>{companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>
              <button onClick={() => setQuickCreateType('company')} className="text-[10px] text-blue-600 font-bold mt-1 hover:underline">+ Créer une entreprise</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500">
                  MOA<input className="w-full border p-2 rounded text-sm mt-1"
                    value={newProjectData.moa} onChange={e => setNewProjectData({ ...newProjectData, moa: e.target.value })} />
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">
                  MOE<input className="w-full border p-2 rounded text-sm mt-1"
                    value={newProjectData.moe} onChange={e => setNewProjectData({ ...newProjectData, moe: e.target.value })} />
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">
                Contact<input className="w-full border p-2 rounded text-sm mt-1"
                  value={newProjectData.contactName} onChange={e => setNewProjectData({ ...newProjectData, contactName: e.target.value })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Email<input className="w-full border p-2 rounded text-sm mt-1"
                    value={newProjectData.email} onChange={e => setNewProjectData({ ...newProjectData, email: e.target.value })} />
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">
                  Tél<input className="w-full border p-2 rounded text-sm mt-1"
                    value={newProjectData.phone} onChange={e => setNewProjectData({ ...newProjectData, phone: e.target.value })} />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
            <div>
              <label className="text-xs font-bold text-gray-500">
                Nom de l'entreprise *<input autoFocus className="w-full border p-2 rounded text-sm mt-1" placeholder="ex: Bâtiment SAS"
                  value={newCompanyData.name} onChange={e => setNewCompanyData({ ...newCompanyData, name: e.target.value })} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">
                Contact Principal<input className="w-full border p-2 rounded text-sm mt-1" value={newCompanyData.contactName}
                  onChange={e => setNewCompanyData({ ...newCompanyData, contactName: e.target.value })} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">
                Email<input className="w-full border p-2 rounded text-sm mt-1"
                  value={newCompanyData.email} onChange={e => setNewCompanyData({ ...newCompanyData, email: e.target.value })} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">
                Téléphone<input className="w-full border p-2 rounded text-sm mt-1"
                  value={newCompanyData.phone} onChange={e => setNewCompanyData({ ...newCompanyData, phone: e.target.value })} />
              </label>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6"><button onClick={() => setQuickCreateOpen(false)} className="px-4 py-2 bg-gray-100 rounded text-sm font-medium">Annuler</button><button onClick={handleQuickCreate} className="px-4 py-2 bg-safety-orange text-white rounded text-sm font-bold shadow-sm">{quickCreateType === 'project' ? 'Créer Affaire' : 'Créer & Sélectionner'}</button></div>
      </div>
    </div>
  );
};

export default QuickCreateModal;