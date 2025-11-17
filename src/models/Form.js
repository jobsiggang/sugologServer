import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  formName: {
    type: String,
    required: true,
    trim: true
  },
  fields: [{
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
formSchema.index({ companyId: 1, formName: 1 });

export default mongoose.models.Form || mongoose.model('Form', formSchema);
