const CACHE_NAME = 'Safety-Manual-Team-v28'; // ✅ 캐시 버전을 이전보다 더 높은 새로운 값으로 변경!

const urlsToCache = [
    '/', // 앱의 루트 경로 (index.html)
    '/index.html', // 메인 페이지
    '/style.css',  // 기본 CSS 파일
    '/script.js',  // 기본 JavaScript 파일
    '/manifest.json', // PWA Manifest 파일
    '/offline.html', // 오프라인 대체 페이지

    // 사용하시려는 두 가지 아이콘 파일 (실제 파일 경로 확인 필수)
    '/icons/icon-192.png',
    '/icons/icon-512.png',

    // 모든 재난 가이드 HTML 페이지 (이 경로에 실제 파일이 있어야 합니다.)
    '/guides/earthquake.html',
    '/guides/typhoon.html',
    '/guides/fire.html',
    '/guides/air_pollution.html',

    // 모든 이미지 파일 (현재 'images' 폴더에 있는 모든 JPG, PNG 파일들을 여기에 추가하세요.)
    '/images/earthquake1.jpg',
    '/images/earthquake2.jpg',
    '/images/earthquake3.jpg',
    // 다른 가이드 페이지에 사용될 이미지들도 모두 여기에 추가해야 합니다.
    // 예: '/images/typhoon_map.png', '/images/fire_safety.jpg', 등.

    // 로컬 'lib' 폴더의 Swiper 라이브러리 파일
    '/lib/swiper-bundle.min.css',
    '/lib/swiper-bundle.min.js'
];

// 설치 이벤트: 필요한 모든 리소스를 캐시에 저장
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] 캐시 생성 중:', CACHE_NAME);
                // cache.addAll 대신 Promise.all과 cache.add를 사용하여 개별 오류 추적
                const cachePromises = urlsToCache.map(url => {
                    return cache.add(url).catch(error => {
                        console.error(`[ServiceWorker] 캐싱 실패! URL: ${url}, 오류:`, error);
                        // 이 오류는 Service Worker 설치 자체를 실패하게 만들 수 있습니다.
                        // 하지만 캐싱이 완벽하지 않더라도 Service Worker는 등록될 수 있습니다.
                        // 중요한 것은 Console 탭에서 이 오류를 확인하고 해당 파일 경로를 수정하는 것입니다.
                        return Promise.reject(error); // 오류를 전파하여 waitUntil이 실패하도록 함
                    });
                });
                return Promise.all(cachePromises)
                    .then(() => console.log('[ServiceWorker] 모든 필수 자원 캐싱 완료'))
                    .catch(error => {
                        console.error('[ServiceWorker] 최종 캐싱 작업 실패: 일부 파일 누락됨', error);
                    });
            })
    );
    self.skipWaiting(); // 새 Service Worker가 즉시 활성화되도록 함
});

// 활성화 이벤트: 오래된 캐시 삭제
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('Safety-Manual-Team-') && cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    console.log('[ServiceWorker] 오래된 캐시 삭제:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim(); // Service Worker가 즉시 페이지를 제어하도록 함
});

// ✅ fetch 이벤트: 캐시 우선, 네트워크 폴백 전략 구현
self.addEventListener('fetch', event => {
    // 요청이 HTTP(s)인 경우에만 처리 (크롬 확장 프로그램 요청 등은 무시)
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // 캐시에 요청된 리소스가 있다면 캐시된 응답 반환
                if (cachedResponse) {
                    // console.log('[ServiceWorker] 캐시에서 응답 반환:', event.request.url);
                    return cachedResponse;
                }

                // 캐시에 없다면 네트워크 요청
                // console.log('[ServiceWorker] 캐시에 없어 네트워크 요청:', event.request.url);
                return fetch(event.request).then(networkResponse => {
                    // 네트워크 응답이 유효하면 (200 OK 등) 캐시에 저장
                    // 응답은 한 번만 소비될 수 있으므로 clone() 사용
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        caches.open(CACHE_NAME).then(cache => {
                            // console.log('[ServiceWorker] 네트워크에서 가져와 캐싱:', event.request.url);
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse; // 네트워크 응답 반환
                }).catch(() => {
                    // 네트워크 요청 실패 시 (오프라인 등), 기본 오프라인 페이지 반환
                    // 요청이 HTML 문서일 경우에만 offline.html을 반환
                    if (event.request.destination === 'document') {
                        console.log('[ServiceWorker] 네트워크 요청 실패, offline.html 반환');
                        return caches.match('/offline.html');
                    }
                    // 그 외 리소스(이미지 등)는 캐시에 없으면 null 또는 빈 응답 반환
                    return new Response(null, { status: 404, statusText: 'Not Found (Offline)' });
                });
            })
        );
    }
});