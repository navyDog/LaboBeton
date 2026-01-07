import mongoose from 'mongoose';

const specimenSchema = new mongoose.Schema({
  number: { type: Number },           // Numéro séquentiel dans la série (1, 2, 3...)
  reference: { type: String },        // Référence unique (ex: 2024-B-001-01)
  
  // Planification
  age: { type: Number, required: true }, // Age en jours (7, 28...)
  castingDate: { type: Date },           // Date de prélèvement
  crushingDate: { type: Date },          // Date d'écrasement prévue
  
  // Géométrie
  specimenType: { type: String },     // Cylindrique, Cubique...
  diameter: { type: Number },         // mm (ou côté pour cube)
  height: { type: Number },           // mm
  surface: { type: Number },          // mm2 (Calculé)

  // Résultats (Béton Durci - rempli plus tard)
  weight: { type: Number, default: null }, // g
  force: { type: Number, default: null },  // kN
  stress: { type: Number, default: null }, // MPa (Calculé)
  density: { type: Number, default: null } // kg/m3 (Calculé)
});

const concreteTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Modification : On retire unique: true global pour le gérer via un index composé (userId + reference)
  reference: { type: String }, 
  sequenceNumber: { type: Number },
  year: { type: Number },

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String },
  companyName: { type: String },

  structureName: { type: String, trim: true },
  elementName: { type: String, trim: true },

  receptionDate: { type: Date, default: Date.now },
  samplingDate: { type: Date, default: Date.now },
  volume: { type: Number },

  concreteClass: { type: String },
  consistencyClass: { type: String }, 
  
  mixType: { type: String },
  formulaInfo: { type: String },
  manufacturer: { type: String },
  manufacturingPlace: { type: String },
  deliveryMethod: { type: String },

  slump: { type: Number },
  samplingPlace: { type: String },
  
  // Info globale pour la méthode de confection
  specimenCount: { type: Number, default: 0 }, 
  
  tightening: { type: String },
  vibrationTime: { type: Number },
  layers: { type: Number },
  curing: { type: String },

  testType: { type: String },
  standard: { type: String },
  preparation: { type: String },
  pressMachine: { type: String },

  // Liste détaillée des éprouvettes
  specimens: [specimenSchema]

}, { timestamps: true });

// Index composé pour s'assurer que la référence est unique PAR UTILISATEUR, et non globalement
// Cela permet à 'labo' d'avoir 2025-B-0001 et à 'nouveau_compte' d'avoir aussi 2025-B-0001
concreteTestSchema.index({ userId: 1, reference: 1 }, { unique: true });

concreteTestSchema.pre('save', async function(next) {
  // 1. Génération de référence si nouveau
  if (this.isNew) {
    const currentYear = new Date().getFullYear();
    this.year = currentYear;

    const lastTest = await mongoose.model('ConcreteTest').findOne({
      userId: this.userId,
      year: currentYear
    }).sort({ sequenceNumber: -1 });

    const nextSeq = lastTest ? lastTest.sequenceNumber + 1 : 1;
    this.sequenceNumber = nextSeq;
    
    const seqString = nextSeq.toString().padStart(4, '0');
    this.reference = `${currentYear}-B-${seqString}`;
  }

  // 2. Calcul automatique de la consistance basé sur le Slump (NF EN 206)
  if (this.slump !== undefined) {
    if (this.slump < 10) this.consistencyClass = 'Indétérminé';
    else if (this.slump <= 40) this.consistencyClass = 'S1';
    else if (this.slump <= 90) this.consistencyClass = 'S2';
    else if (this.slump <= 150) this.consistencyClass = 'S3';
    else if (this.slump <= 210) this.consistencyClass = 'S4';
    else this.consistencyClass = 'S5';
  }

  // 3. Calculs Scientifiques pour chaque éprouvette (Surface, Contrainte, Densité)
  if (this.specimens && this.specimens.length > 0) {
    this.specimenCount = this.specimens.length;
    
    this.specimens.forEach(s => {
      // A. Recalcul Surface (au cas où diamètre change)
      // Si type contient 'cube' ou dimensions carrées, Surface = Coté * Coté
      const isCube = s.specimenType && (s.specimenType.toLowerCase().includes('cube') || s.specimenType.toLowerCase().includes('prisme'));
      if (isCube) {
        s.surface = s.diameter * s.diameter; 
      } else {
        // Cylindre: PI * r²
        s.surface = Math.PI * Math.pow(s.diameter / 2, 2);
      }
      
      // B. Calcul Contrainte (MPa) = Force (N) / Surface (mm²)
      // Force stockée en kN, donc * 1000
      if (s.force !== null && s.force !== undefined && s.surface > 0) {
        s.stress = (s.force * 1000) / s.surface;
      } else {
        s.stress = null;
      }

      // C. Calcul Masse Volumique (kg/m³) = Masse (kg) / Volume (m³)
      // Masse en g, Dimensions en mm.
      // Formule simplifiée : (Masse_g / (Surface_mm2 * Hauteur_mm)) * 1,000,000
      if (s.weight !== null && s.weight !== undefined && s.height > 0 && s.surface > 0) {
        const volumeMm3 = s.surface * s.height;
        s.density = (s.weight / volumeMm3) * 1000000;
      } else {
        s.density = null;
      }
    });
  }

  next();
});

const ConcreteTest = mongoose.model('ConcreteTest', concreteTestSchema);

export default ConcreteTest;