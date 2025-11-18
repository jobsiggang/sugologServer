import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false
  },
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: false
  },
  siteName: {
    type: String,
    required: true
  },
  formName: {
    type: String,
    required: true
  },
  data: {
    type: Map,
    of: String
  },
  photoUrl: {
    type: String,
    required: false
  },
  imageUrls: {
    type: [String],
    default: []
  },
  imageCount: {
    type: Number,
    default: 0
  },
  googleSheetRowId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'uploaded', 'failed', 'completed'],
    default: 'uploaded'
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

// 인덱스 설정
uploadSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
uploadSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.Upload || mongoose.model('Upload', uploadSchema);
