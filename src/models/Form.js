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
  // 항목별 옵션 리스트 (예: { "현장명": ["양주신도시", "옥정더퍼스트"], "공종코드": ["1", "2", "3"] })
  fieldOptions: {
    type: Map,
    of: [String],
    default: new Map()
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

// 복합 인덱스 생성
formSchema.index({ companyId: 1, formName: 1 });

export default mongoose.models.Form || mongoose.model('Form', formSchema);
