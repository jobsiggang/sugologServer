import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 슈퍼바이저 비밀번호 변경 (본인만 가능)
export async function PUT(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 비밀번호를 변경할 수 있습니다.' }, { status: 403 });
    }
    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '기존 비밀번호와 새 비밀번호를 입력하세요.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }
    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return NextResponse.json({ error: '기존 비밀번호가 일치하지 않습니다.' }, { status: 400 });
    }
    user.password = newPassword;
    await user.save();
    return NextResponse.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return NextResponse.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
