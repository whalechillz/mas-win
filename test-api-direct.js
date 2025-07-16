// Admin 페이지 콘솔에서 실행
// API 직접 테스트

async function testAPI() {
  console.log('🧪 API 테스트 시작...');
  
  try {
    const response = await fetch('/api/generate-multichannel-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
    
    const data = await response.json();
    console.log('응답:', data);
    
    if (data.success) {
      alert(`✅ 성공! ${data.count}개의 콘텐츠가 생성되었습니다.`);
      setTimeout(() => location.reload(), 2000);
    } else {
      console.error('❌ 에러:', data.error);
      alert('에러: ' + data.error);
    }
  } catch (error) {
    console.error('❌ 네트워크 에러:', error);
    alert('네트워크 에러: ' + error.message);
  }
}

// 실행
testAPI();