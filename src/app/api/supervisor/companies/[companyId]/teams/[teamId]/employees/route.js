import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 직원 목록 조회
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'team_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();

    // 슈퍼바이저는 모든 직원, 회사관리자는 자기 회사 직원만
    const query = decoded.role === 'supervisor' 
      ? {} 
      : { teamId: decoded.teamId };

    const employees = await User.find({
      ...query,
      role: { $in: ['team_admin', 'employee'] }
    })
    .select('-password')
    .populate('teamId', 'name')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json({ 
      error: '직원 목록 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 직원 생성
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'team_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { username, password, name, role, teamId } = await request.json();

    // 입력값 검증
    if (!username || !password || !name || !role) {
      return NextResponse.json({ 
        error: '필수 항목을 모두 입력해주세요.' 
      }, { status: 400 });
    }

    // 역할 검증
    if (!['team_admin', 'employee'].includes(role)) {
      return NextResponse.json({ 
        error: '올바르지 않은 역할입니다.' 
      }, { status: 400 });
    }

    await connectDB();

    // 중복 사용자명 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ 
        error: '이미 존재하는 사용자명입니다.' 
      }, { status: 400 });
    }

    // 회사관리자는 자기 회사에만 직원 추가 가능
    const finalteamId = decoded.role === 'supervisor' 
      ? teamId 
      : decoded.teamId;

    if (!finalteamId) {
      return NextResponse.json({ 
        error: '회사 정보가 필요합니다.' 
      }, { status: 400 });
    }

    // 새 사용자 생성
    const newUser = new User({
      username,
      password,
      name,
      role,
      teamId: finalteamId
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: '직원이 성공적으로 등록되었습니다.',
      employee: userResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ 
      error: '직원 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
