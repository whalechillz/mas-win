/**
 * 155번 메시지 이미지 강제 설정
 * 브라우저 콘솔에서 직접 실행할 수 있는 코드 생성
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getImageUrl() {
  const { data: images } = await supabase
    .from('image_metadata')
    .select('*')
    .contains('tags', ['sms-155'])
    .eq('source', 'mms')
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!images || images.length === 0) {
    const { data: sms } = await supabase
      .from('channel_sms')
      .select('image_url')
      .eq('id', 155)
      .single();
    
    if (sms && sms.image_url && sms.image_url.startsWith('http')) {
      return sms.image_url;
    }
    return null;
  }

  return images[0].image_url;
}

async function main() {
  console.log('='.repeat(100));
  console.log('🖼️ 155번 메시지 이미지 URL 확인');
  console.log('='.repeat(100));
  console.log('');

  const imageUrl = await getImageUrl();
  
  if (!imageUrl) {
    console.error('❌ 이미지 URL을 찾을 수 없습니다.');
    return;
  }

  console.log('✅ 이미지 URL 발견:');
  console.log(`   ${imageUrl}`);
  console.log('');
  console.log('='.repeat(100));
  console.log('📋 브라우저 콘솔에서 실행할 코드:');
  console.log('='.repeat(100));
  console.log('');
  console.log('다음 코드를 브라우저 콘솔(F12)에 복사하여 실행하세요:');
  console.log('');
  console.log('```javascript');
  console.log(`const imageUrl = '${imageUrl}';`);
  console.log(`
// React DevTools를 통해 컴포넌트 상태 업데이트
// 또는 직접 DOM 조작
const imgElements = document.querySelectorAll('img[alt*="선택된"], img[alt*="이미지"]');
if (imgElements.length > 0) {
  imgElements[0].src = imageUrl;
  console.log('✅ 이미지 src 업데이트 완료');
}

// 또는 localStorage에 저장 후 페이지 새로고침
localStorage.setItem('forceImageUrl155', imageUrl);
console.log('✅ localStorage에 저장 완료. 페이지를 새로고침하세요.');
`);
  console.log('```');
  console.log('');
  console.log('='.repeat(100));
}

main();

