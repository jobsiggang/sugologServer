// src/app/api/uploadPhoto/route.js (서버 측 최종 코드)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import Form from "@/models/Form";
import Upload from "@/models/Upload"; // MongoDB Upload 모델
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

/**
 * ⚡ 클라이언트로부터 일괄 이미지 데이터를 받아 GAS 업로드 및 개별 DB 기록
 * 요청 형식 (클라이언트 finalUploadPayload):
 * {
 * formId: "양식 ID",
 * formName: "양식 이름",
 * representativeData: { ... }, 
 * images: [ 
 * { filename: "photo_1.jpg", base64Image: "...", thumbnail: "...", fieldData: {...} },
 * ...
 * ]
 * }
 */
export async function POST(req) {
    try {
        // 1. 인증 및 기본 설정 확인 (기존 로직 유지)
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
        
        // 2. 요청 본문 파싱
        const { formId, formName, images } = await req.json();

        if (!formId || !images || images.length === 0) {
            return NextResponse.json({ error: '필수 데이터 (formId, images 배열)가 누락되었습니다.' }, { status: 400 });
        }
        
        const form = await Form.findById(formId);
        if (!form) {
            return NextResponse.json({ error: '양식을 찾을 수 없습니다.' }, { status: 404 });
        }

        const uploadedRecordIds = [];

        // 3. 🚨 CRITICAL: 이미지 배열 루프 및 GAS 업로드, **개별 DB 기록**
        for (const [i, image] of images.entries()) {
            const { base64Image, filename, thumbnail, fieldData } = image; 

            // fieldData에 사용자/업체 정보 추가
            const enrichedFieldData = {
                ...fieldData,
                "사용자": user.name,
                "사용자명": user.username,
                "업체명": company.name,
                "업로드_시점": new Date().toLocaleString(),
            };
            
            const uploadData = {
                base64Image,
                filename,
                formName: formName,
                fieldData: enrichedFieldData,
                folderStructure: form.folderStructure || [],
                // 시트명은 현장명과 양식명으로 구성 (개별 데이터의 현장명을 따름)
                sheetName: `${enrichedFieldData['현장명'] || company.name}_${formName}` 
            };

            console.log(`📤 [${i + 1}/${images.length}] Google Apps Script로 업로드 중: ${filename}`);

            // 4. Google Apps Script 호출
            const gasRes = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(uploadData),
            });
            
            if (!gasRes.ok) {
                console.error(`❌ GAS 응답 오류 (${i + 1}):`, gasRes.status, gasRes.statusText);
                throw new Error(`Google Apps Script 요청 실패 (${i + 1}): ${gasRes.statusText}`);
            }

            const data = await gasRes.json();

            if (!data.success) {
                console.error(`❌ GAS 오류 (${i + 1}):`, data.error);
                throw new Error(data.error || `Google Drive 업로드 실패 (${i + 1})`);
            }
            
            // 5. 🚨 개별 DB 기록 (Upload 모델 사용) - 요청하신 사항
            const individualUploadRecord = await Upload.create({
                userId: user._id,
                companyId: company._id,
                formId: form._id,
                formName: formName,
                // 💡 현재 이미지의 개별 데이터를 저장
                data: enrichedFieldData, 
                imageCount: 1, // 개별 레코드이므로 1
                imageUrls: [data.fileUrl], // GAS에서 받은 파일 URL
                thumbnails: [thumbnail], // 클라이언트에서 받은 썸네일
                folderPath: data.folderPath,
            });

            uploadedRecordIds.push(individualUploadRecord._id);

            console.log(`✅ [${i + 1}/${images.length}] DB 기록 성공: ${individualUploadRecord._id}`);
        } // End of loop

        // 6. Google 설정의 lastSync 업데이트
        company.googleSettings.lastSync = new Date();
        await company.save();

        
        // 7. 최종 응답 반환
        return NextResponse.json({
            success: true,
            message: `${images.length}개 이미지가 성공적으로 업로드 및 개별 DB에 기록되었습니다.`,
            uploadRecordIds: uploadedRecordIds,
        });

    } catch (err) {
        console.error('❌ 업로드 API 오류:', err);
        return NextResponse.json({ 
            success: false, 
            error: err.message || '업로드 처리 중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}