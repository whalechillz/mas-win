/**
 * SMS 메시지 ID 155의 잘린 이미지 URL을 복구하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSMS155ImageUrl() {
  console.log('🔍 SMS 메시지 155의 이미지 URL 확인 및 복구 시작...\n');

  try {
    // 1. channel_sms에서 메시지 정보 가져오기
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (smsError) {
      console.error('❌ 메시지 조회 실패:', smsError);
      process.exit(1);
    }

    if (!sms) {
      console.error('❌ 메시지 ID 155를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${sms.id}`);
    console.log(`   현재 image_url: ${sms.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms.image_url ? sms.image_url.length : 0}\n`);

    // 2. image_url이 잘렸는지 확인
    if (sms.image_url && sms.image_url.includes('supabase.co/storage/v') && !sms.image_url.includes('/object/public/')) {
      console.log('⚠️ 이미지 URL이 잘린 것으로 확인됨');
      console.log(`   잘린 URL: ${sms.image_url}\n`);

      // 3. image_metadata에서 올바른 이미지 URL 찾기
      const tag = `sms-155`;
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.error('❌ image_metadata 조회 실패:', metadataError);
        process.exit(1);
      }

      if (!metadata || metadata.length === 0) {
        console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
        console.log('   대안: 수동으로 이미지를 다시 업로드하거나, Solapi에서 이미지를 복구해야 합니다.\n');
        
        // Solapi imageId가 있는지 확인
        if (sms.image_url && !sms.image_url.startsWith('http')) {
          console.log(`💡 Solapi imageId로 보입니다: ${sms.image_url}`);
          console.log('   이 경우 Solapi API를 통해 이미지를 다운로드하고 Supabase에 재업로드해야 합니다.\n');
        }
        
        process.exit(0);
      }

      const correctImageUrl = metadata[0].image_url;
      console.log('✅ image_metadata에서 올바른 이미지 URL 발견:');
      console.log(`   ${correctImageUrl}\n`);

      // 4. 이미지 URL이 실제로 접근 가능한지 확인
      console.log('🔍 이미지 URL 유효성 확인 중...');
      try {
        const imageResponse = await fetch(correctImageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}\n`);
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }

      // 5. channel_sms의 image_url 업데이트
      console.log('💾 channel_sms.image_url 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: correctImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ channel_sms.image_url 업데이트 완료!\n');
      console.log('📱 다음 단계:');
      console.log('   1. SMS 편집 페이지를 새로고침하세요');
      console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요\n');

    } else if (sms.image_url && sms.image_url.includes('/object/public/')) {
      console.log('✅ 이미지 URL이 올바른 형식입니다.');
      console.log(`   URL: ${sms.image_url}\n`);
      
      // URL이 유효한지 확인
      try {
        const imageResponse = await fetch(sms.image_url, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효하고 접근 가능합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log('   image_metadata에서 대체 이미지를 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-155`;
          const { data: metadata } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .order('created_at', { ascending: false })
            .limit(1);

          if (metadata && metadata.length > 0) {
            const altUrl = metadata[0].image_url;
            console.log(`✅ 대체 이미지 URL 발견: ${altUrl}`);
            console.log('   이 URL로 업데이트하시겠습니까? (수동으로 확인 필요)\n');
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }
    } else {
      console.log('ℹ️ image_url이 없거나 다른 형식입니다.');
      console.log(`   값: ${sms.image_url || '(없음)'}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixSMS155ImageUrl();

 * SMS 메시지 ID 155의 잘린 이미지 URL을 복구하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSMS155ImageUrl() {
  console.log('🔍 SMS 메시지 155의 이미지 URL 확인 및 복구 시작...\n');

  try {
    // 1. channel_sms에서 메시지 정보 가져오기
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (smsError) {
      console.error('❌ 메시지 조회 실패:', smsError);
      process.exit(1);
    }

    if (!sms) {
      console.error('❌ 메시지 ID 155를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${sms.id}`);
    console.log(`   현재 image_url: ${sms.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms.image_url ? sms.image_url.length : 0}\n`);

    // 2. image_url이 잘렸는지 확인
    if (sms.image_url && sms.image_url.includes('supabase.co/storage/v') && !sms.image_url.includes('/object/public/')) {
      console.log('⚠️ 이미지 URL이 잘린 것으로 확인됨');
      console.log(`   잘린 URL: ${sms.image_url}\n`);

      // 3. image_metadata에서 올바른 이미지 URL 찾기
      const tag = `sms-155`;
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.error('❌ image_metadata 조회 실패:', metadataError);
        process.exit(1);
      }

      if (!metadata || metadata.length === 0) {
        console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
        console.log('   대안: 수동으로 이미지를 다시 업로드하거나, Solapi에서 이미지를 복구해야 합니다.\n');
        
        // Solapi imageId가 있는지 확인
        if (sms.image_url && !sms.image_url.startsWith('http')) {
          console.log(`💡 Solapi imageId로 보입니다: ${sms.image_url}`);
          console.log('   이 경우 Solapi API를 통해 이미지를 다운로드하고 Supabase에 재업로드해야 합니다.\n');
        }
        
        process.exit(0);
      }

      const correctImageUrl = metadata[0].image_url;
      console.log('✅ image_metadata에서 올바른 이미지 URL 발견:');
      console.log(`   ${correctImageUrl}\n`);

      // 4. 이미지 URL이 실제로 접근 가능한지 확인
      console.log('🔍 이미지 URL 유효성 확인 중...');
      try {
        const imageResponse = await fetch(correctImageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}\n`);
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }

      // 5. channel_sms의 image_url 업데이트
      console.log('💾 channel_sms.image_url 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: correctImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ channel_sms.image_url 업데이트 완료!\n');
      console.log('📱 다음 단계:');
      console.log('   1. SMS 편집 페이지를 새로고침하세요');
      console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요\n');

    } else if (sms.image_url && sms.image_url.includes('/object/public/')) {
      console.log('✅ 이미지 URL이 올바른 형식입니다.');
      console.log(`   URL: ${sms.image_url}\n`);
      
      // URL이 유효한지 확인
      try {
        const imageResponse = await fetch(sms.image_url, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효하고 접근 가능합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log('   image_metadata에서 대체 이미지를 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-155`;
          const { data: metadata } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .order('created_at', { ascending: false })
            .limit(1);

          if (metadata && metadata.length > 0) {
            const altUrl = metadata[0].image_url;
            console.log(`✅ 대체 이미지 URL 발견: ${altUrl}`);
            console.log('   이 URL로 업데이트하시겠습니까? (수동으로 확인 필요)\n');
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }
    } else {
      console.log('ℹ️ image_url이 없거나 다른 형식입니다.');
      console.log(`   값: ${sms.image_url || '(없음)'}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixSMS155ImageUrl();

 * SMS 메시지 ID 155의 잘린 이미지 URL을 복구하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSMS155ImageUrl() {
  console.log('🔍 SMS 메시지 155의 이미지 URL 확인 및 복구 시작...\n');

  try {
    // 1. channel_sms에서 메시지 정보 가져오기
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (smsError) {
      console.error('❌ 메시지 조회 실패:', smsError);
      process.exit(1);
    }

    if (!sms) {
      console.error('❌ 메시지 ID 155를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${sms.id}`);
    console.log(`   현재 image_url: ${sms.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms.image_url ? sms.image_url.length : 0}\n`);

    // 2. image_url이 잘렸는지 확인
    if (sms.image_url && sms.image_url.includes('supabase.co/storage/v') && !sms.image_url.includes('/object/public/')) {
      console.log('⚠️ 이미지 URL이 잘린 것으로 확인됨');
      console.log(`   잘린 URL: ${sms.image_url}\n`);

      // 3. image_metadata에서 올바른 이미지 URL 찾기
      const tag = `sms-155`;
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.error('❌ image_metadata 조회 실패:', metadataError);
        process.exit(1);
      }

      if (!metadata || metadata.length === 0) {
        console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
        console.log('   대안: 수동으로 이미지를 다시 업로드하거나, Solapi에서 이미지를 복구해야 합니다.\n');
        
        // Solapi imageId가 있는지 확인
        if (sms.image_url && !sms.image_url.startsWith('http')) {
          console.log(`💡 Solapi imageId로 보입니다: ${sms.image_url}`);
          console.log('   이 경우 Solapi API를 통해 이미지를 다운로드하고 Supabase에 재업로드해야 합니다.\n');
        }
        
        process.exit(0);
      }

      const correctImageUrl = metadata[0].image_url;
      console.log('✅ image_metadata에서 올바른 이미지 URL 발견:');
      console.log(`   ${correctImageUrl}\n`);

      // 4. 이미지 URL이 실제로 접근 가능한지 확인
      console.log('🔍 이미지 URL 유효성 확인 중...');
      try {
        const imageResponse = await fetch(correctImageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}\n`);
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }

      // 5. channel_sms의 image_url 업데이트
      console.log('💾 channel_sms.image_url 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: correctImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ channel_sms.image_url 업데이트 완료!\n');
      console.log('📱 다음 단계:');
      console.log('   1. SMS 편집 페이지를 새로고침하세요');
      console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요\n');

    } else if (sms.image_url && sms.image_url.includes('/object/public/')) {
      console.log('✅ 이미지 URL이 올바른 형식입니다.');
      console.log(`   URL: ${sms.image_url}\n`);
      
      // URL이 유효한지 확인
      try {
        const imageResponse = await fetch(sms.image_url, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효하고 접근 가능합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log('   image_metadata에서 대체 이미지를 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-155`;
          const { data: metadata } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .order('created_at', { ascending: false })
            .limit(1);

          if (metadata && metadata.length > 0) {
            const altUrl = metadata[0].image_url;
            console.log(`✅ 대체 이미지 URL 발견: ${altUrl}`);
            console.log('   이 URL로 업데이트하시겠습니까? (수동으로 확인 필요)\n');
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }
    } else {
      console.log('ℹ️ image_url이 없거나 다른 형식입니다.');
      console.log(`   값: ${sms.image_url || '(없음)'}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixSMS155ImageUrl();

 * SMS 메시지 ID 155의 잘린 이미지 URL을 복구하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSMS155ImageUrl() {
  console.log('🔍 SMS 메시지 155의 이미지 URL 확인 및 복구 시작...\n');

  try {
    // 1. channel_sms에서 메시지 정보 가져오기
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (smsError) {
      console.error('❌ 메시지 조회 실패:', smsError);
      process.exit(1);
    }

    if (!sms) {
      console.error('❌ 메시지 ID 155를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${sms.id}`);
    console.log(`   현재 image_url: ${sms.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms.image_url ? sms.image_url.length : 0}\n`);

    // 2. image_url이 잘렸는지 확인
    if (sms.image_url && sms.image_url.includes('supabase.co/storage/v') && !sms.image_url.includes('/object/public/')) {
      console.log('⚠️ 이미지 URL이 잘린 것으로 확인됨');
      console.log(`   잘린 URL: ${sms.image_url}\n`);

      // 3. image_metadata에서 올바른 이미지 URL 찾기
      const tag = `sms-155`;
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.error('❌ image_metadata 조회 실패:', metadataError);
        process.exit(1);
      }

      if (!metadata || metadata.length === 0) {
        console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
        console.log('   대안: 수동으로 이미지를 다시 업로드하거나, Solapi에서 이미지를 복구해야 합니다.\n');
        
        // Solapi imageId가 있는지 확인
        if (sms.image_url && !sms.image_url.startsWith('http')) {
          console.log(`💡 Solapi imageId로 보입니다: ${sms.image_url}`);
          console.log('   이 경우 Solapi API를 통해 이미지를 다운로드하고 Supabase에 재업로드해야 합니다.\n');
        }
        
        process.exit(0);
      }

      const correctImageUrl = metadata[0].image_url;
      console.log('✅ image_metadata에서 올바른 이미지 URL 발견:');
      console.log(`   ${correctImageUrl}\n`);

      // 4. 이미지 URL이 실제로 접근 가능한지 확인
      console.log('🔍 이미지 URL 유효성 확인 중...');
      try {
        const imageResponse = await fetch(correctImageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}\n`);
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }

      // 5. channel_sms의 image_url 업데이트
      console.log('💾 channel_sms.image_url 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: correctImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ channel_sms.image_url 업데이트 완료!\n');
      console.log('📱 다음 단계:');
      console.log('   1. SMS 편집 페이지를 새로고침하세요');
      console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요\n');

    } else if (sms.image_url && sms.image_url.includes('/object/public/')) {
      console.log('✅ 이미지 URL이 올바른 형식입니다.');
      console.log(`   URL: ${sms.image_url}\n`);
      
      // URL이 유효한지 확인
      try {
        const imageResponse = await fetch(sms.image_url, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효하고 접근 가능합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log('   image_metadata에서 대체 이미지를 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-155`;
          const { data: metadata } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .order('created_at', { ascending: false })
            .limit(1);

          if (metadata && metadata.length > 0) {
            const altUrl = metadata[0].image_url;
            console.log(`✅ 대체 이미지 URL 발견: ${altUrl}`);
            console.log('   이 URL로 업데이트하시겠습니까? (수동으로 확인 필요)\n');
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }
    } else {
      console.log('ℹ️ image_url이 없거나 다른 형식입니다.');
      console.log(`   값: ${sms.image_url || '(없음)'}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixSMS155ImageUrl();

 * SMS 메시지 ID 155의 잘린 이미지 URL을 복구하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSMS155ImageUrl() {
  console.log('🔍 SMS 메시지 155의 이미지 URL 확인 및 복구 시작...\n');

  try {
    // 1. channel_sms에서 메시지 정보 가져오기
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (smsError) {
      console.error('❌ 메시지 조회 실패:', smsError);
      process.exit(1);
    }

    if (!sms) {
      console.error('❌ 메시지 ID 155를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${sms.id}`);
    console.log(`   현재 image_url: ${sms.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms.image_url ? sms.image_url.length : 0}\n`);

    // 2. image_url이 잘렸는지 확인
    if (sms.image_url && sms.image_url.includes('supabase.co/storage/v') && !sms.image_url.includes('/object/public/')) {
      console.log('⚠️ 이미지 URL이 잘린 것으로 확인됨');
      console.log(`   잘린 URL: ${sms.image_url}\n`);

      // 3. image_metadata에서 올바른 이미지 URL 찾기
      const tag = `sms-155`;
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metadataError) {
        console.error('❌ image_metadata 조회 실패:', metadataError);
        process.exit(1);
      }

      if (!metadata || metadata.length === 0) {
        console.log('⚠️ image_metadata에서 이미지를 찾을 수 없습니다.');
        console.log('   대안: 수동으로 이미지를 다시 업로드하거나, Solapi에서 이미지를 복구해야 합니다.\n');
        
        // Solapi imageId가 있는지 확인
        if (sms.image_url && !sms.image_url.startsWith('http')) {
          console.log(`💡 Solapi imageId로 보입니다: ${sms.image_url}`);
          console.log('   이 경우 Solapi API를 통해 이미지를 다운로드하고 Supabase에 재업로드해야 합니다.\n');
        }
        
        process.exit(0);
      }

      const correctImageUrl = metadata[0].image_url;
      console.log('✅ image_metadata에서 올바른 이미지 URL 발견:');
      console.log(`   ${correctImageUrl}\n`);

      // 4. 이미지 URL이 실제로 접근 가능한지 확인
      console.log('🔍 이미지 URL 유효성 확인 중...');
      try {
        const imageResponse = await fetch(correctImageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}\n`);
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }

      // 5. channel_sms의 image_url 업데이트
      console.log('💾 channel_sms.image_url 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: correctImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ channel_sms.image_url 업데이트 완료!\n');
      console.log('📱 다음 단계:');
      console.log('   1. SMS 편집 페이지를 새로고침하세요');
      console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요\n');

    } else if (sms.image_url && sms.image_url.includes('/object/public/')) {
      console.log('✅ 이미지 URL이 올바른 형식입니다.');
      console.log(`   URL: ${sms.image_url}\n`);
      
      // URL이 유효한지 확인
      try {
        const imageResponse = await fetch(sms.image_url, { method: 'HEAD' });
        if (imageResponse.ok) {
          console.log('✅ 이미지 URL이 유효하고 접근 가능합니다.\n');
        } else {
          console.warn(`⚠️ 이미지 URL 접근 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          console.log('   image_metadata에서 대체 이미지를 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-155`;
          const { data: metadata } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .order('created_at', { ascending: false })
            .limit(1);

          if (metadata && metadata.length > 0) {
            const altUrl = metadata[0].image_url;
            console.log(`✅ 대체 이미지 URL 발견: ${altUrl}`);
            console.log('   이 URL로 업데이트하시겠습니까? (수동으로 확인 필요)\n');
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ 이미지 URL 확인 중 오류: ${fetchError.message}\n`);
      }
    } else {
      console.log('ℹ️ image_url이 없거나 다른 형식입니다.');
      console.log(`   값: ${sms.image_url || '(없음)'}\n`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixSMS155ImageUrl();









