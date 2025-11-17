/**
 * ✨ Google Apps Script V2.0 for Fair Project
 * 
 * 주요 기능:
 * - 양식별 폴더 구조 커스터마이징 지원
 * - folderStructure 파라미터로 동적 폴더 계층 생성
 * - Google Drive에 사진 저장 (폴더 구조 자동 생성)
 * - Google Sheets에 데이터 자동 기록 (양식별 시트 생성)
 * 
 * POST 요청 형식:
 * {
 *   base64Image: "data:image/jpeg;base64,...",
 *   filename: "photo_123.jpg",
 *   formName: "DL연간단가",
 *   fieldData: { "일자": "2024-11-17", "현장명": "양주신도시", "위치": "A동", ... },
 *   folderStructure: ["일자", "현장명", "위치", "공종"]
 * }
 * 
 * 폴더 구조 예시:
 * 공정한웍스/
 *   └─ 2024-11-17/
 *       └─ 양주신도시/
 *           └─ A동/
 *               └─ 타일/
 *                   └─ photo_001.jpg
 * 
 * Google Sheets 구조:
 * - 시트명: 양식명 (formName)
 * - 헤더: 작성일시, [필드명들...], 파일명, 사진링크, 폴더경로
 * - 자동으로 시트 생성 및 데이터 추가
 */

// ⚙️ 설정
const ROOT_FOLDER_NAME = "공정한웍스";

/**
 * ⚡ POST 요청 핸들러 - 이미지 업로드
 * 
 * Next.js에서 전송된 이미지를 Google Drive에 저장하고 Sheets에 기록
 * 폴더 구조는 folderStructure 배열 순서대로 동적 생성
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const {
      base64Image,
      filename,
      formName,
      fieldData,
      folderStructure
    } = data;

    // 필수 항목 검증
    if (!base64Image) throw new Error("이미지 데이터가 누락되었습니다.");
    if (!filename) throw new Error("파일명이 누락되었습니다.");
    if (!formName) throw new Error("양식명이 누락되었습니다.");
    if (!fieldData) throw new Error("입력 데이터가 누락되었습니다.");

    Logger.log(`📤 업로드 시작: ${filename} (양식: ${formName})`);
    Logger.log(`📁 폴더 구조: ${JSON.stringify(folderStructure)}`);
    Logger.log(`📋 필드 데이터: ${JSON.stringify(fieldData)}`);

    // 1. Google Drive에 이미지 저장
    const fileInfo = saveImageToDrive(
      base64Image,
      filename,
      formName,
      fieldData,
      folderStructure || []
    );

    Logger.log(`✅ Drive 저장 완료: ${fileInfo.savedFilename}`);
    Logger.log(`📁 저장 경로: ${fileInfo.folderPath}`);

    // 2. Google Sheets에 데이터 기록
    const sheetInfo = saveToSheet(
      formName,
      fieldData,
      fileInfo.fileUrl,
      fileInfo.savedFilename,
      fileInfo.folderPath
    );

    Logger.log(`✅ Sheet 기록 완료: ${sheetInfo.sheetName}, 행: ${sheetInfo.rowNumber}`);

    // 성공 응답
    return createJsonResponse({
      success: true,
      fileUrl: fileInfo.fileUrl,
      savedFilename: fileInfo.savedFilename,
      folderPath: fileInfo.folderPath,
      sheetName: sheetInfo.sheetName,
      rowNumber: sheetInfo.rowNumber,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    Logger.log(`❌ 업로드 오류: ${err.message}`);
    Logger.log(`❌ 스택: ${err.stack}`);

    return createJsonResponse({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}

/**
 * 📁 Google Drive에 이미지 저장
 * 
 * @param {string} base64Image - Base64 인코딩된 이미지
 * @param {string} filename - 원본 파일명
 * @param {string} formName - 양식명
 * @param {object} fieldData - 필드 데이터
 * @param {array} folderStructure - 폴더 계층 구조 (예: ["일자", "현장명", "위치"])
 * @returns {object} { fileUrl, savedFilename, folderPath }
 */
