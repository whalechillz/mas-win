/**
 * 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기
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

async function findSimilarMmsImages() {
  console.log('🔍 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기...\n');

  try {
    // 1. 155번 메시지 정보 가져오기
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    if (!sms155) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 155번 메시지 정보:');
    console.log(`   ID: ${sms155.id}`);
    console.log(`   생성일: ${sms155.created_at}`);
    console.log(`   발송일: ${sms155.sent_at || '(미발송)'}`);
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms155.image_url ? sms155.image_url.length : 0}\n`);

    // 2. image_metadata에서 155번 메시지의 이미지 찾기
    const tag = `sms-155`;
    const { data: metadata155, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetImageUrl = null;
    if (metadata155 && metadata155.length > 0) {
      targetImageUrl = metadata155[0].image_url;
      console.log('✅ image_metadata에서 155번 메시지 이미지 발견:');
      console.log(`   ${targetImageUrl}\n`);
    } else {
      console.log('⚠️ image_metadata에서 155번 메시지 이미지를 찾을 수 없습니다.\n');
      
      // 3. 같은 날짜/시간대에 발송된 메시지 찾기
      if (sms155.sent_at) {
        const sentDate = new Date(sms155.sent_at);
        const startDate = new Date(sentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(sentDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(`🔍 같은 날짜(${startDate.toISOString().split('T')[0]})에 발송된 메시지 찾기...\n`);

        const { data: sameDayMessages, error: sameDayError } = await supabase
          .from('channel_sms')
          .select('*')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .neq('id', 155)
          .not('image_url', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (sameDayError) {
          console.error('❌ 같은 날짜 메시지 조회 실패:', sameDayError);
        } else if (sameDayMessages && sameDayMessages.length > 0) {
          console.log(`✅ 같은 날짜에 발송된 메시지 ${sameDayMessages.length}개 발견:\n`);
          sameDayMessages.forEach(msg => {
            console.log(`   메시지 ID: ${msg.id}`);
            console.log(`   발송일: ${msg.sent_at}`);
            console.log(`   image_url: ${msg.image_url ? msg.image_url.substring(0, 80) : '(없음)'}...`);
            console.log(`   메시지 내용: ${msg.message_text ? msg.message_text.substring(0, 50) : '(없음)'}...\n`);
          });

          // 각 메시지의 image_metadata 확인
          console.log('🔍 각 메시지의 image_metadata 확인 중...\n');
          for (const msg of sameDayMessages) {
            const msgTag = `sms-${msg.id}`;
            const { data: msgMetadata } = await supabase
              .from('image_metadata')
              .select('*')
              .contains('tags', [msgTag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .limit(1);

            if (msgMetadata && msgMetadata.length > 0) {
              console.log(`   ✅ 메시지 ${msg.id}의 이미지: ${msgMetadata[0].image_url}`);
              
              // 이 이미지 URL을 155번 메시지에 사용할 수 있는지 확인
              if (!targetImageUrl) {
                targetImageUrl = msgMetadata[0].image_url;
                console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
                break;
              }
            }
          }
        } else {
          console.log('⚠️ 같은 날짜에 발송된 다른 메시지를 찾을 수 없습니다.\n');
        }
      }
    }

    // 4. 비슷한 이미지 파일명을 가진 메시지 찾기
    if (sms155.image_url && sms155.image_url.includes('mms-155-')) {
      const fileNamePattern = sms155.image_url.match(/mms-155-(\d+)\./);
      if (fileNamePattern) {
        const timestamp = fileNamePattern[1];
        console.log(`🔍 비슷한 타임스탬프(${timestamp})를 가진 이미지 찾기...\n`);

        // image_metadata에서 비슷한 파일명 찾기
        const { data: similarImages } = await supabase
          .from('image_metadata')
          .select('*')
          .ilike('image_url', `%mms-%${timestamp}%`)
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(10);

        if (similarImages && similarImages.length > 0) {
          console.log(`✅ 비슷한 타임스탬프를 가진 이미지 ${similarImages.length}개 발견:\n`);
          similarImages.forEach(img => {
            console.log(`   이미지 URL: ${img.image_url}`);
            console.log(`   태그: ${JSON.stringify(img.tags)}`);
            console.log(`   생성일: ${img.created_at}\n`);
          });
        }
      }
    }

    // 5. 최근 MMS 메시지 중 이미지가 있는 메시지 찾기
    console.log('🔍 최근 MMS 메시지 중 이미지가 있는 메시지 찾기...\n');
    const { data: recentMms, error: recentError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('message_type', 'MMS')
      .not('image_url', 'is', null)
      .neq('id', 155)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ 최근 MMS 메시지 조회 실패:', recentError);
    } else if (recentMms && recentMms.length > 0) {
      console.log(`✅ 최근 MMS 메시지 ${recentMms.length}개 발견:\n`);
      
      // 각 메시지의 image_metadata 확인
      for (const msg of recentMms) {
        const msgTag = `sms-${msg.id}`;
        const { data: msgMetadata } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [msgTag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (msgMetadata && msgMetadata.length > 0) {
          const imageUrl = msgMetadata[0].image_url;
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   생성일: ${msg.created_at}`);
          console.log(`   이미지 URL: ${imageUrl}`);
          console.log(`   파일명: ${imageUrl.split('/').pop()}\n`);

          // 이 이미지가 155번 메시지와 같은지 확인 (파일명 비교)
          if (imageUrl.includes('mms-155-') || imageUrl.includes('155')) {
            console.log(`   ⭐ 이 이미지는 155번 메시지와 관련이 있을 수 있습니다!\n`);
            if (!targetImageUrl) {
              targetImageUrl = imageUrl;
              console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
            }
          }
        }
      }
    }

    // 6. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 결과 요약:');
    if (targetImageUrl) {
      console.log(`   ✅ 복구 가능한 이미지 URL 발견:`);
      console.log(`   ${targetImageUrl}\n`);
      console.log('💡 다음 단계:');
      console.log('   1. 이 이미지 URL을 155번 메시지에 업데이트하세요');
      console.log('   2. 또는 갤러리에서 이 이미지를 선택하여 155번 메시지에 적용하세요\n');
    } else {
      console.log(`   ⚠️ 복구 가능한 이미지를 찾을 수 없습니다.\n`);
      console.log('💡 대안:');
      console.log('   1. 갤러리에서 비슷한 이미지를 선택하세요');
      console.log('   2. 또는 새로운 이미지를 업로드하세요\n');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

findSimilarMmsImages();

 * 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기
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

async function findSimilarMmsImages() {
  console.log('🔍 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기...\n');

  try {
    // 1. 155번 메시지 정보 가져오기
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    if (!sms155) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 155번 메시지 정보:');
    console.log(`   ID: ${sms155.id}`);
    console.log(`   생성일: ${sms155.created_at}`);
    console.log(`   발송일: ${sms155.sent_at || '(미발송)'}`);
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms155.image_url ? sms155.image_url.length : 0}\n`);

    // 2. image_metadata에서 155번 메시지의 이미지 찾기
    const tag = `sms-155`;
    const { data: metadata155, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetImageUrl = null;
    if (metadata155 && metadata155.length > 0) {
      targetImageUrl = metadata155[0].image_url;
      console.log('✅ image_metadata에서 155번 메시지 이미지 발견:');
      console.log(`   ${targetImageUrl}\n`);
    } else {
      console.log('⚠️ image_metadata에서 155번 메시지 이미지를 찾을 수 없습니다.\n');
      
      // 3. 같은 날짜/시간대에 발송된 메시지 찾기
      if (sms155.sent_at) {
        const sentDate = new Date(sms155.sent_at);
        const startDate = new Date(sentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(sentDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(`🔍 같은 날짜(${startDate.toISOString().split('T')[0]})에 발송된 메시지 찾기...\n`);

        const { data: sameDayMessages, error: sameDayError } = await supabase
          .from('channel_sms')
          .select('*')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .neq('id', 155)
          .not('image_url', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (sameDayError) {
          console.error('❌ 같은 날짜 메시지 조회 실패:', sameDayError);
        } else if (sameDayMessages && sameDayMessages.length > 0) {
          console.log(`✅ 같은 날짜에 발송된 메시지 ${sameDayMessages.length}개 발견:\n`);
          sameDayMessages.forEach(msg => {
            console.log(`   메시지 ID: ${msg.id}`);
            console.log(`   발송일: ${msg.sent_at}`);
            console.log(`   image_url: ${msg.image_url ? msg.image_url.substring(0, 80) : '(없음)'}...`);
            console.log(`   메시지 내용: ${msg.message_text ? msg.message_text.substring(0, 50) : '(없음)'}...\n`);
          });

          // 각 메시지의 image_metadata 확인
          console.log('🔍 각 메시지의 image_metadata 확인 중...\n');
          for (const msg of sameDayMessages) {
            const msgTag = `sms-${msg.id}`;
            const { data: msgMetadata } = await supabase
              .from('image_metadata')
              .select('*')
              .contains('tags', [msgTag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .limit(1);

            if (msgMetadata && msgMetadata.length > 0) {
              console.log(`   ✅ 메시지 ${msg.id}의 이미지: ${msgMetadata[0].image_url}`);
              
              // 이 이미지 URL을 155번 메시지에 사용할 수 있는지 확인
              if (!targetImageUrl) {
                targetImageUrl = msgMetadata[0].image_url;
                console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
                break;
              }
            }
          }
        } else {
          console.log('⚠️ 같은 날짜에 발송된 다른 메시지를 찾을 수 없습니다.\n');
        }
      }
    }

    // 4. 비슷한 이미지 파일명을 가진 메시지 찾기
    if (sms155.image_url && sms155.image_url.includes('mms-155-')) {
      const fileNamePattern = sms155.image_url.match(/mms-155-(\d+)\./);
      if (fileNamePattern) {
        const timestamp = fileNamePattern[1];
        console.log(`🔍 비슷한 타임스탬프(${timestamp})를 가진 이미지 찾기...\n`);

        // image_metadata에서 비슷한 파일명 찾기
        const { data: similarImages } = await supabase
          .from('image_metadata')
          .select('*')
          .ilike('image_url', `%mms-%${timestamp}%`)
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(10);

        if (similarImages && similarImages.length > 0) {
          console.log(`✅ 비슷한 타임스탬프를 가진 이미지 ${similarImages.length}개 발견:\n`);
          similarImages.forEach(img => {
            console.log(`   이미지 URL: ${img.image_url}`);
            console.log(`   태그: ${JSON.stringify(img.tags)}`);
            console.log(`   생성일: ${img.created_at}\n`);
          });
        }
      }
    }

    // 5. 최근 MMS 메시지 중 이미지가 있는 메시지 찾기
    console.log('🔍 최근 MMS 메시지 중 이미지가 있는 메시지 찾기...\n');
    const { data: recentMms, error: recentError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('message_type', 'MMS')
      .not('image_url', 'is', null)
      .neq('id', 155)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ 최근 MMS 메시지 조회 실패:', recentError);
    } else if (recentMms && recentMms.length > 0) {
      console.log(`✅ 최근 MMS 메시지 ${recentMms.length}개 발견:\n`);
      
      // 각 메시지의 image_metadata 확인
      for (const msg of recentMms) {
        const msgTag = `sms-${msg.id}`;
        const { data: msgMetadata } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [msgTag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (msgMetadata && msgMetadata.length > 0) {
          const imageUrl = msgMetadata[0].image_url;
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   생성일: ${msg.created_at}`);
          console.log(`   이미지 URL: ${imageUrl}`);
          console.log(`   파일명: ${imageUrl.split('/').pop()}\n`);

          // 이 이미지가 155번 메시지와 같은지 확인 (파일명 비교)
          if (imageUrl.includes('mms-155-') || imageUrl.includes('155')) {
            console.log(`   ⭐ 이 이미지는 155번 메시지와 관련이 있을 수 있습니다!\n`);
            if (!targetImageUrl) {
              targetImageUrl = imageUrl;
              console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
            }
          }
        }
      }
    }

    // 6. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 결과 요약:');
    if (targetImageUrl) {
      console.log(`   ✅ 복구 가능한 이미지 URL 발견:`);
      console.log(`   ${targetImageUrl}\n`);
      console.log('💡 다음 단계:');
      console.log('   1. 이 이미지 URL을 155번 메시지에 업데이트하세요');
      console.log('   2. 또는 갤러리에서 이 이미지를 선택하여 155번 메시지에 적용하세요\n');
    } else {
      console.log(`   ⚠️ 복구 가능한 이미지를 찾을 수 없습니다.\n`);
      console.log('💡 대안:');
      console.log('   1. 갤러리에서 비슷한 이미지를 선택하세요');
      console.log('   2. 또는 새로운 이미지를 업로드하세요\n');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

findSimilarMmsImages();

 * 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기
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

async function findSimilarMmsImages() {
  console.log('🔍 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기...\n');

  try {
    // 1. 155번 메시지 정보 가져오기
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    if (!sms155) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 155번 메시지 정보:');
    console.log(`   ID: ${sms155.id}`);
    console.log(`   생성일: ${sms155.created_at}`);
    console.log(`   발송일: ${sms155.sent_at || '(미발송)'}`);
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms155.image_url ? sms155.image_url.length : 0}\n`);

    // 2. image_metadata에서 155번 메시지의 이미지 찾기
    const tag = `sms-155`;
    const { data: metadata155, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetImageUrl = null;
    if (metadata155 && metadata155.length > 0) {
      targetImageUrl = metadata155[0].image_url;
      console.log('✅ image_metadata에서 155번 메시지 이미지 발견:');
      console.log(`   ${targetImageUrl}\n`);
    } else {
      console.log('⚠️ image_metadata에서 155번 메시지 이미지를 찾을 수 없습니다.\n');
      
      // 3. 같은 날짜/시간대에 발송된 메시지 찾기
      if (sms155.sent_at) {
        const sentDate = new Date(sms155.sent_at);
        const startDate = new Date(sentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(sentDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(`🔍 같은 날짜(${startDate.toISOString().split('T')[0]})에 발송된 메시지 찾기...\n`);

        const { data: sameDayMessages, error: sameDayError } = await supabase
          .from('channel_sms')
          .select('*')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .neq('id', 155)
          .not('image_url', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (sameDayError) {
          console.error('❌ 같은 날짜 메시지 조회 실패:', sameDayError);
        } else if (sameDayMessages && sameDayMessages.length > 0) {
          console.log(`✅ 같은 날짜에 발송된 메시지 ${sameDayMessages.length}개 발견:\n`);
          sameDayMessages.forEach(msg => {
            console.log(`   메시지 ID: ${msg.id}`);
            console.log(`   발송일: ${msg.sent_at}`);
            console.log(`   image_url: ${msg.image_url ? msg.image_url.substring(0, 80) : '(없음)'}...`);
            console.log(`   메시지 내용: ${msg.message_text ? msg.message_text.substring(0, 50) : '(없음)'}...\n`);
          });

          // 각 메시지의 image_metadata 확인
          console.log('🔍 각 메시지의 image_metadata 확인 중...\n');
          for (const msg of sameDayMessages) {
            const msgTag = `sms-${msg.id}`;
            const { data: msgMetadata } = await supabase
              .from('image_metadata')
              .select('*')
              .contains('tags', [msgTag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .limit(1);

            if (msgMetadata && msgMetadata.length > 0) {
              console.log(`   ✅ 메시지 ${msg.id}의 이미지: ${msgMetadata[0].image_url}`);
              
              // 이 이미지 URL을 155번 메시지에 사용할 수 있는지 확인
              if (!targetImageUrl) {
                targetImageUrl = msgMetadata[0].image_url;
                console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
                break;
              }
            }
          }
        } else {
          console.log('⚠️ 같은 날짜에 발송된 다른 메시지를 찾을 수 없습니다.\n');
        }
      }
    }

    // 4. 비슷한 이미지 파일명을 가진 메시지 찾기
    if (sms155.image_url && sms155.image_url.includes('mms-155-')) {
      const fileNamePattern = sms155.image_url.match(/mms-155-(\d+)\./);
      if (fileNamePattern) {
        const timestamp = fileNamePattern[1];
        console.log(`🔍 비슷한 타임스탬프(${timestamp})를 가진 이미지 찾기...\n`);

        // image_metadata에서 비슷한 파일명 찾기
        const { data: similarImages } = await supabase
          .from('image_metadata')
          .select('*')
          .ilike('image_url', `%mms-%${timestamp}%`)
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(10);

        if (similarImages && similarImages.length > 0) {
          console.log(`✅ 비슷한 타임스탬프를 가진 이미지 ${similarImages.length}개 발견:\n`);
          similarImages.forEach(img => {
            console.log(`   이미지 URL: ${img.image_url}`);
            console.log(`   태그: ${JSON.stringify(img.tags)}`);
            console.log(`   생성일: ${img.created_at}\n`);
          });
        }
      }
    }

    // 5. 최근 MMS 메시지 중 이미지가 있는 메시지 찾기
    console.log('🔍 최근 MMS 메시지 중 이미지가 있는 메시지 찾기...\n');
    const { data: recentMms, error: recentError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('message_type', 'MMS')
      .not('image_url', 'is', null)
      .neq('id', 155)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ 최근 MMS 메시지 조회 실패:', recentError);
    } else if (recentMms && recentMms.length > 0) {
      console.log(`✅ 최근 MMS 메시지 ${recentMms.length}개 발견:\n`);
      
      // 각 메시지의 image_metadata 확인
      for (const msg of recentMms) {
        const msgTag = `sms-${msg.id}`;
        const { data: msgMetadata } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [msgTag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (msgMetadata && msgMetadata.length > 0) {
          const imageUrl = msgMetadata[0].image_url;
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   생성일: ${msg.created_at}`);
          console.log(`   이미지 URL: ${imageUrl}`);
          console.log(`   파일명: ${imageUrl.split('/').pop()}\n`);

          // 이 이미지가 155번 메시지와 같은지 확인 (파일명 비교)
          if (imageUrl.includes('mms-155-') || imageUrl.includes('155')) {
            console.log(`   ⭐ 이 이미지는 155번 메시지와 관련이 있을 수 있습니다!\n`);
            if (!targetImageUrl) {
              targetImageUrl = imageUrl;
              console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
            }
          }
        }
      }
    }

    // 6. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 결과 요약:');
    if (targetImageUrl) {
      console.log(`   ✅ 복구 가능한 이미지 URL 발견:`);
      console.log(`   ${targetImageUrl}\n`);
      console.log('💡 다음 단계:');
      console.log('   1. 이 이미지 URL을 155번 메시지에 업데이트하세요');
      console.log('   2. 또는 갤러리에서 이 이미지를 선택하여 155번 메시지에 적용하세요\n');
    } else {
      console.log(`   ⚠️ 복구 가능한 이미지를 찾을 수 없습니다.\n`);
      console.log('💡 대안:');
      console.log('   1. 갤러리에서 비슷한 이미지를 선택하세요');
      console.log('   2. 또는 새로운 이미지를 업로드하세요\n');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

findSimilarMmsImages();

 * 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기
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

async function findSimilarMmsImages() {
  console.log('🔍 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기...\n');

  try {
    // 1. 155번 메시지 정보 가져오기
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    if (!sms155) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 155번 메시지 정보:');
    console.log(`   ID: ${sms155.id}`);
    console.log(`   생성일: ${sms155.created_at}`);
    console.log(`   발송일: ${sms155.sent_at || '(미발송)'}`);
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms155.image_url ? sms155.image_url.length : 0}\n`);

    // 2. image_metadata에서 155번 메시지의 이미지 찾기
    const tag = `sms-155`;
    const { data: metadata155, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetImageUrl = null;
    if (metadata155 && metadata155.length > 0) {
      targetImageUrl = metadata155[0].image_url;
      console.log('✅ image_metadata에서 155번 메시지 이미지 발견:');
      console.log(`   ${targetImageUrl}\n`);
    } else {
      console.log('⚠️ image_metadata에서 155번 메시지 이미지를 찾을 수 없습니다.\n');
      
      // 3. 같은 날짜/시간대에 발송된 메시지 찾기
      if (sms155.sent_at) {
        const sentDate = new Date(sms155.sent_at);
        const startDate = new Date(sentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(sentDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(`🔍 같은 날짜(${startDate.toISOString().split('T')[0]})에 발송된 메시지 찾기...\n`);

        const { data: sameDayMessages, error: sameDayError } = await supabase
          .from('channel_sms')
          .select('*')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .neq('id', 155)
          .not('image_url', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (sameDayError) {
          console.error('❌ 같은 날짜 메시지 조회 실패:', sameDayError);
        } else if (sameDayMessages && sameDayMessages.length > 0) {
          console.log(`✅ 같은 날짜에 발송된 메시지 ${sameDayMessages.length}개 발견:\n`);
          sameDayMessages.forEach(msg => {
            console.log(`   메시지 ID: ${msg.id}`);
            console.log(`   발송일: ${msg.sent_at}`);
            console.log(`   image_url: ${msg.image_url ? msg.image_url.substring(0, 80) : '(없음)'}...`);
            console.log(`   메시지 내용: ${msg.message_text ? msg.message_text.substring(0, 50) : '(없음)'}...\n`);
          });

          // 각 메시지의 image_metadata 확인
          console.log('🔍 각 메시지의 image_metadata 확인 중...\n');
          for (const msg of sameDayMessages) {
            const msgTag = `sms-${msg.id}`;
            const { data: msgMetadata } = await supabase
              .from('image_metadata')
              .select('*')
              .contains('tags', [msgTag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .limit(1);

            if (msgMetadata && msgMetadata.length > 0) {
              console.log(`   ✅ 메시지 ${msg.id}의 이미지: ${msgMetadata[0].image_url}`);
              
              // 이 이미지 URL을 155번 메시지에 사용할 수 있는지 확인
              if (!targetImageUrl) {
                targetImageUrl = msgMetadata[0].image_url;
                console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
                break;
              }
            }
          }
        } else {
          console.log('⚠️ 같은 날짜에 발송된 다른 메시지를 찾을 수 없습니다.\n');
        }
      }
    }

    // 4. 비슷한 이미지 파일명을 가진 메시지 찾기
    if (sms155.image_url && sms155.image_url.includes('mms-155-')) {
      const fileNamePattern = sms155.image_url.match(/mms-155-(\d+)\./);
      if (fileNamePattern) {
        const timestamp = fileNamePattern[1];
        console.log(`🔍 비슷한 타임스탬프(${timestamp})를 가진 이미지 찾기...\n`);

        // image_metadata에서 비슷한 파일명 찾기
        const { data: similarImages } = await supabase
          .from('image_metadata')
          .select('*')
          .ilike('image_url', `%mms-%${timestamp}%`)
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(10);

        if (similarImages && similarImages.length > 0) {
          console.log(`✅ 비슷한 타임스탬프를 가진 이미지 ${similarImages.length}개 발견:\n`);
          similarImages.forEach(img => {
            console.log(`   이미지 URL: ${img.image_url}`);
            console.log(`   태그: ${JSON.stringify(img.tags)}`);
            console.log(`   생성일: ${img.created_at}\n`);
          });
        }
      }
    }

    // 5. 최근 MMS 메시지 중 이미지가 있는 메시지 찾기
    console.log('🔍 최근 MMS 메시지 중 이미지가 있는 메시지 찾기...\n');
    const { data: recentMms, error: recentError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('message_type', 'MMS')
      .not('image_url', 'is', null)
      .neq('id', 155)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ 최근 MMS 메시지 조회 실패:', recentError);
    } else if (recentMms && recentMms.length > 0) {
      console.log(`✅ 최근 MMS 메시지 ${recentMms.length}개 발견:\n`);
      
      // 각 메시지의 image_metadata 확인
      for (const msg of recentMms) {
        const msgTag = `sms-${msg.id}`;
        const { data: msgMetadata } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [msgTag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (msgMetadata && msgMetadata.length > 0) {
          const imageUrl = msgMetadata[0].image_url;
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   생성일: ${msg.created_at}`);
          console.log(`   이미지 URL: ${imageUrl}`);
          console.log(`   파일명: ${imageUrl.split('/').pop()}\n`);

          // 이 이미지가 155번 메시지와 같은지 확인 (파일명 비교)
          if (imageUrl.includes('mms-155-') || imageUrl.includes('155')) {
            console.log(`   ⭐ 이 이미지는 155번 메시지와 관련이 있을 수 있습니다!\n`);
            if (!targetImageUrl) {
              targetImageUrl = imageUrl;
              console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
            }
          }
        }
      }
    }

    // 6. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 결과 요약:');
    if (targetImageUrl) {
      console.log(`   ✅ 복구 가능한 이미지 URL 발견:`);
      console.log(`   ${targetImageUrl}\n`);
      console.log('💡 다음 단계:');
      console.log('   1. 이 이미지 URL을 155번 메시지에 업데이트하세요');
      console.log('   2. 또는 갤러리에서 이 이미지를 선택하여 155번 메시지에 적용하세요\n');
    } else {
      console.log(`   ⚠️ 복구 가능한 이미지를 찾을 수 없습니다.\n`);
      console.log('💡 대안:');
      console.log('   1. 갤러리에서 비슷한 이미지를 선택하세요');
      console.log('   2. 또는 새로운 이미지를 업로드하세요\n');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

findSimilarMmsImages();

 * 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기
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

async function findSimilarMmsImages() {
  console.log('🔍 155번 메시지와 같은 이미지를 사용한 다른 메시지 찾기...\n');

  try {
    // 1. 155번 메시지 정보 가져오기
    const { data: sms155, error: sms155Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (sms155Error) {
      console.error('❌ 155번 메시지 조회 실패:', sms155Error);
      process.exit(1);
    }

    if (!sms155) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 155번 메시지 정보:');
    console.log(`   ID: ${sms155.id}`);
    console.log(`   생성일: ${sms155.created_at}`);
    console.log(`   발송일: ${sms155.sent_at || '(미발송)'}`);
    console.log(`   현재 image_url: ${sms155.image_url || '(없음)'}`);
    console.log(`   image_url 길이: ${sms155.image_url ? sms155.image_url.length : 0}\n`);

    // 2. image_metadata에서 155번 메시지의 이미지 찾기
    const tag = `sms-155`;
    const { data: metadata155, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetImageUrl = null;
    if (metadata155 && metadata155.length > 0) {
      targetImageUrl = metadata155[0].image_url;
      console.log('✅ image_metadata에서 155번 메시지 이미지 발견:');
      console.log(`   ${targetImageUrl}\n`);
    } else {
      console.log('⚠️ image_metadata에서 155번 메시지 이미지를 찾을 수 없습니다.\n');
      
      // 3. 같은 날짜/시간대에 발송된 메시지 찾기
      if (sms155.sent_at) {
        const sentDate = new Date(sms155.sent_at);
        const startDate = new Date(sentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(sentDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(`🔍 같은 날짜(${startDate.toISOString().split('T')[0]})에 발송된 메시지 찾기...\n`);

        const { data: sameDayMessages, error: sameDayError } = await supabase
          .from('channel_sms')
          .select('*')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .neq('id', 155)
          .not('image_url', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(10);

        if (sameDayError) {
          console.error('❌ 같은 날짜 메시지 조회 실패:', sameDayError);
        } else if (sameDayMessages && sameDayMessages.length > 0) {
          console.log(`✅ 같은 날짜에 발송된 메시지 ${sameDayMessages.length}개 발견:\n`);
          sameDayMessages.forEach(msg => {
            console.log(`   메시지 ID: ${msg.id}`);
            console.log(`   발송일: ${msg.sent_at}`);
            console.log(`   image_url: ${msg.image_url ? msg.image_url.substring(0, 80) : '(없음)'}...`);
            console.log(`   메시지 내용: ${msg.message_text ? msg.message_text.substring(0, 50) : '(없음)'}...\n`);
          });

          // 각 메시지의 image_metadata 확인
          console.log('🔍 각 메시지의 image_metadata 확인 중...\n');
          for (const msg of sameDayMessages) {
            const msgTag = `sms-${msg.id}`;
            const { data: msgMetadata } = await supabase
              .from('image_metadata')
              .select('*')
              .contains('tags', [msgTag])
              .eq('source', 'mms')
              .eq('channel', 'sms')
              .limit(1);

            if (msgMetadata && msgMetadata.length > 0) {
              console.log(`   ✅ 메시지 ${msg.id}의 이미지: ${msgMetadata[0].image_url}`);
              
              // 이 이미지 URL을 155번 메시지에 사용할 수 있는지 확인
              if (!targetImageUrl) {
                targetImageUrl = msgMetadata[0].image_url;
                console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
                break;
              }
            }
          }
        } else {
          console.log('⚠️ 같은 날짜에 발송된 다른 메시지를 찾을 수 없습니다.\n');
        }
      }
    }

    // 4. 비슷한 이미지 파일명을 가진 메시지 찾기
    if (sms155.image_url && sms155.image_url.includes('mms-155-')) {
      const fileNamePattern = sms155.image_url.match(/mms-155-(\d+)\./);
      if (fileNamePattern) {
        const timestamp = fileNamePattern[1];
        console.log(`🔍 비슷한 타임스탬프(${timestamp})를 가진 이미지 찾기...\n`);

        // image_metadata에서 비슷한 파일명 찾기
        const { data: similarImages } = await supabase
          .from('image_metadata')
          .select('*')
          .ilike('image_url', `%mms-%${timestamp}%`)
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(10);

        if (similarImages && similarImages.length > 0) {
          console.log(`✅ 비슷한 타임스탬프를 가진 이미지 ${similarImages.length}개 발견:\n`);
          similarImages.forEach(img => {
            console.log(`   이미지 URL: ${img.image_url}`);
            console.log(`   태그: ${JSON.stringify(img.tags)}`);
            console.log(`   생성일: ${img.created_at}\n`);
          });
        }
      }
    }

    // 5. 최근 MMS 메시지 중 이미지가 있는 메시지 찾기
    console.log('🔍 최근 MMS 메시지 중 이미지가 있는 메시지 찾기...\n');
    const { data: recentMms, error: recentError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('message_type', 'MMS')
      .not('image_url', 'is', null)
      .neq('id', 155)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ 최근 MMS 메시지 조회 실패:', recentError);
    } else if (recentMms && recentMms.length > 0) {
      console.log(`✅ 최근 MMS 메시지 ${recentMms.length}개 발견:\n`);
      
      // 각 메시지의 image_metadata 확인
      for (const msg of recentMms) {
        const msgTag = `sms-${msg.id}`;
        const { data: msgMetadata } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [msgTag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (msgMetadata && msgMetadata.length > 0) {
          const imageUrl = msgMetadata[0].image_url;
          console.log(`   메시지 ID: ${msg.id}`);
          console.log(`   생성일: ${msg.created_at}`);
          console.log(`   이미지 URL: ${imageUrl}`);
          console.log(`   파일명: ${imageUrl.split('/').pop()}\n`);

          // 이 이미지가 155번 메시지와 같은지 확인 (파일명 비교)
          if (imageUrl.includes('mms-155-') || imageUrl.includes('155')) {
            console.log(`   ⭐ 이 이미지는 155번 메시지와 관련이 있을 수 있습니다!\n`);
            if (!targetImageUrl) {
              targetImageUrl = imageUrl;
              console.log(`   💡 이 이미지를 155번 메시지에 사용할 수 있습니다!\n`);
            }
          }
        }
      }
    }

    // 6. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 결과 요약:');
    if (targetImageUrl) {
      console.log(`   ✅ 복구 가능한 이미지 URL 발견:`);
      console.log(`   ${targetImageUrl}\n`);
      console.log('💡 다음 단계:');
      console.log('   1. 이 이미지 URL을 155번 메시지에 업데이트하세요');
      console.log('   2. 또는 갤러리에서 이 이미지를 선택하여 155번 메시지에 적용하세요\n');
    } else {
      console.log(`   ⚠️ 복구 가능한 이미지를 찾을 수 없습니다.\n`);
      console.log('💡 대안:');
      console.log('   1. 갤러리에서 비슷한 이미지를 선택하세요');
      console.log('   2. 또는 새로운 이미지를 업로드하세요\n');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

findSimilarMmsImages();






