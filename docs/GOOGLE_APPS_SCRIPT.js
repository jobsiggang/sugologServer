/**
 * 📌 Google Apps Script for Fair Project
 * MongoDB 기반 Next.js 앱과 연동
 * 
 * 주요 기능:
 * 1. GET: Next.js 앱에서 현장 목록, 양식 목록 조회
 * 2. POST: 직원이 업로드한 사진을 Google Drive에 저장하고 Sheets에 기록
 * 3. 폴더 구조: 업체명 / 일자 / 현장명 / 직원명 / 양식명
 * 4. 유사키 매핑을 통한 필드명 정규화
 */

/**
 * ⚙️ GET: 데이터 조회
 * 
 * 사용 예:
 * ?action=getForms - 양식 목록 조회
 * ?action=getSites - 현장 목록 조회
 * ?action=getKeyMappings - 유사키 매핑 조회
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let result = {};

    switch (action) {
      case 'getForms':
        // 양식 목록 조회
        const formsSheet = ss.getSheetByName("양식목록");
        if (formsSheet) {
          result = getSheetData(formsSheet);
        } else {
          result = { success: false, error: "양식목록 시트가 없습니다." };
        }
        break;

      case 'getSites':
        // 현장 목록 조회
        const sitesSheet = ss.getSheetByName("현장목록");
        if (sitesSheet) {
          result = getSheetData(sitesSheet);
        } else {
          result = { success: false, error: "현장목록 시트가 없습니다." };
        }
        break;

      case 'getKeyMappings':
        // 유사키 매핑 조회
        const keySheet = ss.getSheetByName("유사키매핑");
        if (keySheet) {
          result = getSheetData(keySheet);
        } else {
          result = { success: false, error: "유사키매핑 시트가 없습니다." };
        }
        break;

      case 'test':
        // 연결 테스트
        result = {
          success: true,
          message: "Google Apps Script 연결 성공",
          timestamp: new Date().toISOString(),
          spreadsheetId: ss.getId(),
          spreadsheetName: ss.getName()
        };
        break;

      default:
        result = {
          success: false,
          error: "지원하지 않는 action입니다. (getForms, getSites, getKeyMappings, test)"
        };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: err.message,
        stack: err.stack 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ⚙️ POST: 사진 업로드 및 데이터 저장
 * 
 * Request Body:
 * {
 *   companyName: "DL건설",
 *   employeeName: "김철수",
 *   formName: "DL연간단가",
 *   base64: "data:image/jpeg;base64,...",
 *   filename: "photo_123.jpg",
 *   entryData: {
 *     "일자": "2024-01-15",
 *     "현장명": "양주신도시",
 *     "공종코드": "1",
 *     "물량": "100",
 *     ...
 *   }
 * }
 * 
 * 폴더 구조:
 * 공정한웍스/
 *   └─ [업체명]/
 *       └─ [일자]/
 *           └─ [현장명]/
 *               └─ [직원명]/
 *                   └─ [양식명]/
 *                       └─ photo.jpg
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { 
      companyName,
      employeeName, 
      formName,
      base64, 
      filename, 
      entryData 
    } = data;

    // 필수 항목 검증
    if (!companyName) throw new Error("업체명(companyName)이 누락되었습니다.");
    if (!employeeName) throw new Error("직원명(employeeName)이 누락되었습니다.");
    if (!formName) throw new Error("양식명(formName)이 누락되었습니다.");
    if (!base64) throw new Error("이미지 데이터(base64)가 누락되었습니다.");
    if (!filename) throw new Error("파일명(filename)이 누락되었습니다.");
    if (!entryData) throw new Error("입력 데이터(entryData)가 누락되었습니다.");

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ✅ 유사키 매핑 로드
    const keyMap = loadKeyMappings(ss);

    // ✅ entryData 키 정규화 (유사키 → 마스터키)
    const normalized = normalizeKeys(entryData, keyMap);

    // ✅ 주요 항목 추출
    const date = normalized["일자"] || 
      Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const siteName = normalized["현장명"] || "미지정";

    // ✅ 타임스탬프 추가
    const timestamp = Utilities.formatDate(
      new Date(), 
      "Asia/Seoul", 
      "yyyy-MM-dd HH:mm:ss"
    );

    // ✅ Google Drive 폴더 생성 및 파일 저장
    const fileInfo = saveToGoogleDrive({
      companyName,
      date,
      siteName,
      employeeName,
      formName,
      base64,
      filename
    });

    // ✅ Google Sheets에 데이터 기록
    saveToGoogleSheets({
      ss,
      companyName,
      siteName,
      formName,
      normalized,
      employeeName,
      timestamp,
      filename: fileInfo.savedAs,
      fileUrl: fileInfo.fileUrl
    });

    // ✅ 성공 응답
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "업로드 성공",
        fileUrl: fileInfo.fileUrl,
        filename: fileInfo.savedAs,
        driveFolder: fileInfo.folderUrl,
        timestamp: timestamp
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("업로드 오류: " + err.message);
    Logger.log("스택: " + err.stack);
    
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        stack: err.stack
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 📊 시트 데이터를 JSON으로 변환
 */
