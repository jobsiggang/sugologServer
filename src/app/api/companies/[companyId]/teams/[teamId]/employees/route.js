// src/app/api/companies/[companyId]/teams/[teamId]/employees/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Company from "@/models/Company";
import Team from "@/models/Team";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import mongoose from 'mongoose';

// 직원 목록 조회 (GET)
export async function GET(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 1. 🚨 권한 제한: team_admin만 허용
        if (!decoded || decoded.role !== 'team_admin') {
            return NextResponse.json({ error: '팀 관리자만 접근 가능합니다.' }, { status: 403 });
        }

        await connectDB();

        // 2. URL 파라미터 추출 및 토큰 정보와의 일치 확인
        const resolvedParams = await params; // ⭐ params가 Promise일 수 있음
        const { companyId, teamId } = resolvedParams;

        // 🚨 [핵심] companyId와 teamId가 토큰 정보와 완벽하게 일치해야 함 (문자열로 비교)
        const tokenCompanyId = decoded.companyId?.toString ? decoded.companyId.toString() : String(decoded.companyId);
        const tokenTeamId = decoded.teamId?.toString ? decoded.teamId.toString() : String(decoded.teamId);
        
        console.error(`🔍 권한 검증:`, {
            tokenCompanyId,
            paramsCompanyId: companyId,
            tokenTeamId,
            paramsTeamId: teamId,
            match: tokenCompanyId === companyId && tokenTeamId === teamId,
            decodedRole: decoded.role,
            decodedUserId: decoded.userId
        });
        
        if (tokenCompanyId !== companyId || tokenTeamId !== teamId) {
            console.error(`❌ 접근 권한 거부:`, {
                tokenCompanyId,
                paramsCompanyId: companyId,
                tokenTeamId,
                paramsTeamId: teamId
            });
            return NextResponse.json({ 
                error: '접근 권한이 없습니다. URL 정보가 토큰과 일치하지 않습니다.',
                debug: {
                    tokenCompanyId,
                    paramsCompanyId: companyId,
                    tokenTeamId,
                    paramsTeamId: teamId
                }
            }, { status: 403 });
        }

        // 3. 필터 설정 (토큰 정보 사용)
        const filter = { 
            role: 'employee', 
            companyId: decoded.companyId,
            teamId: decoded.teamId
        };
        
        const employees = await User.find(filter)
            .select('-password')
            .populate('companyId', 'name')
            .populate('teamId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, employees });
    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json({ error: '직원 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// 직원 생성 (POST)
export async function POST(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        const decoded = verifyToken(token);
        
        // 1. 🚨 권한 제한: team_admin만 허용
        if (!decoded || decoded.role !== 'team_admin') {
            return NextResponse.json({ error: '팀 관리자만 직원을 생성할 수 있습니다.' }, { status: 403 });
        }

        const { username, password, name } = await request.json();
        if (!username || !password || !name) {
            return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
        }

        await connectDB();
        
        // 2. URL 파라미터 추출 및 토큰 정보와의 일치 확인
        const resolvedParams = await params; // ⭐ params가 Promise일 수 있음
        const { companyId, teamId } = resolvedParams;
        
        // 🚨 [핵심] companyId와 teamId가 토큰 정보와 완벽하게 일치해야 함
        if (decoded.companyId !== companyId || decoded.teamId !== teamId) {
            return NextResponse.json({ error: '접근 권한이 없습니다. URL 정보가 토큰과 일치하지 않습니다.' }, { status: 403 });
        }
        
            // 중복 사용자명 확인 (같은 회사+팀 내에서만 중복 불가)
            const existingUser = await User.findOne({ username, companyId: decoded.companyId, teamId: decoded.teamId });
            if (existingUser) {
            return NextResponse.json({ error: '이미 존재하는 사용자명입니다.' }, { status: 400 });
        }

        // 3. 새 사용자 생성
        const newUser = new User({
            username,
            password,
            name,
            role: 'employee',
            companyId: decoded.companyId,
            teamId: decoded.teamId // 🚨 토큰의 ID를 사용 (URL에서 가져온 ID와 일치함)
        });

        try {
            await newUser.save();
        } catch (err) {
            // MongoDB unique index 에러 처리 (companyId+username)
            if (err.code === 11000) {
                return NextResponse.json({ error: '같은 회사 내에 이미 존재하는 사용자명입니다.' }, { status: 400 });
            }
            throw err;
        }
        // ... (비밀번호 제거 및 응답 구성)
        const userResponse = newUser.toObject();
        delete userResponse.password;
        return NextResponse.json({ success: true, message: '직원이 성공적으로 등록되었습니다.', employee: userResponse }, { status: 201 });
    } catch (error) {
        console.error('Create employee error:', error);
        return NextResponse.json({ error: '직원 등록 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

