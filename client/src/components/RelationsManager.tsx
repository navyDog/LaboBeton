import React, { useState } from 'react';
import { Building, Briefcase } from 'lucide-react';
import { CompanyManager } from './CompanyManager';
import { ProjectManager } from './ProjectManager';

interface RelationsManagerProps {
  token: string;
}

export const RelationsManager: React.FC<RelationsManagerProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'projects'>('companies');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="bg-concrete-100 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'companies' 
                ? 'bg-white text-concrete-900 shadow-sm' 
                : 'text-concrete-500 hover:text-concrete-700'
            }`}
          >
            <Building className="w-4 h-4" />
            Entreprises (Clients)
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'projects' 
                ? 'bg-white text-concrete-900 shadow-sm' 
                : 'text-concrete-500 hover:text-concrete-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Affaires (Chantiers)
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-transparent">
        {activeTab === 'companies' ? (
          <CompanyManager token={token} />
        ) : (
          <ProjectManager token={token} />
        )}
      </div>
    </div>
  );
};
