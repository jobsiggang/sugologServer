# 프로젝트 파일 구조

```
fair_app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── companies/
│   │   │   │   └── route.js              # 업체 관리 API
│   │   │   ├── employees/
│   │   │   │   ├── route.js              # 직원 목록, 생성 API
│   │   │   │   └── [id]/route.js         # 직원 조회, 수정, 삭제 API
│   │   │   ├── sites/
│   │   │   │   ├── route.js              # 현장 목록, 생성 API
│   │   │   │   └── [id]/route.js         # 현장 조회, 수정, 삭제 API
│   │   │   ├── forms/
│   │   │   │   ├── route.js              # 양식 목록, 생성 API
│   │   │   │   └── [id]/route.js         # 양식 조회, 수정, 삭제 API
│   │   │   ├── key-mappings/
│   │   │   │   ├── route.js              # 유사키 목록, 생성 API
│   │   │   │   └── [id]/route.js         # 유사키 조회, 수정, 삭제 API
│   │   │   ├── login/
│   │   │   │   └── route.js              # 로그인 API (업데이트)
│   │   │   ├── fetchSheet/
│   │   │   │   └── route.js              # 기존 Google Sheets API
│   │   │   ├── uploadPhoto/
│   │   │   │   └── route.js              # 기존 사진 업로드 API
│   │   │   └── verifyUser/
│   │   │       └── route.js              # 기존 사용자 검증 API
│   │   ├── admin/
│   │   │   └── page.js                   # 관리자 대시보드 (NEW)
│   │   ├── login/
│   │   │   └── page.js                   # 로그인 페이지 (업데이트)
│   │   ├── upload/
│   │   │   └── page.js                   # 사진 업로드 페이지 (기존)
│   │   ├── settings/
│   │   │   └── page.js                   # 설정 페이지 (기존)
│   │   ├── globals.css                   # 전역 스타일
│   │   ├── layout.tsx                    # 레이아웃
│   │   └── page.js                       # 홈 페이지
│   │
│   ├── components/
│   │   ├── ImageCanvas.jsx               # 기존 컴포넌트
│   │   ├── ImageEditor.jsx               # 기존 컴포넌트
│   │   └── InputForm.jsx                 # 기존 컴포넌트
│   │
│   ├── lib/
│   │   ├── mongodb.js                    # MongoDB 연결 유틸리티 (NEW)
│   │   ├── auth.js                       # JWT 인증 유틸리티 (NEW)
│   │   ├── middleware.js                 # 인증 미들웨어 (NEW)
│   │   ├── googleSheet.js                # Google Sheets 유틸리티 (기존)
│   │   ├── googleDrive.js                # Google Drive 유틸리티 (기존)
│   │   ├── createComposite.js            # 이미지 합성 유틸리티 (기존)
│   │   └── compositeConfig.js            # 합성 설정 (기존)
│   │
│   ├── models/
│   │   ├── User.js                       # 사용자 모델 (NEW)
│   │   ├── Company.js                    # 업체 모델 (NEW)
│   │   ├── Site.js                       # 현장 모델 (NEW)
│   │   ├── Form.js                       # 입력양식 모델 (NEW)
│   │   └── KeyMapping.js                 # 유사키 매핑 모델 (NEW)
│   │
│   └── types/
│       └── next-pwa.d.ts                 # PWA 타입 정의
│
├── scripts/
│   └── seedData.js                       # 초기 데이터 삽입 스크립트 (NEW)
│
├── public/
│   ├── manifest.json                     # PWA 매니페스트
│   └── icons/                            # 앱 아이콘
│
├── .env.local                            # 환경 변수 (NEW)
├── .gitignore                            # Git 제외 파일
├── package.json                          # 패키지 설정 (업데이트)
├── next.config.ts                        # Next.js 설정
├── tsconfig.json                         # TypeScript 설정
├── tailwind.config.mjs                   # TailwindCSS 설정
├── postcss.config.mjs                    # PostCSS 설정
├── README.md                             # 프로젝트 설명 (기존)
├── UPGRADE_README.md                     # 업그레이드 상세 문서 (NEW)
├── IMPLEMENTATION_SUMMARY.md             # 구현 요약 (NEW)
└── QUICKSTART.md                         # 빠른 시작 가이드 (NEW)
```

