import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Google Apps Script 설정
  googleSettings: {
    webAppUrl: {
      type: String,
      default: '',
      trim: true,
      description: '업체관리자가 배포한 Google Apps Script 웹앱 URL'
    },
    spreadsheetId: {
      type: String,
      default: '',
      trim: true,
      description: '업체의 Google Spreadsheet ID'
    },
    driveFolderId: {
      type: String,
      default: '',
      trim: true,
      description: '업체의 Google Drive 폴더 ID (공정한웍스)'
    },
    setupCompleted: {
      type: Boolean,
      default: false,
      description: 'Google 설정 완료 여부'
    },
    lastSync: {
      type: Date,
      description: '마지막 동기화 시간'
    }
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

export default mongoose.models.Company || mongoose.model('Company', companySchema);
