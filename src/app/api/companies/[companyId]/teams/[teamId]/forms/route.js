import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form"; // Form 모델
import User from "@/models/User"; // User 모델 (인증/권한 확인용)
import Company from "@/models/Company";
import Team from "@/models/Team";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import mongoose from 'mongoose';

// ----------------------------------------------------------------------
// 양식 목록 조회 (GET)
// ----------------------------------------------------------------------

export async function GET(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded ) {
            return NextResponse.json({ error: '로그인사용자만 접근 가능합니다.' }, { status: 403 });
        }

        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;

        // 🚨 URL 파라미터가 토큰 정보와 일치하는지 확인 (team_admin의 경우)
        if ((decoded.role === 'team_admin'|| decoded.role === 'employee') && (decoded.companyId !== companyId || decoded.teamId !== teamId)) {
            return NextResponse.json({ error: 'URL 정보가 토큰 정보와 일치하지 않습니다.' }, { status: 403 });
        }

        // 팀장은 모든 양식, 직원은 활성화된 양식만 조회
        let formQuery = { companyId, teamId };
        if (decoded.role === 'employee') {
            formQuery.isActive = true;
        }
        const forms = await Form.find(formQuery)
            .select('-__v')
            .sort({ formName: 1 });

        return NextResponse.json({ success: true, forms });

    } catch (error) {
        console.error('양식 조회 오류:', error);
        return NextResponse.json({ error: '양식 조회 실패' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// 양식 생성 (POST)
// ----------------------------------------------------------------------

export async function POST(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 생성할 수 있습니다.' }, { status: 403 });
        }

        const body = await request.json();
                const { formName, fields, fieldOptions, folderStructure, isActive, boardPosition, boardSize, boardBackground, boardFont, resolution } = body;

        // 필수 필드 검증
        if (!formName || !Array.isArray(fields)) {
            return NextResponse.json({ error: '양식명과 항목 정보가 필요합니다.' }, { status: 400 });
        }

        await connectDB();

        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;
        const decodedCompanyId = decoded.companyId; // 토큰에 있는 ID

        // 🚨 URL 파라미터 검증 (토큰과 일치하는지)
        if (decodedCompanyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 403 });
        }

        // 중복 양식명 확인 (회사+팀 내 유니크)
        const exists = await Form.findOne({ companyId, teamId, formName });
        if (exists) {
            return NextResponse.json({ error: '이미 존재하는 양식명입니다.' }, { status: 400 });
        }

        // fields: string[] 또는 object[] 모두 허용 → object[]로 변환
        const normalizedFields = fields.map(f => {
            if (typeof f === 'string') return { name: f, type: 'text' };
            if (typeof f === 'object' && f !== null && f.name) return { name: f.name, type: f.type || 'text' };
            return null;
        }).filter(Boolean);
        if (normalizedFields.length === 0) {
            return NextResponse.json({ error: '항목 정보가 올바르지 않습니다.' }, { status: 400 });
        }

        // 새 양식 생성
        const newForm = new Form({
            companyId,
            teamId,
            formName,
            fields: normalizedFields,
            fieldOptions: fieldOptions || {},
            folderStructure: folderStructure || [],
            isActive: isActive !== undefined ? isActive : true,
            boardPosition,
            boardSize,
            boardBackground,
            boardFont,
            resolution,
            createdBy: decoded.userId
        });

        await newForm.save();

        return NextResponse.json({
            success: true,
            message: '양식이 성공적으로 생성되었습니다.',
            form: newForm
        }, { status: 201 });

    } catch (error) {
        console.error('양식 생성 오류:', error);
        return NextResponse.json({ error: '양식 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// 양식 수정 (PUT)
// ----------------------------------------------------------------------

export async function PUT(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 수정할 수 있습니다.' }, { status: 403 });
        }

        const { formId, formName, fields, fieldOptions, folderStructure, isActive, boardPosition, boardSize, boardBackground, boardFont, resolution } = await request.json();
        
        if (!formId) {
            return NextResponse.json({ error: '양식 ID가 누락되었습니다.' }, { status: 400 });
        }
        
        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        
        // 🚨 URL 파라미터 검증
        if (decoded.companyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 403 });
        }

        // MongoDB ObjectId로 변환하여 쿼리 일관성 확보
        const form = await Form.findOne({ 
            _id: mongoose.Types.ObjectId.isValid(formId) ? new mongoose.Types.ObjectId(formId) : null, 
            companyId: mongoose.Types.ObjectId.isValid(companyId) ? new mongoose.Types.ObjectId(companyId) : null 
        });
        
        if (!form) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 양식명 변경 시 중복 검사
        if (formName && formName !== form.formName) {
            const exists = await Form.findOne({ companyId, formName, _id: { $ne: formId } });
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

// ----------------------------------------------------------------------
// 양식 삭제 (DELETE)
// ----------------------------------------------------------------------

export async function DELETE(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 삭제할 수 있습니다.' }, { status: 403 });
        }

        // 💡 [수정] DELETE 요청에서는 request.json() 대신 쿼리 파라미터나 URL에서 ID를 받는 것이 일반적입니다.
        // 현재 클라이언트 코드는 URL 파라미터를 사용하지 않으므로, 요청 본문에서 formId를 받도록 유지합니다.
        const { formId } = await request.json(); 
        if (!formId) {
            return NextResponse.json({ error: '양식 ID가 누락되었습니다.' }, { status: 400 });
        }

        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;

        // 🚨 URL 파라미터 검증
        if (decoded.companyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 403 });
        }

        // 해당 회사에 속한 양식 삭제 (MongoDB ObjectId 변환)
        const deletedForm = await Form.findOneAndDelete({ 
            _id: mongoose.Types.ObjectId.isValid(formId) ? new mongoose.Types.ObjectId(formId) : null, 
            companyId: mongoose.Types.ObjectId.isValid(companyId) ? new mongoose.Types.ObjectId(companyId) : null 
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