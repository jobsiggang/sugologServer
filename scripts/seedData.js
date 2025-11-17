/**
 * MongoDB 초기 데이터 삽입 스크립트
 * 
 * 사용법:
 * 1. .env.local 파일에 MONGODB_URI가 설정되어 있는지 확인
 * 2. 터미널에서 실행: node scripts/seedData.js
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

// 스키마 정의 (간단 버전)
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

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  role: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const siteSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  siteName: String,
  projectName: String,
  workTypeCode: String,
  workTypeName: String,
  constructionStage: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const formSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  formName: String,
  fields: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const keyMappingSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  masterKey: String,
  similarKeys: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// 비밀번호 해싱 추가
const bcrypt = require('bcryptjs');
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);
const Site = mongoose.model('Site', siteSchema);
const Form = mongoose.model('Form', formSchema);
const KeyMapping = mongoose.model('KeyMapping', keyMappingSchema);

// 초기 데이터 삽입
const seedData = async () => {
  try {
    // 기존 데이터 삭제
    await Company.deleteMany({});
    await User.deleteMany({});
    await Site.deleteMany({});
    await Form.deleteMany({});
    await KeyMapping.deleteMany({});
    console.log('🗑️  기존 데이터 삭제 완료');

    // 1. 업체 생성
    const company = await Company.create({
      name: 'DL건설',
      description: '도배, 타일 전문 업체',
      googleSettings: {
        webAppUrl: 'https://script.google.com/macros/s/AKfycby67JCQ4vhX1D1FWd2E0qGTpzJcKmqsTrXw-RIpXZRddRQ7_ww6m99oc2R_zCc8M5B9/exec',
        spreadsheetId: '12pF-9Y8c_CYw2GxzkIVn7Yyyyx3mmMGdpdVuL4M8N3k',
        driveFolderId: '',
        setupCompleted: true,
        lastSync: new Date()
      }
    });
    console.log('✅ 업체 생성 완료:', company.name);
    console.log('✅ Google Apps Script 웹앱 URL 설정 완료');
    console.log('✅ Google Spreadsheet ID 설정 완료');

    // 2. 슈퍼바이저 생성
    const supervisor = await User.create({
      username: 'admin',
      password: 'admin123',
      name: '슈퍼바이저',
      role: 'supervisor'
    });
    console.log('✅ 슈퍼바이저 생성 완료:', supervisor.username);

    // 3. 업체 관리자 생성
    const companyAdmin = await User.create({
      username: 'manager1',
      password: 'manager123',
      name: '김관리',
      role: 'company_admin',
      companyId: company._id
    });
    console.log('✅ 업체관리자 생성 완료:', companyAdmin.username);

    // 4. 직원 생성
    const employees = await User.insertMany([
      {
        username: 'worker1',
        password: 'worker123',
        name: '이직원',
        role: 'employee',
        companyId: company._id
      },
      {
        username: 'worker2',
        password: 'worker123',
        name: '박직원',
        role: 'employee',
        companyId: company._id
      }
    ]);
    console.log('✅ 직원 생성 완료:', employees.length + '명');

    // 5. 현장 데이터 생성
    const sites = await Site.insertMany([
      {
        companyId: company._id,
        siteName: '양주신도시',
        projectName: '용인 서천',
        workTypeCode: '1',
        workTypeName: '발포',
        constructionStage: '전'
      },
      {
        companyId: company._id,
        siteName: '옥정더퍼스트',
        projectName: '고촌 센트럴자이',
        workTypeCode: '2',
        workTypeName: '석고',
        constructionStage: '중'
      },
      {
        companyId: company._id,
        siteName: '옥정메트로포레',
        projectName: '포스코 덕암',
        workTypeCode: '3',
        workTypeName: '도배',
        constructionStage: '후'
      }
    ]);
    console.log('✅ 현장 생성 완료:', sites.length + '개');

    // 6. 입력양식 생성
    const forms = await Form.insertMany([
      {
        companyId: company._id,
        formName: 'DL연간단가',
        fields: ['현장명', '일자', '위치', '공종코드', '물량', '공사단계']
      },
      {
        companyId: company._id,
        formName: '품의건',
        fields: ['공사명', '일자', '위치', '공종명', '공사단계']
      }
    ]);
    console.log('✅ 입력양식 생성 완료:', forms.length + '개');

    // 7. 유사키 매핑 생성
    const keyMappings = await KeyMapping.insertMany([
      {
        companyId: company._id,
        masterKey: '현장명',
        similarKeys: ['공사명', '현장명']
      },
      {
        companyId: company._id,
        masterKey: '일자',
        similarKeys: ['작업일', '날짜']
      },
      {
        companyId: company._id,
        masterKey: '위치',
        similarKeys: ['동호수']
      },
      {
        companyId: company._id,
        masterKey: '공종코드',
        similarKeys: ['공종명']
      },
      {
        companyId: company._id,
        masterKey: '물량',
        similarKeys: ['수량']
      },
      {
        companyId: company._id,
        masterKey: '공사단계',
        similarKeys: ['단계']
      }
    ]);
    console.log('✅ 유사키 매핑 생성 완료:', keyMappings.length + '개');

    console.log('\n========================================');
    console.log('🎉 초기 데이터 삽입 완료!');
    console.log('========================================');
    console.log('\n로그인 정보:');
    console.log('1. 슈퍼바이저: admin / admin123');
    console.log('2. 업체관리자: manager1 / manager123');
    console.log('3. 직원1: worker1 / worker123');
    console.log('4. 직원2: worker2 / worker123');
    console.log('\n⚠️  다음 단계:');
    console.log('1. manager1로 로그인');
    console.log('2. 관리자 대시보드 → Google 설정 탭');
    console.log('3. Google Apps Script 웹앱 URL 등록');
    console.log('4. 설정 가이드: /docs/google-setup-guide.md');
    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ 데이터 삽입 실패:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
};

// 스크립트 실행
connectDB().then(() => seedData());
