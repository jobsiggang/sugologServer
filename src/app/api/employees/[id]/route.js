import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 특정 직원 조회
export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();

    const employee = await User.findById(params.id)
      .select('-password')
      .populate('companyId', 'name');

    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사 직원만 조회 가능
    if (decoded.role === 'company_admin' && 
        employee.companyId._id.toString() !== decoded.companyId.toString()) {
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
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { name, password, isActive } = await request.json();

    await connectDB();

    const employee = await User.findById(params.id);
    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사 직원만 수정 가능
    if (decoded.role === 'company_admin' && 
        employee.companyId.toString() !== decoded.companyId.toString()) {
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
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();

    const employee = await User.findById(params.id);
    if (!employee) {
      return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사 직원만 삭제 가능
    if (decoded.role === 'company_admin' && 
        employee.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Soft delete
    employee.isActive = false;
    await employee.save();

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
