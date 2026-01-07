import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  },
  status: {
    type: String,
    enum: ['En cours', 'Terminé', 'Archivé'],
    default: 'En cours'
  }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;