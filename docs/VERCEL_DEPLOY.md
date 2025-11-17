# 🚀 Vercel 기본 URL 배포 가이드

## 📋 개요

도메인 없이 Vercel이 제공하는 기본 URL로 앱을 배포하고 테스트하는 가이드입니다.

---

## 1️⃣ 현재 상태 확인 ✅

### Git 푸시 완료
- ✅ Commit: `603a80f`
- ✅ 7개 파일 변경사항 푸시 완료
- ✅ GitHub에 자동 업로드됨

### 주요 변경사항
- 직원 업로드 UI: `/upload` → `/` (루트)
- 로그인 리다이렉트 수정
- `vercel.json` 설정 파일 추가
- `/upload` → `/` 영구 리다이렉트

---

## 2️⃣ Vercel 배포 확인

### A. Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 찾기 (fair_app 또는 fairproject)
3. 최신 배포 상태 확인

### B. 배포 상태
- **Building** 🔨: 빌드 진행 중
- **Ready** ✅: 배포 완료
- **Error** ❌: 오류 발생

### C. Vercel URL 확인
배포가 완료되면 다음과 같은 URL이 생성됩니다:
```
https://fair-app-xxxx.vercel.app
또는
https://fairproject-xxxx.vercel.app
```

**URL 찾는 방법**:
1. Vercel 대시보드 → 프로젝트 클릭
2. 상단의 **Visit** 버튼 옆 URL 복사
3. 또는 **Deployments** → 최신 배포 → **View Deployment**

---

## 3️⃣ 환경 변수 설정 (필수) ⚠️

배포 후 반드시 환경 변수를 설정해야 합니다!

### A. Vercel 대시보드에서 설정
1. 프로젝트 선택
2. **Settings** → **Environment Variables** 클릭

### B. 필수 환경 변수 추가

#### 1. MONGODB_URI
```
mongodb+srv://username:password@cluster.mongodb.net/fairproject?retryWrites=true&w=majority
```
- MongoDB Atlas 연결 문자열
- Database → Connect → Connect your application에서 복사

#### 2. JWT_SECRET
```
your-super-secret-jwt-key-minimum-32-characters
```
- 랜덤 문자열 (최소 32자 권장)
- 예: `fair_project_jwt_secret_2024_production_key`

#### 3. NEXT_PUBLIC_API_URL (선택사항)
```
https://fair-app-xxxx.vercel.app
```
- 자신의 Vercel URL 입력

### C. Environment 설정
모든 환경에 적용:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### D. 재배포
환경 변수 추가 후:
1. **Deployments** 탭 이동
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 선택
4. 재배포 완료 대기 (1-2분)

---

## 4️⃣ MongoDB Atlas 설정 확인

### Network Access 설정
1. MongoDB Atlas 로그인
2. **Network Access** 메뉴
3. **IP Access List** 확인
4. Vercel 접속을 위해 모든 IP 허용:
   - **Add IP Address** 클릭
   - **Allow Access from Anywhere** 선택
   - IP: `0.0.0.0/0` 자동 입력
   - **Confirm** 클릭

⚠️ **보안 주의**: 프로덕션 환경에서는 Vercel IP만 허용하는 것이 좋지만, 테스트 단계에서는 `0.0.0.0/0`으로 설정합니다.

---

## 5️⃣ 접속 테스트

### Vercel 기본 URL로 접속

도메인이 없으므로 Vercel URL로 직접 접속합니다:

#### A. 메인 페이지 (직원 업로드)
```
https://fair-app-xxxx.vercel.app/
```
- 로그인하지 않은 경우: 로그인 페이지
- 직원으로 로그인: ImageEditor 업로드 화면

#### B. 업체 관리자 페이지
```
https://fair-app-xxxx.vercel.app/company/dashboard
```
- 업체관리자 계정으로 로그인 필요
- 직원/현장/양식 관리 화면

#### C. 슈퍼바이저 페이지
```
https://fair-app-xxxx.vercel.app/admin
```
- 슈퍼바이저 계정으로 로그인 필요
- 전체 시스템 관리 화면

