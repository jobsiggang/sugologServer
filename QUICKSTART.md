# 🚀 Quick Start Guide

## 빠른 시작

### 1️⃣ 초기 데이터 삽입 (이미 완료)
```bash
npm run seed
```

결과:
```
✅ MongoDB 연결 성공
✅ 업체 생성 완료: DL건설
✅ 슈퍼바이저 생성 완료: admin
✅ 업체관리자 생성 완료: manager1
✅ 직원 생성 완료: 2명
✅ 현장 생성 완료: 3개
✅ 입력양식 생성 완료: 2개
✅ 유사키 매핑 생성 완료: 6개
```

### 2️⃣ 개발 서버 실행
```bash
npm run dev
```

### 3️⃣ 로그인 테스트

브라우저에서 http://localhost:3000/login 접속

#### 슈퍼바이저로 로그인
- 사용자명: `admin`
- 비밀번호: `admin123`
- 역할: 모든 업체 및 데이터 관리

#### 업체관리자로 로그인
- 사용자명: `manager1`
- 비밀번호: `manager123`
- 역할: DL건설 업체 관리

#### 직원으로 로그인
- 사용자명: `worker1` 또는 `worker2`
- 비밀번호: `worker123`
- 역할: 사진 업로드 및 데이터 조회

## 📱 페이지 접근

### 관리자 (슈퍼바이저, 업체관리자)
로그인 후 자동으로 `/admin` 페이지로 이동

**사용 가능한 탭:**
- ✅ 직원 관리 (완전히 구현됨)
- 현장 관리 (API 완성, UI는 기본 틀만)
- 입력양식 관리 (API 완성, UI는 기본 틀만)
- 유사키 관리 (API 완성, UI는 기본 틀만)

### 직원
로그인 후 `/upload` 페이지로 이동 (기존 기능)

## 🧪 테스트 시나리오

### 직원 관리 테스트
1. `admin` 또는 `manager1`로 로그인
2. "직원 추가" 버튼 클릭
3. 새 직원 정보 입력:
   - 사용자명: `test_worker`
   - 비밀번호: `test123`
   - 이름: `테스트직원`
   - 역할: `직원`
4. "등록" 버튼 클릭
5. 테이블에서 새 직원 확인
6. "삭제" 버튼으로 테스트

### API 테스트 (Postman 또는 Thunder Client)

#### 로그인
```http
POST http://localhost:3000/api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

응답에서 `token` 복사

#### 직원 목록 조회
```http
GET http://localhost:3000/api/employees
Authorization: Bearer <YOUR_TOKEN>
```

#### 현장 목록 조회
```http
GET http://localhost:3000/api/sites
Authorization: Bearer <YOUR_TOKEN>
```

#### 양식 목록 조회
```http
GET http://localhost:3000/api/forms
Authorization: Bearer <YOUR_TOKEN>
```

#### 유사키 목록 조회
```http
GET http://localhost:3000/api/key-mappings
Authorization: Bearer <YOUR_TOKEN>
```

## 🔧 개발 팁

### 로컬스토리지 확인
브라우저 개발자 도구 > Application > Local Storage
- `token`: JWT 토큰
- `user`: 사용자 정보 (JSON)

### MongoDB 데이터 확인
1. MongoDB Compass 설치
2. URI로 연결: `mongodb+srv://fairboard:YFwSznH7ieFlepVr@cluster0.ivgrlcv.mongodb.net/`
3. `fairproject` 데이터베이스 선택
4. Collections 확인:
   - users
   - companies
   - sites
   - forms
   - keymappings

### 데이터 리셋
초기 상태로 돌아가려면:
```bash
npm run seed
```
이 명령어는 기존 데이터를 삭제하고 초기 데이터를 다시 삽입합니다.

## 📊 현재 데이터

### 업체 (1개)
- DL건설

### 사용자 (4명)
1. admin (슈퍼바이저)
2. manager1 (DL건설 업체관리자)
3. worker1 (DL건설 직원)
4. worker2 (DL건설 직원)

### 현장 (3개)
1. 양주신도시 - 용인 서천 (발포/전)
2. 옥정더퍼스트 - 고촌 센트럴자이 (석고/중)
3. 옥정메트로포레 - 포스코 덕암 (도배/후)

### 입력양식 (2개)
1. DL연간단가: 현장명, 일자, 위치, 공종코드, 물량, 공사단계
2. 품의건: 공사명, 일자, 위치, 공종명, 공사단계

### 유사키 매핑 (6개)
1. 현장명 ← 공사명, 현장명
2. 일자 ← 작업일, 날짜
3. 위치 ← 동호수
4. 공종코드 ← 공종명
5. 물량 ← 수량
6. 공사단계 ← 단계

## ❓ 자주 묻는 질문

**Q: 로그인이 안됩니다**
A: 
- 초기 데이터가 삽입되었는지 확인 (`npm run seed`)
- 개발 서버가 실행 중인지 확인 (`npm run dev`)
- 브라우저 콘솔에서 오류 메시지 확인

**Q: "접근 권한이 없습니다" 오류가 나옵니다**
A: 
- 올바른 역할로 로그인했는지 확인
- 토큰이 만료되었을 수 있음 (로그아웃 후 재로그인)

**Q: UI에서 현장/양식/유사키 관리가 안됩니다**
A: 
- API는 완성되었지만 UI는 기본 틀만 있습니다
- 필요시 직원 관리 UI를 참고하여 확장 가능

**Q: 데이터베이스를 초기화하고 싶습니다**
A: 
```bash
npm run seed
```

## 🎯 다음 단계

### UI 확장 (선택사항)
`/src/app/admin/page.js` 파일에서:
- `SiteManagement` 컴포넌트 구현
- `FormManagement` 컴포넌트 구현  
- `KeyMappingManagement` 컴포넌트 구현

`EmployeeManagement` 컴포넌트를 참고하여 동일한 패턴으로 구현하면 됩니다.

### 프로덕션 배포
1. Vercel/Netlify에 배포
2. 환경변수 설정 (MONGODB_URI, JWT_SECRET)
3. 초기 슈퍼바이저 비밀번호 변경

---

**준비 완료!** 이제 시스템을 사용할 수 있습니다. 🎉
