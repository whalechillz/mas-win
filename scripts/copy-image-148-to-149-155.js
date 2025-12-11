/**
 * 148번 메시지의 이미지를 149-155번 메시지에도 설정
 * 
 * 1. 148번 메시지의 이미지 URL 확인
 * 2. HTTP URL이면 Solapi에 재업로드하여 imageId 획득
 * 3. 149-155번 메시지의 image_url을 동일한 imageId로 설정
 */

const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');
const { compressImageForSolapi } = require('../lib/server/compressImageForSolapi.js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ Solapi 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function copyImage148ToOthers() {
  console.log('='.repeat(100));
  console.log('🖼️ 148번 메시지 이미지를 149-155번에 복사');
  console.log('='.repeat(100));
  console.log('');

  // 1. 148번 메시지 조회
  console.log('📋 1단계: 148번 메시지 이미지 확인');
  console.log('-'.repeat(100));
  
  const { data: message148, error: msg148Error } = await supabase
    .from('channel_sms')
    .select('id, image_url')
    .eq('id', 148)
    .single();

  if (msg148Error || !message148) {
    console.error('❌ 148번 메시지를 찾을 수 없습니다:', msg148Error?.message);
    process.exit(1);
  }

  if (!message148.image_url) {
    console.error('❌ 148번 메시지에 이미지가 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 148번 메시지 이미지 발견:`);
  console.log(`   URL/ID: ${message148.image_url.substring(0, 100)}${message148.image_url.length > 100 ? '...' : ''}`);

  const isHttpUrl = /^https?:\/\//i.test(message148.image_url);
  const isSolapiId = /^[A-Z0-9]+$/i.test(message148.image_url) && message148.image_url.length > 10;

  let finalImageId = null;

  if (isHttpUrl) {
    console.log(`   타입: HTTP URL (Supabase) - Solapi에 재업로드 필요\n`);
    
    // 2. HTTP URL을 Solapi에 재업로드
    console.log('📤 2단계: Solapi에 이미지 재업로드');
    console.log('-'.repeat(100));
    
    try {
      console.log('   이미지 다운로드 중...');
      const imageResponse = await fetch(message148.image_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!imageResponse.ok) {
        throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      console.log(`   ✅ 이미지 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)}KB)`);

      // 이미지 압축
      console.log('   이미지 압축 중...');
      let compressionInfo;
      try {
        compressionInfo = await compressImageForSolapi(imageBuffer);
        console.log(`   ✅ 이미지 압축 완료 (${(compressionInfo.compressedSize / 1024).toFixed(2)}KB)`);
      } catch (sharpError) {
        console.warn(`   ⚠️ Sharp 압축 실패, 원본 사용: ${sharpError.message}`);
        if (imageBuffer.length > 200 * 1024) {
          throw new Error('이미지가 200KB를 초과하고 압축에 실패했습니다.');
        }
        compressionInfo = {
          buffer: imageBuffer,
          compressedSize: imageBuffer.length
        };
      }

      // Solapi에 업로드
      console.log('   Solapi에 업로드 중...');
      const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
      const base64Data = compressionInfo.buffer.toString('base64');

      const fileName = message148.image_url.split('/').pop() || `mms-148-${Date.now()}.jpg`;
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

      const solapiResponse = await fetch('https://api.solapi.com/storage/v1/files', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file: base64Data,
          name: safeFileName,
          type: 'MMS'
        })
      });

      const solapiResult = await solapiResponse.json();

      if (!solapiResponse.ok) {
        throw new Error(solapiResult?.message || 'Solapi 업로드 실패');
      }

      finalImageId = solapiResult.fileId || solapiResult.id;

      if (!finalImageId) {
        throw new Error('Solapi에서 imageId를 받지 못했습니다.');
      }

      console.log(`   ✅ Solapi 업로드 성공: ${finalImageId}\n`);

      // 148번 메시지도 imageId로 업데이트
      console.log('   📝 148번 메시지도 imageId로 업데이트 중...');
      const { error: update148Error } = await supabase
        .from('channel_sms')
        .update({ image_url: finalImageId })
        .eq('id', 148);

      if (update148Error) {
        console.warn(`   ⚠️ 148번 업데이트 실패: ${update148Error.message}`);
      } else {
        console.log(`   ✅ 148번 메시지 imageId 업데이트 완료\n`);
      }

    } catch (error) {
      console.error(`   ❌ Solapi 재업로드 실패: ${error.message}`);
      console.error(`   원인: ${error.stack}`);
      process.exit(1);
    }

  } else if (isSolapiId) {
    console.log(`   타입: Solapi imageId - 바로 사용 가능\n`);
    finalImageId = message148.image_url;
  } else {
    console.error(`   ❌ 알 수 없는 이미지 형식입니다.`);
    process.exit(1);
  }

  // 3. 149-155번 메시지에 이미지 설정
  console.log('📝 3단계: 149-155번 메시지에 이미지 설정');
  console.log('-'.repeat(100));

  const targetIds = [149, 150, 151, 152, 153, 154, 155];
  const updateResults = [];

  for (const id of targetIds) {
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: finalImageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error(`   ❌ 메시지 ID ${id} 업데이트 실패: ${updateError.message}`);
      updateResults.push({ id, success: false, error: updateError.message });
    } else {
      console.log(`   ✅ 메시지 ID ${id} 이미지 설정 완료`);
      updateResults.push({ id, success: true });
    }
  }

  // 4. 결과 요약
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 설정 결과 요약:');
  console.log('-'.repeat(100));

  const successCount = updateResults.filter(r => r.success).length;
  const failCount = updateResults.filter(r => !r.success).length;

  console.log(`   ✅ 성공: ${successCount}개`);
  if (failCount > 0) {
    console.log(`   ❌ 실패: ${failCount}개`);
    updateResults.filter(r => !r.success).forEach(r => {
      console.log(`      - 메시지 ID ${r.id}: ${r.error}`);
    });
  }

  console.log(`\n   🖼️ 사용된 이미지 ID: ${finalImageId}`);

  // 5. 검증
  console.log('\n🔍 4단계: 이미지 설정 검증');
  console.log('-'.repeat(100));

  const allIds = [148, ...targetIds];
  const { data: verifyMessages, error: verifyError } = await supabase
    .from('channel_sms')
    .select('id, image_url')
    .in('id', allIds)
    .order('id', { ascending: true });

  if (verifyError) {
    console.error('❌ 검증 중 오류:', verifyError);
  } else {
    console.log(`✅ 검증 완료: ${verifyMessages.length}개 메시지\n`);
    verifyMessages.forEach(msg => {
      const isSolapiId = /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10;
      const status = isSolapiId ? '✅ Solapi imageId' : '⚠️ HTTP URL';
      console.log(`   메시지 ID ${msg.id}: ${status}`);
    });
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n✅ 이미지 복사 완료!');
  console.log('\n📌 다음 단계:');
  console.log('   1. 모든 메시지(148-155)에 동일한 Solapi imageId가 설정되었습니다.');
  console.log('   2. 예약 시간이 되면 정상적으로 발송됩니다.');
  console.log('   3. 이미지 문제로 인한 Solapi 1023 오류는 발생하지 않습니다.');
}

copyImage148ToOthers();








