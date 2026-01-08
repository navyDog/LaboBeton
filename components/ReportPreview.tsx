import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { ConcreteTest, Specimen, User } from '../types';

interface ReportPreviewProps {
  test: ConcreteTest;
  user?: User; 
  type: 'PV' | 'RP'; 
  onClose: () => void;
}

const groupSpecimensByAge = (specimens: Specimen[]) => {
  const groups: Record<number, Specimen[]> = {};
  specimens.forEach(s => {
    if (!groups[s.age]) groups[s.age] = [];
    groups[s.age].push(s);
  });
  return groups;
};

const getTargetStrength = (concreteClass: string, isCube: boolean): number | null => {
  if (!concreteClass) return null;
  const match = concreteClass.match(/C(\d+)\/(\d+)/i);
  if (match) {
    const cylinder = parseInt(match[1]);
    const cube = parseInt(match[2]);
    return isCube ? cube : cylinder;
  }
  return null;
};

export const ReportPreview: React.FC<ReportPreviewProps> = ({ test, user, type, onClose }) => {
  
  const filteredSpecimens = test.specimens.filter(s => {
    if (type === 'PV') return s.age <= 7; 
    return true; 
  }).sort((a, b) => a.number - b.number);

  const groupedSpecimens = groupSpecimensByAge(filteredSpecimens);
  const ages = Object.keys(groupedSpecimens).map(Number).sort((a, b) => a - b);

  const title = type === 'PV' 
    ? "PROCÈS VERBAL D'ESSAIS (PROVISOIRE)" 
    : "RAPPORT D'ESSAIS SUR BÉTON DURCI";

  const reportDate = new Date().toLocaleDateString('fr-FR');

  const headerName = user?.companyName || "Nom du Laboratoire";
  const headerAddress = user?.address || "Adresse non renseignée";
  const headerContact = user?.contact || "Contact non renseigné";
  const headerLogo = user?.logo;

  const legalParts = [];
  if (user?.siret) legalParts.push(`SIRET : ${user.siret}`);
  if (user?.apeCode) legalParts.push(`APE : ${user.apeCode}`);
  if (user?.legalInfo) legalParts.push(user.legalInfo);
  const legalString = legalParts.join(' - ');

  const extTemp = (test as any).externalTemp;
  const concTemp = (test as any).concreteTemp;

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
                @page { size: A4; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.2; }
                .no-print { display: none; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 3px 5px; text-align: left; }
                .break-inside-avoid { page-break-inside: avoid; }
                h1 { font-size: 16px; margin-bottom: 2px; }
                h2 { font-size: 14px; margin-bottom: 2px; }
                h3 { font-size: 12px; margin-bottom: 4px; margin-top: 8px; }
                p { margin-bottom: 2px; }
              }
            </style>
          </head>
          <body class="bg-white">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-concrete-100 w-full max-w-4xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        
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

        <div className="flex-grow overflow-y-auto p-8 bg-concrete-200 flex justify-center">
           
           <div 
             id="report-content" 
             className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-xl text-black text-[11px] leading-tight relative flex flex-col"
             style={{ fontFamily: 'Arial, sans-serif' }}
           >
              {/* HEADER */}
              <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-2">
                 <div className="flex gap-4 items-center">
                    {headerLogo && (
                       <img src={headerLogo} alt="Logo" className="h-16 w-auto object-contain max-w-[120px]" />
                    )}
                    <div>
                      <h1 className="text-lg font-black uppercase tracking-wider mb-0.5">{headerName}</h1>
                      <p className="text-[10px] text-gray-600 whitespace-pre-wrap">{headerAddress}</p>
                      <p className="text-[10px] text-gray-600">{headerContact}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <h2 className="text-lg font-bold uppercase text-safety-orange">{type === 'PV' ? 'PROCÈS VERBAL' : 'RAPPORT FINAL'}</h2>
                    <p className="font-mono font-bold text-base mt-1">{test.reference}</p>
                    <p className="text-[10px] mt-1">Date édition : {reportDate}</p>
                 </div>
              </div>

              {/* INFO CHANTIER & CLIENT - COMPACT */}
              <div className="grid grid-cols-2 gap-0 border-2 border-black mb-4">
                 <div className="p-2 border-r-2 border-black">
                    <h4 className="font-bold uppercase text-[10px] text-gray-500 mb-0.5">Client / Demandeur</h4>
                    <p className="font-bold text-sm">{test.companyName}</p>
                    <p>{test.projectName}</p>
                    <div className="flex gap-4 mt-1 text-[10px]">
                      <span>MOE: {test.moe || '-'}</span>
                      <span>MOA: {test.moa || '-'}</span>
                    </div>
                 </div>
                 <div className="p-2">
                    <h4 className="font-bold uppercase text-[10px] text-gray-500 mb-0.5">Localisation Ouvrage</h4>
                    <p className="font-bold text-sm">{test.structureName}</p>
                    <p>{test.elementName}</p>
                    <p className="text-[10px] mt-1 italic">Coulage le : {new Date(test.samplingDate).toLocaleDateString()}</p>
                 </div>
              </div>

              {/* CARACTERISTIQUES BETON - COMPACT */}
              <div className="mb-4">
                 <h3 className="font-bold bg-gray-100 p-1 border border-black border-b-0 uppercase text-[10px]">Caractéristiques du Béton & Prélèvement</h3>
                 <table className="w-full border-collapse border border-black text-[10px]">
                    <tbody>
                       <tr>
                          <td className="font-bold bg-gray-50 w-1/6">Classe & Slump</td>
                          <td className="w-2/6">{test.concreteClass} - {test.consistencyClass} ({test.slump}mm)</td>
                          <td className="font-bold bg-gray-50 w-1/6">Dosage/Type</td>
                          <td className="w-2/6">{test.mixType}</td>
                       </tr>
                       <tr>
                          <td className="font-bold bg-gray-50">Fabricant</td>
                          <td>{test.manufacturer} ({test.manufacturingPlace})</td>
                          <td className="font-bold bg-gray-50">Températures</td>
                          <td>Ext: {extTemp ? extTemp + '°C' : '-'} / Béton: {concTemp ? concTemp + '°C' : '-'}</td>
                       </tr>
                       <tr>
                          <td className="font-bold bg-gray-50">Lieu Prélèv.</td>
                          <td>{test.samplingPlace}</td>
                          <td className="font-bold bg-gray-50">Volume / Livr.</td>
                          <td>{test.volume} m³ ({test.deliveryMethod})</td>
                       </tr>
                       <tr>
                          <td className="font-bold bg-gray-50">Info Formule</td>
                          <td>{test.formulaInfo}</td>
                          <td className="font-bold bg-gray-50">Serrage</td>
                          <td>{test.tightening}</td>
                       </tr>
                       <tr>
                          <td className="font-bold bg-gray-50">Conservation</td>
                          <td>{test.curing}</td>
                          <td className="font-bold bg-gray-50">Norme</td>
                          <td>{test.standard}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* RESULTATS */}
              <div className="mb-4">
                 <h3 className="font-bold bg-gray-100 p-1 border border-black border-b-0 uppercase text-[10px] flex justify-between">
                    <span>Résultats des Essais (NF EN 12390-3)</span>
                 </h3>
                 <table className="w-full border-collapse border border-black text-[10px]">
                    <thead>
                       <tr className="bg-gray-200">
                          <th className="text-center w-10">N°</th>
                          <th className="text-center w-12">Âge</th>
                          <th className="text-center w-20">Date</th>
                          <th className="text-center">Dim. (mm)</th>
                          <th className="text-right">Masse Vol. (kg/m³)</th>
                          <th className="text-right">Force (kN)</th>
                          <th className="text-right bg-gray-300 w-24">MPa</th>
                       </tr>
                    </thead>
                    <tbody>
                       {ages.map(age => {
                          const specs = groupedSpecimens[age];
                          const avgStress = specs.reduce((acc, s) => acc + (s.stress || 0), 0) / specs.length;
                          const avgDensity = specs.reduce((acc, s) => acc + (s.density || 0), 0) / specs.length;
                          
                          return (
                            <React.Fragment key={age}>
                               {specs.map((s, idx) => (
                                  <tr key={`${age}-${idx}`}>
                                     <td className="text-center font-bold">#{s.number}</td>
                                     <td className="text-center">{s.age}j</td>
                                     <td className="text-center">{new Date(s.crushingDate).toLocaleDateString()}</td>
                                     <td className="text-center">{s.diameter} x {s.height}</td>
                                     <td className="text-right text-gray-700">{s.density ? s.density.toFixed(0) : '-'}</td>
                                     <td className="text-right">{s.force || '-'}</td>
                                     <td className="text-right font-bold text-sm">
                                        {s.stress ? s.stress.toFixed(1) : '-'}
                                     </td>
                                  </tr>
                               ))}
                               <tr className="bg-gray-100 font-bold break-inside-avoid">
                                  <td colSpan={4} className="text-right uppercase text-[9px]">Moyenne {age} Jours :</td>
                                  <td className="text-right text-[10px]">{avgDensity > 0 ? avgDensity.toFixed(0) : '-'}</td>
                                  <td className="text-right bg-gray-200">-</td>
                                  <td className="text-right text-sm border-l-2 border-l-black bg-gray-300 text-black">
                                    {avgStress > 0 ? avgStress.toFixed(1) : '-'}
                                  </td>
                               </tr>
                            </React.Fragment>
                          );
                       })}
                    </tbody>
                 </table>
              </div>

              {/* OBSERVATIONS & CONCLUSION */}
              <div className="border border-black p-2 mb-4 flex-grow min-h-[80px]">
                 <h4 className="font-bold underline mb-1 text-[10px]">OBSERVATIONS & CONCLUSIONS :</h4>
                 <div className="text-[11px] space-y-1 whitespace-pre-wrap break-words">
                    {test.concreteClass && (
                      <p>Classe de résistance spécifiée : <strong>{test.concreteClass}</strong>.</p>
                    )}

                    {/* Conformité Probable 7j */}
                    {type === 'PV' && filteredSpecimens.some(s => s.age === 7 && s.stress) && (
                       (() => {
                          const specimens7d = groupedSpecimens[7];
                          if(specimens7d && specimens7d.length > 0) {
                             const avg7d = specimens7d.reduce((acc, s) => acc + (s.stress || 0), 0) / specimens7d.length;
                             const isCube = specimens7d[0].specimenType.toLowerCase().includes('cube');
                             const targetStrength = getTargetStrength(test.concreteClass, isCube);

                             if(targetStrength) {
                                const required7d = targetStrength * 0.7;
                                const percent = (avg7d / targetStrength) * 100;
                                const isConform = avg7d >= required7d;

                                return (
                                  <div className={`mt-1 border-l-2 pl-2 ${isConform ? "border-green-600" : "border-red-600"}`}>
                                    <p className={isConform ? "text-green-800" : "text-red-700"}>
                                      <strong>Conformité Probable (7j) :</strong> Résistance moyenne 7j : <strong>{avg7d.toFixed(1)} MPa</strong> ({percent.toFixed(0)}% de fc28).
                                      <br/>
                                      Seuil (70% fc28) : {required7d.toFixed(1)} MPa.
                                      <span className="block font-bold uppercase">
                                        {isConform ? "=> RÉSULTAT CONFORME AUX ATTENTES." : "=> ATTENTION : RÉSULTAT INFÉRIEUR AUX ATTENTES."}
                                      </span>
                                    </p>
                                  </div>
                                )
                             }
                          }
                          return null;
                       })()
                    )}
                    
                    {/* Conformité 28j */}
                    {type === 'RP' && filteredSpecimens.some(s => s.age === 28 && s.stress) && (
                       (() => {
                          const specimens28d = groupedSpecimens[28];
                          if(specimens28d && specimens28d.length > 0) {
                             const avg28d = specimens28d.reduce((acc, s) => acc + (s.stress || 0), 0) / specimens28d.length;
                             const isCube = specimens28d[0].specimenType.toLowerCase().includes('cube');
                             const targetStrength = getTargetStrength(test.concreteClass, isCube);

                             if(targetStrength) {
                                const isConform = avg28d >= targetStrength;

                                return (
                                  <div className={`mt-1 border-l-2 pl-2 ${isConform ? "border-green-600" : "border-red-600"}`}>
                                    <p className={isConform ? "text-green-800" : "text-red-700"}>
                                      <strong>Conformité à 28 jours :</strong> Résistance moyenne 28j : <strong>{avg28d.toFixed(1)} MPa</strong>.
                                      <br/>
                                      Résistance caractéristique requise ({test.concreteClass}) : {targetStrength} MPa.
                                      <span className="block font-bold uppercase">
                                        {isConform ? "=> BÉTON CONFORME (Résistance caractéristique atteinte)." : "=> BÉTON NON CONFORME (Résistance insuffisante)."}
                                      </span>
                                    </p>
                                  </div>
                                )
                             }
                          }
                          return null;
                       })()
                    )}
                 </div>
              </div>

              {/* SIGNATURES */}
              <div className="grid grid-cols-2 gap-12 mt-auto pt-2">
                 <div className="border-t border-black pt-1">
                    <p className="font-bold text-[10px] uppercase">Le Technicien</p>
                    <div className="h-12"></div>
                 </div>
                 <div className="border-t border-black pt-1">
                    <p className="font-bold text-[10px] uppercase">Le Responsable Technique</p>
                    <div className="h-12 flex items-center justify-center opacity-50">
                       <CheckCircle2 className="w-8 h-8 text-gray-300" />
                       <span className="ml-1 text-gray-400 text-[10px] font-mono">VALIDÉ</span>
                    </div>
                 </div>
              </div>

              {/* FOOTER */}
              <div className="absolute bottom-2 left-0 right-0 text-center px-8">
                 <div className="border-t border-gray-300 pt-1 text-[9px] text-gray-500">
                   <p>{headerName} - Document généré informatiquement le {reportDate}.</p>
                   {legalString && <p>{legalString}</p>}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};