// 캠페인 추적 스크립트
(function() {
  // 현재 페이지에서 캠페인 ID 추출
  const pathname = window.location.pathname;
  let campaignId = '2025-08'; // 기본값
  
  // URL에서 캠페인 ID 자동 감지
  if (pathname.includes('funnel-2025-07')) {
    campaignId = '2025-07';
  } else if (pathname.includes('funnel-2025-08')) {
    campaignId = '2025-08';
  }
  
  // 페이지 로드 시 조회수 추적
  window.addEventListener('load', function() {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        page: pathname
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
          'campaign_id': campaignId
        });
      }
    }
  });
})();