// src/app/api/uploadPhoto/route.js (Next.js API Route)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import Form from "@/models/Form";
import Upload from "@/models/Upload"; // MongoDB Upload 모델
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Node.js 환경에서 File 객체를 Base64로 변환하는 유틸리티 함수 (서버 측에서 사용)
async function fileToBase64(file) {
    // File 객체의 arrayBuffer()를 사용하여 바이너리 데이터 추출
    const bytes = await file.arrayBuffer();
    // Buffer로 변환 후 Base64 문자열로 인코딩
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
}

/**
 * ⚡ MultiPart/form-data를 받아 GAS 업로드 및 개별 DB 기록
 * 클라이언트에서 FormData로 전송된 파일을 처리합니다.
 */
export async function POST(req) {
    try {
        // 1. 인증 및 기본 설정 확인
        const token = getTokenFromRequest(req);
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(decoded.userId).populate('companyId');
        if (!user || !user.companyId) {
            return NextResponse.json({ error: '사용자 또는 업체 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const company = user.companyId;
        const SCRIPT_URL = company.googleSettings?.webAppUrl;
        if (!company.googleSettings?.setupCompleted || !SCRIPT_URL) {
            return NextResponse.json({ 
                error: '업체의 Google Apps Script가 설정되지 않았습니다. 관리자에게 문의하세요.' 
            }, { status: 400 });
        }
        
        // 2. 🚨 [핵심 수정] MultiPart/form-data 파싱
        const formData = await req.formData();
        
        const file = formData.get('file'); // 'file': 합성 이미지 (리사이징됨)
        const thumbnail = formData.get('thumbnail'); // 'thumbnail': 썸네일 파일
        
        const formId = formData.get('formId');
        const formName = formData.get('formName');
        const fieldDataStr = formData.get('fieldData'); // JSON 문자열
        // totalImageCount는 현재 단일 업로드이므로 '1'로 가정

        if (!file || !thumbnail || !formId || !fieldDataStr) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다. (file, thumbnail, formId, fieldData 필요)' }, { status: 400 });
        }
        
        // FormData에서 추출된 데이터 처리
        const fieldData = JSON.parse(fieldDataStr);
        const filename = file.name;

        // 3. 파일 Base64 변환 (서버에서 GAS로 전달하기 위해 파일 데이터를 Base64로 변환)
        const base64Image = await fileToBase64(file);
        const base64Thumbnail = await fileToBase64(thumbnail);

        const form = await Form.findById(formId);
        if (!form) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 4. 필드 데이터 보강
        const enrichedFieldData = {
            ...fieldData,
            "사용자": user.name,
            "사용자명": user.username,
            "업체명": company.name,
            "업로드_시점": new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        };
        
        // 5. GAS로 전송할 데이터 (GAS는 Base64를 요구하므로 Base64로 다시 포장)
       const folderNames = (form.folderStructure || []).filter(Boolean);
      const folderPathStr = folderNames.join('_');
      const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.jpg';
      const fileIndex = enrichedFieldData['파일번호'] || 1; // 필요시 동적으로
      const finalFilename = `${folderPathStr}${fileIndex ? `(${fileIndex})` : ''}${ext}`;

      const uploadData = {
          base64Image: `data:image/jpeg;base64,${base64Image}`,
          filename: finalFilename,
          formName: formName,
          fieldData: enrichedFieldData,
          folderStructure: form.folderStructure || [],
          // sheetName: `${enrichedFieldData['현장명'] || company.name}_${formName}`
      
      };
        // 6. Google Apps Script 호출
        const gasRes = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uploadData),
        });
        
        if (!gasRes.ok) {
            console.error('❌ GAS 응답 오류:', gasRes.status, gasRes.statusText);
            throw new Error(`Google Apps Script 요청 실패: ${gasRes.statusText}`);
        }

        const data = await gasRes.json();

        if (!data.success) {
            console.error('❌ GAS 오류:', data.error);
            throw new Error(data.error || 'Google Drive 업로드 실패');
        }
        
        // 7. 개별 DB 기록 (Upload 모델 사용)
        const uploadRecord = await Upload.create({
            userId: user._id,
            companyId: company._id,
            formId: form._id,
            formName: formName,
            data: enrichedFieldData, 
            imageCount: 1,
            imageUrls: [data.fileUrl], 
            thumbnails: [`data:image/jpeg;base64,${base64Thumbnail}`], // 서버에서 변환한 Base64 썸네일 저장
            folderPath: data.folderPath,
        });

        // 8. Google 설정의 lastSync 업데이트
        company.googleSettings.lastSync = new Date();
        await company.save();

        console.log('✅ 업로드 및 DB 기록 성공:', uploadRecord._id);
        
        // 9. 최종 응답 반환 (클라이언트 목록 업데이트용으로 Base64 썸네일을 다시 전달)
        return NextResponse.json({
            success: true,
            message: `이미지가 성공적으로 업로드 및 DB에 기록되었습니다.`,
            uploadRecordId: uploadRecord._id,
            thumbnails: [`data:image/jpeg;base64,${base64Thumbnail}`], 
        });

    } catch (err) {
        console.error('❌ 업로드 API 오류:', err);
        return NextResponse.json({ 
            success: false, 
            error: err.message || '업로드 처리 중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}