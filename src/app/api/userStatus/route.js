import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Company from '@/models/Company';
import { verifyToken } from "@/lib/auth"; // 토큰 검증 함수를 가정

// @desc    로그인된 사용자의 활성 상태 및 전체 정보 확인 (POST 방식, Body에 토큰 포함)
// @route   POST /api/userStatus
export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ success: false, message: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const { token, userId } = body; // 클라이언트에서 보낸 토큰과 userId를 Body에서 추출

    if (!token) {
        return NextResponse.json({
            success: false,
            message: "인증 토큰이 필요합니다. 다시 로그인해주세요.",
        }, { status: 401 });
    }

    let decoded;
    try {
        // 1. 토큰 검증
        decoded = verifyToken(token); 
        
        // 토큰 내의 ID와 클라이언트가 보낸 userId가 일치하는지 확인 (선택적 보안 강화)
        // if (!decoded || !decoded.userId || decoded.userId.toString() !== userId) {
        if (!decoded ) {
             return NextResponse.json({
                success: false,
                message: "토큰 정보가 사용자 ID와 일치하지 않거나 유효하지 않습니다.",
            }, { status: 401 });
        }
    } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return NextResponse.json({
            success: false,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        }, { status: 401 });
    }

    // 2. MongoDB 연결
    try {
        await connectDB();
    } catch (dbError) {
        console.error('MongoDB 연결 실패:', dbError);
        return NextResponse.json({
            success: false,
            message: "데이터베이스 연결에 실패했습니다.",
        }, { status: 503 });
    }

    // 3. 사용자 정보 조회 (isActive 상태 및 회사 정보 포함)
    try {
        const user = await User.findById(decoded.userId)
            .select('username name role companyId isActive')
            .populate('companyId', 'name'); 
        
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "사용자 정보를 찾을 수 없습니다.",
            }, { status: 404 });
        }

        // 🚨 [핵심] isActive 상태 확인
        if (user.isActive === false) {
             return NextResponse.json({
                success: false, 
                message: "계정이 현재 비활성화 상태입니다. 관리자에게 문의하세요.",
                user: { isActive: false }
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
            token: token, // 현재 유효한 토큰을 다시 반환
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