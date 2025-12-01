// src/models/Team.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  adminId: { // 팀 책임자(관리자) User _id
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
googleSettings: {
    webAppUrl: { type: String, default: '' },
    setupCompleted: { type: Boolean, default: false },
    lastSync: { type: Date }
}
},{
  timestamps: true // 🟢 [수정] createdAt, updatedAt 자동 생성 옵션 사용
});

// 회사별로 팀명 유니크 인덱스
teamSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.models.Team || mongoose.model('Team', teamSchema);