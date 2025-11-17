import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Site from "@/models/Site";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 특정 현장 조회
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

    const site = await Site.findById(params.id).populate('companyId', 'name');

    if (!site) {
      return NextResponse.json({ error: '현장을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자/직원은 자기 회사 현장만 조회 가능
    if (decoded.role !== 'supervisor' && 
        site.companyId._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      site
    });
  } catch (error) {
    console.error('Get site error:', error);
    return NextResponse.json({ 
      error: '현장 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 현장 정보 수정
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

    const { siteName, projectName, workTypeCode, workTypeName, constructionStage, isActive } = await request.json();

    await connectDB();

    const site = await Site.findById(params.id);
    if (!site) {
      return NextResponse.json({ error: '현장을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사 현장만 수정 가능
    if (decoded.role === 'company_admin' && 
        site.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드
    if (siteName) site.siteName = siteName;
    if (projectName) site.projectName = projectName;
    if (workTypeCode) site.workTypeCode = workTypeCode;
    if (workTypeName) site.workTypeName = workTypeName;
    if (constructionStage !== undefined) site.constructionStage = constructionStage;
    if (typeof isActive === 'boolean') site.isActive = isActive;

    await site.save();

    const updatedSite = await Site.findById(site._id).populate('companyId', 'name');

    return NextResponse.json({
      success: true,
      message: '현장 정보가 수정되었습니다.',
      site: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    return NextResponse.json({ 
      error: '현장 정보 수정 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 현장 삭제
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

    const site = await Site.findById(params.id);
    if (!site) {
      return NextResponse.json({ error: '현장을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사 현장만 삭제 가능
    if (decoded.role === 'company_admin' && 
        site.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Soft delete
    site.isActive = false;
    await site.save();

    return NextResponse.json({
      success: true,
      message: '현장이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete site error:', error);
    return NextResponse.json({ 
      error: '현장 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
