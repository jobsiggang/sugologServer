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
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사만 조회 가능
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

    const { webAppUrl } = await request.json();

    await connectDB();

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사만 수정 가능
    if (decoded.role === 'company_admin' && company._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Google 설정 업데이트
    if (webAppUrl !== undefined) company.googleSettings.webAppUrl = webAppUrl;

    // webAppUrl이 입력되면 setupCompleted를 true로
    if (company.googleSettings.webAppUrl) {
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
      return NextResponse.json({ error: '회사를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사만 테스트 가능
    if (decoded.role === 'company_admin' && company._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    if (!company.googleSettings.webAppUrl) {
      return NextResponse.json({ 
        error: 'Google 웹앱 URL이 설정되지 않았습니다.' 
      }, { status: 400 });
    }

    console.log('🔍 Google Apps Script 연결 테스트 시작:', company.googleSettings.webAppUrl);

    // Google Apps Script V2.0 테스트 - 더미 이미지 전송
    const testData = {
      base64Image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      filename: "test_connection.png",
      formName: "연결테스트",
      fieldData: {
        "일자": new Date().toISOString().split('T')[0],
        "현장명": "테스트현장",
        "작성자": "시스템"
      },
      folderStructure: ["일자", "현장명"]
    };

    const response = await fetch(company.googleSettings.webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Google Apps Script 응답 상태:', response.status, response.statusText);
    console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 응답 본문 (처음 500자):', responseText.substring(0, 500));

    // 429 에러 (Rate Limit) 처리 - 실제로는 성공했을 수 있음
    if (response.status === 429) {
      return NextResponse.json({
        success: true,
        warning: 'Google Apps Script 요청 제한에 도달했습니다. 하지만 요청은 처리되었을 가능성이 높습니다.',
        message: 'Google Drive와 Sheets를 직접 확인하여 테스트 파일이 저장되었는지 확인하세요.',
        hint: '1-2분 후에 다시 시도하거나, Google Drive에서 "공정한웍스" 폴더를 확인하세요.',
        driveFolder: '공정한웍스 / 2025-11-18 / 테스트현장',
        expectedFile: 'test_connection.png'
      });
    }

    if (!response.ok) {
      console.error('❌ Google Apps Script 응답 오류:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `Google Apps Script 요청 실패: ${response.status} ${response.statusText}`,
        details: responseText.substring(0, 500),
        hint: response.status === 403 
          ? "Google Apps Script 배포 설정에서 '모든 사용자(익명 포함)'로 액세스 권한을 설정하세요."
          : "Google Apps Script 배포 URL이 올바른지 확인하세요. 웹 앱으로 배포되어야 합니다."
      }, { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError.message);
      return NextResponse.json({
        success: false,
        error: 'Google Apps Script가 유효한 JSON을 반환하지 않았습니다.',
        details: responseText.substring(0, 500),
        hint: "Google Apps Script가 웹 앱으로 배포되었는지 확인하세요. 현재 HTML 페이지가 반환되고 있습니다."
      }, { status: 400 });
    }

    console.log('✅ Google Apps Script 응답:', data);

    if (data.success) {
      company.googleSettings.lastSync = new Date();
      await company.save();

      return NextResponse.json({
        success: true,
        message: 'Google 연결 테스트 성공! 테스트 파일이 Drive에 저장되었습니다.',
        data: {
          fileUrl: data.fileUrl,
          folderPath: data.folderPath,
          sheetName: data.sheetName,
          timestamp: data.timestamp
        }
      });
    } else {
      console.error('❌ Google Apps Script 오류:', data.error);
      return NextResponse.json({
        success: false,
        error: 'Google 연결 실패: ' + (data.error || '알 수 없는 오류')
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Test Google connection error:', error);
    return NextResponse.json({ 
      error: 'Google 연결 테스트 중 오류가 발생했습니다: ' + error.message 
    }, { status: 500 });
  }
}
