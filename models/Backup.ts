import mongoose from 'mongoose';

const BackupSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Backup || mongoose.model('Backup', BackupSchema);