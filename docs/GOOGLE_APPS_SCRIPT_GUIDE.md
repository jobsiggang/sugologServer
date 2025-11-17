# 📱 Google Apps Script 연동 가이드

## 📋 개요

MongoDB 기반 Next.js 앱과 Google Sheets/Drive를 연동하는 Apps Script입니다.

---

## 🚀 설정 방법

### 1. Google Sheets 생성

1. Google Sheets 새 문서 생성
2. 이름: `공정한웍스_데이터`

### 2. Apps Script 설치

1. **확장 프로그램** → **Apps Script** 클릭
2. 기본 코드 삭제
3. `docs/GOOGLE_APPS_SCRIPT.js` 내용 전체 복사
4. 붙여넣기
5. **저장** (Ctrl+S)

### 3. 초기 시트 구조 생성

Apps Script 편집기에서:

```javascript
// 실행 → 함수 선택 → setupInitialSheets → 실행
setupInitialSheets()
```

**권한 승인**:
- "권한 검토" → Google 계정 선택
- "고급" → "안전하지 않은 페이지로 이동" 클릭
- "허용" 클릭

### 4. 웹 앱으로 배포

1. **배포** → **새 배포**
2. 설정:
   - **유형**: 웹 앱
   - **설명**: Fair Project API v1
   - **실행 계정**: 나
   - **액세스 권한**: 전체 사용자
3. **배포** 클릭
4. **웹 앱 URL** 복사 (중요!)

예시:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

### 5. Next.js 앱 환경 변수 설정

`.env.local` 파일에 추가:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

또는 Vercel 환경 변수에 추가.

---

## 📊 Google Sheets 구조

### 유사키매핑 시트

직원이 입력하는 필드명과 실제 저장될 마스터키를 매핑합니다.

| 마스터키 | 기본키 | 유사키                    | 설명           |
|----------|--------|---------------------------|----------------|
| 현장명   | 현장   | 현장; 공사현장; 사이트    | 공사 현장 이름 |
| 일자     | 날짜   | 날짜; 작업일자; date      | 작업 날짜      |
| 공종     | 공종명 | 공종명; 작업종류          | 공사 종류      |

**주의**: 유사키는 세미콜론(;)으로 구분합니다.

### 데이터 시트 (자동 생성)

업로드 시 `[업체명]_[양식명]` 형식으로 자동 생성됩니다.

예: `DL건설_DL연간단가`

| 업로드시간       | 직원명 | 현장명     | 일자       | 공종코드 | 물량 | 파일명          | 파일URL |
|------------------|--------|------------|------------|----------|------|-----------------|---------|
| 2024-01-15 10:30 | 김철수 | 양주신도시 | 2024-01-15 | 1        | 100  | photo_123.jpg   | https://... |

---

## 💾 Google Drive 폴더 구조

```
공정한웍스/
  └─ DL건설/                    (업체명)
      └─ 2024-01-15/            (일자)
          └─ 양주신도시/        (현장명)
              └─ 김철수/        (직원명)
                  └─ DL연간단가/  (양식명)
                      └─ photo_123.jpg
```

---

## 🔌 API 사용법

### GET 요청

#### 1. 연결 테스트

```javascript
GET https://script.google.com/.../exec?action=test
```

**응답**:
```json
{
  "success": true,
  "message": "Google Apps Script 연결 성공",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "spreadsheetId": "...",
  "spreadsheetName": "공정한웍스_데이터"
}
```

#### 2. 유사키 매핑 조회

```javascript
GET https://script.google.com/.../exec?action=getKeyMappings
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "마스터키": "현장명",
      "기본키": "현장",
      "유사키": "현장; 공사현장; 사이트",
      "설명": "공사 현장 이름"
    }
  ]
}
```

### POST 요청

#### 사진 업로드

```javascript
POST https://script.google.com/.../exec
Content-Type: application/json

{
  "companyName": "DL건설",
  "employeeName": "김철수",
  "formName": "DL연간단가",
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "filename": "photo_123.jpg",
  "entryData": {
    "일자": "2024-01-15",
    "현장명": "양주신도시",
    "공종코드": "1",
    "물량": "100",
    "공사단계": "중"
  }
}
```

**응답**:
```json
{
  "success": true,
  "message": "업로드 성공",
  "fileUrl": "https://drive.google.com/file/d/.../view",
  "filename": "photo_123.jpg",
  "driveFolder": "https://drive.google.com/drive/folders/...",
  "timestamp": "2024-01-15 10:30:45"
}
```

