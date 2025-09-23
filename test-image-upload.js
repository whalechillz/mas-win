// 이미지 업로드 API 테스트
require('dotenv').config({ path: '.env.local' });

async function testImageUpload() {
  try {
    console.log('🧪 이미지 업로드 API 테스트 중...');
    
    // 간단한 1x1 픽셀 PNG 이미지 (Base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await fetch('http://localhost:3000/api/upload-image-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImageBase64,
        fileName: 'test-image.png',
        optimize: true
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 이미지 업로드 성공!');
      console.log('이미지 URL:', result.imageUrl);
      console.log('파일명:', result.fileName);
    } else {
      console.error('❌ 이미지 업로드 실패:', result);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testImageUpload();
