import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import mongoose from 'mongoose';

// GET: 특정 양식 조회
export async function GET(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return NextResponse.json({ error: '로그인사용자만 접근 가능합니다.' }, { status: 403 });
        }

        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;
        const formId = resolvedParams.formId;

        // URL 파라미터 검증
        if ((decoded.role === 'team_admin' || decoded.role === 'employee') && 
            (decoded.companyId !== companyId || decoded.teamId !== teamId)) {
            return NextResponse.json({ error: 'URL 정보가 토큰 정보와 일치하지 않습니다.' }, { status: 403 });
        }

        // ObjectId 유효성 검증
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return NextResponse.json({ error: '유효한 양식 ID가 아닙니다.' }, { status: 400 });
        }

        const form = await Form.findOne({
            _id: new mongoose.Types.ObjectId(formId),
            companyId: new mongoose.Types.ObjectId(companyId),
            teamId: new mongoose.Types.ObjectId(teamId)
        });

        if (!form) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 직원은 활성화된 양식만 조회 가능
        if (decoded.role === 'employee' && !form.isActive) {
            return NextResponse.json({ error: '접근할 수 없는 양식입니다.' }, { status: 403 });
        }

        return NextResponse.json({ success: true, form });

    } catch (error) {
        console.error('양식 조회 오류:', error);
        return NextResponse.json({ error: '양식 조회 실패' }, { status: 500 });
    }
}

// PUT: 양식 수정
export async function PUT(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 수정할 수 있습니다.' }, { status: 403 });
        }

        const body = await request.json();
        const { formName, fields, fieldOptions, folderStructure, isActive, boardPosition, boardSize, boardBackground, boardFont, resolution } = body;
        
        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;
        const formId = resolvedParams.formId;
        
        // 🚨 URL 파라미터 검증
        if (decoded.companyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 403 });
        }

        // ObjectId 유효성 검증
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return NextResponse.json({ error: '유효한 양식 ID가 아닙니다.' }, { status: 400 });
        }

        // MongoDB ObjectId로 변환하여 쿼리 일관성 확보
        const form = await Form.findOne({ 
            _id: new mongoose.Types.ObjectId(formId), 
            companyId: new mongoose.Types.ObjectId(companyId),
            teamId: new mongoose.Types.ObjectId(teamId)
        });
        
        if (!form) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 양식명 변경 시 중복 검사
        if (formName && formName !== form.formName) {
            const exists = await Form.findOne({ companyId, teamId, formName, _id: { $ne: formId } });
            if (exists) {
                return NextResponse.json({ error: '이미 존재하는 양식명입니다.' }, { status: 400 });
            }
            form.formName = formName;
        }

        // 데이터 업데이트 (필드가 제공된 경우에만 업데이트)
        if (fields !== undefined) form.fields = Array.isArray(fields) ? fields : [];
        if (fieldOptions !== undefined) form.fieldOptions = fieldOptions;
        if (folderStructure !== undefined) form.folderStructure = Array.isArray(folderStructure) ? folderStructure : [];
        if (isActive !== undefined) form.isActive = isActive;
        if (boardPosition !== undefined) form.boardPosition = boardPosition;
        if (boardSize !== undefined) form.boardSize = boardSize;
        if (boardBackground !== undefined) form.boardBackground = boardBackground;
        if (boardFont !== undefined) form.boardFont = boardFont;
        if (resolution !== undefined) form.resolution = resolution;
        
        await form.save();

        return NextResponse.json({ success: true, form });

    } catch (error) {
        console.error('양식 수정 오류:', error);
        return NextResponse.json({ error: '양식 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE: 양식 삭제
export async function DELETE(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 삭제할 수 있습니다.' }, { status: 403 });
        }

        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;
        const formId = resolvedParams.formId;

        // 🚨 URL 파라미터 검증
        if (decoded.companyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 403 });
        }

        // ObjectId 유효성 검증
        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return NextResponse.json({ error: '유효한 양식 ID가 아닙니다.' }, { status: 400 });
        }

        // 해당 회사에 속한 양식 삭제 (MongoDB ObjectId 변환)
        const deletedForm = await Form.findOneAndDelete({ 
            _id: new mongoose.Types.ObjectId(formId), 
            companyId: new mongoose.Types.ObjectId(companyId),
            teamId: new mongoose.Types.ObjectId(teamId)
        });

        if (!deletedForm) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: '양식이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('양식 삭제 오류:', error);
        return NextResponse.json({ error: '양식 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
