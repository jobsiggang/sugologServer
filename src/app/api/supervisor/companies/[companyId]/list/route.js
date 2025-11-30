import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import team from "@/models/team";

// 모든 활성 팀 목록 조회 (로그인 화면용)
export async function GET() {
  try {
    await connectDB();
    
    const companies = await team.find({ isActive: true })
      .select('name')
      .sort({ name: 1 });

    return NextResponse.json({ 
      success: true, 
      companies 
    });
  } catch (error) {
    console.error('Get companies list error:', error);
    return NextResponse.json({ 
      error: '팀 목록 조회 실패' 
    }, { status: 500 });
  }
}
