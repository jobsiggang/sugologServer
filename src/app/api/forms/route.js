import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 양식 목록 조회
export async function GET(request) {
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

    // 슈퍼바이저는 모든 양식, 업체관리자/직원은 자기 회사 양식만
    const query = decoded.role === 'supervisor' 
      ? {} 
      : { companyId: decoded.companyId };

    const forms = await Form.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      forms
    });
  } catch (error) {
    console.error('Get forms error:', error);
    return NextResponse.json({ 
      error: '양식 목록 조회 중 오류가 발생했습니다.' 
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

    const { formName, fields, companyId } = await request.json();

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
      fields
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
    return NextResponse.json({ 
      error: '양식 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
