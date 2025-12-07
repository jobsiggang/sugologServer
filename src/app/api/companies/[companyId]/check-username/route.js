import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// GET: username 중복 확인
export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    // Next.js 13+ dynamic API: params may be a Promise
    const resolvedParams = await params;
    const { companyId } = resolvedParams;

    // URL에서 username 파라미터 추출
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'username이 필요합니다.' }, { status: 400 });
    }

    // 권한 확인: company_admin 또는 team_admin만 확인 가능
    if (!['company_admin', 'team_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // URL 파라미터 검증
    if (decoded.companyId.toString() !== companyId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 같은 회사에서 username 중복 확인
    const existingUser = await User.findOne({
      companyId,
      username
    });

    return NextResponse.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? '이미 사용 중인 ID입니다.' : 'ID를 사용할 수 있습니다.'
    });
  } catch (error) {
    console.error('Username 중복 확인 오류:', error);
    return NextResponse.json(
      { error: 'Username 중복 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
