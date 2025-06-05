const CACHE_NAME = 'Safety-Manual-Team-v39'; // ✅ 캐시 버전을 이전보다 더 높은 새로운 값으로 변경! (예: v36 -> v39)

// 캐시할 모든 URL 목록 (경로 확인 필수)
const urlsToCache = [
    '/', // 앱의 루트 경로 (index.html)
    '/index.html', // 메인 페이지
    '/style.css',  // 기본 CSS 파일
    '/script.js',  // 기본 JavaScript 파일
    '/manifest.json', // PWA Manifest 파일
    '/favicon.ico', // 파비콘 추가 (있어야 404 오류 발생 안 함)
    '/offline.html', // 오프라인 시 보여줄 페이지 (필요하다면 추가, 파일 존재 확인 필수)
    '/icons/icon-192.png', // PWA 아이콘 (모든 아이콘 추가)
    '/icons/icon-512.png', // PWA 아이콘 (모든 아이콘 추가)
    
    // 라이브러리 파일
    '/lib/swiper-bundle.min.css', // Swiper CSS
    '/lib/swiper-bundle.min.js',  // Swiper JS

    // ✅ Zooming.js 라이브러리 CDN URL 추가 (오프라인 캐싱을 위해)
    'https://cdn.jsdelivr.net/npm/zooming@2.1.1/build/zooming.min.js',
    
    // ✅ Google Fonts (Noto Sans KR) 캐싱 - 사용 시 추가
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap',
    // 실제 사용되는 Noto Sans KR 폰트 파일의 URL을 개발자 도구 Network 탭에서 확인 후 정확하게 추가
    // 아래 URL은 예시이므로, 실제 로드되는 URL과 다를 수 있습니다.
    'https://fonts.gstatic.com/s/notosanskr/v37/Cn-lPNbhc_YgIdt_gI_M_qHzD_K_tQ.woff2', 
    'https://fonts.gstatic.com/s/notosanskr/v37/Cn-lPNbhc_YgIdt_gI_M_qHxD_K_tQ.woff2', // 다른 가중치 폰트 파일 예시

    // 가이드 페이지 및 이미지 (모든 가이드 페이지와 해당 이미지 경로 정확히 포함)
    '/guides/earthquake.html',
    '/guides/typhoon.html',
    '/guides/fire.html',
    '/guides/air_pollution.html',
    
    // 지진 이미지
    '/images/earthquake1.jpg',
    '/images/earthquake2.jpg',
    '/images/earthquake3.jpg',

    // 화재 이미지 (고객님이 추가해주신 부분)
    '/images/fire.jpg', 
    '/images/fire2.jpg',
    '/images/fire3.jpg',
    '/images/fire4.jpg',
    
    // 태풍, 미세먼지 등 다른 재난 관련 이미지가 있다면 여기에 추가
    // 예: '/images/typhoon1.jpg',
    // 예: '/images/air_pollution1.jpg',
];

// install 이벤트: 서비스 워커 설치 시 캐시 저장
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] 설치 중...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] 모든 자원 캐싱 중:', urlsToCache);
                // addAll은 하나라도 실패하면 전체가 실패하므로, 오류 처리 강화
                return cache.addAll(urlsToCache).then(() => {
                    console.log('[ServiceWorker] 모든 필수 자원 캐싱 완료!');
                }).catch((error) => {
                    console.error('[ServiceWorker] 일부 필수 자원 캐싱 실패! 오류:', error);
                    // 특정 리소스 로드 실패가 전체 서비스 워커 설치를 막지 않도록
                    // 여기서는 추가적인 로직을 넣지 않지만, 중요한 자원이 실패하면
                    // 실패한 자원에 대한 캐싱 시도를 나중에 다시 하거나 사용자에게 알릴 수 있음
                });
            })
            .catch((error) => {
                console.error('[ServiceWorker] 캐시 열기 실패:', error);
            })
    );
});

// activate 이벤트: 서비스 워커 활성화 시 오래된 캐시 삭제 및 클라이언트 제어권 주장
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] 활성화 중...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 현재 캐시 이름과 다른, 'Safety-Manual-Team-'으로 시작하는 오래된 캐시 삭제
                    if (cacheName.startsWith('Safety-Manual-Team-') && cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] 오래된 캐시 삭제 중:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[ServiceWorker] 활성화 완료. 클라이언트 제어권 주장...'); // ✅ 로그 추가
            return self.clients.claim(); // ✅ 이 줄을 추가합니다. 서비스 워커가 즉시 제어권을 갖도록 함
        })
    );
});

// fetch 이벤트: 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    // 특정 CDN 요청 (Zooming.js, Google Fonts) 처리: 캐시 우선 전략 (네트워크 폴백 및 캐시 업데이트)
    if (event.request.url.startsWith('https://cdn.jsdelivr.net/npm/zooming') ||
        event.request.url.startsWith('https://fonts.googleapis.com') ||
        event.request.url.startsWith('https://fonts.gstatic.com')) {
        
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // 캐시에 있으면 캐시된 응답 반환
                    return cachedResponse;
                }
                // 캐시에 없으면 네트워크에서 가져와 캐시하고 반환
                return fetch(event.request).then((networkResponse) => {
                    // 응답이 유효하고 캐시할 수 있는 경우에만 캐시에 저장
                    if (networkResponse && networkResponse.status === 200 || networkResponse.type === 'opaque') {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse; // 유효하지 않은 응답은 캐시하지 않고 반환
                }).catch(() => {
                    // 네트워크 요청 실패 시 (오프라인 등)
                    console.log('[ServiceWorker] CDN 로드 실패 또는 오프라인:', event.request.url);
                    // 필요하다면 여기서 CDN 자원에 대한 폴백 (예: 기본 폰트)을 제공할 수 있음
                    return new Response(''); // 빈 응답 반환 또는 특정 폴백
                });
            })
        );
        return; // 해당 요청은 여기서 처리되었으므로 함수 종료
    }

    // 다른 모든 요청 처리 (캐시 우선, 네트워크 폴백 및 오프라인 페이지 제공 전략)
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                // 캐시에 있으면 캐시된 응답 반환
                return response;
            }
            // 캐시에 없으면 네트워크에서 가져오기
            return fetch(event.request)
                .then((networkResponse) => {
                    // 응답이 유효하고 캐시할 수 있는 경우에만 캐시에 저장
                    if (networkResponse && networkResponse.status === 200 || networkResponse.type === 'opaque') {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse; // 유효하지 않은 응답은 캐시하지 않고 반환
                })
                .catch(() => {
                    // 네트워크 요청 실패 시 (오프라인 상태)
                    // HTML 페이지 요청인 경우 오프라인 페이지 반환
                    if (event.request.mode === 'navigate' || // 페이지 로드 요청
                        event.request.destination === 'document' || // HTML 문서 요청
                        event.request.url.endsWith('.html') || // .html 확장자 요청
                        event.request.url.endsWith('/')) { // 디렉토리 루트 요청 (index.html 같은)
                        
                        console.log('[ServiceWorker] 오프라인 상태: 캐시에서 오프라인 페이지 제공');
                        return caches.match('/offline.html'); // ✅ offline.html 파일 존재 확인 필수
                    }
                    // HTML이 아닌 다른 자원(이미지, CSS, JS 등)은 null 반환 또는 다른 폴백 처리
                    console.log('[ServiceWorker] 오프라인 상태: 캐시된 자원 없음, 네트워크 실패:', event.request.url);
                    return null; 
                });
        })
    );
});