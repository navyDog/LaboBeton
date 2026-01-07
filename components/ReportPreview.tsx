import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { ConcreteTest, Specimen, User } from '../types';

interface ReportPreviewProps {
  test: ConcreteTest;
  user?: User; // Utilisateur courant pour l'entête
  type: 'PV' | 'RP'; // PV = 7 jours (Provisoire), RP = 28 jours (Final)
  onClose: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ test, user, type, onClose }) => {
  
  // Filtrage des éprouvettes selon le type de rapport
  const filteredSpecimens = test.specimens.filter(s => {
    if (type === 'PV') return s.age <= 7; // PV : On montre jusqu'à 7 jours
    return true; // RP : On montre tout l'historique
  }).sort((a, b) => a.number - b.number);

  const title = type === 'PV' 
    ? "PROCÈS VERBAL D'ESSAIS (PROVISOIRE)" 
    : "RAPPORT D'ESSAIS SUR BÉTON DURCI";

  const reportDate = new Date().toLocaleDateString('fr-FR');

  // Données de l'en-tête (Défaut si non configuré)
  const headerName = user?.companyName || "Nom du Laboratoire";
  const headerAddress = user?.address || "Adresse non renseignée";
  const headerContact = user?.contact || "Contact non renseigné";
  const headerLogo = user?.logo;

  // Pied de page légal
  const legalParts = [];
  if (user?.siret) legalParts.push(`SIRET : ${user.siret}`);
  if (user?.apeCode) legalParts.push(`APE : ${user.apeCode}`);
  if (user?.legalInfo) legalParts.push(user.legalInfo);
  const legalString = legalParts.join(' - ');

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - ${test.reference}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { size: A4; margin: 15mm; }
                body { -webkit-print-color-adjust: exact; font-family: 'Arial', sans-serif; font-size: 12px; }
                .no-print { display: none; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                .header-box { border: 2px solid #000; padding: 10px; margin-bottom: 20px; }
              }
            </style>
          </head>
          <body class="bg-white p-8">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Petit délai pour laisser Tailwind charger
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-concrete-100 w-full max-w-4xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="bg-concrete-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-safety-orange rounded text-white">
                <FileText className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-lg">Aperçu {type === 'PV' ? 'PV 7 Jours' : 'Rapport Final'}</h3>
               <p className="text-concrete-400 text-xs">{test.reference}</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-concrete-900 rounded-lg hover:bg-concrete-200 transition-colors font-bold text-sm"
            >
              <Printer className="w-4 h-4" /> Imprimer / PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-8 bg-concrete-200 flex justify-center">
           
           {/* REPORT PAPER (A4 RATIO) */}
           <div 
             id="report-content" 
             className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-black text-sm relative flex flex-col"
             style={{ fontFamily: 'Arial, sans-serif' }}
           >
              {/* HEADER LABO - DYNAMIQUE AVEC LOGO */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                 <div className="flex gap-4">
                    {/* LOGO */}
                    {headerLogo && (
                       <img src={headerLogo} alt="Logo" className="h-24 w-auto object-contain max-w-[150px]" />
                    )}
                    
                    <div>
                      <h1 className="text-2xl font-black uppercase tracking-wider mb-1">{headerName}</h1>
                      <p className="text-xs text-gray-600">Laboratoire de Contrôle des Matériaux</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{headerAddress}</p>
                      <p className="text-xs text-gray-600">{headerContact}</p>
                    </div>
                 </div>
                 
                 <div className="text-right">
                    <h2 className="text-xl font-bold uppercase text-safety-orange">{type === 'PV' ? 'PROCÈS VERBAL' : 'RAPPORT FINAL'}</h2>
                    <p className="font-mono font-bold text-lg mt-1">{test.reference}</p>
                    <p className="text-xs mt-1">Date édition : {reportDate}</p>
                 </div>
              </div>

              {/* INFO CHANTIER & CLIENT */}
              <div className="grid grid-cols-2 gap-0 border-2 border-black mb-6">
                 <div className="p-3 border-r-2 border-black">
                    <h4 className="font-bold uppercase text-xs text-gray-500 mb-1">Client / Demandeur</h4>
                    <p className="font-bold text-lg">{test.companyName}</p>
                    <p>{test.projectName}</p>
                    <p className="text-xs mt-1">MOE: {test.moe || 'Non renseigné'}</p>
                 </div>
                 <div className="p-3">
                    <h4 className="font-bold uppercase text-xs text-gray-500 mb-1">Localisation Ouvrage</h4>
                    <p className="font-bold">{test.structureName}</p>
                    <p>{test.elementName}</p>
                    <p className="text-xs mt-1 italic">Coulage le : {new Date(test.samplingDate).toLocaleDateString()}</p>
                 </div>
              </div>

              {/* CARACTERISTIQUES BETON */}
              <div className="mb-6">
                 <h3 className="font-bold bg-gray-100 p-2 border border-black border-b-0 uppercase text-xs">Caractéristiques du Béton & Prélèvement</h3>
                 <table className="w-full border-collapse border border-black text-xs">
                    <tbody>
                       <tr>
                          <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Classe & Consistance</td>
                          <td className="border border-black p-2 w-1/4">{test.concreteClass} - {test.consistencyClass} ({test.slump}mm)</td>
                          <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Formulation</td>
                          <td className="border border-black p-2 w-1/4">{test.mixType}</td>
                       </tr>
                       <tr>
                          <td className="border border-black p-2 font-bold bg-gray-50">Lieu Fabrication</td>
                          <td className="border border-black p-2">{test.manufacturingPlace}</td>
                          <td className="border border-black p-2 font-bold bg-gray-50">Volume</td>
                          <td className="border border-black p-2">{test.volume} m³</td>
                       </tr>
                       <tr>
                          <td className="border border-black p-2 font-bold bg-gray-50">Conservation</td>
                          <td className="border border-black p-2">{test.curing}</td>
                          <td className="border border-black p-2 font-bold bg-gray-50">Serrage</td>
                          <td className="border border-black p-2">{test.tightening}</td>
                       </tr>
                       <tr>
                          <td className="border border-black p-2 font-bold bg-gray-50">Norme</td>
                          <td className="border border-black p-2" colSpan={3}>{test.standard}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* RESULTATS */}
              <div className="mb-8">
                 <h3 className="font-bold bg-gray-100 p-2 border border-black border-b-0 uppercase text-xs flex justify-between">
                    <span>Résultats des Essais de Compression</span>
                    <span>Norme NF EN 12390-3</span>
                 </h3>
                 <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                       <tr className="bg-gray-200">
                          <th className="border border-black p-2 text-center">N°</th>
                          <th className="border border-black p-2 text-center">Âge</th>
                          <th className="border border-black p-2 text-center">Date Écrasement</th>
                          <th className="border border-black p-2 text-center">Dimensions (mm)</th>
                          <th className="border border-black p-2 text-right">Masse (g)</th>
                          <th className="border border-black p-2 text-right">Force (kN)</th>
                          <th className="border border-black p-2 text-right bg-gray-300">Résistance (MPa)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredSpecimens.map((s, idx) => (
                          <tr key={idx}>
                             <td className="border border-black p-2 text-center font-bold">#{s.number}</td>
                             <td className="border border-black p-2 text-center">{s.age} jours</td>
                             <td className="border border-black p-2 text-center">{new Date(s.crushingDate).toLocaleDateString()}</td>
                             <td className="border border-black p-2 text-center">{s.diameter} x {s.height}</td>
                             <td className="border border-black p-2 text-right">{s.weight || '-'}</td>
                             <td className="border border-black p-2 text-right">{s.force || '-'}</td>
                             <td className="border border-black p-2 text-right font-bold text-base">
                                {s.stress ? s.stress.toFixed(1) : '-'}
                             </td>
                          </tr>
                       ))}
                       {filteredSpecimens.length === 0 && (
                          <tr>
                             <td colSpan={7} className="border border-black p-4 text-center italic text-gray-500">
                                Aucun résultat disponible pour cet âge.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* OBSERVATIONS & CONCLUSION */}
              <div className="border border-black p-4 mb-8 min-h-[100px]">
                 <h4 className="font-bold underline mb-2 text-xs">OBSERVATIONS & CONCLUSIONS :</h4>
                 <p className="text-sm">
                    {test.concreteClass ? `La résistance caractéristique attendue est de classe ${test.concreteClass}.` : ''} 
                    {filteredSpecimens.some(s => s.stress) ? ' Les résultats obtenus sont conformes aux exigences normatives pour l\'âge considéré.' : ''}
                 </p>
              </div>

              {/* SIGNATURES */}
              <div className="grid grid-cols-2 gap-12 mt-auto">
                 <div className="border-t border-black pt-2">
                    <p className="font-bold text-xs uppercase">Le Technicien Laboratoire</p>
                    <div className="h-20"></div>
                 </div>
                 <div className="border-t border-black pt-2">
                    <p className="font-bold text-xs uppercase">Le Responsable Technique</p>
                    <div className="h-20 flex items-center justify-center opacity-50">
                       <CheckCircle2 className="w-12 h-12 text-gray-300" />
                       <span className="ml-2 text-gray-400 text-xs font-mono">VALIDÉ NUMÉRIQUEMENT</span>
                    </div>
                 </div>
              </div>

              {/* FOOTER PAGE - DYNAMIQUE AVEC INFOS LEGALES */}
              <div className="absolute bottom-4 left-0 right-0 text-center px-8">
                 <div className="border-t border-gray-300 pt-2 text-[10px] text-gray-500">
                   <p>{headerName} - Document généré informatiquement le {reportDate}.</p>
                   {legalString && <p className="mt-1 font-medium">{legalString}</p>}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};