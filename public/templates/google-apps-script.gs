/**
 * 🎯 공정한웍스 - Google Apps Script 템플릿
 * 
 * 이 스크립트를 Google Sheets에 복사하여 사용하세요
 * 각 업체는 자신의 Google Sheets와 Drive에 데이터를 저장합니다
 */

/**
 * ⚙️ GET: 현장목록 또는 사용자 목록 불러오기
 * ?sheet=현장목록 또는 ?sheet=사용자
 */
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || "현장목록"; // 기본값: 현장목록
    const ss = SpreadsheetApp.getActiveSpreadsheet(); 
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("시트를 찾을 수 없음: " + sheetName);

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(r => {
      let obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      return obj;
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ⚙️ POST: Base64 이미지 업로드
 * data: { base64, filename, entryData }
 * 폴더 구조: 일자 / 현장명 / 위치 / 공종
 * 유사키 매핑 지원
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { base64, filename, entryData } = data;
    if (!entryData) throw new Error("entryData가 누락되었습니다.");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mapSheet = ss.getSheetByName("항목명관리");
    if (!mapSheet) throw new Error("'항목명관리' 시트를 찾을 수 없습니다.");

    const mapData = mapSheet.getDataRange().getValues();
    const headers = mapData[0];
    const repIdx = headers.indexOf("대표키");
    const synIdx = headers.indexOf("유사키");

    // ✅ 대표키 매핑
    const keyMap = {};
    for (let i = 1; i < mapData.length; i++) {
      const rep = mapData[i][repIdx];
      const synonyms = mapData[i][synIdx]
        ? mapData[i][synIdx].split(",").map(s => s.trim())
        : [];
      if (rep) keyMap[rep] = [rep, ...synonyms];
    }

    // ✅ entryData 키 정규화 (대소문자 무시 + 공백 제거)
    const normalized = {};
    for (let [k, v] of Object.entries(entryData)) {
      const keyLower = k.trim().toLowerCase();
      const foundKey = Object.keys(keyMap).find(rep =>
        keyMap[rep].some(syn => syn.trim().toLowerCase() === keyLower)
      );
      normalized[foundKey || k] = v;
    }

    // ✅ 주요 항목 추출 (필수값 확인)
    const date = normalized["일자"] || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const siteName = normalized["현장명"];
    const location = normalized["위치"];
    const workType = normalized["공종"];
    const author = normalized["작성자"] || "미상";

    if (!siteName) throw new Error("현장명(또는 유사키)이 누락되었습니다.");

    // ✅ 루트 폴더 가져오기/생성
    const rootName = "공정한웍스";
    const rootFolderIter = DriveApp.getFoldersByName(rootName);
    const rootFolder = rootFolderIter.hasNext()
      ? rootFolderIter.next()
      : DriveApp.createFolder(rootName);

    // ✅ 폴더 생성 순서: 일자 → 현장명 → 위치 → 공종
    let targetFolder = rootFolder;
    const folderOrder = [
      { key: "일자", value: date },
      { key: "현장명", value: siteName },
      { key: "위치", value: location },
      { key: "공종", value: workType },
    ];

    folderOrder.forEach(({ value }) => {
      if (value) {
        const safeValue = String(value).replace(/[\\/:*?"<>|]/g, "_");
        const folderIter = targetFolder.getFoldersByName(safeValue);
        targetFolder = folderIter.hasNext()
          ? folderIter.next()
          : targetFolder.createFolder(safeValue);
      }
    });

    // ✅ 파일 이름 중복 방지 (_1, _2, _3)
    const safeFilename = getUniqueFilename(targetFolder, filename);

    // ✅ Base64 → Blob → 파일 저장
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), "image/jpeg", safeFilename);
    const file = targetFolder.createFile(blob);

    // ✅ Google Sheet 업데이트
    let sheet = ss.getSheetByName(siteName);
    if (!sheet) {
      sheet = ss.insertSheet(siteName);
      sheet.appendRow([...Object.keys(normalized), "파일명"]);
    }
    sheet.appendRow([...Object.values(normalized), safeFilename]);

    // ✅ 결과 반환
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        fileUrl: file.getUrl(),
        savedAs: safeFilename,
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 📁 중복 방지 파일명 생성 함수
 */
function getUniqueFilename(folder, originalName) {
  const ext = originalName.substring(originalName.lastIndexOf("."));
  const base = originalName.substring(0, originalName.lastIndexOf("."));
  let newName = originalName;
  let counter = 1;

  while (folder.getFilesByName(newName).hasNext()) {
    newName = `${base}_${counter}${ext}`;
    counter++;
  }

  return newName;
}
