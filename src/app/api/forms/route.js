import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import Form from "@/models/Form";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 양식 목록 조회
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

    console.log('Forms GET - decoded:', { userId: decoded.userId, role: decoded.role, companyId: decoded.companyId });

    await connectDB();

    // 슈퍼바이저는 모든 양식, 업체관리자/직원은 자기 회사 양식만
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

    const forms = await Form.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    console.log('Forms found:', forms.length);

    return NextResponse.json({
      success: true,
      forms
    });
  } catch (error) {
    console.error('Get forms error:', error);
    return NextResponse.json({ 
      success: false,
      error: '양식 목록 조회 중 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
}

// 양식 생성
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

    const { formName, fields, fieldOptions, folderStructure, companyId } = await request.json();

    console.log('📝 양식 생성 요청:', { formName, fields, fieldOptions, folderStructure });
    console.log('📝 fieldOptions 상세:', JSON.stringify(fieldOptions, null, 2));

    // 입력값 검증
    if (!formName || !fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ 
        error: '양식명과 항목을 입력해주세요.' 
      }, { status: 400 });
    }

    await connectDB();

    // 업체관리자는 자기 회사에만 양식 추가 가능
    const finalCompanyId = decoded.role === 'supervisor' 
      ? companyId 
      : decoded.companyId;

    if (!finalCompanyId) {
      return NextResponse.json({ 
        error: '업체 정보가 필요합니다.' 
      }, { status: 400 });
    }

    // 새 양식 생성
    const newForm = new Form({
      companyId: finalCompanyId,
      formName,
      fields,
      fieldOptions: fieldOptions ? new Map(Object.entries(fieldOptions)) : new Map(),
      folderStructure: folderStructure || []
    });

    await newForm.save();

    const populatedForm = await Form.findById(newForm._id).populate('companyId', 'name');

    return NextResponse.json({
      success: true,
      message: '양식이 성공적으로 등록되었습니다.',
      form: populatedForm
    }, { status: 201 });
  } catch (error) {
    console.error('Create form error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      success: false,
      error: '양식 등록 중 오류가 발생했습니다.',
      details: error.message,
      errorName: error.name
    }, { status: 500 });
  }
}
