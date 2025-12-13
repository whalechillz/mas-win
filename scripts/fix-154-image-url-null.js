/**
 * 154번 메시지 image_url을 NULL로 업데이트
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

async function fix154ImageUrlNull() {
  console.log('🔧 154번 메시지 image_url을 NULL로 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. 현재 상태 확인
    console.log('📋 1단계: 현재 상태 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 현재 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}\n`);

    if (!message.image_url) {
      console.log('✅ image_url이 이미 NULL입니다. 수정할 필요가 없습니다.\n');
      return;
    }

    // 2. image_url을 NULL로 업데이트
    console.log('🔧 2단계: image_url을 NULL로 업데이트 중...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms.image_url 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url || '(NULL)'}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyError) {
      console.error('❌ 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 확인 완료:');
      console.log(`   ID: ${verifyMessage.id}`);
      console.log(`   image_url: ${verifyMessage.image_url || '(NULL)'}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 SMS 편집기에서 이미지가 표시되지 않습니다.');
    console.log('페이지를 새로고침하면 변경사항이 반영됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageUrlNull();

 * 154번 메시지 image_url을 NULL로 업데이트
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

async function fix154ImageUrlNull() {
  console.log('🔧 154번 메시지 image_url을 NULL로 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. 현재 상태 확인
    console.log('📋 1단계: 현재 상태 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 현재 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}\n`);

    if (!message.image_url) {
      console.log('✅ image_url이 이미 NULL입니다. 수정할 필요가 없습니다.\n');
      return;
    }

    // 2. image_url을 NULL로 업데이트
    console.log('🔧 2단계: image_url을 NULL로 업데이트 중...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms.image_url 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url || '(NULL)'}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyError) {
      console.error('❌ 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 확인 완료:');
      console.log(`   ID: ${verifyMessage.id}`);
      console.log(`   image_url: ${verifyMessage.image_url || '(NULL)'}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 SMS 편집기에서 이미지가 표시되지 않습니다.');
    console.log('페이지를 새로고침하면 변경사항이 반영됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageUrlNull();

 * 154번 메시지 image_url을 NULL로 업데이트
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

async function fix154ImageUrlNull() {
  console.log('🔧 154번 메시지 image_url을 NULL로 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. 현재 상태 확인
    console.log('📋 1단계: 현재 상태 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 현재 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}\n`);

    if (!message.image_url) {
      console.log('✅ image_url이 이미 NULL입니다. 수정할 필요가 없습니다.\n');
      return;
    }

    // 2. image_url을 NULL로 업데이트
    console.log('🔧 2단계: image_url을 NULL로 업데이트 중...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms.image_url 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url || '(NULL)'}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyError) {
      console.error('❌ 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 확인 완료:');
      console.log(`   ID: ${verifyMessage.id}`);
      console.log(`   image_url: ${verifyMessage.image_url || '(NULL)'}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 SMS 편집기에서 이미지가 표시되지 않습니다.');
    console.log('페이지를 새로고침하면 변경사항이 반영됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageUrlNull();

 * 154번 메시지 image_url을 NULL로 업데이트
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

async function fix154ImageUrlNull() {
  console.log('🔧 154번 메시지 image_url을 NULL로 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. 현재 상태 확인
    console.log('📋 1단계: 현재 상태 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 현재 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}\n`);

    if (!message.image_url) {
      console.log('✅ image_url이 이미 NULL입니다. 수정할 필요가 없습니다.\n');
      return;
    }

    // 2. image_url을 NULL로 업데이트
    console.log('🔧 2단계: image_url을 NULL로 업데이트 중...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms.image_url 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url || '(NULL)'}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyError) {
      console.error('❌ 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 확인 완료:');
      console.log(`   ID: ${verifyMessage.id}`);
      console.log(`   image_url: ${verifyMessage.image_url || '(NULL)'}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 SMS 편집기에서 이미지가 표시되지 않습니다.');
    console.log('페이지를 새로고침하면 변경사항이 반영됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageUrlNull();

 * 154번 메시지 image_url을 NULL로 업데이트
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

async function fix154ImageUrlNull() {
  console.log('🔧 154번 메시지 image_url을 NULL로 업데이트...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. 현재 상태 확인
    console.log('📋 1단계: 현재 상태 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 현재 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}\n`);

    if (!message.image_url) {
      console.log('✅ image_url이 이미 NULL입니다. 수정할 필요가 없습니다.\n');
      return;
    }

    // 2. image_url을 NULL로 업데이트
    console.log('🔧 2단계: image_url을 NULL로 업데이트 중...\n');
    
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      console.error('   상세:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ channel_sms.image_url 업데이트 완료:');
    console.log(`   ID: ${updatedMessage.id}`);
    console.log(`   image_url: ${updatedMessage.image_url || '(NULL)'}\n`);

    // 3. 최종 확인
    console.log('='.repeat(60));
    console.log('📊 최종 확인:\n');
    
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('channel_sms')
      .select('id, image_url')
      .eq('id', messageId)
      .single();

    if (verifyError) {
      console.error('❌ 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 확인 완료:');
      console.log(`   ID: ${verifyMessage.id}`);
      console.log(`   image_url: ${verifyMessage.image_url || '(NULL)'}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 작업 완료!\n');
    console.log('이제 SMS 편집기에서 이미지가 표시되지 않습니다.');
    console.log('페이지를 새로고침하면 변경사항이 반영됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fix154ImageUrlNull();









