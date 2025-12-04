/**
 * 메시지 140-147의 이미지를 Solapi에 재업로드하고 imageId로 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';
const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];

async function fixImages() {
  console.log('='.repeat(80));
  console.log('🖼️  메시지 140-147 이미지 Solapi 재업로드');
  console.log('='.repeat(80));
  console.log('');

  // 메시지 조회
  const { data: messages } = await supabase
    .from('channel_sms')
    .select('id, image_url, message_type')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (!messages || messages.length === 0) {
    console.log('❌ 메시지를 찾을 수 없습니다.');
    return;
  }

  for (const msg of messages) {
    if (!msg.image_url) {
      console.log(`⏭️  메시지 ${msg.id}: 이미지 없음, 건너뜀`);
      continue;
    }

    // HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(msg.image_url);
    if (!isHttpUrl) {
      console.log(`✅ 메시지 ${msg.id}: 이미 Solapi imageId입니다 (${msg.image_url})`);
      continue;
    }

    console.log(`\n🔄 메시지 ${msg.id}: 이미지 재업로드 중...`);
    console.log(`   URL: ${msg.image_url.substring(0, 80)}...`);

    try {
      // Solapi에 재업로드
      const reuploadResponse = await fetch(`${BASE_URL}/api/solapi/reupload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: msg.image_url,
          messageId: msg.id
        })
      });

      if (!reuploadResponse.ok) {
        const errorData = await reuploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${reuploadResponse.status}`);
      }

      const result = await reuploadResponse.json();
      
      if (!result.success || !result.imageId) {
        throw new Error(result.message || 'imageId를 받지 못했습니다.');
      }

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: result.imageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', msg.id);

      if (updateError) {
        throw new Error(`DB 업데이트 실패: ${updateError.message}`);
      }

      console.log(`✅ 메시지 ${msg.id}: Solapi imageId로 업데이트 완료 (${result.imageId})`);
    } catch (error) {
      console.error(`❌ 메시지 ${msg.id}: 오류 - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 완료!');
}

fixImages().catch(console.error);

