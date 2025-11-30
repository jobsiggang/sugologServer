// src/app/api/supervisor/companies/%5BcompanyId%5D/route.js
// 회사 전체 목록 조회, 회사 생성, (필요시) 전체 삭제" 등 회사 관련 CRUD의 엔드포인트
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import company from "@/models/Company";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 특정 회사 조회
export async function GET(req, { params }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'company_admin' && user.role !== 'supervisor') {
      return NextResponse.json({ error: '회사관리자만 접근 가능합니다.' }, { status: 403 });
    }

    const { id } = params;
    const company = await company.findById(id);

    if (!company) {
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 관리자 정보 조회
    const admin = await User.findOne({ 
      companyId: company._id, 
      role: 'company_admin' 
    }).select('username name');

    // 직원 수 조회
    const employeeCount = await User.countDocuments({
      companyId: company._id,
      role: 'employee'
    });

    return NextResponse.json({ 
      success: true, 
      company: {
        _id: company._id,
        name: company.name,
        description: company.description,
        isActive: company.isActive,
        admin: admin ? { username: admin.username, name: admin.name } : null,
        employeeCount,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json({ 
      error: '회사 조회 실패' 
    }, { status: 500 });
  }
}

// 회사 정보 수정
export async function PUT(req, { params }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 접근 가능합니다.' }, { status: 403 });
    }

    const { id } = params;
    const { name, description, isActive } = await req.json();

    const company = await company.findById(id);
    if (!company) {
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사명 변경 시 중복 확인
    if (name && name !== company.name) {
      const existingTeam = await company.findOne({ name, _id: { $ne: id } });
      if (existingTeam) {
        return NextResponse.json({ 
          error: '이미 존재하는 회사명입니다.' 
        }, { status: 400 });
      }
      company.name = name;
    }

    if (description !== undefined) {
      company.description = description;
    }

    if (isActive !== undefined) {
      company.isActive = isActive;
    }

    await company.save();

    return NextResponse.json({ 
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        description: company.description,
        isActive: company.isActive
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ 
      error: '회사 수정 실패',
      details: error.message
    }, { status: 500 });
  }
}

// 회사 삭제
export async function DELETE(req, { params }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 접근 가능합니다.' }, { status: 403 });
    }

    const { id } = params;
    const company = await company.findById(id);

    if (!company) {
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사에 속한 사용자 수 확인
    const userCount = await User.countDocuments({ companyId: id });

    if (userCount > 0) {
      return NextResponse.json({ 
        error: `회사에 ${userCount}명의 사용자가 등록되어 있습니다. 먼저 모든 사용자를 삭제해주세요.`,
        userCount
      }, { status: 400 });
    }

    await company.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: '회사가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json({ 
      error: '회사 삭제 실패',
      details: error.message
    }, { status: 500 });
  }
}
