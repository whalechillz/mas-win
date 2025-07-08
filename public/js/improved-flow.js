// 개선된 프론트엔드 플로우 예시

// 1. 퀴즈 완료 처리
async function handleQuizComplete(quizData) {
  try {
    // 퀴즈 결과 저장
    const response = await fetch('/api/quiz-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: quizData.name,
        phone: quizData.phone,
        swing_style: quizData.swingStyle,
        priority: quizData.priority,
        current_distance: quizData.currentDistance,
        recommended_flex: quizData.recommendedFlex,
        expected_distance: quizData.expectedDistance,
        campaign_source: 'funnel-2025-07',
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // quiz_result_id를 세션에 저장
      sessionStorage.setItem('quiz_result_id', result.quiz_result_id);
      
      // 결과 페이지로 이동
      showResultPage(quizData);
    }
  } catch (error) {
    console.error('Quiz save error:', error);
  }
}

// 2. 예약 처리
async function handleBooking(bookingData) {
  try {
    const quizResultId = sessionStorage.getItem('quiz_result_id');
    
    const response = await fetch('/api/booking-improved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_result_id: quizResultId,
        date: bookingData.date,
        time: bookingData.time,
        club: bookingData.club,
        // 폴백을 위한 기본 정보
        name: bookingData.name,
        phone: bookingData.phone
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showSuccessMessage('예약이 완료되었습니다!');
      // GTM/GA 이벤트 전송
      gtag('event', 'booking_complete', {
        booking_id: result.booking_id,
        quiz_result_id: quizResultId
      });
    }
  } catch (error) {
    console.error('Booking error:', error);
  }
}

// 3. 재방문 고객 처리
async function checkReturningCustomer(phone) {
  try {
    // 전화번호로 기존 퀴즈 결과 조회
    const response = await fetch(`/api/get-quiz-result?phone=${phone}`);
    const result = await response.json();
    
    if (result.found) {
      // 기존 고객 - 맞춤 메시지 표시
      showPersonalizedMessage(result.data);
      sessionStorage.setItem('quiz_result_id', result.data.id);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Customer check error:', error);
    return false;
  }
}

// 4. 통합 추적
function trackUserJourney(event, data) {
  // GTM/GA4 이벤트
  gtag('event', event, {
    ...data,
    quiz_result_id: sessionStorage.getItem('quiz_result_id'),
    timestamp: new Date().toISOString()
  });
  
  // 페이스북 픽셀
  if (typeof fbq !== 'undefined') {
    fbq('track', event, data);
  }
  
  // 카카오 픽셀
  if (typeof kakaoPixel !== 'undefined') {
    kakaoPixel(event, data);
  }
}
