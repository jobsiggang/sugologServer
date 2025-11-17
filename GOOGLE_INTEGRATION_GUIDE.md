# 🎯 프로젝트 구조 업데이트 (Google Apps Script 연동)

## 핵심 변경사항

### 기존 구조 (Before)
- 중앙 집중식 Google Sheets/Drive
- 환경변수에 하드코딩된 Google Apps Script URL
- 모든 업체가 동일한 구글 계정 사용

### 새로운 구조 (After) ✨
- **업체별 독립적인 Google Sheets/Drive**
- 각 업체가 자신의 Google 계정으로 Apps Script 배포
- MongoDB에 업체별 Google 설정 저장
- 업체관리자가 직접 Google 연동 설정

## 🏗️ 업체별 Google 설정 구조

### Company 모델 확장
```javascript
{
  name: "DL건설",
  description: "도배, 타일 전문 업체",
  googleSettings: {
    webAppUrl: "https://script.google.com/macros/s/.../exec",
    spreadsheetId: "1abc...xyz",
    driveFolderId: "1def...uvw", // 선택사항
    setupCompleted: true,
    lastSync: "2025-11-17T10:30:00.000Z"
  }
}
```

## 📋 업체관리자 설정 프로세스

### 1단계: Google Sheets 템플릿 준비
```
1. 샘플 Google Sheets 복사
2. 필수 시트 생성:
   - 현장목록
   - 항목명관리
   - 사용자 (선택)
```

### 2단계: Apps Script 배포
```
1. 확장 프로그램 → Apps Script
2. 템플릿 코드 붙여넣기 (/public/templates/google-apps-script.gs)
3. 배포 → 새 배포 → 웹 앱
4. 액세스 권한: "모든 사용자"
5. 웹앱 URL 복사
```

### 3단계: 관리자 대시보드 등록
```
1. 로그인 (업체관리자 계정)
2. Google 설정 탭
3. 웹앱 URL, Spreadsheet ID 입력
4. 설정 저장 → 연결 테스트
```

## 🔄 데이터 흐름

### 사진 업로드 프로세스
```
[직원 앱]
    ↓ POST /api/uploadPhoto (with JWT token)
[Next.js API]
    ↓ 1. 토큰 검증
    ↓ 2. 사용자 정보 조회
    ↓ 3. 업체의 googleSettings 조회
    ↓ 4. 업체별 webAppUrl로 요청
[Google Apps Script]
    ↓ 1. Base64 이미지 디코딩
    ↓ 2. Google Drive에 저장 (폴더: 일자/현장/위치/공종)
    ↓ 3. Google Sheets 업데이트
    ↓ 4. 결과 반환
[Next.js API]
    ↓ Company.googleSettings.lastSync 업데이트
[직원 앱]
    ← 성공 응답
```

### Google Drive 폴더 구조 (업체별)
```
업체A의 Google Drive:
  공정한웍스/
    ├── 2025-11-17/
    │   ├── 양주신도시/
    │   │   ├── 101동/
    │   │   │   ├── 발포/
    │   │   │   │   └── photo1.jpg
    │   │   │   └── 석고/
    │   │   └── 102동/
    │   └── 옥정더퍼스트/
    └── 2025-11-18/

업체B의 Google Drive:
  공정한웍스/
    └── [업체B의 데이터...]
```

## 🆕 새로 추가된 API

### Google 설정 관리
```javascript
// 조회
GET /api/companies/[id]/google-settings
Authorization: Bearer <token>

// 업데이트
PUT /api/companies/[id]/google-settings
{
  "webAppUrl": "https://...",
  "spreadsheetId": "1abc...",
  "driveFolderId": "1def..."
}

// 연결 테스트
POST /api/companies/[id]/google-settings
```

### 업로드 API 변경
```javascript
// Before
POST /api/uploadPhoto
- 환경변수의 고정 URL 사용

// After
POST /api/uploadPhoto
Authorization: Bearer <token>
- JWT에서 사용자/업체 정보 추출
- 업체별 webAppUrl 동적 사용
- 작성자 정보 자동 추가
```

## 🎨 UI 변경사항

### 관리자 대시보드
```
탭 구조:
- 직원 관리 ✅ (완전 구현)
- 현장 관리
- 🆕 Google 설정 (완전 구현)
- 입력양식 관리
- 유사키 관리
```

