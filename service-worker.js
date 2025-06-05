const CACHE_NAME = 'Safety-Manual-Team-v23'; // ✅ 캐시 버전을 이전보다 더 높은 새로운 값으로 변경!

const urlsToCache = [
    '/', // 앱의 루트 경로
    '/index.html', // 메인 페이지
    '/style.css',  // 기본 CSS 파일
    '/script.js',  // 기본 JavaScript 파일
    '/manifest.json', // PWA Manifest 파일
    '/offline.html', // 오프라인 대체 페이지

    // ✅ 사용하시려는 두 가지 아이콘 파일만 포함
    '/icons/icon-192.png',
    '/icons/icon-512.png',

    // 모든 재난 가이드 HTML 페이지 (이 경로에 실제 파일이 있어야 합니다.)
    '/guides/earthquake.html',
    '/guides/typhoon.html',
    '/guides/fire.html',
    '/guides/air_pollution.html',

    // 모든 이미지 파일 (현재 있는 것과 나중에 추가할 것들. 실제 파일이 이 경로에 있어야 합니다.)
    '/images/earthquake1.jpg',
    '/images/earthquake2.jpg',
    '/images/earthquake3.jpg',
    // 다른 가이드 페이지에 사용될 이미지들도 여기에 모두 추가해야 합니다.
    // 예: '/images/typhoon_example.jpg', '/images/fire_example.jpg', 등.

    // ✅ 로컬 'lib' 폴더의 Swiper 라이브러리 파일
    '/lib/swiper-bundle.min.css',
    '/lib/swiper-bundle.min.js'
];

// ✅ 설치 이벤트: 필요한 모든 리소스를 캐시에 저장
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] 캐시 생성 중:', CACHE_NAME);
                return cache.addAll(urlsToCache)
                    .then(() => console.log('[ServiceWorker] 모든 필수 자원 캐싱 완료'))
                    .catch(error => {
                        // ✅ 이 오류 메시지가 캐싱이 안 되는 직접적인 원인을 알려줍니다!
                        // (예: Uncaught (in promise) DOMException: Failed to execute 'addAll' on 'Cache': Request for /nonexistent-file.js failed with 404 response)
                        console.error('[ServiceWorker] 일부 필수 자원 캐싱 실패!:', error);
                    });
            })
    );
    self.skipWaiting(); // 새 Service Worker가 즉시 활성화되도록 함
});

// ✅ fetch 이벤트: Stale-while-revalidate 전략 (오래된 캐시 제공 후 갱신)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // 네트워크 응답이 유효하면 캐시에 저장 (동적 캐싱)
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // 네트워크 요청 실패 시 (진정한 오프라인 상태)
                // HTML 문서 요청이면 offline.html로 폴백
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
                // 다른 자원 (이미지, CSS, JS 등)은 캐시된 것이 없으면 실패하거나, 대체 리소스를 제공할 수 있습니다.
                console.warn(`[ServiceWorker] '${event.request.url}'을(를) 가져올 수 없습니다. 오프라인 모드일 수 있습니다.`);
                return null; // 캐시된 것도, 네트워크도 없으면 null 반환
            });

            // 캐시된 응답이 있으면 즉시 반환, 없으면 네트워크 요청 기다림
            return cachedResponse || fetchPromise;
        })
    );
});

// ✅ activate 이벤트: 오래된 캐시 정리
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[ServiceWorker] 이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Service Worker가 즉시 페이지를 제어하도록 함
});