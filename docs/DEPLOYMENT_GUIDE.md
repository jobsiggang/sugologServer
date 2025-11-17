# 🚀 배포 실행 가이드

## 1️⃣ Git 푸시 완료 ✅

변경사항이 GitHub에 성공적으로 푸시되었습니다:
- Commit: `603a80f`
- 7개 파일 변경 (492 추가, 122 삭제)
- `vercel.json` 및 `docs/DOMAIN_SETUP.md` 포함

---

## 2️⃣ Vercel 자동 배포 확인

### Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 선택 (fair_app 또는 fairproject)
3. **Deployments** 탭 확인

### 배포 상태 확인
- ✅ **Building**: 코드 빌드 중
- ✅ **Ready**: 배포 완료
- ❌ **Error**: 에러 발생 시 로그 확인

**예상 배포 시간**: 2-5분

---

## 3️⃣ DNS 레코드 설정 (도메인이 있는 경우)

### 필요한 도메인
실제 도메인을 사용하려면 다음과 같이 설정하세요:

예시: `fairproject.com`을 사용한다고 가정

### A. 도메인 등록 업체 접속
- GoDaddy, Namecheap, Cloudflare, 가비아 등
- DNS 관리 페이지로 이동

### B. A 레코드 추가 (메인 도메인)
```
Type: A
Name: @ (또는 비워두기)
Value: 76.76.21.21
TTL: 3600 (또는 자동)
```

### C. CNAME 레코드 추가 (서브도메인)

**모바일 전용 (선택사항)**
```
Type: CNAME
Name: m
Value: cname.vercel-dns.com
TTL: 3600
```

**업체 관리자 페이지**
```
Type: CNAME
Name: manage
Value: cname.vercel-dns.com
TTL: 3600
```

**슈퍼바이저 페이지**
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

### D. DNS 전파 대기
- 일반적으로 5분 ~ 48시간 소요
- 확인 방법:
  ```bash
  nslookup fairproject.com
  nslookup manage.fairproject.com
  nslookup admin.fairproject.com
  ```

---

## 4️⃣ Vercel에서 도메인 연결

### A. Vercel 대시보드에서 도메인 추가

1. 프로젝트 선택
2. **Settings** → **Domains** 클릭
3. 다음 도메인들을 차례로 추가:

#### 메인 도메인 (모바일 업로드)
```
fairproject.com
```

#### 모바일 전용 (선택사항)
```
m.fairproject.com
```

#### 업체 관리자
```
manage.fairproject.com
```

#### 슈퍼바이저
```
admin.fairproject.com
```

### B. 도메인 추가 방법

1. **Add** 버튼 클릭
2. 도메인 입력 (예: `fairproject.com`)
3. **Add** 클릭
4. Vercel이 자동으로 DNS 확인
5. ✅ 체크마크 표시되면 연결 완료

### C. SSL 인증서 자동 발급
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 수 분 내 완료

---

## 5️⃣ 도메인이 없는 경우 - Vercel 기본 URL로 테스트

도메인이 없어도 Vercel이 제공하는 기본 URL로 테스트 가능:

### Vercel 기본 URL 확인
1. Vercel 대시보드 → 프로젝트 선택
2. **Deployments** → 최신 배포 클릭
3. **Visit** 버튼의 URL 확인

예시:
```
https://fairproject-xxxx.vercel.app
```

### 서브도메인 테스트
Vercel은 기본적으로 단일 URL만 제공하므로, 서브도메인 라우팅을 테스트하려면:

1. **브라우저에서 직접 경로 접근**:
   - `https://fairproject-xxxx.vercel.app/` (직원 업로드)
   - `https://fairproject-xxxx.vercel.app/company/dashboard` (업체관리자)
   - `https://fairproject-xxxx.vercel.app/admin` (슈퍼바이저)

2. **로그인 후 리다이렉트 테스트**:
   - 직원 계정으로 로그인 → `/`로 이동 확인
   - 업체관리자 계정으로 로그인 → `/company/dashboard`로 이동 확인
   - 슈퍼바이저 계정으로 로그인 → `/admin`으로 이동 확인

---

## 6️⃣ 배포 후 기능 테스트

### A. 기본 접속 테스트

#### 1. 직원 (모바일 업로드)
- **URL**: `https://fairproject.com` (또는 Vercel URL)
- **확인사항**:
  - [ ] 로그인 페이지 표시
  - [ ] 직원 계정으로 로그인
  - [ ] 루트(`/`)에서 ImageEditor 화면 표시
  - [ ] 사진 업로드 기능 동작
  - [ ] 모바일 반응형 UI 확인

