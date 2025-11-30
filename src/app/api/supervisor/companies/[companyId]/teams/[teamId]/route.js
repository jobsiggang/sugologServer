import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 단일 팀 정보 조회
export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin', 'team_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    await connectDB();
    const team = await Team.findById(params.teamId).populate('companyId', 'name');
    if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 });
    // 권한 체크 예시
    if (decoded.role === 'company_admin' && team.companyId._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    if (decoded.role === 'team_admin' && team._id.toString() !== decoded.teamId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    return NextResponse.json({ success: true, team });
  } catch (error) {
    return NextResponse.json({ error: '팀 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단일 팀 정보 수정
export async function PUT(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    const { name, description } = await request.json();
    await connectDB();
    const team = await Team.findById(params.teamId);
    if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 });
    if (name) team.name = name;
    if (description) team.description = description;
    await team.save();
    return NextResponse.json({ success: true, message: '팀 정보가 수정되었습니다.', team });
  } catch (error) {
    return NextResponse.json({ error: '팀 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단일 팀 삭제
export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    await connectDB();
    const team = await Team.findById(params.teamId);
    if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 });
    await Team.findByIdAndDelete(params.teamId);
    return NextResponse.json({ success: true, message: '팀이 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '팀 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}