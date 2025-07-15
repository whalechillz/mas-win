// 새 API 테스트 함수
// Admin 페이지의 콘솔에서 실행

async function testNewAPI() {
  try {
    console.log('🔧 새로운 API 테스트 시작...');
    
    // 1. 디버그 API 테스트
    const debugRes = await fetch('/api/debug-supabase');
    const debugData = await debugRes.json();
    console.log('📊 디버그 정보:', debugData);
    
    // 2. Fixed API 테스트
    const res = await fetch('/api/generate-multichannel-content-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 2025, month: 7 })
    });
    
    const data = await res.json();
    console.log('✅ API 응답:', data);
    
    if (data.success) {
      alert('성공! 콘텐츠가 생성되었습니다.');
      location.reload(); // 페이지 새로고침
    } else {
      alert('실패: ' + data.error);
    }
  } catch (error) {
    console.error('❌ 에러:', error);
    alert('에러: ' + error.message);
  }
}

// 실행
testNewAPI();