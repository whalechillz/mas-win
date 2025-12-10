/**
 * 128번 메시지 이미지에 sms-155 태그 추가
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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지 이미지 찾기 (모든 이미지)
    const tag128 = 'sms-128';
    const { data: images128, error: error128 } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag128])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (error128) {
      console.error('❌ 128번 메시지 이미지 조회 실패:', error128.message);
      process.exit(1);
    }

    if (!images128 || images128.length === 0) {
      console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 128번 메시지 이미지 ${images128.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 2. 각 이미지에 sms-155 태그 추가
    for (const image128 of images128) {
      console.log(`📋 이미지 ID: ${image128.id}`);
      console.log(`   이미지 URL: ${image128.image_url}`);
      console.log(`   현재 태그: ${image128.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = image128.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(image128.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', image128.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }
    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();


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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지 이미지 찾기 (모든 이미지)
    const tag128 = 'sms-128';
    const { data: images128, error: error128 } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag128])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (error128) {
      console.error('❌ 128번 메시지 이미지 조회 실패:', error128.message);
      process.exit(1);
    }

    if (!images128 || images128.length === 0) {
      console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 128번 메시지 이미지 ${images128.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 2. 각 이미지에 sms-155 태그 추가
    for (const image128 of images128) {
      console.log(`📋 이미지 ID: ${image128.id}`);
      console.log(`   이미지 URL: ${image128.image_url}`);
      console.log(`   현재 태그: ${image128.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = image128.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(image128.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', image128.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }
    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();


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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지 이미지 찾기 (모든 이미지)
    const tag128 = 'sms-128';
    const { data: images128, error: error128 } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag128])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (error128) {
      console.error('❌ 128번 메시지 이미지 조회 실패:', error128.message);
      process.exit(1);
    }

    if (!images128 || images128.length === 0) {
      console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 128번 메시지 이미지 ${images128.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 2. 각 이미지에 sms-155 태그 추가
    for (const image128 of images128) {
      console.log(`📋 이미지 ID: ${image128.id}`);
      console.log(`   이미지 URL: ${image128.image_url}`);
      console.log(`   현재 태그: ${image128.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = image128.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(image128.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', image128.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }
    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();


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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지 이미지 찾기 (모든 이미지)
    const tag128 = 'sms-128';
    const { data: images128, error: error128 } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag128])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (error128) {
      console.error('❌ 128번 메시지 이미지 조회 실패:', error128.message);
      process.exit(1);
    }

    if (!images128 || images128.length === 0) {
      console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 128번 메시지 이미지 ${images128.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 2. 각 이미지에 sms-155 태그 추가
    for (const image128 of images128) {
      console.log(`📋 이미지 ID: ${image128.id}`);
      console.log(`   이미지 URL: ${image128.image_url}`);
      console.log(`   현재 태그: ${image128.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = image128.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(image128.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', image128.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }
    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();


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

async function addSms155TagTo128Image() {
  console.log('🔗 128번 메시지 이미지에 sms-155 태그 추가...\n');

  try {
    // 1. 128번 메시지 이미지 찾기 (모든 이미지)
    const tag128 = 'sms-128';
    const { data: images128, error: error128 } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [tag128])
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .order('created_at', { ascending: false });

    if (error128) {
      console.error('❌ 128번 메시지 이미지 조회 실패:', error128.message);
      process.exit(1);
    }

    if (!images128 || images128.length === 0) {
      console.error('❌ 128번 메시지 이미지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 128번 메시지 이미지 ${images128.length}개 발견:\n`);

    let updatedCount = 0;
    let alreadyHasTagCount = 0;

    // 2. 각 이미지에 sms-155 태그 추가
    for (const image128 of images128) {
      console.log(`📋 이미지 ID: ${image128.id}`);
      console.log(`   이미지 URL: ${image128.image_url}`);
      console.log(`   현재 태그: ${image128.tags?.join(', ') || '(없음)'}`);

      // sms-155 태그가 이미 있는지 확인
      const hasSms155Tag = image128.tags?.includes('sms-155');
      
      if (hasSms155Tag) {
        console.log(`   ✅ 이미 sms-155 태그가 있습니다.\n`);
        alreadyHasTagCount++;
        continue;
      }

      // sms-155 태그 추가
      const updatedTags = [...(image128.tags || []), 'sms-155'];
      
      console.log(`   💾 sms-155 태그 추가 중...`);
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', image128.id);

      if (updateError) {
        console.error(`   ❌ 태그 업데이트 실패: ${updateError.message}\n`);
        continue;
      }

      console.log(`   ✅ 태그 업데이트 완료!`);
      console.log(`   새 태그: ${updatedTags.join(', ')}\n`);
      updatedCount++;
    }
    console.log('='.repeat(60));
    console.log('✅ 완료!');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   이미 태그가 있던 이미지: ${alreadyHasTagCount}개`);
    console.log('   이제 155번 폴더를 열면 128번 메시지 이미지가 링크된 이미지로 표시됩니다.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addSms155TagTo128Image();

