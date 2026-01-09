import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['bug', 'feature', 'other'],
    default: 'bug'
  },
  description: { 
    type: String, 
    required: true 
  },
  user: { 
    type: String, // Nom d'utilisateur ou ID
    required: true 
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

const BugReport = mongoose.model('BugReport', bugReportSchema);

export default BugReport;