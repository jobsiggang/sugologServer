import mongoose from 'mongoose';

const keyMappingSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  masterKey: {
    type: String,
    required: true,
    trim: true
  },
  similarKeys: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 복합 인덱스 생성
keyMappingSchema.index({ companyId: 1, masterKey: 1 });

export default mongoose.models.KeyMapping || mongoose.model('KeyMapping', keyMappingSchema);
