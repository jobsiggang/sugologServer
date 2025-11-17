import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Site from "@/models/Site";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 현장 목록 조회
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: '인증이 필요합니다.' 
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: '유효하지 않은 토큰입니다.' 
      }, { status: 401 });
    }

    console.log('Sites GET - decoded:', { userId: decoded.userId, role: decoded.role, companyId: decoded.companyId });

    await connectDB();

    // 슈퍼바이저는 모든 현장, 업체관리자/직원은 자기 회사 현장만
    let query = {};
    
    if (decoded.role === 'supervisor') {
      query = {};
    } else {
      if (!decoded.companyId) {
        return NextResponse.json({ 
          success: false,
          error: '회사 정보가 없습니다. 다시 로그인해주세요.' 
        }, { status: 400 });
      }
      query = { companyId: decoded.companyId };
    }

    const sites = await Site.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    console.log('Sites found:', sites.length);

    return NextResponse.json({
      success: true,
      sites
    });
  } catch (error) {
    console.error('Get sites error:', error);
    return NextResponse.json({ 
      success: false,
      error: '현장 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
}

// 현장 생성
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { siteName, projectName, workTypeCode, workTypeName, constructionStage, companyId } = await request.json();

    // 입력값 검증
    if (!siteName || !projectName || !workTypeCode || !workTypeName) {
      return NextResponse.json({ 
        error: '필수 항목을 모두 입력해주세요.' 
      }, { status: 400 });
    }

    await connectDB();

    // 업체관리자는 자기 회사에만 현장 추가 가능
    const finalCompanyId = decoded.role === 'supervisor' 
      ? companyId 
      : decoded.companyId;

    if (!finalCompanyId) {
      return NextResponse.json({ 
        error: '업체 정보가 필요합니다.' 
      }, { status: 400 });
    }

    // 새 현장 생성
    const newSite = new Site({
      companyId: finalCompanyId,
      siteName,
      projectName,
      workTypeCode,
      workTypeName,
      constructionStage: constructionStage || ''
    });

    await newSite.save();

    const populatedSite = await Site.findById(newSite._id).populate('companyId', 'name');

    return NextResponse.json({
      success: true,
      message: '현장이 성공적으로 등록되었습니다.',
      site: populatedSite
    }, { status: 201 });
  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json({ 
      error: '현장 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
