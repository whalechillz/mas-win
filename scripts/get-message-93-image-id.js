/**
 * 93번 메시지의 솔라피 이미지 ID 확인
 */

import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../utils/solapiSignature.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function getMessage93ImageId() {
  const { data: message, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 93)
    .single();

  if (error || !message) {
    console.error('❌ 메시지를 찾을 수 없습니다:', error?.message);
    process.exit(1);
  }

  console.log('📋 93번 메시지 정보:');
  console.log(`   - 솔라피 그룹 ID: ${message.solapi_group_id || '없음'}\n`);

  if (!message.solapi_group_id) {
    console.error('❌ 솔라피 그룹 ID가 없습니다.');
    process.exit(1);
  }

  const groupId = message.solapi_group_id.split(',')[0].trim();
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

  console.log('🔍 솔라피 메시지 목록 조회 중...');
  const response = await fetch(
    `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1`,
    {
      method: 'GET',
      headers: authHeaders
    }
  );

  if (!response.ok) {
    console.error('❌ 솔라피 API 오류:', response.status);
    process.exit(1);
  }

  const data = await response.json();
  
  let imageId = null;
  if (data.messageList) {
    const messageKeys = Object.keys(data.messageList);
    if (messageKeys.length > 0) {
      const firstMessage = data.messageList[messageKeys[0]];
      imageId = firstMessage.imageId || firstMessage.image_id || null;
    }
  } else if (data.messages && data.messages.length > 0) {
    imageId = data.messages[0].imageId || data.messages[0].image_id || null;
  }

  if (imageId) {
    console.log(`✅ 솔라피 이미지 ID: ${imageId}\n`);
    console.log('💡 다운로드 폴더에서 다음 파일을 찾아보세요:');
    console.log(`   ${imageId}.jpeg 또는 ${imageId}.jpg\n`);
    console.log('   또는 솔라피 콘솔에서 다운로드:');
    console.log(`   https://console.solapi.com/message-log?criteria=groupId&value=${groupId}\n`);
  } else {
    console.log('❌ 이미지 ID를 찾을 수 없습니다.');
  }
}

getMessage93ImageId();