function getSheetData(sheet) {
  try {
    const rows = sheet.getDataRange().getValues();
    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 🔑 유사키 매핑 로드
 * 
 * "유사키매핑" 시트 구조:
 * | 마스터키 | 기본키 | 유사키                    | 설명 |
 * |----------|--------|---------------------------|------|
 * | 현장명   | 현장   | 현장; 공사현장; 사이트    | ...  |
 * | 일자     | 날짜   | 날짜; 작업일자; date      | ...  |
 */
function loadKeyMappings(ss) {
  try {
    const mapSheet = ss.getSheetByName("유사키매핑");
    if (!mapSheet) {
      Logger.log("유사키매핑 시트가 없습니다. 매핑 없이 진행합니다.");
      return {};
    }

    const data = mapSheet.getDataRange().getValues();
    const headers = data[0];
    const masterIdx = headers.indexOf("마스터키");
    const originalIdx = headers.indexOf("기본키");
    const synonymIdx = headers.indexOf("유사키");

    if (masterIdx === -1 || synonymIdx === -1) {
      Logger.log("유사키매핑 시트 형식 오류");
      return {};
    }

    const keyMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const master = data[i][masterIdx];
      const original = originalIdx !== -1 ? data[i][originalIdx] : "";
      const synonyms = data[i][synonymIdx] 
        ? data[i][synonymIdx].toString().split(";").map(s => s.trim())
        : [];

      if (master) {
        // 마스터키를 기준으로 모든 유사키 매핑
        const allKeys = [master, original, ...synonyms].filter(k => k);
        keyMap[master] = allKeys;
      }
    }

    return keyMap;
  } catch (err) {
    Logger.log("유사키 로드 오류: " + err.message);
    return {};
  }
}

/**
 * 🔄 키 정규화 (유사키 → 마스터키)
 */
function normalizeKeys(entryData, keyMap) {
  const normalized = {};

  for (let [key, value] of Object.entries(entryData)) {
    const keyLower = key.trim().toLowerCase();
    
    // 매핑에서 해당 키 찾기
    let masterKey = key; // 기본값은 원본 키
    
    for (let [master, synonyms] of Object.entries(keyMap)) {
      const found = synonyms.some(syn => 
        syn.trim().toLowerCase() === keyLower
      );
      
      if (found) {
        masterKey = master;
        break;
      }
    }

    normalized[masterKey] = value;
  }

  return normalized;
}

/**
 * 💾 Google Drive에 파일 저장
 * 
 * 폴더 구조: 공정한웍스 / 업체명 / 일자 / 현장명 / 직원명 / 양식명
 */
function saveToGoogleDrive(params) {
  const {
    companyName,
    date,
    siteName,
    employeeName,
    formName,
    base64,
    filename
  } = params;

  // ✅ 루트 폴더 가져오기/생성
  const rootName = "공정한웍스";
  let rootFolder = getFolderByName(null, rootName);
  if (!rootFolder) {
    rootFolder = DriveApp.createFolder(rootName);
  }

  // ✅ 폴더 계층 생성
  const folderHierarchy = [
    companyName,
    date,
    siteName,
    employeeName,
    formName
  ];

  let currentFolder = rootFolder;
  for (let folderName of folderHierarchy) {
    const safeName = String(folderName).replace(/[\\/:*?"<>|]/g, "_");
    let nextFolder = getFolderByName(currentFolder, safeName);
    if (!nextFolder) {
      nextFolder = currentFolder.createFolder(safeName);
    }
    currentFolder = nextFolder;
  }

  // ✅ 중복 파일명 방지
  const uniqueFilename = getUniqueFilename(currentFolder, filename);

  // ✅ Base64 → Blob → 파일 저장
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const blob = Utilities.newBlob(
    Utilities.base64Decode(cleanBase64), 
    "image/jpeg", 
    uniqueFilename
  );
  const file = currentFolder.createFile(blob);

  return {
    fileUrl: file.getUrl(),
    savedAs: uniqueFilename,
    folderUrl: currentFolder.getUrl(),
    fileId: file.getId()
  };
}

/**
 * 📝 Google Sheets에 데이터 기록
 * 
 * 시트 이름: [업체명]_[양식명] (예: DL건설_DL연간단가)
 */
function saveToGoogleSheets(params) {
  const {
    ss,
    companyName,
    siteName,
    formName,
    normalized,
    employeeName,
    timestamp,
    filename,
    fileUrl
  } = params;

  // ✅ 시트 이름: 업체명_양식명
  const sheetName = `${companyName}_${formName}`;
  let sheet = ss.getSheetByName(sheetName);

  // ✅ 시트가 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // 헤더 생성
    const headers = [
      "업로드시간",
      "직원명",
      "현장명",
      ...Object.keys(normalized),
      "파일명",
      "파일URL"
    ];
    
    sheet.appendRow(headers);
    
    // 헤더 스타일
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
  }

  // ✅ 데이터 추가
  const rowData = [
    timestamp,
    employeeName,
    siteName,
    ...Object.values(normalized),
    filename,
    fileUrl
  ];

  sheet.appendRow(rowData);

  // ✅ 자동 필터 및 틀 고정
  if (sheet.getLastRow() === 2) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn())
      .createFilter();
  }
}

