// 프로덕션 환경 이미지 업로드 테스트
require('dotenv').config({ path: '.env.local' });

async function testProductionImageUpload() {
  try {
    console.log('🧪 프로덕션 환경 이미지 업로드 테스트 중...');
    
    // 간단한 1x1 픽셀 PNG 이미지 (Base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const productionUrl = 'https://mas-bsm5kp0ly-taksoo-kims-projects.vercel.app';
    
    const response = await fetch(`${productionUrl}/api/upload-image-supabase`, {
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
    
    const result = await response.json();
    
    console.log('응답 상태:', response.status);
    console.log('응답 결과:', result);
    
    if (response.ok) {
      console.log('✅ 프로덕션 이미지 업로드 성공!');
      console.log('이미지 URL:', result.imageUrl);
      console.log('파일명:', result.fileName);
    } else {
      console.error('❌ 프로덕션 이미지 업로드 실패:', result);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testProductionImageUpload();
