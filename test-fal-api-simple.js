// FAL AI API 간단 테스트
const testFALAPI = async () => {
  const apiKey = 'b6ae9e4b-d592-4dee-a0ac-78a4a2be3486:5642c60bc1fd9b18402026df987a2123';
  
  try {
    console.log('🧪 FAL AI API 테스트 시작...');
    console.log('API 키:', apiKey.substring(0, 20) + '...');
    
    // 간단한 테스트 요청
    const response = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "A simple golf ball on green grass",
        num_images: 1,
        image_size: "landscape_16_9"
      })
    });

    console.log('응답 상태:', response.status);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ FAL AI API 테스트 성공!');
      console.log('결과:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ FAL AI API 테스트 실패:', response.status);
      console.error('에러 내용:', errorText);
    }
  } catch (error) {
    console.error('❌ FAL AI API 테스트 에러:', error);
  }
};

// 테스트 실행
testFALAPI();