/**
 * 📁 폴더 찾기 (이름으로)
 */
function getFolderByName(parentFolder, folderName) {
  let folders;
  if (parentFolder) {
    folders = parentFolder.getFoldersByName(folderName);
  } else {
    folders = DriveApp.getFoldersByName(folderName);
  }
  
  return folders.hasNext() ? folders.next() : null;
}

/**
 * 📁 중복 방지 파일명 생성
 */
function getUniqueFilename(folder, originalName) {
  const lastDotIndex = originalName.lastIndexOf(".");
  const ext = lastDotIndex > -1 
    ? originalName.substring(lastDotIndex) 
    : "";
  const base = lastDotIndex > -1 
    ? originalName.substring(0, lastDotIndex)
    : originalName;
  
  let newName = originalName;
  let counter = 1;

  while (folder.getFilesByName(newName).hasNext()) {
    newName = `${base}_${counter}${ext}`;
    counter++;
  }

  return newName;
}

/**
 * 🔧 설정용 함수들
 */

/**
 * 초기 시트 구조 생성
 */
function setupInitialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 유사키매핑 시트
  let mappingSheet = ss.getSheetByName("유사키매핑");
  if (!mappingSheet) {
    mappingSheet = ss.insertSheet("유사키매핑");
    mappingSheet.appendRow(["마스터키", "기본키", "유사키", "설명"]);
    mappingSheet.appendRow([
      "현장명", "현장", "현장; 공사현장; 사이트; site", "공사 현장 이름"
    ]);
    mappingSheet.appendRow([
      "일자", "날짜", "날짜; 작업일자; date", "작업 날짜"
    ]);
    mappingSheet.appendRow([
      "공종", "공종명", "공종명; 작업종류; 공사종류", "공사 종류"
    ]);
  }
  
  Logger.log("초기 시트 구조 생성 완료");
}

/**
 * 테스트용 함수
 */
function testConnection() {
  Logger.log("=== 연결 테스트 시작 ===");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("스프레드시트: " + ss.getName());
  Logger.log("스프레드시트 ID: " + ss.getId());
  
  const sheets = ss.getSheets();
  Logger.log("총 시트 수: " + sheets.length);
  sheets.forEach(sheet => {
    Logger.log("- " + sheet.getName());
  });
  
  Logger.log("=== 연결 테스트 완료 ===");
}
