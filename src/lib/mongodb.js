import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    // 연결 상태 확인
    if (mongoose.connection.readyState === 1) {
      console.log('Using cached MongoDB connection');
      return cached.conn;
    } else {
      console.log('Cached connection is not ready, reconnecting...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10초 타임아웃
      socketTimeoutMS: 45000, // 45초 소켓 타임아웃
      maxPoolSize: 10, // 연결 풀 크기
      minPoolSize: 2,
    };

    console.log('Creating new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB 연결 성공');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB 연결 실패:', error);
        cached.promise = null; // 실패 시 promise 초기화
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ MongoDB connection error in connectDB:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