---

## 🔧 Next.js 코드 예시

### 환경 변수 사용

```javascript
// lib/googleAppsScript.js
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

export async function uploadToGoogleDrive(data) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

export async function testGoogleConnection() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=test`);
  return await response.json();
}

export async function getKeyMappings() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getKeyMappings`);
  return await response.json();
}
```

### ImageEditor에서 사용

```javascript
// components/ImageEditor.jsx
import { uploadToGoogleDrive } from '@/lib/googleAppsScript';

const handleUpload = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const uploadData = {
      companyName: user.companyName,
      employeeName: user.name,
      formName: selectedForm.formName,
      base64: imageData, // canvas.toDataURL()
      filename: `${Date.now()}.jpg`,
      entryData: formData // 사용자가 입력한 데이터
    };
    
    const result = await uploadToGoogleDrive(uploadData);
    
    if (result.success) {
      alert('업로드 성공!');
      console.log('파일 URL:', result.fileUrl);
    } else {
      alert('업로드 실패: ' + result.error);
    }
  } catch (error) {
    console.error('업로드 오류:', error);
    alert('업로드 중 오류가 발생했습니다.');
  }
};
```

---

## 🐛 문제 해결

### 1. CORS 오류

**증상**: `No 'Access-Control-Allow-Origin' header`

**해결**:
- Apps Script는 자동으로 CORS를 허용합니다
- 배포 시 "액세스 권한"을 "전체 사용자"로 설정했는지 확인

### 2. 권한 오류

**증상**: `You do not have permission to call...`

**해결**:
1. Apps Script 편집기에서 함수 직접 실행
2. 권한 승인
3. 다시 배포

### 3. 업로드 실패

**증상**: `entryData가 누락되었습니다`

**해결**:
- POST 요청 body에 모든 필수 필드 포함 확인:
  - companyName
  - employeeName
  - formName
  - base64
  - filename
  - entryData

### 4. 시트가 생성되지 않음

**증상**: 데이터 시트가 자동 생성되지 않음

**해결**:
1. Apps Script에서 `setupInitialSheets()` 실행
2. Google Sheets 편집 권한 확인

### 5. 파일이 Drive에 저장되지 않음

**증상**: Sheets에는 기록되지만 Drive에 파일 없음

**해결**:
- base64 데이터 형식 확인: `data:image/jpeg;base64,...`
- Drive API 권한 확인

---

## 📝 로그 확인

Apps Script 편집기에서:

1. **실행** 탭 클릭
2. 최근 실행 내역 확인
3. 오류 메시지 확인

또는:

```javascript
Logger.log("디버그 메시지");
```

**보기** → **로그** (Ctrl+Enter)

---

## 🔐 보안 고려사항

### 1. Apps Script URL 보호

- 환경 변수에만 저장
- 코드에 직접 노출 금지
- `.env.local`을 `.gitignore`에 추가

### 2. 데이터 검증

Apps Script에서 자동으로 검증:
- 필수 필드 확인
- 파일 형식 확인 (이미지만)
- SQL Injection 방지 (Sheets는 SQL 미사용)

### 3. 폴더 권한

- Drive 폴더는 Apps Script 실행 계정 소유
- 공유 설정은 수동으로 관리

---

## 🎯 주요 기능

### ✅ 구현 완료

- [x] 사진 업로드 및 Drive 저장
- [x] Google Sheets에 데이터 기록
- [x] 유사키 매핑을 통한 필드명 정규화
- [x] 폴더 계층 자동 생성
- [x] 파일명 중복 방지
- [x] 타임스탬프 자동 기록
- [x] 업체별/양식별 시트 자동 생성

### 🔄 향후 개선 사항

- [ ] 이미지 리사이징 (용량 최적화)
- [ ] 썸네일 자동 생성
- [ ] 일괄 업로드 지원
- [ ] 업로드 진행률 표시
- [ ] Drive 용량 모니터링

---

## 📞 지원

문제가 발생하면:

1. **로그 확인**: Apps Script 실행 로그
2. **권한 확인**: Google Sheets/Drive 접근 권한
3. **배포 확인**: 웹 앱 URL 유효성
4. **환경 변수 확인**: Next.js .env.local 설정

---

## 📚 참고 자료

- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Sheets API 가이드](https://developers.google.com/sheets/api)
- [Drive API 가이드](https://developers.google.com/drive/api)
