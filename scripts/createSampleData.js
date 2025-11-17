/**
 * 샘플 데이터 생성 스크립트
 * 
 * 사용법:
 * 1. 먼저 데이터베이스 초기화: node scripts/clearDatabase.js
 * 2. 샘플 데이터 생성: node scripts/createSampleData.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// 모델 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['supervisor', 'company_admin', 'employee'], required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  googleSettings: {
    webAppUrl: { type: String, default: '' },
    spreadsheetId: { type: String, default: '' },
    driveFolderId: { type: String, default: '' },
    setupCompleted: { type: Boolean, default: false },
    lastSync: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const formSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  formName: { type: String, required: true },
  fields: [{ type: String }],
  fieldOptions: { type: Map, of: [String] },
  folderStructure: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);
const Form = mongoose.model('Form', formSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

const createSampleData = async () => {
  try {
    await connectDB();

    console.log('📝 샘플 데이터 생성 시작...\n');

    // 1. 슈퍼바이저 생성
    console.log('1️⃣  슈퍼바이저 생성 중...');
    const hashedSuperPassword = await bcrypt.hash('super1234', 10);
    const supervisor = await User.create({
      username: 'super',
      password: hashedSuperPassword,
      role: 'supervisor',
      name: '슈퍼바이저',
      isActive: true
    });
    console.log(`   ✅ 슈퍼바이저 생성 완료: ${supervisor.username} (${supervisor.name})`);

    // 2. 업체 생성
    console.log('\n2️⃣  업체 생성 중...');
    const companies = await Company.create([
      {
        name: 'DL건설',
        supervisorId: supervisor._id,
        isActive: true
      },
      {
        name: '삼성물산',
        supervisorId: supervisor._id,
        isActive: true
      }
    ]);
    console.log(`   ✅ ${companies.length}개 업체 생성 완료`);
    companies.forEach(c => console.log(`      - ${c.name}`));

    // 3. 업체 관리자 및 직원 생성
    console.log('\n3️⃣  직원 생성 중...');
    const hashedAdminPassword = await bcrypt.hash('admin1234', 10);
    const hashedEmpPassword = await bcrypt.hash('emp1234', 10);

    // DL건설 직원
    const dlAdmin = await User.create({
      username: 'dl_admin',
      password: hashedAdminPassword,
      role: 'company_admin',
      companyId: companies[0]._id,
      name: '김관리',
      isActive: true
    });

    const dlEmployees = await User.create([
      {
        username: 'kim_worker',
        password: hashedEmpPassword,
        role: 'employee',
        companyId: companies[0]._id,
        name: '김철수',
        isActive: true
      },
      {
        username: 'lee_worker',
        password: hashedEmpPassword,
        role: 'employee',
        companyId: companies[0]._id,
        name: '이영희',
        isActive: true
      },
      {
        username: 'park_worker',
        password: hashedEmpPassword,
        role: 'employee',
        companyId: companies[0]._id,
        name: '박민수',
        isActive: false  // 비활성화된 직원
      }
    ]);

    // 삼성물산 직원
    const samsungAdmin = await User.create({
      username: 'samsung_admin',
      password: hashedAdminPassword,
      role: 'company_admin',
      companyId: companies[1]._id,
      name: '이관리',
      isActive: true
    });

    const samsungEmployees = await User.create([
      {
        username: 'choi_worker',
        password: hashedEmpPassword,
        role: 'employee',
        companyId: companies[1]._id,
        name: '최지훈',
        isActive: true
      },
      {
        username: 'jung_worker',
        password: hashedEmpPassword,
        role: 'employee',
        companyId: companies[1]._id,
        name: '정수진',
        isActive: true
      }
    ]);

    console.log(`   ✅ DL건설: 관리자 1명, 직원 3명 (활성 2명, 비활성 1명)`);
    console.log(`   ✅ 삼성물산: 관리자 1명, 직원 2명`);

    // 4. 입력양식 생성
    console.log('\n4️⃣  입력양식 생성 중...');
    
    // DL건설 양식
    const dlForms = await Form.create([
      {
        companyId: companies[0]._id,
        formName: 'DL연간단가',
        fields: ['일자', '현장명', '위치', '공종', '물량', '단가'],
        fieldOptions: new Map([
          ['현장명', ['양주신도시', '옥정더퍼스트', '옥정메트로포레']],
          ['위치', ['A동', 'B동', 'C동']],
          ['공종', ['타일', '목공', '철근', '콘크리트']]
        ]),
        folderStructure: ['일자', '현장명', '위치', '공종'],
        isActive: true
      },
      {
        companyId: companies[0]._id,
        formName: '안전점검',
        fields: ['일자', '현장명', '점검자', '점검항목', '상태'],
        fieldOptions: new Map([
          ['현장명', ['양주신도시', '옥정더퍼스트']],
          ['점검항목', ['안전모', '안전화', '안전벨트', '비계']],
          ['상태', ['양호', '보통', '불량']]
        ]),
        folderStructure: ['일자', '현장명'],
        isActive: true
      },
      {
        companyId: companies[0]._id,
        formName: '테스트양식',
        fields: ['항목1', '항목2'],
        fieldOptions: new Map(),
        folderStructure: [],
        isActive: false  // 비활성화된 양식
      }
    ]);

    // 삼성물산 양식
    const samsungForms = await Form.create([
      {
        companyId: companies[1]._id,
        formName: '일일작업일보',
        fields: ['일자', '현장명', '작업내용', '작업자', '공정률'],
        fieldOptions: new Map([
          ['현장명', ['강남역 프로젝트', '판교 테크노밸리']],
          ['작업내용', ['기초작업', '골조작업', '마감작업']]
        ]),
        folderStructure: ['일자', '현장명', '작업자'],
        isActive: true
      }
    ]);

    console.log(`   ✅ DL건설: 3개 양식 (활성 2개, 비활성 1개)`);
    console.log(`   ✅ 삼성물산: 1개 양식`);

    // 완료 메시지
    console.log('\n✨ 샘플 데이터 생성 완료!\n');
    console.log('📋 생성된 계정 정보:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('슈퍼바이저:');
    console.log('  아이디: super');
    console.log('  비밀번호: super1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DL건설 관리자:');
    console.log('  아이디: dl_admin');
    console.log('  비밀번호: admin1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DL건설 직원:');
    console.log('  아이디: kim_worker (김철수, 활성)');
    console.log('  아이디: lee_worker (이영희, 활성)');
    console.log('  아이디: park_worker (박민수, 비활성)');
    console.log('  비밀번호: emp1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('삼성물산 관리자:');
    console.log('  아이디: samsung_admin');
    console.log('  비밀번호: admin1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('삼성물산 직원:');
    console.log('  아이디: choi_worker (최지훈, 활성)');
    console.log('  아이디: jung_worker (정수진, 활성)');
    console.log('  비밀번호: emp1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
};

createSampleData();
