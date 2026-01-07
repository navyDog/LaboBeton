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
  
  reference: { type: String, unique: true },
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
  // consistencyClass est supprimé en tant que champ stocké manuellement, 
  // on pourra le déduire du slump ou le stocker calculé. 
  // Ici on le garde pour le cache si besoin, mais il sera piloté par le slump.
  consistencyClass: { type: String }, 
  
  mixType: { type: String },
  formulaInfo: { type: String },
  manufacturer: { type: String },
  manufacturingPlace: { type: String },
  deliveryMethod: { type: String },

  slump: { type: Number },
  samplingPlace: { type: String },
  
  // Info globale pour la méthode de confection (reste utile pour les rapports)
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

concreteTestSchema.pre('save', async function(next) {
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

  // Calcul automatique de la consistance basé sur le Slump (NF EN 206)
  if (this.slump !== undefined) {
    if (this.slump < 10) this.consistencyClass = 'Indétérminé';
    else if (this.slump <= 40) this.consistencyClass = 'S1';
    else if (this.slump <= 90) this.consistencyClass = 'S2';
    else if (this.slump <= 150) this.consistencyClass = 'S3';
    else if (this.slump <= 210) this.consistencyClass = 'S4';
    else this.consistencyClass = 'S5';
  }

  next();
});

const ConcreteTest = mongoose.model('ConcreteTest', concreteTestSchema);

export default ConcreteTest;