### Google 설정 탭 기능
- ✅ 웹앱 URL 입력/수정
- ✅ Spreadsheet ID 입력/수정
- ✅ Drive 폴더 ID 입력/수정 (선택)
- ✅ 연결 테스트 버튼
- ✅ 설정 상태 표시 (완료/미완료)
- ✅ 마지막 동기화 시간 표시
- ✅ 설정 가이드 링크

## 📁 새로 추가된 파일

```
src/
├── models/
│   └── Company.js (수정: googleSettings 추가)
├── app/
│   ├── api/
│   │   ├── companies/
│   │   │   └── [id]/
│   │   │       └── google-settings/
│   │   │           └── route.js (NEW)
│   │   └── uploadPhoto/
│   │       └── route.js (수정: 업체별 URL 사용)
│   └── admin/
│       └── page.js (수정: Google 설정 탭 추가)

public/
├── templates/
│   └── google-apps-script.gs (NEW)
└── docs/
    └── google-setup-guide.md (NEW)

scripts/
└── seedData.js (수정: Google 설정 필드 포함)
```

## 🔐 보안 및 권한

### 역할별 Google 설정 권한
```
슈퍼바이저:
- ✅ 모든 업체의 Google 설정 조회/수정
- ✅ 모든 업체의 연결 테스트

업체관리자:
- ✅ 자기 업체의 Google 설정 조회/수정
- ✅ 자기 업체의 연결 테스트
- ❌ 다른 업체의 설정 접근 불가

직원:
- ❌ Google 설정 접근 불가
- ✅ 사진 업로드 시 자동으로 업체의 Google 사용
```

### Google Apps Script 배포 권한
```
배포 설정:
- 실행 권한: 나 (업체관리자 본인)
- 액세스 권한: 모든 사용자 ⚠️ 중요!
  → 앱에서 익명으로 접근 가능해야 함
```

## ✅ 테스트 시나리오

### 1. 업체관리자 Google 설정
```
1. manager1로 로그인
2. Google 설정 탭 클릭
3. 웹앱 URL 입력
4. Spreadsheet ID 입력
5. 설정 저장
6. 연결 테스트 → 성공 확인
```

### 2. 직원 사진 업로드
```
1. worker1로 로그인
2. 사진 촬영/선택
3. 현장 정보 입력
4. 업로드 → 자동으로 DL건설의 Google Drive에 저장
5. Google Sheets에서 데이터 확인
```

### 3. 다중 업체 테스트
```
1. 슈퍼바이저로 새 업체 생성
2. 해당 업체의 관리자 계정 생성
3. 새 업체 관리자가 별도의 Google Sheets 설정
4. 각 업체의 직원이 업로드 → 자기 업체 Drive에만 저장
```

## 📊 환경변수 변경

### Before (.env.local)
```env
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/.../exec
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL_ADMIN=https://script.google.com/.../exec
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
GOOGLE_DRIVE_FOLDER_ID=
```

### After (.env.local)
```env
# MongoDB 설정
MONGODB_URI=mongodb+srv://...

# JWT 설정
JWT_SECRET=your-secret-key

# Google 설정은 더 이상 환경변수에 저장하지 않음
# 각 업체가 DB에 자신의 설정을 저장
```

## 🎯 마이그레이션 가이드

### 기존 사용자 → 새 시스템
```
1. 각 업체별 Google Sheets 준비
2. Apps Script 템플릿 배포
3. 관리자 대시보드에서 설정 등록
4. 기존 데이터 Google Drive → 새 업체별 Drive로 이동 (수동)
```

## 🚀 배포 전 체크리스트

- [ ] MongoDB Company 모델 업데이트
- [ ] Google 설정 API 테스트
- [ ] 관리자 대시보드 Google 탭 동작 확인
- [ ] 업로드 API 업체별 URL 사용 확인
- [ ] Apps Script 템플릿 최종 검증
- [ ] 설정 가이드 문서 검토
- [ ] 다중 업체 시나리오 테스트
- [ ] 권한 체크 (슈퍼바이저/관리자/직원)

---

**업체별 Google 연동 구조 완성!** 🎉

각 업체가 독립적으로 자신의 Google Workspace를 사용할 수 있습니다.
