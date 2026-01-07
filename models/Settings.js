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
  mixTypes: [{ type: String, trim: true }],           // ex: C25/30 XF1
  concreteClasses: [{ type: String, trim: true }],    // ex: S3, S4
  nfStandards: [{ type: String, trim: true }]         // ex: NF EN 206/CN
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;