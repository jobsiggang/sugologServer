// Service Worker for 현장사진 업로드 앱
const CACHE_NAME = 'fair-app-v1';
const RUNTIME_CACHE = 'fair-runtime-v1';

// 오프라인에서도 접근 가능한 필수 파일들
const PRECACHE_URLS = [
  '/login',
  '/upload',
  '/manifest.json'
  // 아이콘은 존재할 때만 캐시에 추가
];

// 설치 이벤트: 필수 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트: 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  // API 요청은 항상 네트워크 우선
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ success: false, message: '오프라인 상태입니다.' }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // 이미지 업로드는 네트워크 전용 (캐시 안함)
  if (event.request.method === 'POST' || event.request.method === 'PUT') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 기타 GET 요청: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME_CACHE).then((cache) => {
          return fetch(event.request).then((response) => {
            // 성공한 응답만 캐싱
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
      .catch(() => {
        // 오프라인이고 캐시도 없으면 기본 페이지
        return caches.match('/login');
      })
  );
});

// 푸시 알림 (향후 확장 가능)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('현장사진 업로드', options)
  );
});
