// GTM 설정을 복사하는 간단한 방법
// 브라우저 콘솔에서 실행

// 1. 현재 설정 추출
function exportGTMSettings() {
  const settings = {
    tags: [],
    triggers: [],
    variables: []
  };
  
  // 데이터 레이어에서 설정 정보 수집
  // ... (GTM 내부 API 사용)
  
  console.log('GTM 설정:', JSON.stringify(settings, null, 2));
  return settings;
}

// 2. 설정 적용
function importGTMSettings(settings) {
  // dataLayer.push를 통한 설정
  settings.tags.forEach(tag => {
    console.log('태그 생성:', tag.name);
    // GTM API 호출
  });
}

// 3. 빠른 설정 - 7월 퍼널용
function quickSetupJulyFunnel() {
  // 필수 dataLayer 이벤트 정의
  const events = [
    'phone_click',
    'quiz_complete', 
    'booking_submit',
    'contact_submit',
    'scroll_depth',
    'distance_comparison'
  ];
  
  console.log('다음 이벤트들을 GTM에서 설정하세요:', events);
  
  // 설정 가이드 출력
  console.log(`
=== GTM 빠른 설정 가이드 ===

1. GA4 구성 태그
   - 태그 ID: G-SMJWL2TRM7
   - 트리거: All Pages

2. 전화 클릭 이벤트
   - 이벤트 이름: phone_click
   - 트리거: Click URL starts with "tel:"
   
3. 퀴즈 완료 이벤트  
   - 이벤트 이름: quiz_complete
   - 변수: swing_style, priority, current_distance

4. 예약/문의 이벤트
   - booking_submit, contact_submit
   - Custom Event 트리거 사용

복사해서 사용하세요!
  `);
}

// 실행
quickSetupJulyFunnel();
