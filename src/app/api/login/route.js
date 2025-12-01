import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import Company from '@/models/Company';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, companyId, teamId } = body;

    console.log('=== 로그인 시도 ===');
    console.log('Username:', username);
    console.log('CompanyId:', companyId);
    console.log('시간:', new Date().toISOString());

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "아이디와 비밀번호를 입력해주세요.",
      }, { status: 400 });
    }

    // MongoDB 연결 (타임아웃 추가)
    console.log('MongoDB 연결 시작...');
    const startTime = Date.now();
    
    try {
      await connectDB();
      console.log(`MongoDB 연결 완료 (${Date.now() - startTime}ms)`);
    } catch (dbError) {
      console.error('MongoDB 연결 실패:', dbError);
      return NextResponse.json({
        success: false,
        message: "데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
      }, { status: 503 });
    }


    // 사용자 찾기 (회사+팀+username 조합)
    let query = { username, isActive: true };
    if (companyId) query.companyId = companyId;
    if (teamId) query.teamId = teamId;
    if (!companyId) query.role = 'company_admin';
    console.log('Query:', JSON.stringify(query));

    let user;
    try {
      user = await User.findOne(query).populate('companyId');
      console.log('User 조회 완료:', !!user);
    } catch (findError) {
      console.error('User 조회 실패:', findError);
      return NextResponse.json({
        success: false,
        message: "사용자 조회 중 오류가 발생했습니다.",
      }, { status: 500 });
    }

    if (user) {
      console.log('User 정보:', {
        username: user.username,
        role: user.role,
        hasCompanyId: !!user.companyId,
        hasPassword: !!user.password
      });
    }

    if (!user) {
      console.log('❌ 사용자를 찾을 수 없음');
      return NextResponse.json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      }, { status: 401 });
    }

    // 비밀번호 확인
    console.log('비밀번호 확인 시작...');
    let isPasswordValid;
    try {
      isPasswordValid = await user.comparePassword(password);
      console.log('비밀번호 확인 결과:', isPasswordValid);
    } catch (pwError) {
      console.error('비밀번호 확인 중 오류:', pwError);
      return NextResponse.json({
        success: false,
        message: "비밀번호 확인 중 오류가 발생했습니다.",
      }, { status: 500 });
    }

    if (!isPasswordValid) {
      console.log('❌ 비밀번호 불일치');
      return NextResponse.json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      }, { status: 401 });
    }

    // companyId를 안전하게 추출
    const userCompanyId = user.companyId?._id || user.companyId;
    const userTeamId = user.teamId?._id || user.teamId;
    console.log('Extracted companyId for token:', userCompanyId);
    console.log('Extracted teamId for token:', userTeamId);

    // JWT 토큰 생성
    const token = generateToken(user._id, user.role, userCompanyId, userTeamId);
    console.log('✅ 토큰 생성 완료');

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      role: user.role,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        companyId: user.companyId?._id,
        companyName: user.companyId?.name,
        teamId: user.teamId,
        teamName: user.teamId?.name || undefined,
      },
      token,
    });

    // 쿠키에 토큰 설정
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    console.log('=== 로그인 성공 ===\n');
    return response;
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // MongoDB 연결 에러 처리
    if (error.name === 'MongooseError' || error.name === 'MongoServerError') {
      return NextResponse.json({ 
        success: false, 
        message: "데이터베이스 연결 오류입니다. 잠시 후 다시 시도해주세요.",
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