#### D. 로그인 페이지
```
https://fair-app-xxxx.vercel.app/login
```

---

## 6️⃣ 역할별 접속 시나리오

### 🧑 직원 (Employee)

1. **접속**: `https://fair-app-xxxx.vercel.app/`
2. **로그인 화면** 표시
3. 직원 계정으로 로그인 (예: `employee1` / `password123`)
4. **자동 리다이렉트**: `/` (루트)
5. **ImageEditor 화면** 표시
6. 사진 업로드 테스트

### 👔 업체 관리자 (Company Admin)

1. **접속**: `https://fair-app-xxxx.vercel.app/`
2. **로그인 화면** 표시
3. 업체관리자 계정으로 로그인 (예: `company_admin1` / `password123`)
4. **자동 리다이렉트**: `/company/dashboard`
5. **관리 대시보드** 표시
6. 직원/현장/양식 관리 테스트

### 🔧 슈퍼바이저 (Supervisor)

1. **접속**: `https://fair-app-xxxx.vercel.app/`
2. **로그인 화면** 표시
3. 슈퍼바이저 계정으로 로그인 (예: `supervisor1` / `password123`)
4. **자동 리다이렉트**: `/admin`
5. **관리자 화면** 표시
6. 전체 시스템 관리 테스트

---

## 7️⃣ 기능 테스트 체크리스트

### ✅ 기본 기능
- [ ] Vercel URL 접속 성공
- [ ] 로그인 페이지 표시
- [ ] 회원가입 기능 (있는 경우)

### ✅ 직원 기능
- [ ] 직원 계정 로그인
- [ ] `/`에서 ImageEditor 표시 확인
- [ ] 사진 선택 및 업로드
- [ ] 양식 선택 (드롭다운)
- [ ] 필드 입력
- [ ] Google Drive 업로드 성공
- [ ] Google Sheets 기록 성공

### ✅ 업체 관리자 기능
- [ ] 업체관리자 계정 로그인
- [ ] `/company/dashboard`로 자동 이동
- [ ] 직원 목록 조회
- [ ] 직원 추가/수정/삭제
- [ ] 현장 관리
- [ ] 양식 관리
- [ ] 유사키 매핑 관리

### ✅ 슈퍼바이저 기능
- [ ] 슈퍼바이저 계정 로그인
- [ ] `/admin`으로 자동 이동
- [ ] 전체 시스템 관리 기능

### ✅ 리다이렉트 테스트
- [ ] `/upload` 접속 시 `/`로 자동 리다이렉트
- [ ] 직원 로그인 후 `/`로 이동
- [ ] 업체관리자 로그인 후 `/company/dashboard`로 이동
- [ ] 슈퍼바이저 로그인 후 `/admin`으로 이동

### ✅ 모바일 테스트
- [ ] 모바일 브라우저에서 접속
- [ ] 반응형 UI 확인
- [ ] 터치 인터페이스 동작
- [ ] 사진 촬영/업로드

---

## 8️⃣ 문제 해결

### 배포가 실패하는 경우

#### 1. 빌드 로그 확인
- Vercel 대시보드 → Deployments
- 실패한 배포 클릭
- **Build Logs** 확인

#### 2. 일반적인 오류

**환경 변수 누락**
```
Error: MONGODB_URI is not defined
```
→ Settings → Environment Variables에서 추가 후 재배포

**빌드 오류**
```
Error: Build failed
```
→ 로그에서 구체적인 오류 확인
→ 로컬에서 `npm run build` 테스트

**런타임 오류**
```
500 Internal Server Error
```
→ Vercel 대시보드 → Functions → Logs 확인
→ MongoDB 연결 상태 확인

### MongoDB 연결 실패

#### 증상
- 로그인 안됨
- "Database connection failed" 오류

#### 해결
1. MongoDB Atlas에서 Network Access 확인
2. `0.0.0.0/0` 허용되어 있는지 확인
3. `MONGODB_URI` 환경 변수 정확한지 확인
4. MongoDB 클러스터 상태 확인 (Running)

### 로그인 후 리다이렉트 안되는 경우

