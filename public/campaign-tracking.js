// 캠페인 추적 스크립트
(function() {
  // 페이지 로드 시 조회수 추적
  window.addEventListener('load', function() {
    // 데이터베이스에 기록
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: '2025-07',
        page: window.location.pathname
      })
    }).catch(console.error);
  });

  // 전화번호 클릭 추적
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="tel:"]');
    if (target) {
      const phoneNumber = target.getAttribute('href').replace('tel:', '');
      if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_click', {
          'phone_number': phoneNumber,
          'campaign_id': '2025-07'
        });
      }
    }
  });
})();
