/**
 * 155번 메시지 이미지를 다른 메시지의 이미지로 교체
 * 사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]
 * 예: node scripts/replace-155-image-from-other-message.js 123
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

async function replace155ImageFromOtherMessage(sourceMessageId) {
  console.log(`🔄 155번 메시지 이미지를 ${sourceMessageId}번 메시지 이미지로 교체...\n`);

  try {
    // 1. 소스 메시지(예: 123번)의 이미지 찾기
    const sourceTag = `sms-${sourceMessageId}`;
    const { data: sourceMetadata, error: sourceError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [sourceTag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sourceError) {
      console.error('❌ 소스 메시지 이미지 조회 실패:', sourceError);
      process.exit(1);
    }

    if (!sourceMetadata || sourceMetadata.length === 0) {
      console.error(`❌ ${sourceMessageId}번 메시지의 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 사용 가능한 메시지 ID 목록:');
      
      // 최근 MMS 메시지 목록 표시
      const { data: recentMms } = await supabase
        .from('channel_sms')
        .select('id, created_at, message_text')
        .eq('message_type', 'MMS')
        .not('image_url', 'is', null)
        .neq('id', 155)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMms && recentMms.length > 0) {
        recentMms.forEach(msg => {
          console.log(`   - 메시지 ID: ${msg.id} (생성일: ${msg.created_at})`);
        });
      }
      process.exit(1);
    }

    const sourceImageUrl = sourceMetadata[0].image_url;
    console.log(`✅ ${sourceMessageId}번 메시지 이미지 발견:`);
    console.log(`   ${sourceImageUrl}\n`);

    // 2. 이미지 파일이 실제로 존재하는지 확인
    console.log('🔍 이미지 파일 존재 여부 확인 중...');
    try {
      const response = await fetch(sourceImageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
        process.exit(1);
      }
      const contentLength = response.headers.get('content-length');
      console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
      
      if (parseInt(contentLength) < 1000) {
        console.warn('⚠️ 이미지 크기가 매우 작습니다. 손상된 파일일 수 있습니다.\n');
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
      process.exit(1);
    }

    // 3. 155번 메시지 정보 확인
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    console.log('📋 155번 메시지 현재 상태:');
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}\n`);

    // 4. 155번 메시지의 image_url 업데이트
    console.log('💾 155번 메시지 image_url 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: sourceImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 155번 메시지 image_url 업데이트 완료!\n');

    // 5. image_metadata에 155번 메시지 태그 추가 (선택사항)
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    const existingTags = sourceMetadata[0].tags || [];
    const newTag = 'sms-155';
    
    if (!existingTags.includes(newTag)) {
      const { error: tagError } = await supabase
        .from('image_metadata')
        .update({
          tags: [...existingTags, newTag],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceMetadata[0].id);

      if (tagError) {
        console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
      } else {
        console.log('✅ 태그 추가 완료\n');
      }
    } else {
      console.log('✅ 태그가 이미 존재합니다\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 ${sourceMessageId}번 메시지 이미지로 교체되었습니다.`);
    console.log(`   새 이미지 URL: ${sourceImageUrl}`);
    console.log('\n📱 다음 단계:');
    console.log('   1. SMS 편집 페이지를 새로고침하세요');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄 인자에서 소스 메시지 ID 가져오기
const sourceMessageId = process.argv[2];

if (!sourceMessageId) {
  console.log('사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]');
  console.log('예: node scripts/replace-155-image-from-other-message.js 123\n');
  console.log('💡 사용 가능한 메시지 ID를 확인하려면:');
  console.log('   node scripts/find-similar-mms-images.js\n');
  process.exit(1);
}

replace155ImageFromOtherMessage(parseInt(sourceMessageId));

 * 155번 메시지 이미지를 다른 메시지의 이미지로 교체
 * 사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]
 * 예: node scripts/replace-155-image-from-other-message.js 123
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

async function replace155ImageFromOtherMessage(sourceMessageId) {
  console.log(`🔄 155번 메시지 이미지를 ${sourceMessageId}번 메시지 이미지로 교체...\n`);

  try {
    // 1. 소스 메시지(예: 123번)의 이미지 찾기
    const sourceTag = `sms-${sourceMessageId}`;
    const { data: sourceMetadata, error: sourceError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [sourceTag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sourceError) {
      console.error('❌ 소스 메시지 이미지 조회 실패:', sourceError);
      process.exit(1);
    }

    if (!sourceMetadata || sourceMetadata.length === 0) {
      console.error(`❌ ${sourceMessageId}번 메시지의 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 사용 가능한 메시지 ID 목록:');
      
      // 최근 MMS 메시지 목록 표시
      const { data: recentMms } = await supabase
        .from('channel_sms')
        .select('id, created_at, message_text')
        .eq('message_type', 'MMS')
        .not('image_url', 'is', null)
        .neq('id', 155)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMms && recentMms.length > 0) {
        recentMms.forEach(msg => {
          console.log(`   - 메시지 ID: ${msg.id} (생성일: ${msg.created_at})`);
        });
      }
      process.exit(1);
    }

    const sourceImageUrl = sourceMetadata[0].image_url;
    console.log(`✅ ${sourceMessageId}번 메시지 이미지 발견:`);
    console.log(`   ${sourceImageUrl}\n`);

    // 2. 이미지 파일이 실제로 존재하는지 확인
    console.log('🔍 이미지 파일 존재 여부 확인 중...');
    try {
      const response = await fetch(sourceImageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
        process.exit(1);
      }
      const contentLength = response.headers.get('content-length');
      console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
      
      if (parseInt(contentLength) < 1000) {
        console.warn('⚠️ 이미지 크기가 매우 작습니다. 손상된 파일일 수 있습니다.\n');
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
      process.exit(1);
    }

    // 3. 155번 메시지 정보 확인
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    console.log('📋 155번 메시지 현재 상태:');
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}\n`);

    // 4. 155번 메시지의 image_url 업데이트
    console.log('💾 155번 메시지 image_url 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: sourceImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 155번 메시지 image_url 업데이트 완료!\n');

    // 5. image_metadata에 155번 메시지 태그 추가 (선택사항)
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    const existingTags = sourceMetadata[0].tags || [];
    const newTag = 'sms-155';
    
    if (!existingTags.includes(newTag)) {
      const { error: tagError } = await supabase
        .from('image_metadata')
        .update({
          tags: [...existingTags, newTag],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceMetadata[0].id);

      if (tagError) {
        console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
      } else {
        console.log('✅ 태그 추가 완료\n');
      }
    } else {
      console.log('✅ 태그가 이미 존재합니다\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 ${sourceMessageId}번 메시지 이미지로 교체되었습니다.`);
    console.log(`   새 이미지 URL: ${sourceImageUrl}`);
    console.log('\n📱 다음 단계:');
    console.log('   1. SMS 편집 페이지를 새로고침하세요');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄 인자에서 소스 메시지 ID 가져오기
const sourceMessageId = process.argv[2];

if (!sourceMessageId) {
  console.log('사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]');
  console.log('예: node scripts/replace-155-image-from-other-message.js 123\n');
  console.log('💡 사용 가능한 메시지 ID를 확인하려면:');
  console.log('   node scripts/find-similar-mms-images.js\n');
  process.exit(1);
}

replace155ImageFromOtherMessage(parseInt(sourceMessageId));

 * 155번 메시지 이미지를 다른 메시지의 이미지로 교체
 * 사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]
 * 예: node scripts/replace-155-image-from-other-message.js 123
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

async function replace155ImageFromOtherMessage(sourceMessageId) {
  console.log(`🔄 155번 메시지 이미지를 ${sourceMessageId}번 메시지 이미지로 교체...\n`);

  try {
    // 1. 소스 메시지(예: 123번)의 이미지 찾기
    const sourceTag = `sms-${sourceMessageId}`;
    const { data: sourceMetadata, error: sourceError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [sourceTag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sourceError) {
      console.error('❌ 소스 메시지 이미지 조회 실패:', sourceError);
      process.exit(1);
    }

    if (!sourceMetadata || sourceMetadata.length === 0) {
      console.error(`❌ ${sourceMessageId}번 메시지의 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 사용 가능한 메시지 ID 목록:');
      
      // 최근 MMS 메시지 목록 표시
      const { data: recentMms } = await supabase
        .from('channel_sms')
        .select('id, created_at, message_text')
        .eq('message_type', 'MMS')
        .not('image_url', 'is', null)
        .neq('id', 155)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMms && recentMms.length > 0) {
        recentMms.forEach(msg => {
          console.log(`   - 메시지 ID: ${msg.id} (생성일: ${msg.created_at})`);
        });
      }
      process.exit(1);
    }

    const sourceImageUrl = sourceMetadata[0].image_url;
    console.log(`✅ ${sourceMessageId}번 메시지 이미지 발견:`);
    console.log(`   ${sourceImageUrl}\n`);

    // 2. 이미지 파일이 실제로 존재하는지 확인
    console.log('🔍 이미지 파일 존재 여부 확인 중...');
    try {
      const response = await fetch(sourceImageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
        process.exit(1);
      }
      const contentLength = response.headers.get('content-length');
      console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
      
      if (parseInt(contentLength) < 1000) {
        console.warn('⚠️ 이미지 크기가 매우 작습니다. 손상된 파일일 수 있습니다.\n');
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
      process.exit(1);
    }

    // 3. 155번 메시지 정보 확인
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    console.log('📋 155번 메시지 현재 상태:');
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}\n`);

    // 4. 155번 메시지의 image_url 업데이트
    console.log('💾 155번 메시지 image_url 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: sourceImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 155번 메시지 image_url 업데이트 완료!\n');

    // 5. image_metadata에 155번 메시지 태그 추가 (선택사항)
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    const existingTags = sourceMetadata[0].tags || [];
    const newTag = 'sms-155';
    
    if (!existingTags.includes(newTag)) {
      const { error: tagError } = await supabase
        .from('image_metadata')
        .update({
          tags: [...existingTags, newTag],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceMetadata[0].id);

      if (tagError) {
        console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
      } else {
        console.log('✅ 태그 추가 완료\n');
      }
    } else {
      console.log('✅ 태그가 이미 존재합니다\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 ${sourceMessageId}번 메시지 이미지로 교체되었습니다.`);
    console.log(`   새 이미지 URL: ${sourceImageUrl}`);
    console.log('\n📱 다음 단계:');
    console.log('   1. SMS 편집 페이지를 새로고침하세요');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄 인자에서 소스 메시지 ID 가져오기
const sourceMessageId = process.argv[2];

if (!sourceMessageId) {
  console.log('사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]');
  console.log('예: node scripts/replace-155-image-from-other-message.js 123\n');
  console.log('💡 사용 가능한 메시지 ID를 확인하려면:');
  console.log('   node scripts/find-similar-mms-images.js\n');
  process.exit(1);
}

replace155ImageFromOtherMessage(parseInt(sourceMessageId));

 * 155번 메시지 이미지를 다른 메시지의 이미지로 교체
 * 사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]
 * 예: node scripts/replace-155-image-from-other-message.js 123
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

async function replace155ImageFromOtherMessage(sourceMessageId) {
  console.log(`🔄 155번 메시지 이미지를 ${sourceMessageId}번 메시지 이미지로 교체...\n`);

  try {
    // 1. 소스 메시지(예: 123번)의 이미지 찾기
    const sourceTag = `sms-${sourceMessageId}`;
    const { data: sourceMetadata, error: sourceError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [sourceTag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sourceError) {
      console.error('❌ 소스 메시지 이미지 조회 실패:', sourceError);
      process.exit(1);
    }

    if (!sourceMetadata || sourceMetadata.length === 0) {
      console.error(`❌ ${sourceMessageId}번 메시지의 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 사용 가능한 메시지 ID 목록:');
      
      // 최근 MMS 메시지 목록 표시
      const { data: recentMms } = await supabase
        .from('channel_sms')
        .select('id, created_at, message_text')
        .eq('message_type', 'MMS')
        .not('image_url', 'is', null)
        .neq('id', 155)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMms && recentMms.length > 0) {
        recentMms.forEach(msg => {
          console.log(`   - 메시지 ID: ${msg.id} (생성일: ${msg.created_at})`);
        });
      }
      process.exit(1);
    }

    const sourceImageUrl = sourceMetadata[0].image_url;
    console.log(`✅ ${sourceMessageId}번 메시지 이미지 발견:`);
    console.log(`   ${sourceImageUrl}\n`);

    // 2. 이미지 파일이 실제로 존재하는지 확인
    console.log('🔍 이미지 파일 존재 여부 확인 중...');
    try {
      const response = await fetch(sourceImageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
        process.exit(1);
      }
      const contentLength = response.headers.get('content-length');
      console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
      
      if (parseInt(contentLength) < 1000) {
        console.warn('⚠️ 이미지 크기가 매우 작습니다. 손상된 파일일 수 있습니다.\n');
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
      process.exit(1);
    }

    // 3. 155번 메시지 정보 확인
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    console.log('📋 155번 메시지 현재 상태:');
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}\n`);

    // 4. 155번 메시지의 image_url 업데이트
    console.log('💾 155번 메시지 image_url 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: sourceImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 155번 메시지 image_url 업데이트 완료!\n');

    // 5. image_metadata에 155번 메시지 태그 추가 (선택사항)
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    const existingTags = sourceMetadata[0].tags || [];
    const newTag = 'sms-155';
    
    if (!existingTags.includes(newTag)) {
      const { error: tagError } = await supabase
        .from('image_metadata')
        .update({
          tags: [...existingTags, newTag],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceMetadata[0].id);

      if (tagError) {
        console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
      } else {
        console.log('✅ 태그 추가 완료\n');
      }
    } else {
      console.log('✅ 태그가 이미 존재합니다\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 ${sourceMessageId}번 메시지 이미지로 교체되었습니다.`);
    console.log(`   새 이미지 URL: ${sourceImageUrl}`);
    console.log('\n📱 다음 단계:');
    console.log('   1. SMS 편집 페이지를 새로고침하세요');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄 인자에서 소스 메시지 ID 가져오기
const sourceMessageId = process.argv[2];

if (!sourceMessageId) {
  console.log('사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]');
  console.log('예: node scripts/replace-155-image-from-other-message.js 123\n');
  console.log('💡 사용 가능한 메시지 ID를 확인하려면:');
  console.log('   node scripts/find-similar-mms-images.js\n');
  process.exit(1);
}

replace155ImageFromOtherMessage(parseInt(sourceMessageId));

 * 155번 메시지 이미지를 다른 메시지의 이미지로 교체
 * 사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]
 * 예: node scripts/replace-155-image-from-other-message.js 123
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

async function replace155ImageFromOtherMessage(sourceMessageId) {
  console.log(`🔄 155번 메시지 이미지를 ${sourceMessageId}번 메시지 이미지로 교체...\n`);

  try {
    // 1. 소스 메시지(예: 123번)의 이미지 찾기
    const sourceTag = `sms-${sourceMessageId}`;
    const { data: sourceMetadata, error: sourceError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [sourceTag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sourceError) {
      console.error('❌ 소스 메시지 이미지 조회 실패:', sourceError);
      process.exit(1);
    }

    if (!sourceMetadata || sourceMetadata.length === 0) {
      console.error(`❌ ${sourceMessageId}번 메시지의 이미지를 찾을 수 없습니다.`);
      console.log('\n💡 사용 가능한 메시지 ID 목록:');
      
      // 최근 MMS 메시지 목록 표시
      const { data: recentMms } = await supabase
        .from('channel_sms')
        .select('id, created_at, message_text')
        .eq('message_type', 'MMS')
        .not('image_url', 'is', null)
        .neq('id', 155)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMms && recentMms.length > 0) {
        recentMms.forEach(msg => {
          console.log(`   - 메시지 ID: ${msg.id} (생성일: ${msg.created_at})`);
        });
      }
      process.exit(1);
    }

    const sourceImageUrl = sourceMetadata[0].image_url;
    console.log(`✅ ${sourceMessageId}번 메시지 이미지 발견:`);
    console.log(`   ${sourceImageUrl}\n`);

    // 2. 이미지 파일이 실제로 존재하는지 확인
    console.log('🔍 이미지 파일 존재 여부 확인 중...');
    try {
      const response = await fetch(sourceImageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
        process.exit(1);
      }
      const contentLength = response.headers.get('content-length');
      console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
      
      if (parseInt(contentLength) < 1000) {
        console.warn('⚠️ 이미지 크기가 매우 작습니다. 손상된 파일일 수 있습니다.\n');
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
      process.exit(1);
    }

    // 3. 155번 메시지 정보 확인
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    console.log('📋 155번 메시지 현재 상태:');
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}\n`);

    // 4. 155번 메시지의 image_url 업데이트
    console.log('💾 155번 메시지 image_url 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: sourceImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 155번 메시지 image_url 업데이트 완료!\n');

    // 5. image_metadata에 155번 메시지 태그 추가 (선택사항)
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    const existingTags = sourceMetadata[0].tags || [];
    const newTag = 'sms-155';
    
    if (!existingTags.includes(newTag)) {
      const { error: tagError } = await supabase
        .from('image_metadata')
        .update({
          tags: [...existingTags, newTag],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceMetadata[0].id);

      if (tagError) {
        console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
      } else {
        console.log('✅ 태그 추가 완료\n');
      }
    } else {
      console.log('✅ 태그가 이미 존재합니다\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 ${sourceMessageId}번 메시지 이미지로 교체되었습니다.`);
    console.log(`   새 이미지 URL: ${sourceImageUrl}`);
    console.log('\n📱 다음 단계:');
    console.log('   1. SMS 편집 페이지를 새로고침하세요');
    console.log('   2. 이미지가 정상적으로 표시되는지 확인하세요');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄 인자에서 소스 메시지 ID 가져오기
const sourceMessageId = process.argv[2];

if (!sourceMessageId) {
  console.log('사용법: node scripts/replace-155-image-from-other-message.js [메시지ID]');
  console.log('예: node scripts/replace-155-image-from-other-message.js 123\n');
  console.log('💡 사용 가능한 메시지 ID를 확인하려면:');
  console.log('   node scripts/find-similar-mms-images.js\n');
  process.exit(1);
}

replace155ImageFromOtherMessage(parseInt(sourceMessageId));












