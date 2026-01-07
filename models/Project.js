import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  companyName: {
    type: String, // Stocké pour éviter des requêtes complexes, mis à jour si l'entreprise change
    trim: true,
    default: ''
  },
  name: {
    type: String, // Nom de l'affaire
    required: true,
    trim: true
  },
  contactName: {
    type: String, // Contact principal de l'affaire
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
  },
  moa: {
    type: String, // Maître d'ouvrage
    trim: true
  },
  moe: {
    type: String, // Maître d'oeuvre
    trim: true
  }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;