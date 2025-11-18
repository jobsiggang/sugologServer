# 📸 현장사진 업로드 시스템 (Fair Project)

Next.js 기반의 현장 사진 업로드 및 관리 시스템입니다.

## 🎯 주요 기능

### 직원용 (Employee)
- 📱 모바일 PWA 앱으로 설치 가능
- 📸 현장에서 사진 촬영 및 정보 입력
- 🎨 사진 + 입력정보 자동 합성
- ☁️ Google Drive/Sheets 자동 업로드
- 📋 전송기록 확인 (썸네일 미리보기)

### 업체관리자용 (Company Admin)
- 👥 직원 계정 관리 (생성/수정/삭제)
- 📝 입력양식 관리 (커스텀 필드 및 옵션)
- 🔧 Google Apps Script 연동 설정
- 📊 직원별 전송기록 조회

### 슈퍼바이저용 (Supervisor)
- 🏢 업체 관리 (생성/수정/활성화)
- 👤 업체관리자 계정 관리
- 📈 전체 시스템 모니터링

---

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3. 초기 설정

1. `/admin/setup` 접속 → 슈퍼바이저 계정 생성
2. `/supervisor/login` 로그인 → 업체 등록
3. 업체관리자 계정 생성
4. `/admin/login` 로그인 → Google 연동 설정

---

## 📦 배포 (Vercel)

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경변수 설정 (Vercel Dashboard)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

**배포 URL:** https://fairworks.vercel.app

---

## 🔧 Google Apps Script 연동

### 1. Google Sheets 설정

1. **템플릿 사본 만들기**
   - Google Sheets에서 새 스프레드시트 생성
   - 확장 프로그램 → Apps Script 클릭

2. **스크립트 배포**
   ```javascript
   // docs/GOOGLE_APPS_SCRIPT_V2.js 내용 복사
   ```
   
3. **웹 앱 배포**
   - 배포 → 새 배포
   - 유형: 웹 앱
   - 액세스 권한: **모든 사용자**
   - 배포 후 **웹 앱 URL 복사**

4. **시스템에 등록**
   - 업체관리자 로그인
   - Google 설정 → 웹 앱 URL 붙여넣기

### 2. 자동 기능

- ✅ 스프레드시트 자동 인식 (ID 입력 불필요)
- ✅ "공정한웍스" 폴더 자동 생성
- ✅ 양식별 시트 자동 생성
- ✅ 폴더 구조 자동 생성 (folderStructure 기준)

---

## 📱 PWA 설치

### 아이콘 준비

**필수 파일:**
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

**생성 방법:** `PWA_ICON_GUIDE.md` 참조

### 활성화

```javascript
// next.config.ts
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: false, // 아이콘 준비 후 false로 변경
  register: true,
  skipWaiting: true
});
```

---

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.js            # 직원 업로드 페이지 (/)
│   ├── login/             # 직원 로그인
│   ├── admin/             # 업체관리자
│   │   ├── login/
│   │   └── setup/
│   ├── supervisor/        # 슈퍼바이저
│   │   ├── login/
│   │   └── dashboard/
│   ├── company/
│   │   └── dashboard/     # 업체관리자 대시보드
│   └── api/               # API Routes
│       ├── login/
│       ├── forms/
│       ├── uploads/
│       └── companies/
├── components/            # 재사용 컴포넌트
│   ├── ImageEditor.jsx   # 메인 업로드 UI
│   ├── InputForm.jsx     # 입력 폼
│   └── ImageCanvas.jsx   # 이미지 미리보기
├── lib/                   # 유틸리티 라이브러리
│   ├── mongodb.js        # DB 연결
│   ├── auth.js           # JWT 인증
│   ├── createComposite.js # 이미지 합성
│   └── googleDrive.js    # Google 업로드
└── models/                # MongoDB 스키마
    ├── Company.js
    ├── User.js
    ├── Form.js
    └── Upload.js
```

---

## 🔐 사용자 역할

| 역할 | 로그인 경로 | 권한 |
|------|------------|------|
| **슈퍼바이저** | `/supervisor/login` | 모든 업체 관리 |
| **업체관리자** | `/admin/login` | 자기 업체 관리 |
| **직원** | `/login` | 사진 업로드만 |

---

## 🛠️ 기술 스택

- **Frontend:** Next.js 15, React, TailwindCSS
- **Backend:** Next.js API Routes, MongoDB
- **인증:** JWT (jsonwebtoken, bcryptjs)
- **이미지:** Canvas API, Base64 압축
- **외부연동:** Google Apps Script
- **배포:** Vercel
- **PWA:** @ducanh2912/next-pwa

---

## 📝 주요 파일 설명

### 모델 (Models)
- `Company.js` - 업체 정보, Google 설정
- `User.js` - 사용자 계정 (role: supervisor/company_admin/employee)
- `Form.js` - 입력양식 (fields, fieldOptions, folderStructure)
- `Upload.js` - 전송기록 (thumbnails, imageCount, status)

### 라이브러리 (Libraries)
- `createComposite.js` - 사진 + 테이블 합성 (Canvas API)
- `googleDrive.js` - Google Apps Script 업로드
- `auth.js` - JWT 토큰 생성/검증
- `mongodb.js` - MongoDB 연결 관리

### 컴포넌트 (Components)
- `ImageEditor.jsx` - 사진 촬영, 합성, 업로드, 전송기록
- `InputForm.jsx` - 동적 입력 폼 (자동완성)
- `ImageCanvas.jsx` - 합성 이미지 미리보기

---

## 🔄 업데이트 히스토리

### v1.0.0 (2025-11-18)
- ✅ 직원 업로드 PWA 완성
- ✅ 합성 이미지 썸네일 저장
- ✅ Google 설정 간소화 (Web App URL만)
- ✅ 전송기록 썸네일 미리보기
- ✅ 버튼 스타일 통일 및 크기 축소
- ✅ 양식 선택 시 자동 로드
- ✅ 역할별 로그인 포털 분리

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 GitHub Issues를 이용해주세요.

---

## 📄 라이선스

MIT License
