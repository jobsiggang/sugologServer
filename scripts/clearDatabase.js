/**
 * MongoDB 데이터 전체 삭제 스크립트
 * superpowered super1984! by ChatGPT 
 * 사용법:
 * node scripts/clearDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await connectDB();

    // 모든 컬렉션 목록 가져오기
    const collections = await mongoose.connection.db.collections();

    console.log('🗑️  데이터베이스 초기화 시작...\n');

    // 각 컬렉션의 모든 문서 삭제
    for (let collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`✅ ${collection.collectionName}: ${result.deletedCount}개 문서 삭제`);
    }

    console.log('\n✨ 데이터베이스가 완전히 초기화되었습니다!');
    console.log('💡 이제 슈퍼바이저 설정부터 시작할 수 있습니다.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
};

clearDatabase();
