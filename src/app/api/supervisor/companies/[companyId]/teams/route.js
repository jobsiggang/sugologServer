// src/app/api/supervisor/companies/%5BcompanyId%5D/route.js 
//해당 회사(companyId)에 속한 "팀(Team)"의 목록 조회, 생성, (필요시 전체 삭제) 등
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import team from "@/models/team";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 특정 팀 조회
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
    if (!user || user.role !== 'team_admin' && user.role !== 'supervisor') {
      return NextResponse.json({ error: '회사관리자만 접근 가능합니다.' }, { status: 403 });
    }

    const { id } = params;
    const team = await team.findById(id);

    if (!team) {
      return NextResponse.json({ error: '팀를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 관리자 정보 조회
    const admin = await User.findOne({ 
      teamId: team._id, 
      role: 'team_admin' 
    }).select('username name');

    // 직원 수 조회
    const employeeCount = await User.countDocuments({
      teamId: team._id,
      role: 'employee'
    });

    return NextResponse.json({ 
      success: true, 
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        isActive: team.isActive,
        admin: admin ? { username: admin.username, name: admin.name } : null,
        employeeCount,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ 
      error: '팀 조회 실패' 
    }, { status: 500 });
  }
}

// 팀 정보 수정
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

    const team = await team.findById(id);
    if (!team) {
      return NextResponse.json({ error: '팀를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀명 변경 시 중복 확인
    if (name && name !== team.name) {
      const existingTeam = await team.findOne({ name, _id: { $ne: id } });
      if (existingTeam) {
        return NextResponse.json({ 
          error: '이미 존재하는 팀명입니다.' 
        }, { status: 400 });
      }
      team.name = name;
    }

    if (description !== undefined) {
      team.description = description;
    }

    if (isActive !== undefined) {
      team.isActive = isActive;
    }

    await team.save();

    return NextResponse.json({ 
      success: true,
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        isActive: team.isActive
      }
    });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ 
      error: '팀 수정 실패',
      details: error.message
    }, { status: 500 });
  }
}

// 팀 삭제
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
    const team = await team.findById(id);

    if (!team) {
      return NextResponse.json({ error: '팀를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀에 속한 사용자 수 확인
    const userCount = await User.countDocuments({ teamId: id });

    if (userCount > 0) {
      return NextResponse.json({ 
        error: `팀에 ${userCount}명의 사용자가 등록되어 있습니다. 먼저 모든 사용자를 삭제해주세요.`,
        userCount
      }, { status: 400 });
    }

    await team.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: '팀가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json({ 
      error: '팀 삭제 실패',
      details: error.message
    }, { status: 500 });
  }
}
