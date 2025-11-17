# Fair Project - MongoDB 업그레이드 버전

## 개요

Google Sheets 기반 시스템에서 MongoDB 기반 다중 역할 관리 시스템으로 업그레이드된 프로젝트입니다.

## 주요 기능

### 역할 구분
- **슈퍼바이저(Supervisor)**: 모든 업체 및 데이터 관리
- **업체관리자(Company Admin)**: 자신의 업체 내 데이터 관리
- **직원(Employee)**: 자신의 업체 데이터 조회 및 작업

### 관리 기능

#### 1. 직원 관리 (업체관리자)
- 직원 등록 (이름, 비밀번호)
- 직원 목록 조회
- 직원 정보 수정
- 직원 삭제 (Soft Delete)

#### 2. 현장 관리
- 현장명, 공사명, 공종코드, 공종명, 공사단계 관리
- CRUD 기능 완비

#### 3. 입력양식 관리
- 양식명과 항목명 설정
- 예시: DL연간단가 (현장명, 일자, 위치, 공종코드, 물량, 공사단계)

#### 4. 유사키 관리
- 대표키와 유사키 매핑
- 데이터 입력 시 자동 매핑 지원

## 기술 스택

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://fairboard:YFwSznH7ieFlepVr@cluster0.ivgrlcv.mongodb.net/fairproject?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret (프로덕션에서는 반드시 변경하세요)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google API (기존 설정 유지)
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
GOOGLE_DRIVE_FOLDER_ID=
```

### 3. 초기 데이터 삽입

```bash
node scripts/seedData.js
```

### 4. 개발 서버 실행

```bash
npm run dev
```

서버는 http://localhost:3000 에서 실행됩니다.

## 초기 로그인 정보

초기 데이터 삽입 후 다음 계정으로 로그인 가능:

1. **슈퍼바이저**: `admin` / `admin123`
2. **업체관리자**: `manager1` / `manager123`
3. **직원1**: `worker1` / `worker123`
4. **직원2**: `worker2` / `worker123`

## API 엔드포인트

### 인증
- `POST /api/login` - 로그인

### 업체 관리 (슈퍼바이저 전용)
- `GET /api/companies` - 업체 목록 조회
- `POST /api/companies` - 업체 생성

### 직원 관리
- `GET /api/employees` - 직원 목록 조회
- `POST /api/employees` - 직원 생성
- `GET /api/employees/[id]` - 특정 직원 조회
- `PUT /api/employees/[id]` - 직원 정보 수정
- `DELETE /api/employees/[id]` - 직원 삭제

### 현장 관리
- `GET /api/sites` - 현장 목록 조회
- `POST /api/sites` - 현장 생성
- `GET /api/sites/[id]` - 특정 현장 조회
- `PUT /api/sites/[id]` - 현장 정보 수정
- `DELETE /api/sites/[id]` - 현장 삭제

### 입력양식 관리
- `GET /api/forms` - 양식 목록 조회
- `POST /api/forms` - 양식 생성
- `GET /api/forms/[id]` - 특정 양식 조회
- `PUT /api/forms/[id]` - 양식 정보 수정
- `DELETE /api/forms/[id]` - 양식 삭제

### 유사키 관리
- `GET /api/key-mappings` - 유사키 목록 조회
- `POST /api/key-mappings` - 유사키 생성
- `GET /api/key-mappings/[id]` - 특정 유사키 조회
- `PUT /api/key-mappings/[id]` - 유사키 정보 수정
- `DELETE /api/key-mappings/[id]` - 유사키 삭제

## 데이터베이스 스키마

### User (사용자)
- username: 사용자명 (unique)
- password: 암호화된 비밀번호
- name: 이름
- role: 역할 (supervisor/company_admin/employee)
- companyId: 소속 업체 (ObjectId)
- isActive: 활성 상태

### Company (업체)
- name: 업체명 (unique)
- description: 설명
- isActive: 활성 상태

### Site (현장)
- companyId: 소속 업체 (ObjectId)
- siteName: 현장명
- projectName: 공사명
- workTypeCode: 공종코드
- workTypeName: 공종명
- constructionStage: 공사단계 (전/중/후)
- isActive: 활성 상태

### Form (입력양식)
- companyId: 소속 업체 (ObjectId)
- formName: 양식명
- fields: 항목명 배열
- isActive: 활성 상태

### KeyMapping (유사키 매핑)
- companyId: 소속 업체 (ObjectId)
- masterKey: 대표키
- similarKeys: 유사키 배열
- isActive: 활성 상태

## 페이지 구조

- `/login` - 로그인 페이지
- `/admin` - 관리자 대시보드 (슈퍼바이저, 업체관리자)
- `/upload` - 사진 업로드 페이지 (직원)

## 보안 고려사항

1. **JWT Secret**: 프로덕션 환경에서는 반드시 강력한 시크릿 키로 변경
2. **비밀번호**: bcrypt를 사용한 해싱 (salt rounds: 10)
3. **역할 기반 접근 제어**: 각 API에서 사용자 역할 확인
4. **Soft Delete**: 데이터 삭제 시 실제 삭제가 아닌 isActive 플래그 변경

## 향후 개선 사항

- [ ] 현장 관리 UI 완성
- [ ] 입력양식 관리 UI 완성
- [ ] 유사키 관리 UI 완성
- [ ] 비밀번호 재설정 기능
- [ ] 프로필 관리 기능
- [ ] 데이터 내보내기/가져오기
- [ ] 로그 및 감사 추적
- [ ] 실시간 알림 기능

## 문제 해결

### MongoDB 연결 오류
- `.env.local` 파일의 `MONGODB_URI` 확인
- MongoDB Atlas 네트워크 접근 설정 확인 (IP 화이트리스트)

### 로그인 실패
- 초기 데이터가 삽입되었는지 확인 (`node scripts/seedData.js`)
- 브라우저 콘솔 및 서버 로그 확인

## 라이센스

MIT
