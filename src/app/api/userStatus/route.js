// src/app/api/userStatus/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth"; // 토큰 검증 함수를 가정

// @desc    로그인된 사용자의 활성 상태 및 전체 정보 확인
// @route   GET /api/user/status
export async function GET(req) {
    const authorizationHeader = req.headers.get('authorization');
    const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.substring(7) : null;

    if (!token) {
        return NextResponse.json({
            success: false,
            message: "인증 토큰이 필요합니다. 다시 로그인해주세요.",
        }, { status: 401 });
    }

    let decoded;
    try {
        decoded = verifyToken(token); 
        
        if (!decoded || !decoded.id) {
            return NextResponse.json({
                success: false,
                message: "토큰이 유효하지 않습니다.",
            }, { status: 401 });
        }
    } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return NextResponse.json({
            success: false,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        }, { status: 401 });
    }

    // MongoDB 연결
    try {
        await connectDB();
    } catch (dbError) {
        console.error('MongoDB 연결 실패:', dbError);
        return NextResponse.json({
            success: false,
            message: "데이터베이스 연결에 실패했습니다.",
        }, { status: 503 });
    }

    // 사용자 정보 조회 (companyId Populate 추가)
    try {
        // 토큰에 있는 ID를 사용하여 사용자를 조회하며, companyId 필드를 채웁니다.
        const user = await User.findById(decoded.id)
            .select('username name role companyId isActive')
            .populate('companyId', 'name'); // 회사 이름(name)을 가져오도록 populate 설정
        
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "사용자 정보를 찾을 수 없습니다.",
            }, { status: 404 });
        }

        // 🚨 [핵심] isActive 상태 확인
        if (user.isActive === false) {
             return NextResponse.json({
                success: false, // 활성 계정 확인에는 실패했으므로 false를 반환
                message: "계정이 현재 비활성화 상태입니다. 관리자에게 문의하세요.",
                user: {
                    isActive: false,
                }
            }, { status: 403 }); // Forbidden
        }

        // 4. 응답 생성 (클라이언트가 저장할 모든 정보 포함)
        const userCompanyId = user.companyId?._id || user.companyId;
        const userCompanyName = user.companyId?.name || '';
        
        const responseData = {
            success: true,
            user: {
                userId: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                companyId: userCompanyId,
                companyName: userCompanyName,
                isActive: user.isActive, // true
            },
            token: token, // 🚨 현재 유효한 토큰을 다시 반환
            message: "사용자 세션 및 계정 활성 상태 확인 완료",
        };
        
        console.log('✅ User status checked:', user.username, 'isActive:', user.isActive);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('User status retrieval error:', error);
        return NextResponse.json({
            success: false,
            message: "사용자 상태 조회 중 오류가 발생했습니다.",
            error: error.message,
        }, { status: 500 });
    }
}