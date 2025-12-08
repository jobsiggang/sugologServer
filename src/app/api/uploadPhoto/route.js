// src/app/api/uploadPhoto/route.js (Next.js API Route)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import Form from "@/models/Form";
import Team from "@/models/Team";
import Upload from "@/models/Upload"; 
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Node.js 환경에서 File 객체를 Base64로 변환하는 유틸리티 함수 (서버 측에서 사용)
async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
}

/**
 * ⚡ MultiPart/form-data를 받아 GAS 업로드 및 개별 DB 기록
 * (Client의 MultiScreen/EachScreen 통합 처리용)
 */
export async function POST(req) {
    try {
        // 1. 인증 및 기본 설정 확인 (기존 로직 유지)
        const token = getTokenFromRequest(req);
        if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 200 });
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 200 });
        await connectDB();

        const user = await User.findById(decoded.userId).populate('companyId');
        if (!user || !user.companyId) return NextResponse.json({ success: false, error: '사용자 또는 업체 정보를 찾을 수 없습니다.' }, { status: 200 });

        // 팀 정보 조회 및 검증
        const teamId = decoded.teamId;
        if (!teamId) return NextResponse.json({ error: '팀 정보가 필요합니다.' }, { status: 200 });
        const team = await Team.findById(teamId);
        if (!team) return NextResponse.json({ success: false, error: '팀 정보를 찾을 수 없습니다.' }, { status: 200 });
        if (team.companyId.toString() !== user.companyId._id.toString()) {
            return NextResponse.json({ error: '팀이 회사에 속해있지 않습니다.' }, { status: 200 });
        }

        const SCRIPT_URL = team.googleSettings?.webAppUrl;
        if (!team.googleSettings?.setupCompleted || !SCRIPT_URL) {
            return NextResponse.json({ error: '팀의 Google Apps Script가 설정되지 않았습니다. 관리자에게 문의하세요.' }, { status: 200 });
        }
        
        // 2. MultiPart/form-data 파싱
        const formData = await req.formData();
        
        const totalCount = parseInt(formData.get('totalCount') || '1', 10);
        const formId = formData.get('formId');
        const formName = formData.get('formName');
        
        if (isNaN(totalCount) || totalCount < 1 || !formId) {
             return NextResponse.json({ error: '유효한 totalCount 또는 formId 값이 누락되었습니다.' }, { status: 200 });
        }

        const form = await Form.findById(formId);
        if (!form) {
            return NextResponse.json({ success: false, error: '양식을 찾을 수 없습니다.' }, { status: 200 });
        }
        
        const uploadedRecordIds = [];
        const representativeData = formData.get('representativeData') ? JSON.parse(formData.get('representativeData')) : {};
        
        // 3. 🚨 CRITICAL: 이미지 배열 루프 및 GAS 업로드, 개별 DB 기록
        for (let i = 0; i < totalCount; i++) {
            const fileKey = `file_${i}`;
            const thumbnailKey = `thumbnail_${i}`;
            const fieldDataKey = `fieldData_${i}`;

            const file = formData.get(fileKey);
            const thumbnail = formData.get(thumbnailKey);
            const fieldDataStr = formData.get(fieldDataKey);
            
            if (!file || !thumbnail || !fieldDataStr) {
                console.warn(`Skipping item ${i}: Data incomplete or file missing.`);
                continue; 
            }
            
            const fieldData = JSON.parse(fieldDataStr);
            const originalFilename = file.name;

            // 4. 파일 Base64 변환 (서버에서 GAS로 전달하기 위해)
            const base64Image = await fileToBase64(file);
            const base64Thumbnail = await fileToBase64(thumbnail);

            // 5. 필드 데이터 보강
            const enrichedFieldData = {
                ...fieldData,
                "사용자": user.name,
                "사용자명": user.username,
                "회사명": user.companyId.name,
                // "팀명": user.teamId ? team.name : '',
                "업로드_시점": new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            };
            
            // 폴더구조 항목명 값 기반 파일명 생성
            const fileNameParts = Array.isArray(form.folderStructure) && form.folderStructure.length > 0 ? form.folderStructure : [form.formName];
            let fileName = fileNameParts.map(f => enrichedFieldData[f] || f).filter(Boolean).join('_');
            if (!fileName) fileName = `${form.formName}_${i + 1}`;
            fileName += `_${Date.now()}.jpg`;
            
            
            // 7. GAS로 전송할 데이터 구조 완성
            const uploadData = {
                base64Image: `data:image/jpeg;base64,${base64Image}`,
                filename: fileName, // 폴더구조 기반 또는 양식명 기반 파일명
                formName: formName,
                fieldData: enrichedFieldData,
                folderStructure: fileNameParts, // 폴더구조가 없으면 [form.formName]
                sheetName: formName 
            };

            // 8. Google Apps Script 호출
            const gasRes = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(uploadData),
            });
            
            // ... (GAS 응답 및 오류 처리) ...
            if (!gasRes.ok) throw new Error(`Google Apps Script 요청 실패 (${i + 1}): ${gasRes.statusText}`);
            const data = await gasRes.json();
            if (!data.success) throw new Error(data.error || `Google Drive 업로드 실패 (${i + 1})`);
            
            // 9. 개별 DB 기록
            // 모든 값이 string이 되도록 변환
            const safeFieldData = Object.fromEntries(
                Object.entries(enrichedFieldData).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
            );
            const individualUploadRecord = await Upload.create({
                userId: user._id,
                companyId: user.companyId._id,
                teamId: team._id,
                formId: form._id,
                formName: formName,
                data: new Map(Object.entries(safeFieldData)),
                imageCount: 1,
                imageUrls: [data.fileUrl],
                thumbnails: [`data:image/jpeg;base64,${base64Thumbnail}`],
                folderPath: data.folderPath,
            });

            uploadedRecordIds.push(individualUploadRecord._id);
        } // End of loop

        // 10. Google 설정의 lastSync 업데이트 및 최종 응답
        team.googleSettings.lastSync = new Date();
        await team.save();

        return NextResponse.json({
            success: true,
            message: `${uploadedRecordIds.length}개 이미지가 성공적으로 업로드 및 개별 DB에 기록되었습니다.`,
            uploadRecordIds: uploadedRecordIds,
        });

    } catch (err) {
        console.error('❌ 업로드 API 오류:', err);
        return NextResponse.json({ 
            success: false, 
            error: err.message || '업로드 처리 중 오류가 발생했습니다.' 
        }, { status: 200 });
    }
}