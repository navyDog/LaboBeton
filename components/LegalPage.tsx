import React from 'react';
import { ArrowLeft, Shield, Scale, Lock } from 'lucide-react';

interface LegalPageProps {
  type: 'cgu' | 'privacy' | 'mentions';
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  
  const renderContent = () => {
    switch (type) {
      case 'cgu':
        return (
          <div className="space-y-6 text-sm text-concrete-700">
            <h2 className="text-xl font-bold text-concrete-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-safety-orange" /> Conditions Générales d'Utilisation (CGU)
            </h2>
            
            <section>
              <h3 className="font-bold text-concrete-900 mb-2">1. Objet</h3>
              <p>Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services de l'application LaboBéton, outil de gestion pour laboratoires d'essais béton.</p>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">2. Responsabilité & Avertissement Technique</h3>
              <p className="bg-orange-50 p-3 rounded border-l-4 border-safety-orange text-orange-900 font-medium">
                LaboBéton est un logiciel d'aide à la saisie et au calcul. Bien que nous nous efforcions d'assurer l'exactitude des calculs (conformément aux normes NF EN 12390), l'utilisateur reconnaît que l'utilisation de l'application ne se substitue pas à son expertise technique.
                L'éditeur ne saurait être tenu responsable des conséquences d'une erreur de saisie, d'un bug logiciel ou d'une mauvaise interprétation des résultats ayant entraîné des désordres sur un ouvrage.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">3. Accès au service</h3>
              <p>Le service est accessible 24h/24, 7j/7, sauf cas de force majeure ou maintenance. En version Alpha/Bêta, des interruptions peuvent survenir sans préavis.</p>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">4. Propriété Intellectuelle</h3>
              <p>La structure générale de l'application LaboBéton, ainsi que les textes, graphiques et images la composant, sont la propriété de l'éditeur.</p>
            </section>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="space-y-6 text-sm text-concrete-700">
            <h2 className="text-xl font-bold text-concrete-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> Politique de Confidentialité
            </h2>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">1. Collecte des données</h3>
              <p>Nous collectons les données suivantes pour le bon fonctionnement du service :</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Informations de compte (Nom, Email, Société).</li>
                <li>Données techniques des chantiers et essais.</li>
                <li>Logs de connexion pour la sécurité.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">2. Utilisation des données</h3>
              <p>Les données saisies (clients, chantiers, résultats) restent la propriété exclusive de l'utilisateur abonné. LaboBéton n'exploite pas ces données à des fins commerciales tierces.</p>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">3. Sécurité</h3>
              <p>Les mots de passe sont chiffrés (hashés). Les échanges sont sécurisés par protocole HTTPS/TLS. Nous effectuons des sauvegardes régulières.</p>
            </section>
          </div>
        );

      case 'mentions':
        return (
          <div className="space-y-6 text-sm text-concrete-700">
            <h2 className="text-xl font-bold text-concrete-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-concrete-500" /> Mentions Légales
            </h2>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">1. Éditeur</h3>
              <p>
                <strong>Nom de la structure :</strong> LaboBéton Solutions<br/>
                <strong>Forme juridique :</strong> SAS au capital de 10 000 € (Exemple)<br/>
                <strong>Siège social :</strong> 123 Avenue du BTP, 75000 Paris<br/>
                <strong>RCS :</strong> 123 456 789 Paris
              </p>
            </section>

            <section>
              <h3 className="font-bold text-concrete-900 mb-2">2. Hébergement</h3>
              <p>
                Ce site est hébergé sur une infrastructure Cloud (ex: Google Cloud Platform / AWS).<br/>
                Localisation des données : Europe (Sauf mention contraire).
              </p>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-concrete-200 rounded-lg text-concrete-600 hover:text-concrete-900 hover:bg-concrete-50 transition-colors shadow-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </button>
      </div>

      <div className="bg-white rounded-xl border border-concrete-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
        <div className="p-8 md:p-12">
          {renderContent()}
        </div>
        <div className="bg-concrete-50 p-6 text-center border-t border-concrete-100">
          <p className="text-xs text-concrete-400">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
};