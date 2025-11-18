import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// 슈퍼바이저 존재 여부 확인
export async function GET() {
  try {
    // 환경변수로 setup 비활성화 체크
    const setupEnabled = process.env.ENABLE_ADMIN_SETUP === 'true';
    
    if (!setupEnabled) {
      return NextResponse.json({
        success: true,
        disabled: true,
        message: 'Setup is disabled'
      });
    }
    
    await connectDB();
    
    const supervisor = await User.findOne({ role: 'supervisor' });
    
    return NextResponse.json({
      success: true,
      exists: !!supervisor,
      needsSetup: !supervisor,
      disabled: false
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
    // 환경변수로 setup 비활성화 체크
    const setupEnabled = process.env.ENABLE_ADMIN_SETUP === 'true';
    
    if (!setupEnabled) {
      return NextResponse.json({ 
        error: 'Setup is disabled. Set ENABLE_ADMIN_SETUP=true in environment variables.' 
      }, { status: 403 });
    }
    
    await connectDB();
    
    // 이미 슈퍼바이저가 있는지 확인
    const existingSupervisor = await User.findOne({ role: 'supervisor' });
    if (existingSupervisor) {
      return NextResponse.json({ 
        error: '슈퍼바이저가 이미 등록되어 있습니다.' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { username, password, name } = body;

    console.log('Setup request body:', { username, name, passwordLength: password?.length });

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

    console.log('Creating supervisor:', { username, name, role: 'supervisor' });
    await supervisor.save();
    console.log('Supervisor created successfully');

    return NextResponse.json({
      success: true,
      message: '슈퍼바이저가 성공적으로 등록되었습니다.'
    }, { status: 201 });
  } catch (error) {
    console.error('Create supervisor error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ 
      error: '슈퍼바이저 등록 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
}
