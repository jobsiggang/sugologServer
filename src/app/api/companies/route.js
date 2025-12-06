import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 회사 목록 조회 (슈퍼바이저 전용)
export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    console.log('GET /api/companies - decoded:', { userId: decoded.userId, role: decoded.role });

    await connectDB();

    const user = await User.findById(decoded.userId);
    console.log('GET /api/companies - user found:', !!user, 'role:', user?.role);
    
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 접근 가능합니다.' }, { status: 403 });
    }

    const companies = await Company.find().sort({ createdAt: -1 });

    // 각 회사의 관리자 정보도 함께 조회
    const companiesWithAdmin = await Promise.all(
      companies.map(async (company) => {
        const admin = await User.findOne({ 
          companyId: company._id, 
          role: 'company_admin' 
        }).select('username name');
        
        return {
          _id: company._id,
          name: company.name,
          description: company.description,
          isActive: company.isActive,
          admin: admin ? { username: admin.username, name: admin.name } : null,
          createdAt: company.createdAt
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      companies: companiesWithAdmin 
    });
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ 
      error: '회사 목록 조회 실패' 
    }, { status: 500 });
  }
}

// 회사 생성 (슈퍼바이저 전용)
export async function POST(req) {
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

    const { companyName, companyDescription, adminUsername, adminPassword, adminName } = await req.json();

    if (!companyName || !adminUsername || !adminPassword || !adminName) {
      return NextResponse.json({ 
        error: '모든 필수 항목을 입력해주세요.' 
      }, { status: 400 });
    }

    // 중복 회사명 확인
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return NextResponse.json({ 
        error: '이미 존재하는 회사입니다.' 
      }, { status: 400 });
    }

    // 중복 사용자명 확인
    const existingUser = await User.findOne({ username: adminUsername });
    if (existingUser) {
      return NextResponse.json({ 
        error: '이미 사용 중인 사용자명입니다.' 
      }, { status: 400 });
    }

    // 회사 생성
    const company = await Company.create({
      name: companyName,
      description: companyDescription || '',
      googleSettings: {
        webAppUrl: '',
        setupCompleted: false
      }
    });

    // 회사 관리자 생성 (teamId: null 명시)
    const admin = await User.create({
      username: adminUsername,
      password: adminPassword,
      name: adminName,
      role: 'company_admin',
      companyId: company._id,
    });

    return NextResponse.json({ 
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        description: company.description
      },
      admin: {
        username: admin.username,
        name: admin.name
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ 
      error: '회사 생성 실패',
      details: error.message
    }, { status: 500 });
  }
}
