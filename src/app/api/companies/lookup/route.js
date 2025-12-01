// src/app/api/companies/lookup/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company"; // 🚨 Company 모델 경로 확인

/**
 * GET: 회사명으로 회사 ID와 정보를 조회 (로그인 단계 1)
 * 쿼리 파라미터: ?name=회사명
 */
export async function GET(request) {
    try {
        await connectDB();

        // 1. 쿼리 파라미터에서 회사명 추출
        const { searchParams } = new URL(request.url);
        const companyName = searchParams.get('name');

        if (!companyName) {
            return NextResponse.json({ error: '회사명(name)을 입력해주세요.' }, { status: 400 });
        }

        // 2. 회사명으로 조회 (정확히 일치하는 회사 검색)
        const company = await Company.findOne({ name: companyName, isActive: true })
            .select('_id name'); // ID와 이름만 반환

        if (!company) {
            return NextResponse.json({ 
                success: false, 
                error: '일치하는 회사를 찾을 수 없습니다.' 
            }, { status: 404 });
        }

        // 3. 성공 응답
        return NextResponse.json({
            success: true,
            company: {
                _id: company._id,
                name: company.name
            }
        });
        
    } catch (error) {
        console.error('Company lookup API Error:', error);
        // 500 오류 시, 에러 메시지를 숨기고 일반 오류만 반환
        return NextResponse.json({ 
            success: false, 
            error: '서버 처리 중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}