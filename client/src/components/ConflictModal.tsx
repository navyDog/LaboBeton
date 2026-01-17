import React from 'react';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { ConcreteTest, User } from '../types';

interface ConflictModalProps {
  conflictData: ConcreteTest | null;
  user: User | undefined;
  onReload: () => void;
  onForceOverwrite: () => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({ conflictData, user, onReload, onForceOverwrite }) => {
  if (!conflictData) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in zoom-in-95">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500">
        <div className="bg-red-50 p-6 flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-700">Conflit de modification</h3>
            <p className="text-red-600 mt-2 text-sm leading-relaxed">
              Un autre utilisateur a modifié cette fiche pendant que vous travailliez dessus.
              Vos versions ne sont plus synchronisées.
            </p>
            <div className="mt-4 bg-white p-3 rounded border border-red-200 text-xs text-gray-600" data-testid="conflict-info">
              <p><strong>Serveur:</strong> {conflictData.specimens?.length} éprouvettes, Modifié par {conflictData.userId === user?.id ? 'Vous (autre session)' : 'Autrui'}.</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onReload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            data-testid="reload-button"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger (Perdre mes saisies)
          </button>
          <button
            onClick={onForceOverwrite}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md"
            data-testid="overwrite-button"
          >
            <Save className="w-4 h-4" />
            Écraser la version serveur
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictModal;