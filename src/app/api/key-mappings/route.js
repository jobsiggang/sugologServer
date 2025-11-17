import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import KeyMapping from "@/models/KeyMapping";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 유사키 목록 조회
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    // 슈퍼바이저는 모든 유사키, 업체관리자/직원은 자기 회사 유사키만
    const query = decoded.role === 'supervisor' 
      ? {} 
      : { companyId: decoded.companyId };

    const keyMappings = await KeyMapping.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      keyMappings
    });
  } catch (error) {
    console.error('Get key mappings error:', error);
    return NextResponse.json({ 
      error: '유사키 목록 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 유사키 생성
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['supervisor', 'company_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { masterKey, similarKeys, companyId } = await request.json();

    // 입력값 검증
    if (!masterKey || !similarKeys || !Array.isArray(similarKeys) || similarKeys.length === 0) {
      return NextResponse.json({ 
        error: '대표키와 유사키를 입력해주세요.' 
      }, { status: 400 });
    }

    await connectDB();

    // 업체관리자는 자기 회사에만 유사키 추가 가능
    const finalCompanyId = decoded.role === 'supervisor' 
      ? companyId 
      : decoded.companyId;

    if (!finalCompanyId) {
      return NextResponse.json({ 
        error: '업체 정보가 필요합니다.' 
      }, { status: 400 });
    }

    // 새 유사키 매핑 생성
    const newKeyMapping = new KeyMapping({
      companyId: finalCompanyId,
      masterKey,
      similarKeys
    });

    await newKeyMapping.save();

    const populatedKeyMapping = await KeyMapping.findById(newKeyMapping._id).populate('companyId', 'name');

    return NextResponse.json({
      success: true,
      message: '유사키가 성공적으로 등록되었습니다.',
      keyMapping: populatedKeyMapping
    }, { status: 201 });
  } catch (error) {
    console.error('Create key mapping error:', error);
    return NextResponse.json({ 
      error: '유사키 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
