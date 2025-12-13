/**
 * 155번 메시지에 이미지 자동 설정 (API 직접 호출)
 * 이미지 URL을 API를 통해 설정하고 페이지를 새로고침
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

async function autoSetImage155Direct() {
  console.log('='.repeat(100));
  console.log('🖼️ 155번 메시지 이미지 자동 설정 (API 직접 호출)');
  console.log('='.repeat(100));
  console.log('');

  // 1. image_metadata에서 이미지 찾기
  const { data: images } = await supabase
    .from('image_metadata')
    .select('*')
    .contains('tags', ['sms-155'])
    .eq('source', 'mms')
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!images || images.length === 0) {
    console.error('❌ image_metadata에서 이미지를 찾을 수 없습니다.');
    return;
  }

  const imageUrl = images[0].image_url;
  console.log('✅ 이미지 발견:');
  console.log(`   URL: ${imageUrl.substring(0, 70)}...`);
  console.log('');

  // 2. API를 통해 이미지 설정
  console.log('📡 API를 통해 이미지 설정 중...');
  try {
    const response = await fetch('http://localhost:3000/api/solapi/reupload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl,
        messageId: 155
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 이미지 설정 성공!');
      console.log(`   Solapi imageId: ${result.imageId || '(없음)'}`);
      console.log(`   Supabase URL: ${result.supabaseUrl || imageUrl}`);
      console.log('');
      
      // 3. DB 확인
      const { data: updatedMessage } = await supabase
        .from('channel_sms')
        .select('image_url')
        .eq('id', 155)
        .single();
      
      console.log('📋 DB 업데이트 확인:');
      console.log(`   image_url: ${updatedMessage?.image_url?.substring(0, 70) || '(없음)'}...`);
      console.log('');
      
      console.log('='.repeat(100));
      console.log('✅ 완료! 이제 페이지를 새로고침하면 이미지가 표시됩니다.');
      console.log('='.repeat(100));
      console.log('');
      console.log('💡 브라우저에서 http://localhost:3000/admin/sms?id=155 페이지를 새로고침하세요.');
      
    } else {
      console.error('❌ 이미지 설정 실패:', result.message || '알 수 없는 오류');
      console.log('   응답:', result);
    }
  } catch (error) {
    console.error('❌ API 호출 오류:', error.message);
  }
}

autoSetImage155Direct();









