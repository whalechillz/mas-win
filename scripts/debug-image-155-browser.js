/**
 * 브라우저 콘솔에서 실행할 디버깅 코드
 */

console.log(`
================================================================================
🖼️ 155번 메시지 이미지 디버깅 코드
================================================================================

다음 코드를 브라우저 콘솔(F12)에 복사하여 실행하세요:

1. 현재 상태 확인:
--------------------------------------------------------------------------------
const checkState = async () => {
  // API에서 메시지 데이터 가져오기
  const response = await fetch('/api/admin/sms?id=155');
  const result = await response.json();
  
  if (result.success && result.smsContent) {
    const sms = result.smsContent;
    console.log('📋 메시지 데이터:');
    console.log('   ID:', sms.id);
    console.log('   image_url:', sms.image_url);
    console.log('   message_type:', sms.message_type);
    
    // 이미지 URL 확인
    if (sms.image_url && sms.image_url.startsWith('http')) {
      console.log('✅ HTTP URL 발견:', sms.image_url);
      
      // 이미지가 실제로 로드되는지 확인
      const img = new Image();
      img.onload = () => {
        console.log('✅ 이미지 로드 성공!');
        console.log('   크기:', img.width, 'x', img.height);
        
        // 강제로 이미지 설정
        console.log('🔧 강제로 이미지 설정 시도...');
        // React 상태를 직접 업데이트할 수 없으므로, DOM 조작
        const imgElements = document.querySelectorAll('img[alt*="선택된"], img[alt*="이미지"]');
        if (imgElements.length > 0) {
          imgElements[0].src = sms.image_url;
          console.log('✅ DOM 이미지 src 업데이트 완료');
        } else {
          console.log('⚠️ 이미지 요소를 찾을 수 없습니다.');
        }
      };
      img.onerror = () => {
        console.error('❌ 이미지 로드 실패:', sms.image_url);
      };
      img.src = sms.image_url;
    } else {
      console.log('⚠️ HTTP URL이 아닙니다:', sms.image_url);
    }
  } else {
    console.error('❌ API 응답 오류:', result);
  }
};

checkState();

2. 강제로 이미지 설정:
--------------------------------------------------------------------------------
const forceSetImage = () => {
  const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
  
  // 모든 이미지 요소 찾기
  const imgElements = document.querySelectorAll('img');
  console.log('🔍 발견된 이미지 요소:', imgElements.length);
  
  // 이미지 미리보기 영역 찾기
  const previewArea = document.querySelector('[class*="preview"], [class*="image"]');
  if (previewArea) {
    const previewImgs = previewArea.querySelectorAll('img');
    previewImgs.forEach((img, i) => {
      console.log(\`   이미지 \${i + 1}: src=\${img.src.substring(0, 50)}...\`);
      if (!img.src || img.src.includes('placeholder') || img.src.includes('data:')) {
        img.src = imageUrl;
        console.log(\`   ✅ 이미지 \${i + 1} src 업데이트 완료\`);
      }
    });
  }
  
  // AIImagePicker 컴포넌트의 이미지 찾기
  const aiImagePicker = document.querySelector('[class*="AIImagePicker"], [class*="image-picker"]');
  if (aiImagePicker) {
    const aiImgs = aiImagePicker.querySelectorAll('img');
    aiImgs.forEach((img, i) => {
      if (!img.src || img.src.includes('placeholder') || img.src.includes('data:')) {
        img.src = imageUrl;
        console.log(\`   ✅ AIImagePicker 이미지 \${i + 1} src 업데이트 완료\`);
      }
    });
  }
  
  console.log('✅ 강제 이미지 설정 완료');
};

forceSetImage();

3. 페이지 새로고침 후 자동 설정:
--------------------------------------------------------------------------------
const autoSetOnReload = () => {
  const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
  localStorage.setItem('forceImageUrl155', imageUrl);
  console.log('✅ localStorage에 저장 완료. 페이지를 새로고침하세요.');
  console.log('   새로고침 후 자동으로 이미지가 설정됩니다.');
  
  // 3초 후 자동 새로고침
  setTimeout(() => {
    window.location.reload();
  }, 3000);
};

// autoSetOnReload(); // 주석 해제하면 자동 새로고침

================================================================================
`);











