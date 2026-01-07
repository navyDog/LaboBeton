import mongoose from 'mongoose';

const concreteTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Numérotation Auto : 2024-B-0001
  reference: { type: String, unique: true },
  sequenceNumber: { type: Number }, // Pour faciliter le tri et la génération
  year: { type: Number },

  // Relation Affaire / Chantier Global
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String }, // Cache pour affichage
  companyName: { type: String }, // Cache pour affichage

  // Identification Ouvrage
  structureName: { type: String, trim: true },       // Nom de l'ouvrage (ex: Bâtiment A)
  elementName: { type: String, trim: true },         // Partie d'ouvrage (ex: Dalle Niv 1)

  // Dates et Volumes
  receptionDate: { type: Date, default: Date.now },
  samplingDate: { type: Date, default: Date.now },
  volume: { type: Number }, // vBeton (m3)

  // Caractéristiques Béton
  concreteClass: { type: String },      // Classe de Résistance (C25/30)
  consistencyClass: { type: String },   // Classe de Consistance (S3, S4...)
  mixType: { type: String },            // Composition / Recette
  formulaInfo: { type: String },        // Complément
  manufacturer: { type: String },       // fabricantBeton
  manufacturingPlace: { type: String }, // lieuFabrication (Centrale, Site)
  deliveryMethod: { type: String },     // modeLivraison (Toupie...)

  // Données Prélèvement (Frais)
  slump: { type: Number },              // Affaissement Mesuré (mm)
  samplingPlace: { type: String },      // lieuPrelevement
  specimenType: { type: String },       // tEprouvette (Cylindrique 16x32)
  specimenCount: { type: Number, default: 3 }, 
  
  // Mise en oeuvre Éprouvettes
  tightening: { type: String },         // serrage (Piquage, Vibration)
  vibrationTime: { type: Number },      // tVibration (secondes)
  layers: { type: Number },             // couches (nbr)
  curing: { type: String },             // conservation (Eau 20°C...)

  // Paramètres Essai (Durci/Labo)
  testType: { type: String },           // typeEssai (Compression...)
  standard: { type: String },           // norme (NF EN 12390-3...)
  preparation: { type: String },        // preparation (Surfaçage soufre...)
  pressMachine: { type: String },       // presse utilisée

}, { timestamps: true });

// Middleware pour générer le numéro avant sauvegarde
concreteTestSchema.pre('save', async function(next) {
  if (!this.isNew) return next();

  const currentYear = new Date().getFullYear();
  this.year = currentYear;

  // Trouver le dernier numéro de l'année en cours pour cet utilisateur
  const lastTest = await mongoose.model('ConcreteTest').findOne({
    userId: this.userId,
    year: currentYear
  }).sort({ sequenceNumber: -1 });

  const nextSeq = lastTest ? lastTest.sequenceNumber + 1 : 1;
  this.sequenceNumber = nextSeq;
  
  // Format: 2024-B-0001
  const seqString = nextSeq.toString().padStart(4, '0');
  this.reference = `${currentYear}-B-${seqString}`;

  next();
});

const ConcreteTest = mongoose.model('ConcreteTest', concreteTestSchema);

export default ConcreteTest;