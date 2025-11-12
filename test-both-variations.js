// 두 가지 변형 API 테스트
const fetch = require('node-fetch');

(async () => {
  console.log('🔍 두 가지 변형 API 테스트 시작...\n');
  
  const testImageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/generated-1762679887497-replicate-variation-1762679886427-1.png';
  
  // 1. 🔄 변형 (FAL) - /api/vary-existing-image 테스트
  console.log('1️⃣ 🔄 변형 (FAL) - /api/vary-existing-image 테스트...');
  try {
    const startTime1 = Date.now();
    const response1 = await fetch('http://localhost:3000/api/vary-existing-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        prompt: '아시아 인으로 변경',
        title: '갤러리 이미지 변형 테스트',
        excerpt: '테스트용 이미지 변형',
        contentType: 'gallery',
        brandStrategy: 'professional',
        preset: 'creative'
      })
    });
    
    const duration1 = Date.now() - startTime1;
    const result1 = await response1.json();
    
    console.log(`   ⏱️ 응답 시간: ${duration1}ms`);
    console.log(`   📥 HTTP 상태: ${response1.status} ${response1.statusText}`);
    console.log(`   📦 응답:`, JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log('   ✅ 변형 성공!');
      console.log(`   ✅ 생성된 이미지: ${result1.imageUrl}`);
    } else {
      console.log('   ❌ 변형 실패');
      console.log(`   ❌ 오류: ${result1.error}`);
      if (result1.details) {
        console.log(`   ❌ 상세: ${result1.details}`);
      }
    }
  } catch (error) {
    console.error('   ❌ 테스트 오류:', error.message);
  }
  
  console.log('\n');
  
  // 2. 🎨 변형 (Replicate) - /api/generate-blog-image-replicate-flux 테스트
  console.log('2️⃣ 🎨 변형 (Replicate) - /api/generate-blog-image-replicate-flux 테스트...');
  try {
    const startTime2 = Date.now();
    const response2 = await fetch('http://localhost:3000/api/generate-blog-image-replicate-flux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '갤러리 이미지 변형',
        excerpt: '갤러리에서 변형된 이미지',
        contentType: 'gallery',
        brandStrategy: 'professional',
        baseImageUrl: testImageUrl,
        variationStrength: 0.8,
        variationCount: 1
      })
    });
    
    const duration2 = Date.now() - startTime2;
    const result2 = await response2.json();
    
    console.log(`   ⏱️ 응답 시간: ${duration2}ms`);
    console.log(`   📥 HTTP 상태: ${response2.status} ${response2.statusText}`);
    console.log(`   📦 응답:`, JSON.stringify(result2, null, 2));
    
    if (result2.success || result2.images) {
      console.log('   ✅ 변형 성공!');
      if (result2.images && result2.images.length > 0) {
        console.log(`   ✅ 생성된 이미지: ${result2.images[0].originalUrl || result2.images[0]}`);
      }
    } else {
      console.log('   ❌ 변형 실패');
      console.log(`   ❌ 오류: ${result2.error || '알 수 없는 오류'}`);
    }
  } catch (error) {
    console.error('   ❌ 테스트 오류:', error.message);
  }
  
  console.log('\n✅ 테스트 완료!');
})();










