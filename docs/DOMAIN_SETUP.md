# 도메인/서브도메인 분리 배포 가이드

## 📋 개요

이 프로젝트는 다음과 같이 역할별로 UI를 분리합니다:

- **모바일 업로드 (직원)**: 메인 도메인 (`example.com` 또는 `m.example.com`)
- **업체 관리 (Company Admin)**: 관리 서브도메인 (`manage.example.com`)
- **슈퍼바이저 관리**: 관리자 서브도메인 (`admin.example.com`)

---

## 🚀 Vercel 배포 설정

### 1. Vercel 프로젝트 설정

#### 메인 도메인 설정
1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Domains** 이동
3. 다음 도메인들을 추가:
   - `example.com` (메인 - 모바일 업로드)
   - `m.example.com` (모바일 전용 - 선택사항)
   - `manage.example.com` (업체 관리자)
   - `admin.example.com` (슈퍼바이저)

#### 도메인 추가 방법
```bash
# Vercel CLI를 사용하는 경우
vercel domains add example.com
vercel domains add m.example.com
vercel domains add manage.example.com
vercel domains add admin.example.com
```

### 2. DNS 설정

도메인 등록 업체(GoDaddy, Cloudflare, Namecheap 등)에서 다음 레코드를 추가:

#### A 레코드 (IPv4)
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 자동 또는 3600
```

#### CNAME 레코드 (서브도메인)
```
Type: CNAME
Name: m
Value: cname.vercel-dns.com
TTL: 자동 또는 3600

Type: CNAME
Name: manage
Value: cname.vercel-dns.com
TTL: 자동 또는 3600

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 자동 또는 3600
```

### 3. vercel.json 설정

프로젝트 루트의 `vercel.json` 파일에서 도메인별 라우팅이 자동으로 설정됩니다:

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "admin.(?<domain>.*)"
        }
      ],
      "destination": "/admin/:path*"
    },
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "manage.(?<domain>.*)"
        }
      ],
      "destination": "/company/dashboard/:path*"
    }
  ]
}
```

---

## 🌐 접속 시나리오

### 직원 (Employee)
- **접속 URL**: `https://example.com` 또는 `https://m.example.com`
- **동작**: 
  - 로그인하지 않은 경우 → 로그인 페이지
  - 로그인한 경우 → 바로 업로드 UI (ImageEditor)
- **용도**: 모바일 최적화된 사진 업로드 화면

### 업체 관리자 (Company Admin)
- **접속 URL**: `https://manage.example.com`
- **동작**:
  - 로그인하지 않은 경우 → 로그인 페이지
  - 로그인한 경우 → 업체 관리 대시보드
- **용도**: 데스크톱 최적화된 관리 화면 (직원, 현장, 양식, 유사키 관리)

### 슈퍼바이저 (Supervisor)
- **접속 URL**: `https://admin.example.com`
- **동작**:
  - 로그인하지 않은 경우 → 로그인 페이지
  - 로그인한 경우 → 슈퍼바이저 관리 화면
- **용도**: 데스크톱 최적화된 전체 시스템 관리

---

## 🔧 로컬 개발 환경

### hosts 파일 설정 (선택사항)

로컬에서 서브도메인 테스트를 하려면 hosts 파일을 수정:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

```
127.0.0.1 example.local
127.0.0.1 m.example.local
127.0.0.1 manage.example.local
127.0.0.1 admin.example.local
```

### 로컬 개발 서버 실행
```bash
npm run dev
```

접속:
- http://example.local:3000 (모바일 업로드)
- http://manage.example.local:3000 (업체 관리)
- http://admin.example.local:3000 (슈퍼바이저)

---

## 📱 모바일 PWA 설정

### manifest.json 확인

`public/manifest.json`에서 PWA 설정이 되어 있습니다:

```json
{
  "name": "공정한 Works",
  "short_name": "공정한",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#f0f0f0",
  "background_color": "#ffffff"
}
```

### 모바일 홈 화면 추가

1. 모바일 브라우저에서 `https://example.com` 접속
2. Safari: 공유 버튼 → "홈 화면에 추가"
3. Chrome: 메뉴 → "홈 화면에 추가"

---

## 🔐 보안 설정

### CORS 및 CSP 헤더

`vercel.json`에서 기본 보안 헤더가 설정되어 있습니다:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

1. **Settings** → **Environment Variables**
2. 다음 변수들을 추가:
   - `MONGODB_URI`: MongoDB 연결 문자열
   - `JWT_SECRET`: JWT 서명 키
   - `NEXT_PUBLIC_API_URL`: API 기본 URL (선택사항)

---

## ✅ 배포 체크리스트

### 배포 전
- [ ] `vercel.json` 파일이 프로젝트 루트에 있는지 확인
- [ ] DNS 레코드가 올바르게 설정되었는지 확인
- [ ] 환경 변수가 Vercel에 설정되었는지 확인
- [ ] MongoDB Atlas 네트워크 접근 허용 (0.0.0.0/0)

### 배포 후
- [ ] `https://example.com` 접속 → 모바일 업로드 화면 확인
- [ ] `https://manage.example.com` 접속 → 업체 관리 화면 확인
- [ ] `https://admin.example.com` 접속 → 슈퍼바이저 화면 확인
- [ ] 각 도메인에서 로그인 테스트
- [ ] 모바일에서 PWA 설치 테스트

---

## 🐛 문제 해결

### 도메인이 연결되지 않는 경우
1. DNS 전파 확인 (최대 48시간 소요):
   ```bash
   nslookup example.com
   ```
2. Vercel 대시보드에서 도메인 상태 확인
3. SSL 인증서 발급 대기 (자동, 수 분 소요)

### 서브도메인 라우팅이 작동하지 않는 경우
1. `vercel.json` 문법 확인
2. Vercel 프로젝트 재배포:
   ```bash
   vercel --prod
   ```
3. 브라우저 캐시 삭제

### 로그인 후 리다이렉트가 잘못되는 경우
1. 브라우저 개발자 도구 → Console 확인
2. localStorage의 `user` 객체 확인
3. 역할(role)이 올바른지 확인

---

## 📞 추가 지원

문제가 계속되면 다음을 확인하세요:

- Vercel 로그: https://vercel.com/your-project/deployments
- Next.js 문서: https://nextjs.org/docs
- Vercel 도메인 가이드: https://vercel.com/docs/concepts/projects/domains

---

## 🎯 요약

| 도메인 | 역할 | 디바이스 | 기능 |
|--------|------|----------|------|
| `example.com` | 직원 | 모바일 | 사진 업로드 |
| `m.example.com` | 직원 | 모바일 | 사진 업로드 (명시적) |
| `manage.example.com` | 업체관리자 | 데스크톱 | 직원/현장/양식/유사키 관리 |
| `admin.example.com` | 슈퍼바이저 | 데스크톱 | 전체 시스템 관리 |
