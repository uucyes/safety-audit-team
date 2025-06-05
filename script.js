// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker 등록 성공:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker 등록 실패:', error);
            });
    });
}

// 앱이 로드될 때 실행될 코드
document.addEventListener('DOMContentLoaded', () => {
    console.log('재난 매뉴얼 앱이 성공적으로 로드되었습니다!');

    // --- PWA 설치 버튼 로직 ---
    let installButton = document.getElementById('installButton');
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';
        console.log('PWA 설치 프롬프트 준비됨.');
    });

    installButton.addEventListener('click', () => { // (e) 인자 제거
        installButton.style.display = 'none';
        if (deferredPrompt) { // deferredPrompt가 존재하는지 확인
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('PWA 설치 성공: 사용자가 앱을 설치했습니다.');
                } else {
                    console.log('PWA 설치 취소: 사용자가 설치를 거부했습니다.');
                }
                deferredPrompt = null;
            });
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA가 성공적으로 설치되었습니다!');
        installButton.style.display = 'none';
    });

    // 참고: Swiper 초기화 코드는 각 Swiper를 사용하는 HTML 파일 내부에 두는 것이 좋습니다.
    // 이 script.js에서는 전역적인 Swiper 초기화 로직을 제거합니다.
});