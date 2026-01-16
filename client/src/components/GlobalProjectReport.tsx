import React from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { ConcreteTest, Project, User, Specimen } from '../types';

interface GlobalProjectReportProps {
  project: Project;
  tests: ConcreteTest[];
  user?: User;
  onClose: () => void;
}

export const GlobalProjectReport: React.FC<GlobalProjectReportProps> = ({ project, tests, user, onClose }) => {
  
  const reportDate = new Date().toLocaleDateString('fr-FR');
  const headerName = user?.companyName || "Nom du Laboratoire";
  const headerLogo = user?.logo;

  // Trier les tests par date (le plus récent en bas ou en haut ? En général chronologique pour un dossier)
  const sortedTests = [...tests].sort((a, b) => new Date(a.samplingDate).getTime() - new Date(b.samplingDate).getTime());

  const groupSpecimensByAge = (specimens: Specimen[]) => {
    const groups: Record<number, Specimen[]> = {};
    specimens.forEach(s => {
      if (!groups[s.age]) groups[s.age] = [];
      groups[s.age].push(s);
    });
    return groups;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('global-report-content');
    if (!printContent) return;
    
    const windowUrl = 'about:blank';
    const uniqueName = Date.now();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>PV Global - ${project.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { size: A4; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; font-family: 'Arial', sans-serif; font-size: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
                th { background-color: #f3f4f6; font-weight: bold; }
                h1 { font-size: 16px; font-weight: bold; }
                .break-inside-avoid { page-break-inside: avoid; }
                .test-block { border: 2px solid #000; margin-bottom: 15px; }
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
      <div className="bg-concrete-100 w-full max-w-5xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        
        <div className="bg-concrete-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-safety-orange rounded text-white">
                <FileText className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-lg">PV Global d'Affaire</h3>
               <p className="text-concrete-400 text-xs">{project.name}</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-concrete-900 rounded-lg hover:bg-concrete-200 transition-colors font-bold text-sm"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 bg-concrete-200 flex justify-center">
           <div 
             id="global-report-content" 
             className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-xl text-black text-[10px] leading-tight relative flex flex-col"
             style={{ fontFamily: 'Arial, sans-serif' }}
           >
              {/* Header Dossier */}
              <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                 <div className="flex items-center gap-4">
                    {headerLogo && <img src={headerLogo} className="h-16 object-contain max-w-[150px]" alt="logo" />}
                    <div>
                       <h1 className="text-xl font-black uppercase" data-testid="header-name">{headerName}</h1>
                       <p className="text-xs">DOSSIER RÉCAPITULATIF DES ESSAIS BÉTON</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <h2 className="text-lg font-bold uppercase text-safety-orange">PV GLOBAL</h2>
                    <p className="font-bold text-base mt-1" data-testid="project-name">{project.name}</p>
                    <p className="text-xs">Client : <strong>{project.companyName}</strong></p>
                    <p className="text-[10px] mt-1">Date édition : {reportDate}</p>
                 </div>
              </div>

              {/* LISTE DES FICHES */}
              <div className="space-y-6">
                {sortedTests.length === 0 ? (
                   <p className="text-center italic text-gray-500 py-10">Aucun prélèvement enregistré pour cette affaire.</p>
                ) : (
                   sortedTests.map((test, index) => {
                      const grouped = groupSpecimensByAge(test.specimens);
                      const ages = Object.keys(grouped).map(Number).sort((a,b) => a-b);

                      return (
                        <div key={test._id} className="test-block break-inside-avoid border-2 border-black mb-4">
                           {/* Entête Fiche */}
                           <div className="bg-gray-200 border-b border-black p-2 flex justify-between items-center">
                              <div>
                                 <span className="font-black text-sm mr-4">RÉF: {test.reference}</span>
                                 <span className="font-bold">Date : {new Date(test.samplingDate).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right font-bold uppercase">
                                 {test.structureName} <span className="font-normal text-xs normal-case">- {test.elementName}</span>
                              </div>
                           </div>

                           <div className="p-2">
                              {/* Infos Béton */}
                              <div className="grid grid-cols-4 gap-2 mb-2 text-[10px] border-b border-gray-300 pb-2">
                                 <div>
                                    <span className="block font-bold text-gray-500">Classe</span>
                                    <span>{test.concreteClass}</span>
                                 </div>
                                 <div>
                                    <span className="block font-bold text-gray-500">Consistance</span>
                                    <span>{test.consistencyClass || '-'} ({test.slump}mm)</span>
                                 </div>
                                 <div className="col-span-2">
                                    <span className="block font-bold text-gray-500">Formule / Type</span>
                                    <span className="truncate block">{test.mixType}</span>
                                 </div>
                              </div>

                              {/* Tableau Résultats */}
                              {ages.length > 0 ? (
                                <table className="w-full text-[10px]">
                                   <thead>
                                      <tr className="bg-gray-100">
                                         <th className="w-10">Âge</th>
                                         <th className="w-12">N° Ep.</th>
                                         <th className="w-20">Date Écr.</th>
                                         <th className="w-16">Masse (g)</th>
                                         <th className="w-16">Force (kN)</th>
                                         <th className="w-16">MPa</th>
                                         <th className="text-right bg-gray-200 font-bold">Moyenne MPa</th>
                                      </tr>
                                   </thead>
                                   <tbody>
                                      {ages.map(age => {
                                         const specs = grouped[age];
                                         const avg = specs.reduce((acc, s) => acc + (s.stress || 0), 0) / specs.length;
                                         
                                         return (
                                            <React.Fragment key={age}>
                                               {specs.map((s, idx) => (
                                                  <tr key={s.number} className={idx === specs.length - 1 ? "border-b border-black" : ""}>
                                                     {idx === 0 && (
                                                        <td rowSpan={specs.length} className="font-bold bg-gray-50">{age} Jours</td>
                                                     )}
                                                     <td>#{s.number}</td>
                                                     <td>{new Date(s.crushingDate).toLocaleDateString()}</td>
                                                     <td>{s.weight || '-'}</td>
                                                     <td>{s.force || '-'}</td>
                                                     <td>{s.stress ? s.stress.toFixed(1) : '-'}</td>
                                                     {idx === 0 && (
                                                        <td rowSpan={specs.length} className="text-right font-bold text-sm bg-gray-50">
                                                           {avg > 0 ? avg.toFixed(1) : '-'}
                                                        </td>
                                                     )}
                                                  </tr>
                                               ))}
                                            </React.Fragment>
                                         );
                                      })}
                                   </tbody>
                                </table>
                              ) : (
                                 <div className="text-center italic text-xs py-2 text-gray-400">Aucun résultat enregistré.</div>
                              )}
                              
                              {/* Observations si présentes */}
                              {test.formulaInfo && (
                                <div className="mt-2 text-[9px] italic text-gray-600">
                                   Note: {test.formulaInfo}
                                </div>
                              )}
                           </div>
                        </div>
                      );
                   })
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-black text-[9px] text-center text-gray-500">
                 Document généré automatiquement par LaboBéton - {headerName}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};