import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  siteName: {
    type: String,
    required: true,
    trim: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  workTypeCode: {
    type: String,
    required: true,
    trim: true
  },
  workTypeName: {
    type: String,
    required: true,
    trim: true
  },
  constructionStage: {
    type: String,
    enum: ['전', '중', '후', ''],
    default: ''
  },
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
siteSchema.index({ companyId: 1, siteName: 1 });

export default mongoose.models.Site || mongoose.model('Site', siteSchema);
