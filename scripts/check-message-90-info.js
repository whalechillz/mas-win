/**
 * 90번 메시지 정보 확인
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessage90() {
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 90)
    .single();

  if (error || !message) {
    console.error('❌ 메시지를 찾을 수 없습니다:', error?.message);
    process.exit(1);
  }

  console.log('📋 90번 메시지 정보:');
  console.log(`   - 상태: ${message.status}`);
  console.log(`   - 솔라피 그룹 ID: ${message.solapi_group_id || '없음'}`);
  console.log(`   - 발송일: ${message.sent_at || '없음'}`);
  console.log(`   - 현재 image_url: ${message.image_url || '없음'}\n`);

  if (message.solapi_group_id) {
    const groupId = message.solapi_group_id.split(',')[0].trim();
    console.log('💡 솔라피 콘솔에서 이미지 다운로드:');
    console.log(`   https://console.solapi.com/message-log?criteria=groupId&value=${groupId}`);
    console.log('\n   1. 위 URL로 이동');
    console.log('   2. 메시지 상세 모달에서 이미지 우클릭');
    console.log('   3. "이미지를 다른 이름으로 저장..." 선택');
    console.log('   4. 다운로드 후 다음 명령 실행:');
    console.log(`      node scripts/recover-message-image-from-file.js 90 ~/Downloads/다운로드한파일명.jpg\n`);
  }
}

checkMessage90();

