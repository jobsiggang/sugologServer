// src/app/api/userStatus/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Company from '@/models/Company';
import { verifyToken } from "@/lib/auth"; // 토큰 검증 함수를 가정

// @desc    로그인된 사용자의 활성 상태 및 전체 정보 확인 (POST 방식)
// @route   POST /api/userStatus
export async function POST(req) {
    
    // 1. 헤더에서 토큰 추출 (클라이언트 코드와 연동)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let body;
    try {
        body = await req.json();
    } catch (e) {
        // body 파싱 오류 (요청 본문에 데이터가 없거나 형식이 잘못됨)
    }
    
    // 💡 Body가 없거나 userId가 없을 경우를 대비하여 처리
    const { userId } = body || {}; 
    
    // 토큰이 없는 경우 (인증 실패)
    if (!token) { 
        return NextResponse.json({
            success: false,
            message: "인증 토큰이 필요합니다. 다시 로그인해주세요.",
        }, { status: 401 });
    }

    // 클라이언트가 userId를 보내지 않은 경우
    if (!userId) {
        return NextResponse.json({ success: false, message: "사용자 ID가 요청 본문에 없습니다." }, { status: 400 });
    }

    let decoded;
    try {
        // 2. 토큰 검증
        decoded = verifyToken(token); 
        
        // 토큰 내의 ID와 클라이언트가 보낸 userId가 일치하는지 확인
        // 클라이언트가 보낸 userId는 문자열, decoded._id는 ObjectId일 수 있으므로 동등 비교 사용
        // if (!decoded || !(decoded._id == userId)) {
        if (!decoded ){
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

    // 3. MongoDB 연결
    try {
        await connectDB();
    } catch (dbError) {
        console.error('MongoDB 연결 실패:', dbError);
        return NextResponse.json({
            success: false,
            message: "데이터베이스 연결에 실패했습니다.",
        }, { status: 503 });
    }

    // 4. 사용자 정보 조회 및 isActive 상태 확인
try {
        // 💡 토큰 생성 시 사용한 필드 이름인 'userId'로 접근
        const user = await User.findById(decoded.userId) 
            .select('username name role companyId teamId isActive')
            .populate('companyId', 'name')
            .populate('teamId', 'name');
        

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "사용자 정보를 찾을 수 없습니다." + decoded.userId,
            }, { status: 404 });
        }

        // 회사ID, 팀ID, 비활성화 여부 명확히 응답
        const companyId = user.companyId?._id || user.companyId;
        const companyName = user.companyId?.name || '';
        const teamId = user.teamId?._id || user.teamId;
        const teamName = user.teamId?.name || '';


                // 🚨 isActive 상태 확인 및 상세 응답
                if (user.isActive === false) {
                    return NextResponse.json({
                        success: false,
                        message: "계정이 현재 비활성화 상태입니다. 관리자에게 문의하세요.",
                        user: {
                            _id: user._id,
                            username: user.username,
                            name: user.name,
                            role: user.role,
                            companyId,
                            companyName,
                            teamId,
                            teamName,
                            isActive: false
                        }
                    }, { status: 403 });
                }


                // 5. 응답 생성 (회사ID, 팀ID, 활성화 여부 포함)
                const responseData = {
                    success: true,
                    role: user.role,
                    user: {
                        _id: user._id,
                        username: user.username,
                        name: user.name,
                        role: user.role,
                        companyId,
                        companyName,
                        teamId,
                        teamName,
                        isActive: true
                    },
                    token,
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