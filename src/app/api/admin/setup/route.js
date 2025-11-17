import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// 슈퍼바이저 존재 여부 확인
export async function GET() {
  try {
    await connectDB();
    
    const supervisor = await User.findOne({ role: 'supervisor' });
    
    return NextResponse.json({
      success: true,
      exists: !!supervisor,
      needsSetup: !supervisor
    });
  } catch (error) {
    console.error('Check supervisor error:', error);
    return NextResponse.json({ 
      error: '확인 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 슈퍼바이저 초기 설정
export async function POST(request) {
  try {
    await connectDB();
    
    // 이미 슈퍼바이저가 있는지 확인
    const existingSupervisor = await User.findOne({ role: 'supervisor' });
    if (existingSupervisor) {
      return NextResponse.json({ 
        error: '슈퍼바이저가 이미 등록되어 있습니다.' 
      }, { status: 400 });
    }

    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ 
        error: '모든 항목을 입력해주세요.' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: '비밀번호는 최소 6자 이상이어야 합니다.' 
      }, { status: 400 });
    }

    // 슈퍼바이저 생성
    const supervisor = new User({
      username,
      password,
      name,
      role: 'supervisor'
    });

    await supervisor.save();

    return NextResponse.json({
      success: true,
      message: '슈퍼바이저가 성공적으로 등록되었습니다.'
    }, { status: 201 });
  } catch (error) {
    console.error('Create supervisor error:', error);
    return NextResponse.json({ 
      error: '슈퍼바이저 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