## 주요 변경 사항

### ✨ 새로 추가된 파일
- **Models** (5개): User, Company, Site, Form, KeyMapping
- **API Routes** (8개): companies, employees, sites, forms, key-mappings + [id] routes
- **Utilities** (3개): mongodb.js, auth.js, middleware.js
- **Pages** (1개): admin/page.js
- **Scripts** (1개): seedData.js
- **Docs** (3개): UPGRADE_README.md, IMPLEMENTATION_SUMMARY.md, QUICKSTART.md
- **Config** (1개): .env.local

### 🔄 수정된 파일
- **login/route.js**: Google Sheets → MongoDB 인증
- **login/page.js**: 역할별 리다이렉트 추가
- **package.json**: seed 스크립트 추가

### 📦 새로 설치된 패키지
- `mongodb` - MongoDB 드라이버
- `mongoose` - MongoDB ODM
- `bcryptjs` - 비밀번호 해싱
- `jsonwebtoken` - JWT 토큰
- `dotenv` - 환경변수 로드

### 🔒 기존 유지된 기능
- Google Sheets 연동
- Google Drive 이미지 저장
- 사진 업로드 및 합성
- PWA 기능
- 기존 컴포넌트들

## 역할별 접근 권한

```
슈퍼바이저 (supervisor)
├── ✅ 모든 업체 조회/관리
├── ✅ 모든 직원 조회/관리
├── ✅ 모든 현장 조회
├── ✅ 모든 양식 조회
└── ✅ 모든 유사키 조회

업체관리자 (company_admin)
├── ✅ 자기 회사 직원 CRUD
├── ✅ 자기 회사 현장 CRUD
├── ✅ 자기 회사 양식 CRUD
├── ✅ 자기 회사 유사키 CRUD
└── ❌ 다른 회사 데이터 접근 불가

직원 (employee)
├── ✅ 자기 회사 데이터 조회
├── ✅ 사진 업로드
└── ❌ 관리 기능 접근 불가
```

## API 엔드포인트 요약

### 인증
- `POST /api/login` - 로그인

### 업체 (슈퍼바이저 전용)
- `GET /api/companies` - 목록
- `POST /api/companies` - 생성

### 직원
- `GET /api/employees` - 목록
- `POST /api/employees` - 생성
- `GET /api/employees/[id]` - 조회
- `PUT /api/employees/[id]` - 수정
- `DELETE /api/employees/[id]` - 삭제

### 현장
- `GET /api/sites` - 목록
- `POST /api/sites` - 생성
- `GET /api/sites/[id]` - 조회
- `PUT /api/sites/[id]` - 수정
- `DELETE /api/sites/[id]` - 삭제

### 입력양식
- `GET /api/forms` - 목록
- `POST /api/forms` - 생성
- `GET /api/forms/[id]` - 조회
- `PUT /api/forms/[id]` - 수정
- `DELETE /api/forms/[id]` - 삭제

### 유사키
- `GET /api/key-mappings` - 목록
- `POST /api/key-mappings` - 생성
- `GET /api/key-mappings/[id]` - 조회
- `PUT /api/key-mappings/[id]` - 수정
- `DELETE /api/key-mappings/[id]` - 삭제

## 데이터베이스 컬렉션

```
fairproject (database)
├── users          # 사용자 (4개)
├── companies      # 업체 (1개)
├── sites          # 현장 (3개)
├── forms          # 입력양식 (2개)
└── keymappings    # 유사키 (6개)
```

## 완료 상태

### ✅ 완전히 구현된 기능
- MongoDB 연결 및 스키마
- JWT 인증 시스템
- 모든 API 엔드포인트 (CRUD)
- 직원 관리 UI
- 역할 기반 접근 제어
- 초기 데이터 삽입 스크립트

### 🔧 기본 틀만 있는 기능 (확장 가능)
- 현장 관리 UI
- 입력양식 관리 UI
- 유사키 관리 UI

### 📌 향후 개선 가능 항목
- 비밀번호 재설정
- 프로필 수정
- 데이터 내보내기/가져오기
- 로그 및 감사 추적
- 실시간 알림

---

**전체 구조 정리 완료!** 🎉
