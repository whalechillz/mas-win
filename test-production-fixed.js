// 프로덕션 환경 수정된 URL로 테스트
require('dotenv').config({ path: '.env.local' });

async function testProductionFixed() {
  try {
    console.log('🔍 프로덕션 환경 수정된 URL로 테스트 중...');
    
    // 간단한 1x1 픽셀 PNG 이미지 (Base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const productionUrl = 'https://mas-bsm5kp0ly-taksoo-kims-projects.vercel.app';
    
    // URL 끝에 슬래시 추가
    const apiUrl = `${productionUrl}/api/upload-image-supabase/`;
    
    console.log('요청 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImageBase64,
        fileName: 'test-production-image.png',
        optimize: true
      }),
    });
    
    console.log('응답 상태:', response.status);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('응답 텍스트:', responseText);
    
    if (responseText) {
      try {
        const result = JSON.parse(responseText);
        console.log('파싱된 결과:', result);
        
        if (response.ok) {
          console.log('✅ 프로덕션 이미지 업로드 성공!');
          console.log('이미지 URL:', result.imageUrl);
        } else {
          console.error('❌ 프로덕션 이미지 업로드 실패:', result);
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testProductionFixed();
