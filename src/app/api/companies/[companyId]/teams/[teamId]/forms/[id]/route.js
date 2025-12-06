import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form";
import User from "@/models/User"; // User 모델 (인증/권한 확인용)
import Company from "@/models/Company";
import Team from "@/models/Team";
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

    // 팀장: 팀의 모든 양식, 직원: 활성화된 양식만
    let form;
    if (decoded.role === 'employee') {
      form = await Form.findOne({ _id: params.id, isActive: true }).populate('companyId', 'name');
    } else {
      form = await Form.findById(params.id).populate('companyId', 'name');
    }

    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팀장/직원은 자기 회사 양식만 조회 가능
    if (["team_admin", "employee"].includes(decoded.role) && 
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
  console.log("params:", params);
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { formName, fields, folderStructure, isActive, boardPosition, boardSize, boardBackground, boardFont, resolution } = await request.json();

    await connectDB();

    const form = await Form.findById(params.id);
    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사 양식만 수정 가능
    if (decoded.role === 'team_admin' && 
        form.companyId.toString() !== decoded.companyId.toString()) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드
    if (formName) form.formName = formName;
    if (fields && Array.isArray(fields)) {
      form.fields = fields.map(f => ({
        name: f.name,
        type: f.type || 'text',
        options: Array.isArray(f.options) ? f.options : []
      }));
    }
    if (folderStructure !== undefined) form.folderStructure = folderStructure;
    if (typeof isActive === 'boolean') form.isActive = isActive;
    if (boardPosition !== undefined) form.boardPosition = boardPosition;
    if (boardSize !== undefined) form.boardSize = boardSize;
    if (boardBackground !== undefined) form.boardBackground = boardBackground;
    if (boardFont !== undefined) form.boardFont = boardFont;
      if (resolution !== undefined) {
        // resolution 값이 숫자면 객체로 변환
        if (typeof resolution === 'number') {
          form.resolution = { width: resolution, height: 768 };
        } else {
          form.resolution = resolution;
        }
      }

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
    if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();
    const form = await Form.findById(params.id);
    if (!form) {
      return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 회사관리자는 자기 회사 양식만 삭제 가능
    if (decoded.role === 'team_admin' && 
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
