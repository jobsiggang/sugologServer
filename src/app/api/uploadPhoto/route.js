import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

/**
 * ⚡ 여러 장의 이미지를 업체별 Google Apps Script로 업로드
 * 요청 형식:
 * [
 *   { base64: "data...", filename: "photo1.jpg", entryData: {...} },
 *   { base64: "data...", filename: "photo2.jpg", entryData: {...} },
 *   ...
 * ]
 */
export async function POST(req) {
  try {
    // 인증 확인
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    // 사용자 정보 조회
    const user = await User.findById(decoded.userId).populate('companyId');
    if (!user || !user.companyId) {
      return NextResponse.json({ error: '사용자 또는 업체 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 업체의 Google 설정 확인
    const company = user.companyId;
    if (!company.googleSettings.setupCompleted || !company.googleSettings.webAppUrl) {
      return NextResponse.json({ 
        error: '업체의 Google Apps Script가 설정되지 않았습니다. 관리자에게 문의하세요.' 
      }, { status: 400 });
    }

    const uploads = await req.json();

    // 단일 업로드일 경우도 배열로 통일
    const uploadList = Array.isArray(uploads) ? uploads : [uploads];

    if (uploadList.length === 0) {
      throw new Error("업로드할 데이터가 없습니다.");
    }

    // 업체별 Google Apps Script URL 사용
    const SCRIPT_URL = company.googleSettings.webAppUrl;

    // ⚡ 여러 장의 이미지를 순차적으로 업로드
    const results = [];
    for (const { base64, filename, entryData } of uploadList) {
      // entryData에 작성자 정보 추가 (자동으로)
      const enrichedEntryData = {
        ...entryData,
        "작성자": user.name,
        "사용자명": user.username,
      };

      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          base64, 
          filename, 
          entryData: enrichedEntryData 
        }),
      });

      if (!res.ok) {
        results.push({
          filename,
          success: false,
          error: `Apps Script 요청 실패: ${res.status}`,
        });
        continue;
      }

      const data = await res.json();
      results.push({ filename, ...data });
    }

    // Google 설정의 lastSync 업데이트
    company.googleSettings.lastSync = new Date();
    await company.save();

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      company: company.name
    });
  } catch (err) {
    console.error("❌ 업로드 오류:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