function saveImageToDrive(base64Image, filename, formName, fieldData, folderStructure) {
  try {
    // 루트 폴더 가져오기
    let currentFolder = getRootFolder();

    // 폴더 경로 문자열 (로그용)
    let folderPath = ROOT_FOLDER_NAME;

    // folderStructure가 있으면 동적으로 폴더 생성
    if (folderStructure && Array.isArray(folderStructure) && folderStructure.length > 0) {
      for (const fieldName of folderStructure) {
        const folderName = fieldData[fieldName] || fieldName;
        currentFolder = getOrCreateFolder(currentFolder, folderName);
        folderPath += ` / ${folderName}`;
      }
    } else {
      // 폴더 구조가 없으면 기본 구조: formName / 현장명
      currentFolder = getOrCreateFolder(currentFolder, formName);
      folderPath += ` / ${formName}`;

      const siteName = fieldData["현장명"] || "미지정";
      currentFolder = getOrCreateFolder(currentFolder, siteName);
      folderPath += ` / ${siteName}`;
    }

    // Base64 디코딩
    const base64Data = base64Image.split(',')[1] || base64Image;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      getMimeType(filename),
      filename
    );

    // 중복 파일명 처리
    const uniqueFilename = getUniqueFilename(currentFolder, filename);

    // 파일 저장
    const file = currentFolder.createFile(blob.setName(uniqueFilename));

    return {
      fileUrl: file.getUrl(),
      savedFilename: uniqueFilename,
      folderPath: folderPath
    };

  } catch (err) {
    throw new Error(`Drive 저장 실패: ${err.message}`);
  }
}

/**
 * 📊 Google Sheets에 데이터 기록
 * 
 * @param {string} sheetName - 시트명 (양식명 기준)
 * @param {object} fieldData - 필드 데이터
 * @param {string} fileUrl - 파일 URL
 * @param {string} filename - 저장된 파일명
 * @param {string} folderPath - 폴더 경로
 * @returns {object} { sheetName, rowNumber }
 */
function saveToSheet(sheetName, fieldData, fileUrl, filename, folderPath) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    // 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);

      // 헤더 생성 (필드명 + 추가 컬럼)
      const headers = [
        "작성일시",
        ...Object.keys(fieldData),
        "파일명",
        "사진링크",
        "폴더경로"
      ];

      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#4285f4")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);

      Logger.log(`✨ 새 시트 생성: ${sheetName}`);
    }

    // 헤더 가져오기
    const lastCol = sheet.getLastColumn();
    const headers = lastCol > 0 
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      : ["작성일시", ...Object.keys(fieldData), "파일명", "사진링크", "폴더경로"];

    // 데이터 행 준비
    const row = [];
    for (const header of headers) {
      if (header === "작성일시") {
        row.push(Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss"));
      } else if (header === "파일명") {
        row.push(filename);
      } else if (header === "사진링크") {
        row.push(fileUrl);
      } else if (header === "폴더경로") {
        row.push(folderPath);
      } else {
        row.push(fieldData[header] || "");
      }
    }

    // 새 행 추가
    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    // 사진링크 컬럼에 하이퍼링크 스타일 적용
    const photoColIndex = headers.indexOf("사진링크") + 1;
    if (photoColIndex > 0) {
      const cell = sheet.getRange(lastRow, photoColIndex);
      cell.setFormula(`=HYPERLINK("${fileUrl}", "📷 열기")`);
      cell.setFontColor("#1155cc");
      cell.setFontUnderline(true);
    }

    // 행 높이 자동 조정
    sheet.setRowHeight(lastRow, 25);

    return {
      sheetName: sheetName,
      rowNumber: lastRow
    };

  } catch (err) {
    throw new Error(`Sheets 기록 실패: ${err.message}`);
  }
}

/**
 * 📁 루트 폴더 가져오기 또는 생성
 */
function getRootFolder() {
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(ROOT_FOLDER_NAME);
  }
}

/**
 * 📁 하위 폴더 가져오기 또는 생성
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

/**
 * 🔍 중복 파일명 처리
 * 
 * 예: photo.jpg → photo_001.jpg
 */
function getUniqueFilename(folder, filename) {
  const files = folder.getFilesByName(filename);
  if (!files.hasNext()) {
    return filename; // 중복 없음
  }

  // 확장자 분리
  const lastDotIndex = filename.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

  // 중복 체크하며 번호 증가
  let counter = 1;
  let newFilename = `${baseName}_${String(counter).padStart(3, '0')}${extension}`;

  while (folder.getFilesByName(newFilename).hasNext()) {
    counter++;
    newFilename = `${baseName}_${String(counter).padStart(3, '0')}${extension}`;
  }

  return newFilename;
}

/**
 * 🔍 MIME 타입 추출
 */
function getMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 📤 JSON 응답 생성
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
