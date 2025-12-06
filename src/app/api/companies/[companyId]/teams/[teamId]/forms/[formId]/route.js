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
