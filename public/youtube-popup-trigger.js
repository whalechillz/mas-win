// YouTube 팝업 트리거 예제
// funnel-2025-07-complete.html에서 사용할 수 있는 함수

// 팝업 열기 함수
function openYouTubePopup() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'open-youtube' }, '*');
  }
}

// 사용 예제:
// <button onclick="openYouTubePopup()">동영상 보기</button>
// <a href="javascript:openYouTubePopup()">프로모션 영상 보기</a>

// 자동으로 팝업 열기 (예: 특정 섹션 도달 시)
// setTimeout(openYouTubePopup, 5000); // 5초 후

// 스크롤 이벤트로 팝업 열기 (예: 50% 스크롤 시)
/*
let hasTriggered = false;
window.addEventListener('scroll', function() {
  if (!hasTriggered) {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    if (scrollPercent > 50) {
      hasTriggered = true;
      openYouTubePopup();
    }
  }
});
*/
