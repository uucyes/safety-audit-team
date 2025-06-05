// PWA 설치 버튼 로직
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installButton) {
        installButton.style.display = 'block';
    }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        // Hide the app provided install promotion
        installButton.style.display = 'none';
        // Show the install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            // Optionally, send analytics event with outcome of user choice
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, clear it.
            deferredPrompt = null;
        }
    });
}

// ✅ Zooming.js 초기화는 이제 각 가이드 페이지의 스크립트에 포함되므로,
//    이곳 script.js에서는 주석 처리하거나 제거할 수 있습니다.
// document.addEventListener('DOMContentLoaded', () => {
//     new Zooming().listen('[data-action="zoom"]');
// });