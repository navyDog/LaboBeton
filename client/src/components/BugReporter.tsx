import React, { useState } from 'react';
import { Bug, X, Send, MessageSquare } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

interface BugReporterProps {
  token: string;
  username: string;
}

export const BugReporter: React.FC<BugReporterProps> = ({ token, username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await authenticatedFetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, description, user: username })
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
        setDescription('');
      }, 2000);
    } catch (e) {
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-concrete-800 text-white rounded-full shadow-lg hover:bg-concrete-900 transition-transform hover:scale-110"
        title="Signaler un problème"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-concrete-200 animate-in fade-in slide-in-from-bottom-10">
      <div className="flex justify-between items-center p-3 bg-concrete-800 text-white rounded-t-xl">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Support & Bugs
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:text-red-300"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {sent ? (
        <div className="p-8 text-center text-green-600 font-bold">
           Merci ! Message envoyé.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
           <div>
             <label htmlFor="messageType" className="text-xs font-bold text-concrete-500">Type de message</label>
             <select
               id="messageType"
               className="w-full text-sm p-1.5 border rounded mt-1"
               value={type}
               onChange={e => setType(e.target.value)}
             >
               <option value="bug">Bug technique</option>
               <option value="feature">Suggestion</option>
               <option value="other">Autre</option>
             </select>
           </div>
           <div>
             <label htmlFor="description" className="text-xs font-bold text-concrete-500">Description</label>
             <textarea
               id="description"
               required
               className="w-full text-sm p-2 border rounded mt-1 h-24 resize-none"
               placeholder="Décrivez le problème..."
               value={description}
               onChange={e => setDescription(e.target.value)}
             />
           </div>
           <button
             disabled={sending}
             type="submit"
             className="w-full py-2 bg-safety-orange text-white text-sm font-bold rounded hover:bg-orange-600 flex items-center justify-center gap-2"
           >
             {sending ? 'Envoi...' : <><Send className="w-3 h-3" /> Envoyer</>}
           </button>
        </form>
      )}
    </div>
  );
};