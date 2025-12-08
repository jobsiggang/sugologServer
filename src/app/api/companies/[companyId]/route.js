// src/app/api/companies/[companyId]/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import Team from "@/models/Team";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import mongoose from 'mongoose';

// ----------------------------------------------------------------------
// 회사 정보 조회 (GET) - 특정 companyId의 상세 정보 반환
// ----------------------------------------------------------------------

export async function GET(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        
        const decoded = verifyToken(token);
        // 회사 관리자나 슈퍼바이저만 접근 가능하도록 설정
        if (!decoded || (decoded.role !== 'company_admin' && decoded.role !== 'supervisor')) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        await connectDB();
        
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;

        // 1. 회사 정보 조회
        const company = await Company.findById(companyId).select('-__v'); 

        if (!company) {
            return NextResponse.json({ success: false, error: '회사를 찾을 수 없습니다.' }, { status: 200 });
        }

        // 2. 회사 관리자 정보 조회 (책임자 정보가 필요한 경우 populate 대신 별도 조회)
        // 회사 관리자 (company_admin)는 회사당 한 명이라고 가정
        const adminUser = await User.findOne({ companyId, role: 'company_admin' }).select('name username');

        // 3. 활성화된 팀 목록 조회
        const activeTeams = await Team.find({ companyId, isActive: true }).select('name description isActive createdAt');

        // 최종 데이터 구성
        const result = {
            ...company.toObject(),
            admin: adminUser ? { name: adminUser.name, username: adminUser.username } : null,
            teams: activeTeams
        };

        return NextResponse.json({ success: true, company: result });

    } catch (error) {
        console.error('회사 정보 조회 오류:', error);
        return NextResponse.json({ error: '회사 정보 조회 실패' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// 회사 정보 수정 (PUT)
// ----------------------------------------------------------------------

export async function PUT(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'supervisor') {
            return NextResponse.json({ error: '슈퍼바이저만 수정할 수 있습니다.' }, { status: 403 });
        }

        const { name, description, isActive } = await request.json();
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return NextResponse.json({ error: '유효하지 않은 회사 ID 형식입니다.' }, { status: 400 });
        }
        
        await connectDB();

        const company = await Company.findById(companyId);
        if (!company) {
            return NextResponse.json({ success: false, error: '회사를 찾을 수 없습니다.' }, { status: 200 });
        }

        // 회사명 중복 검사
        if (name && name !== company.name) {
            const exists = await Company.findOne({ name, _id: { $ne: companyId } });
            if (exists) {
                return NextResponse.json({ error: '이미 존재하는 회사명입니다.' }, { status: 400 });
            }
        }

        // 데이터 업데이트
        if (name !== undefined) company.name = name;
        if (description !== undefined) company.description = description;
        if (isActive !== undefined) {
            company.isActive = isActive;
            await company.save();
            // 회사 비활성화 시 하위 팀/직원 모두 비활성화 (supervisor 제외)
            await Team.updateMany({ companyId: company._id }, { isActive });
            await User.updateMany({ companyId: company._id, role: { $ne: 'supervisor' } }, { isActive });
        } else {
            await company.save();
        }
        return NextResponse.json({ success: true, company });

    } catch (error) {
        console.error('회사 수정 오류:', error);
        return NextResponse.json({ error: '회사 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// 회사 삭제 (DELETE)
// ----------------------------------------------------------------------

export async function DELETE(request, { params }) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'supervisor') {
            return NextResponse.json({ error: '슈퍼바이저만 삭제할 수 있습니다.' }, { status: 403 });
        }
        
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;
        
        await connectDB();

        // 1. 하위 팀/직원 모두 삭제 (supervisor는 절대 삭제하지 않음)
        await Team.deleteMany({ companyId });
        // supervisor 제외 (role !== 'supervisor')
        await User.deleteMany({ companyId, role: { $ne: 'supervisor' } });
        // 2. 회사 삭제
        const deletedCompany = await Company.findByIdAndDelete(companyId);

        if (!deletedCompany) {
            return NextResponse.json({ success: false, error: '회사를 찾을 수 없습니다.' }, { status: 200 });
        }

        return NextResponse.json({ success: true, message: '회사가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('회사 삭제 오류:', error);
        return NextResponse.json({ error: '회사 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}