import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Google 설정 조회
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

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: '업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사만 조회 가능
    if (decoded.role === 'company_admin' && company._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      googleSettings: company.googleSettings
    });
  } catch (error) {
    console.error('Get Google settings error:', error);
    return NextResponse.json({ 
      error: 'Google 설정 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// Google 설정 업데이트
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

    const { webAppUrl, spreadsheetId, driveFolderId } = await request.json();

    await connectDB();

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: '업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사만 수정 가능
    if (decoded.role === 'company_admin' && company._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Google 설정 업데이트
    if (webAppUrl !== undefined) company.googleSettings.webAppUrl = webAppUrl;
    if (spreadsheetId !== undefined) company.googleSettings.spreadsheetId = spreadsheetId;
    if (driveFolderId !== undefined) company.googleSettings.driveFolderId = driveFolderId;

    // 모든 필수 설정이 입력되면 setupCompleted를 true로
    if (company.googleSettings.webAppUrl && 
        company.googleSettings.spreadsheetId) {
      company.googleSettings.setupCompleted = true;
    }

    company.googleSettings.lastSync = new Date();
    await company.save();

    return NextResponse.json({
      success: true,
      message: 'Google 설정이 업데이트되었습니다.',
      googleSettings: company.googleSettings
    });
  } catch (error) {
    console.error('Update Google settings error:', error);
    return NextResponse.json({ 
      error: 'Google 설정 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// Google 설정 테스트
export async function POST(request, { params }) {
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

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: '업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체관리자는 자기 회사만 테스트 가능
    if (decoded.role === 'company_admin' && company._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    if (!company.googleSettings.webAppUrl) {
      return NextResponse.json({ 
        error: 'Google 웹앱 URL이 설정되지 않았습니다.' 
      }, { status: 400 });
    }

    // Google Apps Script 웹앱 연결 테스트
    const response = await fetch(`${company.googleSettings.webAppUrl}?sheet=현장목록`);
    const data = await response.json();

    if (data.success) {
      company.googleSettings.lastSync = new Date();
      await company.save();

      return NextResponse.json({
        success: true,
        message: 'Google 연결 테스트 성공!',
        data: data.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Google 연결 실패: ' + (data.error || '알 수 없는 오류')
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test Google connection error:', error);
    return NextResponse.json({ 
      error: 'Google 연결 테스트 중 오류가 발생했습니다: ' + error.message 
    }, { status: 500 });
  }
}
