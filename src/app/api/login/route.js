import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, companyId } = body;

    console.log('Login attempt:', { username, hasCompanyId: !!companyId });

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "아이디와 비밀번호를 입력해주세요.",
      }, { status: 400 });
    }

    // MongoDB 연결
    await connectDB();

    // 사용자 찾기 (회사 ID가 있으면 회사별로 조회)
    let query = { username, isActive: true };
    
    // companyId가 있으면 해당 회사의 사용자만 조회
    if (companyId) {
      query.companyId = companyId;
    } else {
      // companyId가 없으면 슈퍼바이저만 조회
      query.role = 'supervisor';
    }

    console.log('Query:', JSON.stringify(query));

    const user = await User.findOne(query).populate('companyId');

    console.log('User found:', !!user, user?.username, user?.role);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      }, { status: 401 });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      }, { status: 401 });
    }

    // JWT 토큰 생성
    const token = generateToken(user._id, user.role, user.companyId?._id);

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        companyId: user.companyId?._id,
        companyName: user.companyId?.name,
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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: "로그인 처리 중 오류가 발생했습니다." 
    }, { status: 500 });
  }
}
