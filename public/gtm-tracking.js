// GTM DataLayer 이벤트 추적 스크립트
// 7월 퍼널용 전환 추적

// DataLayer 초기화
window.dataLayer = window.dataLayer || [];

// 전화번호 클릭 추적 함수
function trackPhoneClick(phoneNumber) {
    window.dataLayer.push({
        'event': 'phone_click',
        'event_category': 'conversion',
        'event_label': 'july_funnel',
        'phone_number': phoneNumber,
        'campaign_id': '2025-07'
    });
    console.log('GTM 전화 클릭 추적:', phoneNumber);
}

// 퀴즈 완료 추적 함수
function trackQuizComplete(quizData) {
    window.dataLayer.push({
        'event': 'quiz_complete',
        'event_category': 'engagement',
        'event_label': 'july_funnel',
        'swing_style': quizData.styleText || quizData.style,
        'priority': quizData.priorityText || quizData.priority,
        'current_distance': quizData.distance,
        'recommended_flex': quizData.recommendedFlex,
        'expected_distance': quizData.expectedDistance
    });
    console.log('GTM 퀴즈 완료 추적:', quizData);
}

// 시타 예약 추적 함수
function trackBookingSubmit(bookingData) {
    window.dataLayer.push({
        'event': 'booking_submit',
        'event_category': 'conversion',
        'event_label': 'july_funnel',
        'club_interest': bookingData.club,
        'booking_date': bookingData.date,
        'booking_time': bookingData.time,
        'swing_style': bookingData.swing_style,
        'current_distance': bookingData.current_distance
    });
    console.log('GTM 시타 예약 추적:', bookingData);
}

// 문의 접수 추적 함수
function trackContactSubmit(contactData) {
    window.dataLayer.push({
        'event': 'contact_submit',
        'event_category': 'conversion',
        'event_label': 'july_funnel',
        'call_times': contactData.call_times,
        'swing_style': contactData.swing_style,
        'current_distance': contactData.current_distance
    });
    console.log('GTM 문의 접수 추적:', contactData);
}

// 플로팅 버튼 클릭 추적
function trackFloatingButtonClick() {
    window.dataLayer.push({
        'event': 'floating_button_click',
        'event_category': 'engagement',
        'event_label': 'july_funnel',
        'button_type': 'floating_phone'
    });
    console.log('GTM 플로팅 버튼 클릭 추적');
}

// 맞춤 클럽 찾기 버튼 클릭 추적
function trackFindClubClick() {
    window.dataLayer.push({
        'event': 'find_club_click',
        'event_category': 'engagement',
        'event_label': 'july_funnel',
        'button_location': 'hero_section'
    });
    console.log('GTM 맞춤 클럽 찾기 클릭 추적');
}

// 비거리 비교 추적
function trackDistanceComparison(userDistance, masDistance) {
    window.dataLayer.push({
        'event': 'distance_comparison',
        'event_category': 'engagement',
        'event_label': 'july_funnel',
        'user_distance': userDistance,
        'mas_distance': masDistance,
        'distance_increase': masDistance - userDistance
    });
    console.log('GTM 비거리 비교 추적:', userDistance, '->', masDistance);
}

// 페이지 스크롤 깊이 추적 (25%, 50%, 75%, 100%)
let scrollDepthTracked = {25: false, 50: false, 75: false, 100: false};

function trackScrollDepth() {
    const scrollPercentage = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    
    [25, 50, 75, 100].forEach(depth => {
        if (scrollPercentage >= depth && !scrollDepthTracked[depth]) {
            scrollDepthTracked[depth] = true;
            
            // GA4 호환 이벤트 전송
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll_depth', {
                    event_category: 'engagement',
                    event_label: 'july_funnel',
                    scroll_percentage: depth,
                    page_title: document.title,
                    page_location: window.location.href,
                    timestamp: new Date().toISOString()
                });
            }
            
            // GTM dataLayer에도 전송 (기존 호환성)
            window.dataLayer.push({
                'event': 'scroll_depth',
                'event_category': 'engagement',
                'event_label': 'july_funnel',
                'scroll_percentage': depth
            });
            
            console.log('스크롤 깊이 추적:', depth + '%');
        }
    });
}

// 스크롤 이벤트 리스너 추가
window.addEventListener('scroll', trackScrollDepth);

// 페이지 로드 시 초기 추적
window.addEventListener('load', function() {
    // 페이지뷰 이벤트
    window.dataLayer.push({
        'event': 'page_view',
        'page_title': 'MASGOLF 7월 퍼널',
        'page_location': window.location.href,
        'campaign_id': '2025-07'
    });
    
    // UTM 파라미터 추적
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        if (urlParams.get(param)) {
            utmParams[param] = urlParams.get(param);
        }
    });
    
    if (Object.keys(utmParams).length > 0) {
        window.dataLayer.push({
            'event': 'campaign_arrival',
            'event_category': 'traffic',
            'event_label': 'july_funnel',
            ...utmParams
        });
    }
});

console.log('GTM 추적 스크립트 로드 완료');
