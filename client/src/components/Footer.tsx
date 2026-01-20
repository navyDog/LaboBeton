import React from 'react';
import { Rocket } from 'lucide-react';

interface FooterProps {
  onNavigate: (targetView: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-concrete-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-concrete-400">&copy; {new Date().getFullYear()} LaboBéton v0.2.0-beta.1 - Normes NF EN</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-concrete-400 font-medium">Developed by</span>
            <div className="flex items-center gap-1 bg-concrete-100 px-2 py-0.5 rounded text-concrete-600 font-bold text-[10px]">
              <Rocket className="w-3 h-3 text-blue-500" /> VBM Solutions
            </div>
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-medium text-concrete-500">
            <button onClick={() => onNavigate('legal_cgu')} className="hover:text-safety-orange hover:underline">CGU</button>
            <button onClick={() => onNavigate('legal_privacy')} className="hover:text-safety-orange hover:underline">Confidentialité</button>
            <button onClick={() => onNavigate('legal_mentions')} className="hover:text-safety-orange hover:underline">Mentions</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;