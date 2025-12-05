import { option } from 'framer-motion/client';
import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
    
  },
  formName: {
    type: String,
    required: true,
    trim: true
  },
  // fields: [{ type: String, required: true }],
  // 필드명, 형식(일반, 날짜, 숫자 등) 포함 객체 배열로 변경
  fields: [{
    name: { type: String, required: true },
    options:[{ type: String }],
    type: { type: String, enum: ['text', 'date', 'number'], default: 'text' }
  }],
  // 표 설정 추가
  boardPosition: {
    type: String,
    enum: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    default: 'bottomLeft'
  },
  boardSize: {
    type: String,
    enum: ['100%', '120%', '150%'],
    default: '100%'
  },
  boardBackground: {
    type: String,
    enum: ['white', 'black'],
    default: 'white'
  },
  boardFont: {
    type: String,
    enum: ['System','Malgun Gothic'],
    default: 'System'
  },
  // 합성사진 해상도 설정 (가로*세로)
  resolution: {
    type: { width: Number, height: Number },
    default: { width: 1024, height: 768 },
    enum: [
      { width: 1024, height: 768 },
      { width: 1280, height: 960 },
      { width: 1600, height: 1200 }
    ]
  },

  // 파일 저장 폴더 구조 (예: ["일자", "현장명", "위치", "공종"])
  folderStructure: [{
    type: String
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
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Map을 일반 객체로 변환
      if (ret.fieldOptions instanceof Map) {
        ret.fieldOptions = Object.fromEntries(ret.fieldOptions);
      }
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      // Map을 일반 객체로 변환
      if (ret.fieldOptions instanceof Map) {
        ret.fieldOptions = Object.fromEntries(ret.fieldOptions);
      }
      return ret;
    }
  }
});

// 회사+팀+폼명 복합 유니크 인덱스 (같은 회사 내 다른 팀에서 동일 폼명 허용)
formSchema.index({ companyId: 1, teamId: 1, formName: 1 }, { unique: true });

export default mongoose.models.Form || mongoose.model('Form', formSchema);
