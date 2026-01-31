import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specimenTypes: [{ type: String, trim: true }],      // ex: Cylindrique 16x32
  deliveryMethods: [{ type: String, trim: true }],    // ex: Toupie, Benne
  manufacturingPlaces: [{ type: String, trim: true }], // ex: Centrale BPE, Sur site
  
  // Composition du béton (Recette)
  mixTypes: [{ type: String, trim: true }],           // ex: Dosage 350kg CEM II, B25 Granulat 20mm
  
  // Caractéristiques normatives
  concreteClasses: [{ type: String, trim: true }],    // Classes de résistance: C25/30, C30/37
  consistencyClasses: [{ type: String, trim: true }], // Classes de consistance: S1, S2, S3...
  
  // Nouveaux champs pour menus déroulants
  curingMethods: [{ type: String, trim: true }],      // ex: Eau 20°C, Salle Humide
  testTypes: [{ type: String, trim: true }],          // ex: Compression, Fendage
  preparations: [{ type: String, trim: true }],       // ex: Surfaçage Soufre, Rectification
  tighteningMethods: [{ type: String, trim: true }], // ex: Piquage, Vibration
  manufacturers: [{ type: String, trim: true }],     // ex: Lafarge, Cemex

  nfStandards: [{ type: String, trim: true }]         // ex: NF EN 206/CN
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;