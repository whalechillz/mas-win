/**
 * 136번 메시지의 이미지 확인 및 155번 메시지에 적용
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

async function checkAndReplace136Image() {
  console.log('🔍 136번 메시지 이미지 확인 및 155번 메시지에 적용...\n');

  try {
    // 1. 136번 메시지 정보 가져오기
    const { data: sms136, error: sms136Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (sms136Error) {
      console.error('❌ 136번 메시지 조회 실패:', sms136Error);
      process.exit(1);
    }

    if (!sms136) {
      console.error('❌ 136번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 136번 메시지 정보:');
    console.log(`   ID: ${sms136.id}`);
    console.log(`   생성일: ${sms136.created_at}`);
    console.log(`   발송일: ${sms136.sent_at || '(미발송)'}`);
    console.log(`   image_url: ${sms136.image_url || '(없음)'}`);
    console.log(`   메시지 내용: ${sms136.message_text ? sms136.message_text.substring(0, 100) : '(없음)'}...\n`);

    if (!sms136.image_url) {
      console.error('❌ 136번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    // 2. image_url이 HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(sms136.image_url);
    let sourceImageUrl = sms136.image_url;

    if (isHttpUrl) {
      console.log('✅ 136번 메시지 image_url이 HTTP URL입니다.');
      console.log(`   ${sourceImageUrl}\n`);

      // 이미지 파일이 실제로 존재하는지 확인
      console.log('🔍 이미지 파일 존재 여부 확인 중...');
      try {
        const response = await fetch(sourceImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
          console.log('   image_metadata에서 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-136`;
          const { data: metadata136 } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .limit(1);

          if (metadata136 && metadata136.length > 0) {
            sourceImageUrl = metadata136[0].image_url;
            console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
          } else {
            console.error('❌ image_metadata에서도 찾을 수 없습니다.');
            process.exit(1);
          }
        } else {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
        }
      } catch (fetchError) {
        console.warn('⚠️ 이미지 접근 중 오류:', fetchError.message);
        console.log('   image_metadata에서 찾아보겠습니다...\n');
        
        // image_metadata에서 찾기
        const tag = `sms-136`;
        const { data: metadata136 } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (metadata136 && metadata136.length > 0) {
          sourceImageUrl = metadata136[0].image_url;
          console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
        }
      }
    } else {
      console.log('⚠️ 136번 메시지 image_url이 Solapi imageId입니다.');
      console.log(`   ${sourceImageUrl}\n`);
      console.log('   image_metadata에서 찾아보겠습니다...\n');
      
      // image_metadata에서 찾기
      const tag = `sms-136`;
      const { data: metadata136 } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .limit(1);

      if (metadata136 && metadata136.length > 0) {
        sourceImageUrl = metadata136[0].image_url;
        console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
      } else {
        console.error('❌ image_metadata에서도 찾을 수 없습니다.');
        process.exit(1);
      }
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

    // 5. image_metadata에 155번 메시지 태그 추가
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    
    // sourceImageUrl로 image_metadata 찾기
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sourceImageUrl)
      .limit(1);

    if (existingMetadata && existingMetadata.length > 0) {
      const existingTags = existingMetadata[0].tags || [];
      const newTag = 'sms-155';
      
      if (!existingTags.includes(newTag)) {
        const { error: tagError } = await supabase
          .from('image_metadata')
          .update({
            tags: [...existingTags, newTag],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata[0].id);

        if (tagError) {
          console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
        } else {
          console.log('✅ 태그 추가 완료\n');
        }
      } else {
        console.log('✅ 태그가 이미 존재합니다\n');
      }
    } else {
      console.log('⚠️ image_metadata를 찾을 수 없어 태그를 추가하지 않았습니다.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 136번 메시지 이미지로 교체되었습니다.`);
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

checkAndReplace136Image();

 * 136번 메시지의 이미지 확인 및 155번 메시지에 적용
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

async function checkAndReplace136Image() {
  console.log('🔍 136번 메시지 이미지 확인 및 155번 메시지에 적용...\n');

  try {
    // 1. 136번 메시지 정보 가져오기
    const { data: sms136, error: sms136Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (sms136Error) {
      console.error('❌ 136번 메시지 조회 실패:', sms136Error);
      process.exit(1);
    }

    if (!sms136) {
      console.error('❌ 136번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 136번 메시지 정보:');
    console.log(`   ID: ${sms136.id}`);
    console.log(`   생성일: ${sms136.created_at}`);
    console.log(`   발송일: ${sms136.sent_at || '(미발송)'}`);
    console.log(`   image_url: ${sms136.image_url || '(없음)'}`);
    console.log(`   메시지 내용: ${sms136.message_text ? sms136.message_text.substring(0, 100) : '(없음)'}...\n`);

    if (!sms136.image_url) {
      console.error('❌ 136번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    // 2. image_url이 HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(sms136.image_url);
    let sourceImageUrl = sms136.image_url;

    if (isHttpUrl) {
      console.log('✅ 136번 메시지 image_url이 HTTP URL입니다.');
      console.log(`   ${sourceImageUrl}\n`);

      // 이미지 파일이 실제로 존재하는지 확인
      console.log('🔍 이미지 파일 존재 여부 확인 중...');
      try {
        const response = await fetch(sourceImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
          console.log('   image_metadata에서 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-136`;
          const { data: metadata136 } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .limit(1);

          if (metadata136 && metadata136.length > 0) {
            sourceImageUrl = metadata136[0].image_url;
            console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
          } else {
            console.error('❌ image_metadata에서도 찾을 수 없습니다.');
            process.exit(1);
          }
        } else {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
        }
      } catch (fetchError) {
        console.warn('⚠️ 이미지 접근 중 오류:', fetchError.message);
        console.log('   image_metadata에서 찾아보겠습니다...\n');
        
        // image_metadata에서 찾기
        const tag = `sms-136`;
        const { data: metadata136 } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (metadata136 && metadata136.length > 0) {
          sourceImageUrl = metadata136[0].image_url;
          console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
        }
      }
    } else {
      console.log('⚠️ 136번 메시지 image_url이 Solapi imageId입니다.');
      console.log(`   ${sourceImageUrl}\n`);
      console.log('   image_metadata에서 찾아보겠습니다...\n');
      
      // image_metadata에서 찾기
      const tag = `sms-136`;
      const { data: metadata136 } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .limit(1);

      if (metadata136 && metadata136.length > 0) {
        sourceImageUrl = metadata136[0].image_url;
        console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
      } else {
        console.error('❌ image_metadata에서도 찾을 수 없습니다.');
        process.exit(1);
      }
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

    // 5. image_metadata에 155번 메시지 태그 추가
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    
    // sourceImageUrl로 image_metadata 찾기
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sourceImageUrl)
      .limit(1);

    if (existingMetadata && existingMetadata.length > 0) {
      const existingTags = existingMetadata[0].tags || [];
      const newTag = 'sms-155';
      
      if (!existingTags.includes(newTag)) {
        const { error: tagError } = await supabase
          .from('image_metadata')
          .update({
            tags: [...existingTags, newTag],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata[0].id);

        if (tagError) {
          console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
        } else {
          console.log('✅ 태그 추가 완료\n');
        }
      } else {
        console.log('✅ 태그가 이미 존재합니다\n');
      }
    } else {
      console.log('⚠️ image_metadata를 찾을 수 없어 태그를 추가하지 않았습니다.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 136번 메시지 이미지로 교체되었습니다.`);
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

checkAndReplace136Image();

 * 136번 메시지의 이미지 확인 및 155번 메시지에 적용
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

async function checkAndReplace136Image() {
  console.log('🔍 136번 메시지 이미지 확인 및 155번 메시지에 적용...\n');

  try {
    // 1. 136번 메시지 정보 가져오기
    const { data: sms136, error: sms136Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (sms136Error) {
      console.error('❌ 136번 메시지 조회 실패:', sms136Error);
      process.exit(1);
    }

    if (!sms136) {
      console.error('❌ 136번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 136번 메시지 정보:');
    console.log(`   ID: ${sms136.id}`);
    console.log(`   생성일: ${sms136.created_at}`);
    console.log(`   발송일: ${sms136.sent_at || '(미발송)'}`);
    console.log(`   image_url: ${sms136.image_url || '(없음)'}`);
    console.log(`   메시지 내용: ${sms136.message_text ? sms136.message_text.substring(0, 100) : '(없음)'}...\n`);

    if (!sms136.image_url) {
      console.error('❌ 136번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    // 2. image_url이 HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(sms136.image_url);
    let sourceImageUrl = sms136.image_url;

    if (isHttpUrl) {
      console.log('✅ 136번 메시지 image_url이 HTTP URL입니다.');
      console.log(`   ${sourceImageUrl}\n`);

      // 이미지 파일이 실제로 존재하는지 확인
      console.log('🔍 이미지 파일 존재 여부 확인 중...');
      try {
        const response = await fetch(sourceImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
          console.log('   image_metadata에서 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-136`;
          const { data: metadata136 } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .limit(1);

          if (metadata136 && metadata136.length > 0) {
            sourceImageUrl = metadata136[0].image_url;
            console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
          } else {
            console.error('❌ image_metadata에서도 찾을 수 없습니다.');
            process.exit(1);
          }
        } else {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
        }
      } catch (fetchError) {
        console.warn('⚠️ 이미지 접근 중 오류:', fetchError.message);
        console.log('   image_metadata에서 찾아보겠습니다...\n');
        
        // image_metadata에서 찾기
        const tag = `sms-136`;
        const { data: metadata136 } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (metadata136 && metadata136.length > 0) {
          sourceImageUrl = metadata136[0].image_url;
          console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
        }
      }
    } else {
      console.log('⚠️ 136번 메시지 image_url이 Solapi imageId입니다.');
      console.log(`   ${sourceImageUrl}\n`);
      console.log('   image_metadata에서 찾아보겠습니다...\n');
      
      // image_metadata에서 찾기
      const tag = `sms-136`;
      const { data: metadata136 } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .limit(1);

      if (metadata136 && metadata136.length > 0) {
        sourceImageUrl = metadata136[0].image_url;
        console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
      } else {
        console.error('❌ image_metadata에서도 찾을 수 없습니다.');
        process.exit(1);
      }
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

    // 5. image_metadata에 155번 메시지 태그 추가
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    
    // sourceImageUrl로 image_metadata 찾기
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sourceImageUrl)
      .limit(1);

    if (existingMetadata && existingMetadata.length > 0) {
      const existingTags = existingMetadata[0].tags || [];
      const newTag = 'sms-155';
      
      if (!existingTags.includes(newTag)) {
        const { error: tagError } = await supabase
          .from('image_metadata')
          .update({
            tags: [...existingTags, newTag],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata[0].id);

        if (tagError) {
          console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
        } else {
          console.log('✅ 태그 추가 완료\n');
        }
      } else {
        console.log('✅ 태그가 이미 존재합니다\n');
      }
    } else {
      console.log('⚠️ image_metadata를 찾을 수 없어 태그를 추가하지 않았습니다.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 136번 메시지 이미지로 교체되었습니다.`);
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

checkAndReplace136Image();

 * 136번 메시지의 이미지 확인 및 155번 메시지에 적용
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

async function checkAndReplace136Image() {
  console.log('🔍 136번 메시지 이미지 확인 및 155번 메시지에 적용...\n');

  try {
    // 1. 136번 메시지 정보 가져오기
    const { data: sms136, error: sms136Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (sms136Error) {
      console.error('❌ 136번 메시지 조회 실패:', sms136Error);
      process.exit(1);
    }

    if (!sms136) {
      console.error('❌ 136번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 136번 메시지 정보:');
    console.log(`   ID: ${sms136.id}`);
    console.log(`   생성일: ${sms136.created_at}`);
    console.log(`   발송일: ${sms136.sent_at || '(미발송)'}`);
    console.log(`   image_url: ${sms136.image_url || '(없음)'}`);
    console.log(`   메시지 내용: ${sms136.message_text ? sms136.message_text.substring(0, 100) : '(없음)'}...\n`);

    if (!sms136.image_url) {
      console.error('❌ 136번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    // 2. image_url이 HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(sms136.image_url);
    let sourceImageUrl = sms136.image_url;

    if (isHttpUrl) {
      console.log('✅ 136번 메시지 image_url이 HTTP URL입니다.');
      console.log(`   ${sourceImageUrl}\n`);

      // 이미지 파일이 실제로 존재하는지 확인
      console.log('🔍 이미지 파일 존재 여부 확인 중...');
      try {
        const response = await fetch(sourceImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
          console.log('   image_metadata에서 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-136`;
          const { data: metadata136 } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .limit(1);

          if (metadata136 && metadata136.length > 0) {
            sourceImageUrl = metadata136[0].image_url;
            console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
          } else {
            console.error('❌ image_metadata에서도 찾을 수 없습니다.');
            process.exit(1);
          }
        } else {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
        }
      } catch (fetchError) {
        console.warn('⚠️ 이미지 접근 중 오류:', fetchError.message);
        console.log('   image_metadata에서 찾아보겠습니다...\n');
        
        // image_metadata에서 찾기
        const tag = `sms-136`;
        const { data: metadata136 } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (metadata136 && metadata136.length > 0) {
          sourceImageUrl = metadata136[0].image_url;
          console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
        }
      }
    } else {
      console.log('⚠️ 136번 메시지 image_url이 Solapi imageId입니다.');
      console.log(`   ${sourceImageUrl}\n`);
      console.log('   image_metadata에서 찾아보겠습니다...\n');
      
      // image_metadata에서 찾기
      const tag = `sms-136`;
      const { data: metadata136 } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .limit(1);

      if (metadata136 && metadata136.length > 0) {
        sourceImageUrl = metadata136[0].image_url;
        console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
      } else {
        console.error('❌ image_metadata에서도 찾을 수 없습니다.');
        process.exit(1);
      }
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

    // 5. image_metadata에 155번 메시지 태그 추가
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    
    // sourceImageUrl로 image_metadata 찾기
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sourceImageUrl)
      .limit(1);

    if (existingMetadata && existingMetadata.length > 0) {
      const existingTags = existingMetadata[0].tags || [];
      const newTag = 'sms-155';
      
      if (!existingTags.includes(newTag)) {
        const { error: tagError } = await supabase
          .from('image_metadata')
          .update({
            tags: [...existingTags, newTag],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata[0].id);

        if (tagError) {
          console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
        } else {
          console.log('✅ 태그 추가 완료\n');
        }
      } else {
        console.log('✅ 태그가 이미 존재합니다\n');
      }
    } else {
      console.log('⚠️ image_metadata를 찾을 수 없어 태그를 추가하지 않았습니다.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 136번 메시지 이미지로 교체되었습니다.`);
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

checkAndReplace136Image();

 * 136번 메시지의 이미지 확인 및 155번 메시지에 적용
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

async function checkAndReplace136Image() {
  console.log('🔍 136번 메시지 이미지 확인 및 155번 메시지에 적용...\n');

  try {
    // 1. 136번 메시지 정보 가져오기
    const { data: sms136, error: sms136Error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (sms136Error) {
      console.error('❌ 136번 메시지 조회 실패:', sms136Error);
      process.exit(1);
    }

    if (!sms136) {
      console.error('❌ 136번 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 136번 메시지 정보:');
    console.log(`   ID: ${sms136.id}`);
    console.log(`   생성일: ${sms136.created_at}`);
    console.log(`   발송일: ${sms136.sent_at || '(미발송)'}`);
    console.log(`   image_url: ${sms136.image_url || '(없음)'}`);
    console.log(`   메시지 내용: ${sms136.message_text ? sms136.message_text.substring(0, 100) : '(없음)'}...\n`);

    if (!sms136.image_url) {
      console.error('❌ 136번 메시지에 image_url이 없습니다.');
      process.exit(1);
    }

    // 2. image_url이 HTTP URL인지 확인
    const isHttpUrl = /^https?:\/\//i.test(sms136.image_url);
    let sourceImageUrl = sms136.image_url;

    if (isHttpUrl) {
      console.log('✅ 136번 메시지 image_url이 HTTP URL입니다.');
      console.log(`   ${sourceImageUrl}\n`);

      // 이미지 파일이 실제로 존재하는지 확인
      console.log('🔍 이미지 파일 존재 여부 확인 중...');
      try {
        const response = await fetch(sourceImageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})`);
          console.log('   image_metadata에서 찾아보겠습니다...\n');
          
          // image_metadata에서 찾기
          const tag = `sms-136`;
          const { data: metadata136 } = await supabase
            .from('image_metadata')
            .select('*')
            .contains('tags', [tag])
            .eq('source', 'mms')
            .eq('channel', 'sms')
            .limit(1);

          if (metadata136 && metadata136.length > 0) {
            sourceImageUrl = metadata136[0].image_url;
            console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
          } else {
            console.error('❌ image_metadata에서도 찾을 수 없습니다.');
            process.exit(1);
          }
        } else {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ 이미지 접근 성공 (크기: ${contentLength} bytes)\n`);
        }
      } catch (fetchError) {
        console.warn('⚠️ 이미지 접근 중 오류:', fetchError.message);
        console.log('   image_metadata에서 찾아보겠습니다...\n');
        
        // image_metadata에서 찾기
        const tag = `sms-136`;
        const { data: metadata136 } = await supabase
          .from('image_metadata')
          .select('*')
          .contains('tags', [tag])
          .eq('source', 'mms')
          .eq('channel', 'sms')
          .limit(1);

        if (metadata136 && metadata136.length > 0) {
          sourceImageUrl = metadata136[0].image_url;
          console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
        }
      }
    } else {
      console.log('⚠️ 136번 메시지 image_url이 Solapi imageId입니다.');
      console.log(`   ${sourceImageUrl}\n`);
      console.log('   image_metadata에서 찾아보겠습니다...\n');
      
      // image_metadata에서 찾기
      const tag = `sms-136`;
      const { data: metadata136 } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .limit(1);

      if (metadata136 && metadata136.length > 0) {
        sourceImageUrl = metadata136[0].image_url;
        console.log(`✅ image_metadata에서 발견: ${sourceImageUrl}\n`);
      } else {
        console.error('❌ image_metadata에서도 찾을 수 없습니다.');
        process.exit(1);
      }
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

    // 5. image_metadata에 155번 메시지 태그 추가
    console.log('📝 image_metadata에 155번 메시지 태그 추가 중...');
    
    // sourceImageUrl로 image_metadata 찾기
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', sourceImageUrl)
      .limit(1);

    if (existingMetadata && existingMetadata.length > 0) {
      const existingTags = existingMetadata[0].tags || [];
      const newTag = 'sms-155';
      
      if (!existingTags.includes(newTag)) {
        const { error: tagError } = await supabase
          .from('image_metadata')
          .update({
            tags: [...existingTags, newTag],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata[0].id);

        if (tagError) {
          console.warn('⚠️ 태그 추가 실패 (무시):', tagError.message);
        } else {
          console.log('✅ 태그 추가 완료\n');
        }
      } else {
        console.log('✅ 태그가 이미 존재합니다\n');
      }
    } else {
      console.log('⚠️ image_metadata를 찾을 수 없어 태그를 추가하지 않았습니다.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   155번 메시지의 이미지가 136번 메시지 이미지로 교체되었습니다.`);
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

checkAndReplace136Image();







