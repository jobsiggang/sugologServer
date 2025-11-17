import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import Form from "@/models/Form";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

/**
 * ⚡ 이미지를 업체별 Google Apps Script로 업로드
 * 요청 형식:
 * {
 *   base64Image: "data:image/jpeg;base64,...",
 *   filename: "photo_123.jpg",
 *   formId: "양식 ID",
 *   fieldData: { "일자": "2024-11-17", "현장명": "양주신도시", ... }
 * }
 */
export async function POST(req) {
  try {
    // 인증 확인
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    // 사용자 정보 조회
    const user = await User.findById(decoded.userId).populate('companyId');
    if (!user || !user.companyId) {
      return NextResponse.json({ error: '사용자 또는 업체 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체의 Google 설정 확인
    const company = user.companyId;
    if (!company.googleSettings.setupCompleted || !company.googleSettings.webAppUrl) {
      return NextResponse.json({ 
        error: '업체의 Google Apps Script가 설정되지 않았습니다. 관리자에게 문의하세요.' 
      }, { status: 400 });
    }

    const { base64Image, filename, formId, fieldData } = await req.json();

    if (!base64Image || !filename || !formId || !fieldData) {
      return NextResponse.json({ 
        error: '필수 데이터가 누락되었습니다. (base64Image, filename, formId, fieldData 필요)' 
      }, { status: 400 });
    }

    // 양식 정보 조회 (폴더 구조 정보 포함)
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // fieldData에 작성자 정보 추가
    const enrichedFieldData = {
      ...fieldData,
      "작성자": user.name,
      "사용자명": user.username,
      "업체명": company.name
    };

    // Google Apps Script로 전송할 데이터
    const uploadData = {
      base64Image,
      filename,
      formName: form.formName,
      fieldData: enrichedFieldData,
      folderStructure: form.folderStructure || [], // 폴더 계층 구조
      sheetName: `${fieldData['현장명'] || company.name}_${form.formName}` // 시트명
    };

    // 업체별 Google Apps Script URL 사용
    const SCRIPT_URL = company.googleSettings.webAppUrl;

    console.log('📤 Google Apps Script로 업로드 중:', {
      url: SCRIPT_URL,
      formName: form.formName,
      folderStructure: form.folderStructure,
      filename
    });

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadData),
    });

    if (!res.ok) {
      console.error('❌ Google Apps Script 응답 오류:', res.status, res.statusText);
      return NextResponse.json({
        success: false,
        error: `Google Apps Script 요청 실패: ${res.status} ${res.statusText}`
      }, { status: 500 });
    }

    const data = await res.json();

    if (!data.success) {
      console.error('❌ Google Apps Script 오류:', data.error);
      return NextResponse.json({
        success: false,
        error: data.error || 'Google Drive 업로드 실패'
      }, { status: 500 });
    }

    console.log('✅ 업로드 성공:', {
      fileUrl: data.fileUrl,
      folderPath: data.folderPath,
      sheetName: data.sheetName
    });

    // Google 설정의 lastSync 업데이트
    company.googleSettings.lastSync = new Date();
    await company.save();

    return NextResponse.json({
      success: true,
      fileUrl: data.fileUrl,
      folderPath: data.folderPath,
      sheetName: data.sheetName,
      message: '업로드 성공',
      company: company.name,
      form: form.formName
    });

  } catch (err) {
    console.error('❌ 업로드 API 오류:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || '업로드 처리 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