#### 증상
- 로그인은 되지만 화면 이동 안됨
- 무한 로딩

#### 해결
1. 브라우저 개발자 도구 (F12) → Console 확인
2. localStorage 확인:
   ```javascript
   console.log(localStorage.getItem('user'))
   ```
3. 역할(role) 확인:
   - `employee` → `/`로 이동해야 함
   - `company_admin` → `/company/dashboard`
   - `supervisor` → `/admin`

### 이미지 업로드 실패

#### 증상
- 사진 선택은 되지만 업로드 안됨
- "Upload failed" 오류

#### 해결
1. Google Drive API 설정 확인
2. Service Account 키 파일 확인
3. Google Sheets API 활성화 확인
4. Vercel 환경 변수에 Google 관련 설정 추가 (필요 시)

---

## 9️⃣ 개발자 도구 활용

### 브라우저 개발자 도구 (F12)

#### Console 탭
- JavaScript 오류 확인
- API 응답 확인
- 로그 메시지 확인

#### Network 탭
- API 요청/응답 확인
- 상태 코드 확인 (200, 401, 500 등)
- 요청 데이터 확인

#### Application 탭
- localStorage 확인
- 쿠키 확인
- Service Worker 상태 (PWA)

### Vercel 로그 확인

1. Vercel 대시보드 → 프로젝트
2. **Functions** 탭
3. **Logs** 확인
4. 실시간 로그 모니터링

---

## 🔟 다음 단계 (선택사항)

### 도메인 연결 (나중에)

나중에 도메인을 구매하면:

1. **도메인 구매** (가비아, GoDaddy 등)
2. **DNS 설정** (A, CNAME 레코드)
3. **Vercel에 도메인 연결**
4. **SSL 자동 발급**

자세한 내용은 `docs/DOMAIN_SETUP.md` 참조

### 성능 최적화

- 이미지 최적화
- 코드 스플리팅
- 캐싱 전략
- CDN 활용

### 보안 강화

- MongoDB IP 화이트리스트 제한
- 환경 변수 보안
- HTTPS 강제
- CSP 헤더 추가

---

## 📞 빠른 참조

### 주요 URL 구조 (Vercel 기본 URL)

```
메인 (직원 업로드)
https://fair-app-xxxx.vercel.app/

로그인
https://fair-app-xxxx.vercel.app/login

업체 관리자
https://fair-app-xxxx.vercel.app/company/dashboard

슈퍼바이저
https://fair-app-xxxx.vercel.app/admin

직원 대시보드
https://fair-app-xxxx.vercel.app/employee
```

### 테스트 계정 (예시)

데이터베이스에 다음 계정이 있다고 가정:

```
직원:
- 사용자명: employee1
- 비밀번호: password123
- 역할: employee

업체관리자:
- 사용자명: company_admin1
- 비밀번호: password123
- 역할: company_admin

슈퍼바이저:
- 사용자명: supervisor1
- 비밀번호: password123
- 역할: supervisor
```

---

## ✅ 최종 체크리스트

### 배포 전
- [x] Git 커밋 및 푸시
- [ ] Vercel 프로젝트 연결 확인
- [ ] MongoDB Atlas 네트워크 접근 허용

### 배포 중
- [ ] Vercel 자동 배포 확인
- [ ] 빌드 성공 확인
- [ ] 환경 변수 설정
- [ ] 재배포

### 배포 후
- [ ] Vercel URL 접속 테스트
- [ ] 로그인 기능 테스트
- [ ] 각 역할별 리다이렉트 확인
- [ ] 업로드 기능 테스트
- [ ] 모바일 반응형 확인

---

## 🎉 요약

**현재 상태**:
- ✅ 코드 변경 완료
- ✅ Git 푸시 완료
- ⏳ Vercel 배포 대기 중

**다음 할 일**:
1. Vercel 대시보드에서 배포 확인
2. 환경 변수 설정 (`MONGODB_URI`, `JWT_SECRET`)
3. MongoDB Network Access 확인 (`0.0.0.0/0`)
4. 재배포
5. Vercel URL로 접속 테스트

**도메인 없이도 완전히 동작합니다!** 🚀
