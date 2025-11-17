import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 업체 목록 조회
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 접근 가능합니다.' }, { status: 403 });
    }

    await connectDB();

    const companies = await Company.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ 
      error: '업체 목록 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 업체 생성 (슈퍼바이저만)
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'supervisor') {
      return NextResponse.json({ error: '슈퍼바이저만 접근 가능합니다.' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ 
        error: '업체명을 입력해주세요.' 
      }, { status: 400 });
    }

    await connectDB();

    // 중복 업체명 확인
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return NextResponse.json({ 
        error: '이미 존재하는 업체명입니다.' 
      }, { status: 400 });
    }

    const newCompany = new Company({
      name,
      description: description || ''
    });

    await newCompany.save();

    return NextResponse.json({
      success: true,
      message: '업체가 성공적으로 등록되었습니다.',
      company: newCompany
    }, { status: 201 });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ 
      error: '업체 등록 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
