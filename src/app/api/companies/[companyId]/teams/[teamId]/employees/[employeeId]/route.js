import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { p } from "framer-motion/client";

// 특정 직원 조회
export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin', 'team_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();

    // Await params as it may be a Promise
    const resolvedParams = await params;
    const { employeeId } = resolvedParams;

    const employee = await User.findById(employeeId)
      .select('-password')
      .populate('companyId', 'name');

    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀장: 자기 회사, 자기 팀 직원만 조회 가능
    if (decoded.role === 'team_admin' && 
        (employee.companyId.toString() !== decoded.companyId.toString() ||
         employee.teamId.toString() !== decoded.teamId.toString())) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json({ 
      error: '직원 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 직원 정보 수정
export async function PUT(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'team_admin') {
      return NextResponse.json({ error: '팀장만 수정할 수 있습니다.' }, { status: 403 });
    }

    const { name, password, isActive } = await request.json();

    await connectDB();

    // Await params as it may be a Promise
    const resolvedParams = await params;
    const { companyId, teamId, employeeId } = resolvedParams;

    // Verify URL params match token (convert ObjectId to string for comparison)
    if (decoded.companyId.toString() !== companyId || decoded.teamId.toString() !== teamId) {
      return NextResponse.json({ error: '접근 권한이 없습니다. URL 정보가 토큰과 일치하지 않습니다.' }, { status: 403 });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀장: 자기 회사, 자기 팀 직원만 수정 가능
    if (
      employee.companyId.toString() !== decoded.companyId.toString() ||
      employee.teamId.toString() !== decoded.teamId.toString()
    ) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드
    if (name) employee.name = name;
    if (password) employee.password = password; // pre-save hook에서 자동 해싱
    if (typeof isActive === 'boolean') employee.isActive = isActive;

    await employee.save();

    const userResponse = employee.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: '직원 정보가 수정되었습니다.',
      employee: userResponse
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ 
      error: '직원 정보 수정 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 직원 삭제
export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'team_admin') {
      return NextResponse.json({ error: '팀장만 삭제할 수 있습니다.' }, { status: 403 });
    }

    await connectDB();

    // Await params as it may be a Promise
    const resolvedParams = await params;
    const { companyId, teamId, employeeId } = resolvedParams;

    // Verify URL params match token (convert ObjectId to string for comparison)
    if (decoded.companyId.toString() !== companyId || decoded.teamId.toString() !== teamId) {
      return NextResponse.json({ error: '접근 권한이 없습니다. URL 정보가 토큰과 일치하지 않습니다.' }, { status: 403 });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀장: 자기 회사, 자기 팀 직원만 삭제 가능
    if (
      employee.companyId.toString() !== decoded.companyId.toString() ||
      employee.teamId.toString() !== decoded.teamId.toString()
    ) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Hard delete - DB에서 완전히 삭제
    await User.findByIdAndDelete(employeeId);

    return NextResponse.json({
      success: true,
      message: '직원이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ 
      error: '직원 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
