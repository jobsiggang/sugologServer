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
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 200 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded ) {
            return NextResponse.json({ error: '로그인사용자만 접근 가능합니다.' }, { status: 200 });
        }

        await connectDB();
        
        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;

        // 🚨 URL 파라미터가 토큰 정보와 일치하는지 확인 (team_admin의 경우)
        if ((decoded.role === 'team_admin'|| decoded.role === 'employee') && (decoded.companyId !== companyId || decoded.teamId !== teamId)) {
            return NextResponse.json({ error: 'URL 정보가 토큰 정보와 일치하지 않습니다.' }, { status: 200 });
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
        return NextResponse.json({ error: '양식 조회 실패' }, { status: 200 });
    }
}

// ----------------------------------------------------------------------
// 양식 생성 (POST)
// ----------------------------------------------------------------------

export async function POST(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 200 });
        const decoded = verifyToken(token);
        
        // 권한 확인: team_admin 이상 허용
        if (!decoded || !['team_admin', 'company_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: '팀 관리자 이상만 양식을 생성할 수 있습니다.' }, { status: 200 });
        }

        const body = await request.json();
                const { formName, fields, fieldOptions, folderStructure, isActive, boardPosition, boardSize, boardBackground, boardFont, resolution } = body;

        // 필수 필드 검증
        if (!formName || !Array.isArray(fields)) {
            return NextResponse.json({ error: '양식명과 항목명을 입력해주세요.' }, { status: 200 });
        }

        await connectDB();

        // Next.js 13+ dynamic API: params may be a Promise
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        const teamId = resolvedParams.teamId;
        const decodedCompanyId = decoded.companyId; // 토큰에 있는 ID

        // 🚨 URL 파라미터 검증 (토큰과 일치하는지)
        if (decodedCompanyId !== companyId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. 회사 ID가 일치하지 않습니다.' }, { status: 200 });
        }

        // 중복 양식명 확인 (회사+팀 내 유니크)
        const exists = await Form.findOne({ companyId, teamId, formName });
        if (exists) {
            return NextResponse.json({ error: '이미 존재하는 양식명입니다.' }, { status: 200 });
        }

        // fields: string[] 또는 object[] 모두 허용 → object[]로 변환
        const normalizedFields = fields.map(f => {
            if (typeof f === 'string') return { name: f, type: 'text' };
            if (typeof f === 'object' && f !== null && f.name) return { name: f.name, type: f.type || 'text' };
            return null;
        }).filter(Boolean);
        if (normalizedFields.length === 0) {
            return NextResponse.json({ error: '항목명을 입력해주세요.' }, { status: 200 });
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
        return NextResponse.json({ error: '양식 생성 중 오류가 발생했습니다.' }, { status: 200 });
    }
}

