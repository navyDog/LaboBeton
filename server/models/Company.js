import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Un utilisateur ne peut pas créer deux fois la même entreprise (optionnel, mais pratique)
companySchema.index({ userId: 1, name: 1 }, { unique: true });

const Company = mongoose.model('Company', companySchema);

export default Company;