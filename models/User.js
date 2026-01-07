import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    minlength: 3 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'standard'], 
    default: 'standard' 
  },
  // Nouveaux champs pour les clients/entreprises
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contact: {
    type: String,
    trim: true,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;