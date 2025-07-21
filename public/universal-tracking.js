// 모든 캠페인에서 재사용 가능한 범용 추적 코드
window.trackCampaignEvent = function(eventName, parameters) {
    // GTM으로 이벤트 전송
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            'event': eventName,
            'campaign_id': window.location.pathname.includes('2025-07') ? '2025-07' : 
                          window.location.pathname.includes('2025-08') ? '2025-08' : 
                          'unknown',
            ...parameters
        });
    }
    
    // 데이터베이스에도 기록
    fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventName,
            ...parameters
        })
    });
};

// 사용 예시:
// trackCampaignEvent('phone_click', { phone_number: '1588-1924' });
// trackCampaignEvent('quiz_complete', { swing_style: 'power' });
