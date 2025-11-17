import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "아이디와 비밀번호를 입력해주세요.",
      }, { status: 400 });
    }

    // MongoDB 연결
    await connectDB();

    // 사용자 찾기
    const user = await User.findOne({ username, isActive: true }).populate('companyId');

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
