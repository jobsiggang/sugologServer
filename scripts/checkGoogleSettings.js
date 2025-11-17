/**
 * Google 설정 확인 스크립트
 * DB에 저장된 Google 설정을 확인합니다
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

const companySchema = new mongoose.Schema({
  name: String,
  description: String,
  googleSettings: {
    webAppUrl: String,
    spreadsheetId: String,
    driveFolderId: String,
    setupCompleted: { type: Boolean, default: false },
    lastSync: Date
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', companySchema);

const checkSettings = async () => {
  try {
    const companies = await Company.find({});
    
    console.log('\n========================================');
    console.log('📊 업체별 Google 설정 현황');
    console.log('========================================\n');

    if (companies.length === 0) {
      console.log('⚠️  등록된 업체가 없습니다.');
    }

    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log('   ID:', company._id);
      console.log('   Google 설정:');
      console.log('   - 웹앱 URL:', company.googleSettings.webAppUrl || '(없음)');
      console.log('   - 스프레드시트 ID:', company.googleSettings.spreadsheetId || '(없음)');
      console.log('   - 드라이브 폴더 ID:', company.googleSettings.driveFolderId || '(없음)');
      console.log('   - 설정 완료:', company.googleSettings.setupCompleted ? '✅' : '❌');
      console.log('   - 마지막 동기화:', company.googleSettings.lastSync || '(없음)');
    });

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ 조회 실패:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
};

// 스크립트 실행
connectDB().then(() => checkSettings());
