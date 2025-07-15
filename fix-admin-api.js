// Admin 페이지에서 실행할 스크립트
// 브라우저 콘솔(F12)에 복사/붙여넣기

// 1. 먼저 직접 테스트
async function testDirectAPI() {
  console.log('🧪 Direct API 테스트...');
  const res = await fetch('/api/test-direct');
  const data = await res.json();
  console.log('Direct API 결과:', data);
  return data.success;
}

// 2. Axios 버전 테스트
async function testAxiosAPI() {
  console.log('🧪 Axios API 테스트...');
  const res = await fetch('/api/multichannel-content-axios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: 2025,
      month: 7,
      selectedChannels: {
        blog: true,
        kakao: true,
        sms: true,
        instagram: true,
        youtube: true
      }
    })
  });
  const data = await res.json();
  console.log('Axios API 결과:', data);
  
  if (data.success) {
    alert(`성공! ${data.count}개의 콘텐츠가 생성되었습니다.`);
    location.reload();
  }
  return data;
}

// 3. 기존 버튼 교체
function replaceAPICall() {
  // 기존 생성 버튼 찾기
  const buttons = document.querySelectorAll('button');
  const generateButton = Array.from(buttons).find(btn => 
    btn.textContent.includes('테이터 생성') || 
    btn.textContent.includes('멀티채널 생성')
  );
  
  if (generateButton) {
    // 기존 이벤트 제거하고 새 이벤트 추가
    const newButton = generateButton.cloneNode(true);
    newButton.onclick = async () => {
      console.log('새 API 호출 중...');
      await testAxiosAPI();
    };
    generateButton.parentNode.replaceChild(newButton, generateButton);
    console.log('✅ 버튼이 새 API를 사용하도록 교체되었습니다');
  } else {
    console.log('❌ 생성 버튼을 찾을 수 없습니다');
  }
}

// 실행
(async () => {
  console.log('=== MasGolf API 수정 스크립트 ===');
  
  // 1. Direct API 테스트
  const directSuccess = await testDirectAPI();
  
  if (directSuccess) {
    console.log('✅ Axios 방식이 작동합니다!');
    
    // 2. 버튼 교체
    replaceAPICall();
    
    // 3. 자동으로 Axios API 테스트
    console.log('3초 후 자동 테스트...');
    setTimeout(() => testAxiosAPI(), 3000);
  } else {
    console.log('❌ Direct API도 실패. 다른 방법이 필요합니다.');
  }
})();