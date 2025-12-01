// src/app/api/companies/[companyId]/teams/list/route.js (수정된 버전)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team"; // 모델명은 대문자 T로 시작하는 것이 관례
import mongoose from 'mongoose';

// 모든 활성 팀 목록 조회 (특정 companyId에 속한 팀만 조회)
export async function GET(request, { params }) {
    try {
        await connectDB();
        
        // 1. URL 파라미터에서 companyId 추출
        const companyId = params.companyId; 

        // 2. companyId 유효성 검증 (선택적)
        if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
             return NextResponse.json({ error: '유효하지 않은 회사 ID입니다.' }, { status: 400 });
        }
        
        // 3. 🚨 [수정] 해당 companyId에 속한 활성 팀만 조회
        const teams = await Team.find({ companyId: companyId, isActive: true }) 
            .select('name _id') // 클라이언트가 필요한 필드만 선택
            .sort({ name: 1 });

        return NextResponse.json({ 
            success: true, 
            teams 
        });
    } catch (error) {
        console.error('Get teams list error:', error);
        return NextResponse.json({ 
            error: '팀 목록 조회 실패' 
        }, { status: 500 });
    }
}