#### 2. 업체 관리자
- **URL**: `https://manage.fairproject.com` (또는 `/company/dashboard`)
- **확인사항**:
  - [ ] 로그인 페이지 표시
  - [ ] 업체관리자 계정으로 로그인
  - [ ] 대시보드 화면 표시
  - [ ] 직원 관리 기능 확인
  - [ ] 현장 관리 기능 확인
  - [ ] 양식 관리 기능 확인

#### 3. 슈퍼바이저
- **URL**: `https://admin.fairproject.com` (또는 `/admin`)
- **확인사항**:
  - [ ] 로그인 페이지 표시
  - [ ] 슈퍼바이저 계정으로 로그인
  - [ ] 관리자 화면 표시
  - [ ] 전체 시스템 관리 기능 확인

### B. 리다이렉트 테스트
- [ ] `/upload` 접속 시 `/`로 자동 리다이렉트
- [ ] 직원 로그인 후 `/`로 이동
- [ ] 업체관리자 로그인 후 `/company/dashboard`로 이동
- [ ] 슈퍼바이저 로그인 후 `/admin`으로 이동

### C. 모바일 PWA 테스트
1. 모바일 브라우저에서 접속
2. Safari: 공유 → "홈 화면에 추가"
3. Chrome: 메뉴 → "홈 화면에 추가"
4. 홈 화면 아이콘 클릭해서 앱처럼 실행 확인

---

## 7️⃣ 문제 해결

### 배포가 실패하는 경우
1. Vercel 대시보드 → Deployments → 실패한 배포 클릭
2. 빌드 로그 확인
3. 일반적인 원인:
   - 환경 변수 누락 (`MONGODB_URI`, `JWT_SECRET`)
   - 패키지 종속성 문제
   - 빌드 오류

### 도메인이 연결되지 않는 경우
1. DNS 레코드 재확인
2. DNS 전파 대기 (최대 48시간)
3. Vercel에서 도메인 상태 확인:
   - ✅ Valid Configuration
   - ⏳ Pending Configuration
   - ❌ Invalid Configuration

### 서브도메인 라우팅이 작동하지 않는 경우
1. `vercel.json` 파일이 프로젝트 루트에 있는지 확인
2. Vercel 프로젝트 재배포:
   ```bash
   # 로컬에서
   vercel --prod
   ```
3. 브라우저 캐시 삭제 후 재시도

### MongoDB 연결 오류
1. Vercel 대시보드 → Settings → Environment Variables
2. `MONGODB_URI` 확인
3. MongoDB Atlas:
   - Network Access → IP Whitelist에 `0.0.0.0/0` 추가
   - Database Access → 사용자 권한 확인

---

## 8️⃣ 환경 변수 설정 (필수)

### Vercel 환경 변수 추가

1. Vercel 대시보드 → Settings → Environment Variables
2. 다음 변수들을 추가:

#### MONGODB_URI
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

#### JWT_SECRET
```
your-super-secret-jwt-key-here
```

#### NEXT_PUBLIC_API_URL (선택사항)
```
https://fairproject.com
```

3. **Environment** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Save** 클릭

5. 재배포 (환경 변수 적용을 위해):
   - Deployments → 최신 배포 → ⋯ 메뉴 → **Redeploy**

---

## 9️⃣ 최종 체크리스트

### 배포 전
- [x] Git 커밋 및 푸시 완료
- [ ] Vercel 프로젝트 연결 확인
- [ ] 환경 변수 설정 (`MONGODB_URI`, `JWT_SECRET`)
- [ ] MongoDB Atlas 네트워크 접근 허용 (`0.0.0.0/0`)

### 도메인 설정 (선택사항)
- [ ] DNS A 레코드 설정 (메인 도메인)
- [ ] DNS CNAME 레코드 설정 (서브도메인들)
- [ ] Vercel에서 도메인 연결
- [ ] SSL 인증서 발급 확인

### 배포 후 테스트
- [ ] 직원 로그인 → 루트(/) 업로드 화면 확인
- [ ] 업체관리자 로그인 → 대시보드 확인
- [ ] 슈퍼바이저 로그인 → 관리자 화면 확인
- [ ] `/upload` 리다이렉트 확인
- [ ] 모바일 반응형 UI 확인
- [ ] PWA 홈 화면 추가 테스트

---

## 🎉 완료!

모든 단계를 완료하면 다음과 같이 접속할 수 있습니다:

| 역할 | URL | 디바이스 |
|------|-----|----------|
| 직원 (Employee) | `https://fairproject.com` | 📱 모바일 |
| 업체관리자 (Company Admin) | `https://manage.fairproject.com` | 💻 데스크톱 |
| 슈퍼바이저 (Supervisor) | `https://admin.fairproject.com` | 💻 데스크톱 |

---

## 📞 추가 참고

- **Vercel 문서**: https://vercel.com/docs
- **Next.js 문서**: https://nextjs.org/docs
- **도메인 설정 상세**: `docs/DOMAIN_SETUP.md` 참조
