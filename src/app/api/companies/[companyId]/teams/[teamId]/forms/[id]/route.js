import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 특정 양식 조회
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

    const form = await Form.findById(params.id).populate('companyId', 'name');

    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자/직원은 자기 회사 양식만 조회 가능
    if (decoded.role !== 'supervisor' && 
        form.companyId._id.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      form
    });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ 
      error: '양식 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 양식 정보 수정
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

    const { formName, fields, fieldOptions, folderStructure, isActive } = await request.json();

    console.log('📝 양식 수정 요청:', { formName, fields, fieldOptions, folderStructure, isActive });

    await connectDB();

    const form = await Form.findById(params.id);
    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사 양식만 수정 가능
    if (decoded.role === 'company_admin' && 
        form.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드
    if (formName) form.formName = formName;
    if (fields && Array.isArray(fields)) form.fields = fields;
    
    // fieldOptions 처리 (빈 객체도 허용)
    if (fieldOptions !== undefined) {
      const entries = Object.entries(fieldOptions);
      form.fieldOptions = entries.length > 0 ? new Map(entries) : new Map();
      console.log('✅ fieldOptions 업데이트:', Array.from(form.fieldOptions.entries()));
    }
    
    if (folderStructure !== undefined) form.folderStructure = folderStructure;
    if (typeof isActive === 'boolean') form.isActive = isActive;

    await form.save();

    const updatedForm = await Form.findById(form._id).populate('companyId', 'name');

    return NextResponse.json({
      success: true,
      message: '양식 정보가 수정되었습니다.',
      form: updatedForm
    });
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ 
      error: '양식 정보 수정 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 양식 삭제
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

    const form = await Form.findById(params.id);
    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사 양식만 삭제 가능
    if (decoded.role === 'company_admin' && 
        form.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 비활성화된 양식만 삭제 가능
    if (form.isActive) {
      return NextResponse.json({ 
        error: '활성화된 양식은 삭제할 수 없습니다. 먼저 비활성화하세요.' 
      }, { status: 400 });
    }

    // Hard delete - DB에서 완전히 삭제
    await Form.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: '양식이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json({ 
      error: '양식 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
