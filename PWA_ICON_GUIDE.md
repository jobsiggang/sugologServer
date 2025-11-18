# 현장사진 업로드 PWA 아이콘 생성 가이드

## 필요한 아이콘

직원 전용 앱을 위해 보라색(#9333ea) 테마의 아이콘이 필요합니다:

1. **icon-192.png** - 192x192 픽셀
2. **icon-512.png** - 512x512 픽셀

## 방법 1: 온라인 도구 사용 (가장 간단) ✅

### PWA Asset Generator
https://www.pwabuilder.com/imageGenerator

1. 사이트 접속
2. 512x512 정사각형 이미지 업로드 (또는 아래 방법으로 생성)
3. 자동으로 모든 크기 생성
4. 다운로드 후 `public/icons/` 폴더에 복사

## 방법 2: Figma/Canva로 직접 제작

### 디자인 가이드
```
크기: 512x512px
배경: #9333ea (보라색) 또는 투명
아이콘: 흰색 카메라 또는 사진 아이콘
스타일: 심플하고 명확한 실루엣
```

### Canva 사용법
1. https://www.canva.com 접속
2. "커스텀 크기" → 512 x 512 px
3. 배경색: #9333ea
4. 요소 추가 → "카메라" 또는 "사진" 검색
5. 흰색 아이콘 배치
6. PNG로 다운로드

### 크기 조절
```bash
# ImageMagick 사용 (설치 필요)
magick icon-512.png -resize 192x192 icon-192.png
```

## 방법 3: 임시 플레이스홀더 생성 (테스트용)

### PowerShell에서 간단한 SVG → PNG 변환

아래 코드를 `create-icons.html`로 저장 후 브라우저에서 열기:

```html
<!DOCTYPE html>
<html>
<head>
    <title>아이콘 생성기</title>
</head>
<body>
    <canvas id="canvas192" width="192" height="192"></canvas>
    <canvas id="canvas512" width="512" height="512"></canvas>
    <br>
    <button onclick="download('canvas192', 'icon-192.png')">192px 다운로드</button>
    <button onclick="download('canvas512', 'icon-512.png')">512px 다운로드</button>

    <script>
        function drawIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            // 보라색 배경
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(0, 0, size, size);
            
            // 흰색 카메라 아이콘
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = size / 40;
            
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 4;
            
            // 카메라 본체
            ctx.fillRect(size * 0.2, size * 0.35, size * 0.6, size * 0.4);
            
            // 렌즈
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // 뷰파인더
            ctx.fillRect(size * 0.3, size * 0.25, size * 0.15, size * 0.1);
        }
        
        drawIcon('canvas192', 192);
        drawIcon('canvas512', 512);
        
        function download(canvasId, filename) {
            const canvas = document.getElementById(canvasId);
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    </script>
</body>
</html>
```

## 설치 위치

생성한 아이콘을 아래 경로에 저장:

```
public/
  icons/
    icon-192.png
    icon-512.png
```

## 확인 방법

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/login` 접속
3. Chrome DevTools → Application → Manifest 확인
4. 아이콘이 제대로 로드되는지 확인

## 모바일 테스트

### Android
1. Chrome에서 사이트 접속
2. 메뉴 → "홈 화면에 추가"
3. 아이콘과 이름 확인

### iOS
1. Safari에서 사이트 접속
2. 공유 버튼 → "홈 화면에 추가"
3. 아이콘과 이름 확인

## 추천 온라인 도구

1. **Favicon.io** - https://favicon.io/favicon-generator/
   - 텍스트에서 아이콘 생성
   - 모든 크기 자동 생성

2. **RealFaviconGenerator** - https://realfavicongenerator.net/
   - 업로드 → 모든 플랫폼용 아이콘 생성

3. **Canva** - https://www.canva.com
   - 비디자이너도 쉽게 제작 가능
   - 무료 카메라 아이콘 템플릿 다양

## 현재 상태

✅ manifest.json - 보라색 테마 설정 완료
✅ Service Worker - 오프라인 지원 설정 완료
⏳ 아이콘 - 생성 필요 (현재 placeholder)

생성 후 `public/icons/` 폴더에 저장하면 자동으로 적용됩니다.
