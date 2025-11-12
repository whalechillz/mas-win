// API 직접 테스트 (브라우저 없이)
const fetch = require('node-fetch');

(async () => {
  console.log('🔍 Replicate 변형 API 직접 테스트 시작...\n');
  
  try {
    // 테스트용 이미지 URL (갤러리에 있는 실제 이미지 URL 사용)
    const testImageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/generated-1762679887497-replicate-variation-1762679886427-1.png';
    const testPrompt = '아시아 인으로 변경';
    
    console.log('📤 API 요청 전송...');
    console.log('   이미지 URL:', testImageUrl);
    console.log('   프롬프트:', testPrompt);
    console.log('');
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/vary-existing-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        prompt: testPrompt,
        title: '갤러리 이미지 변형 테스트',
        excerpt: '테스트용 이미지 변형',
        contentType: 'gallery',
        brandStrategy: 'professional',
        preset: 'creative'
      })
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ 응답 시간: ${duration}ms`);
    console.log(`📥 HTTP 상태: ${response.status} ${response.statusText}`);
    console.log('');
    
    const result = await response.json();
    console.log('📦 API 응답:', JSON.stringify(result, null, 2));
    console.log('');
    
    if (result.success) {
      console.log('✅ 변형 성공!');
      console.log('   생성된 이미지:', result.imageUrl);
      if (result.fileName) {
        console.log('   파일명:', result.fileName);
      }
    } else {
      console.log('❌ 변형 실패');
      console.log('   오류:', result.error);
      if (result.details) {
        console.log('   상세:', result.details);
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    console.error('   메시지:', error.message);
    console.error('   스택:', error.stack);
  }
})();










