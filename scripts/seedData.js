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
  fieldOptions: {
    type: Map,
    of: [String],
    default: new Map()
  },
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

    // 1. 샘플 업체 생성
    const company = await Company.create({
      name: '샘플공사업체',
      description: '도배, 타일, 인테리어 전문 시공업체',
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

    // // 2. 슈퍼바이저 생성
    // const supervisor = await User.create({
    //   username: 'super',
    //   password: 'super123',
    //   name: '최고관리자',
    //   role: 'supervisor'
    // });
    // console.log('✅ 슈퍼바이저 생성 완료:', supervisor.username);

    // 3. 업체 관리자 생성
    const companyAdmin = await User.create({
      username: 'manager1',
      password: 'manager123',
      name: '김관리',
      role: 'company_admin',
      companyId: company._id
    });
    console.log('✅ 업체관리자 생성 완료:', companyAdmin.username);

    // 4. 직원 생성 (insertMany는 pre('save') 훅을 트리거하지 않으므로 create로 생성하여 비밀번호 해싱이 되도록 함)
    const employeesData = [
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
    ];

    const employees = [];
    for (const u of employeesData) {
      const created = await User.create(u);
      employees.push(created);
    }
    console.log('✅ 직원 생성 완료:', employees.length + '명');

    // 5. 샘플 현장 데이터 생성
    const sites = await Site.insertMany([
      {
        companyId: company._id,
        siteName: '힐스테이트 광교',
        projectName: '광교 신축 아파트 1단지',
        workTypeCode: 'WP01',
        workTypeName: '도배',
        constructionStage: '진행중'
      },
      {
        companyId: company._id,
        siteName: '자이 용인',
        projectName: '용인 플랫폼시티 자이',
        workTypeCode: 'WP02',
        workTypeName: '타일',
        constructionStage: '진행중'
      },
      {
        companyId: company._id,
        siteName: '롯데캐슬 판교',
        projectName: '판교 테크노밸리 롯데캐슬',
        workTypeCode: 'WP03',
        workTypeName: '석고보드',
        constructionStage: '완료'
      },
      {
        companyId: company._id,
        siteName: '센트럴 파크 수원',
        projectName: '수원 센트럴파크 푸르지오',
        workTypeCode: 'WP01',
        workTypeName: '도배',
        constructionStage: '시작전'
      }
    ]);
    console.log('✅ 현장 생성 완료:', sites.length + '개');

    // 6. 샘플 입력양식 생성
    const forms = await Form.insertMany([
      {
        companyId: company._id,
        formName: 'DL연간단가',
        fields: ['현장명', '일자', '공종코드', '물량', '공사단계'],
        fieldOptions: new Map([
          ['현장명', ['양주신도시', '옥정더퍼스트', '옥정메트로포레', '옥정리더스가든']],
          ['공종코드', ['1', '2', '3', '4', '5']],
          ['공사단계', ['전', '중', '후']]
        ])
      },
      {
        companyId: company._id,
        formName: '품의건',
        fields: ['공사현장', '일자', '위치', '공종명', '물량', '공사단계'],
        fieldOptions: new Map([
          ['공사현장', ['양주신도시', '옥정더퍼스트', '옥정메트로포레']],
          ['공종명', ['도배', '타일', '석고보드', '인테리어']],
          ['공사단계', ['전', '중', '후']]
        ])
      },
      {
        companyId: company._id,
        formName: '일일작업보고서',
        fields: ['현장명', '일자', '작업위치', '공종', '작업내용', '작업자', '작업시간', '진행상황'],
        fieldOptions: new Map([
          ['현장명', ['힐스테이트 광교', '자이 용인', '롯데캐슬 판교', '센트럴 파크 수원']],
          ['공종', ['도배', '타일', '석고보드']],
          ['진행상황', ['시작', '진행중', '완료']]
        ])
      }
    ]);
    console.log('✅ 입력양식 생성 완료:', forms.length + '개');

    // 7. 유사키 매핑 생성
    const keyMappings = await KeyMapping.insertMany([
      {
        companyId: company._id,
        masterKey: '현장명',
        similarKeys: ['공사명', '현장명', '프로젝트명', '사이트']
      },
      {
        companyId: company._id,
        masterKey: '일자',
        similarKeys: ['작업일', '날짜', '일자', 'date']
      },
      {
        companyId: company._id,
        masterKey: '위치',
        similarKeys: ['동호수', '작업위치', '층', '위치']
      },
      {
        companyId: company._id,
        masterKey: '공종',
        similarKeys: ['공종코드', '공종명', '작업종류', 'worktype']
      },
      {
        companyId: company._id,
        masterKey: '수량',
        similarKeys: ['물량', '수량', 'qty', 'quantity']
      },
      {
        companyId: company._id,
        masterKey: '작업자',
        similarKeys: ['담당자', '작성자', '시공자', 'worker']
      },
      {
        companyId: company._id,
        masterKey: '작업내용',
        similarKeys: ['내용', '비고', '설명', 'description']
      }
    ]);
    console.log('✅ 유사키 매핑 생성 완료:', keyMappings.length + '개');

    console.log('\n========================================');
    console.log('🎉 샘플 데이터 삽입 완료!');
    console.log('========================================');
    console.log('\n📋 생성된 데이터:');
    console.log('  - 업체: 샘플공사업체');
    console.log('  - 현장: 4개 (힐스테이트 광교, 자이 용인, 롯데캐슬 판교, 센트럴파크 수원)');
    console.log('  - 입력양식: 3개 (일일작업보고서, 자재발주서, 하자보수내역)');
    console.log('  - 유사키: 7개');
    console.log('\n🔑 로그인 정보:');
    console.log('1. 슈퍼바이저: super / super123');
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
