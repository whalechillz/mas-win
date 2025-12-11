/**
 * 155번 메시지 이미지 파일이 실제로 존재하는지 확인
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

async function check155ImageExists() {
  console.log('🔍 155번 메시지 이미지 파일 존재 여부 확인...\n');

  try {
    const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
    const storagePath = 'originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';

    console.log('📋 확인할 이미지:');
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Storage 경로: ${storagePath}\n`);

    // 1. Storage에서 파일 존재 확인
    console.log('🔍 Supabase Storage에서 파일 확인 중...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/2025-12-05/155', {
        limit: 100,
        search: 'mms-155-1765118265175.jpg'
      });

    if (listError) {
      console.error('❌ Storage 목록 조회 실패:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('✅ Storage에서 파일 발견:');
      fileList.forEach(file => {
        console.log(`   파일명: ${file.name}`);
        console.log(`   크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`   수정일: ${file.updated_at || file.created_at}\n`);
      });
    } else {
      console.log('❌ Storage에서 파일을 찾을 수 없습니다.\n');
    }

    // 2. HTTP로 이미지 접근 시도
    console.log('🔍 HTTP로 이미지 접근 시도...');
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ 이미지 접근 성공 (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes\n`);
      } else {
        console.log(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})\n`);
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
    }

    // 3. 같은 날짜의 다른 메시지 이미지 확인
    console.log('🔍 같은 날짜(2025-12-05)의 다른 메시지 이미지 확인...');
    const { data: sameDayMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%2025-12-05%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameDayMetadata && sameDayMetadata.length > 0) {
      console.log(`✅ 같은 날짜의 이미지 ${sameDayMetadata.length}개 발견:\n`);
      sameDayMetadata.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}`);
        console.log(`   생성일: ${img.created_at}\n`);
      });
    }

    // 4. 비슷한 파일명을 가진 이미지 찾기 (155번이 아닌)
    console.log('🔍 비슷한 파일명을 가진 다른 메시지 이미지 찾기...');
    const { data: similarImages } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%mms-%')
      .not('image_url', 'like', '%mms-155-%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarImages && similarImages.length > 0) {
      console.log(`✅ 비슷한 파일명을 가진 이미지 ${similarImages.length}개 발견:\n`);
      similarImages.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('💡 권장 사항:');
    console.log('   1. 이미지가 존재하지 않으면, 갤러리에서 비슷한 이미지를 선택하세요');
    console.log('   2. 또는 같은 날짜의 다른 메시지 이미지를 사용하세요');
    console.log('   3. 새로운 이미지를 업로드하여 사용할 수도 있습니다');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check155ImageExists();

 * 155번 메시지 이미지 파일이 실제로 존재하는지 확인
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

async function check155ImageExists() {
  console.log('🔍 155번 메시지 이미지 파일 존재 여부 확인...\n');

  try {
    const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
    const storagePath = 'originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';

    console.log('📋 확인할 이미지:');
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Storage 경로: ${storagePath}\n`);

    // 1. Storage에서 파일 존재 확인
    console.log('🔍 Supabase Storage에서 파일 확인 중...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/2025-12-05/155', {
        limit: 100,
        search: 'mms-155-1765118265175.jpg'
      });

    if (listError) {
      console.error('❌ Storage 목록 조회 실패:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('✅ Storage에서 파일 발견:');
      fileList.forEach(file => {
        console.log(`   파일명: ${file.name}`);
        console.log(`   크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`   수정일: ${file.updated_at || file.created_at}\n`);
      });
    } else {
      console.log('❌ Storage에서 파일을 찾을 수 없습니다.\n');
    }

    // 2. HTTP로 이미지 접근 시도
    console.log('🔍 HTTP로 이미지 접근 시도...');
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ 이미지 접근 성공 (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes\n`);
      } else {
        console.log(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})\n`);
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
    }

    // 3. 같은 날짜의 다른 메시지 이미지 확인
    console.log('🔍 같은 날짜(2025-12-05)의 다른 메시지 이미지 확인...');
    const { data: sameDayMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%2025-12-05%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameDayMetadata && sameDayMetadata.length > 0) {
      console.log(`✅ 같은 날짜의 이미지 ${sameDayMetadata.length}개 발견:\n`);
      sameDayMetadata.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}`);
        console.log(`   생성일: ${img.created_at}\n`);
      });
    }

    // 4. 비슷한 파일명을 가진 이미지 찾기 (155번이 아닌)
    console.log('🔍 비슷한 파일명을 가진 다른 메시지 이미지 찾기...');
    const { data: similarImages } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%mms-%')
      .not('image_url', 'like', '%mms-155-%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarImages && similarImages.length > 0) {
      console.log(`✅ 비슷한 파일명을 가진 이미지 ${similarImages.length}개 발견:\n`);
      similarImages.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('💡 권장 사항:');
    console.log('   1. 이미지가 존재하지 않으면, 갤러리에서 비슷한 이미지를 선택하세요');
    console.log('   2. 또는 같은 날짜의 다른 메시지 이미지를 사용하세요');
    console.log('   3. 새로운 이미지를 업로드하여 사용할 수도 있습니다');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check155ImageExists();

 * 155번 메시지 이미지 파일이 실제로 존재하는지 확인
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

async function check155ImageExists() {
  console.log('🔍 155번 메시지 이미지 파일 존재 여부 확인...\n');

  try {
    const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
    const storagePath = 'originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';

    console.log('📋 확인할 이미지:');
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Storage 경로: ${storagePath}\n`);

    // 1. Storage에서 파일 존재 확인
    console.log('🔍 Supabase Storage에서 파일 확인 중...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/2025-12-05/155', {
        limit: 100,
        search: 'mms-155-1765118265175.jpg'
      });

    if (listError) {
      console.error('❌ Storage 목록 조회 실패:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('✅ Storage에서 파일 발견:');
      fileList.forEach(file => {
        console.log(`   파일명: ${file.name}`);
        console.log(`   크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`   수정일: ${file.updated_at || file.created_at}\n`);
      });
    } else {
      console.log('❌ Storage에서 파일을 찾을 수 없습니다.\n');
    }

    // 2. HTTP로 이미지 접근 시도
    console.log('🔍 HTTP로 이미지 접근 시도...');
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ 이미지 접근 성공 (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes\n`);
      } else {
        console.log(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})\n`);
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
    }

    // 3. 같은 날짜의 다른 메시지 이미지 확인
    console.log('🔍 같은 날짜(2025-12-05)의 다른 메시지 이미지 확인...');
    const { data: sameDayMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%2025-12-05%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameDayMetadata && sameDayMetadata.length > 0) {
      console.log(`✅ 같은 날짜의 이미지 ${sameDayMetadata.length}개 발견:\n`);
      sameDayMetadata.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}`);
        console.log(`   생성일: ${img.created_at}\n`);
      });
    }

    // 4. 비슷한 파일명을 가진 이미지 찾기 (155번이 아닌)
    console.log('🔍 비슷한 파일명을 가진 다른 메시지 이미지 찾기...');
    const { data: similarImages } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%mms-%')
      .not('image_url', 'like', '%mms-155-%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarImages && similarImages.length > 0) {
      console.log(`✅ 비슷한 파일명을 가진 이미지 ${similarImages.length}개 발견:\n`);
      similarImages.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('💡 권장 사항:');
    console.log('   1. 이미지가 존재하지 않으면, 갤러리에서 비슷한 이미지를 선택하세요');
    console.log('   2. 또는 같은 날짜의 다른 메시지 이미지를 사용하세요');
    console.log('   3. 새로운 이미지를 업로드하여 사용할 수도 있습니다');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check155ImageExists();

 * 155번 메시지 이미지 파일이 실제로 존재하는지 확인
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

async function check155ImageExists() {
  console.log('🔍 155번 메시지 이미지 파일 존재 여부 확인...\n');

  try {
    const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
    const storagePath = 'originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';

    console.log('📋 확인할 이미지:');
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Storage 경로: ${storagePath}\n`);

    // 1. Storage에서 파일 존재 확인
    console.log('🔍 Supabase Storage에서 파일 확인 중...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/2025-12-05/155', {
        limit: 100,
        search: 'mms-155-1765118265175.jpg'
      });

    if (listError) {
      console.error('❌ Storage 목록 조회 실패:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('✅ Storage에서 파일 발견:');
      fileList.forEach(file => {
        console.log(`   파일명: ${file.name}`);
        console.log(`   크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`   수정일: ${file.updated_at || file.created_at}\n`);
      });
    } else {
      console.log('❌ Storage에서 파일을 찾을 수 없습니다.\n');
    }

    // 2. HTTP로 이미지 접근 시도
    console.log('🔍 HTTP로 이미지 접근 시도...');
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ 이미지 접근 성공 (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes\n`);
      } else {
        console.log(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})\n`);
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
    }

    // 3. 같은 날짜의 다른 메시지 이미지 확인
    console.log('🔍 같은 날짜(2025-12-05)의 다른 메시지 이미지 확인...');
    const { data: sameDayMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%2025-12-05%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameDayMetadata && sameDayMetadata.length > 0) {
      console.log(`✅ 같은 날짜의 이미지 ${sameDayMetadata.length}개 발견:\n`);
      sameDayMetadata.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}`);
        console.log(`   생성일: ${img.created_at}\n`);
      });
    }

    // 4. 비슷한 파일명을 가진 이미지 찾기 (155번이 아닌)
    console.log('🔍 비슷한 파일명을 가진 다른 메시지 이미지 찾기...');
    const { data: similarImages } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%mms-%')
      .not('image_url', 'like', '%mms-155-%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarImages && similarImages.length > 0) {
      console.log(`✅ 비슷한 파일명을 가진 이미지 ${similarImages.length}개 발견:\n`);
      similarImages.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('💡 권장 사항:');
    console.log('   1. 이미지가 존재하지 않으면, 갤러리에서 비슷한 이미지를 선택하세요');
    console.log('   2. 또는 같은 날짜의 다른 메시지 이미지를 사용하세요');
    console.log('   3. 새로운 이미지를 업로드하여 사용할 수도 있습니다');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check155ImageExists();

 * 155번 메시지 이미지 파일이 실제로 존재하는지 확인
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

async function check155ImageExists() {
  console.log('🔍 155번 메시지 이미지 파일 존재 여부 확인...\n');

  try {
    const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';
    const storagePath = 'originals/mms/2025-12-05/155/mms-155-1765118265175.jpg';

    console.log('📋 확인할 이미지:');
    console.log(`   URL: ${imageUrl}`);
    console.log(`   Storage 경로: ${storagePath}\n`);

    // 1. Storage에서 파일 존재 확인
    console.log('🔍 Supabase Storage에서 파일 확인 중...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/2025-12-05/155', {
        limit: 100,
        search: 'mms-155-1765118265175.jpg'
      });

    if (listError) {
      console.error('❌ Storage 목록 조회 실패:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('✅ Storage에서 파일 발견:');
      fileList.forEach(file => {
        console.log(`   파일명: ${file.name}`);
        console.log(`   크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`   수정일: ${file.updated_at || file.created_at}\n`);
      });
    } else {
      console.log('❌ Storage에서 파일을 찾을 수 없습니다.\n');
    }

    // 2. HTTP로 이미지 접근 시도
    console.log('🔍 HTTP로 이미지 접근 시도...');
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ 이미지 접근 성공 (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes\n`);
      } else {
        console.log(`❌ 이미지 접근 실패 (${response.status} ${response.statusText})\n`);
      }
    } catch (fetchError) {
      console.error('❌ 이미지 접근 중 오류:', fetchError.message);
    }

    // 3. 같은 날짜의 다른 메시지 이미지 확인
    console.log('🔍 같은 날짜(2025-12-05)의 다른 메시지 이미지 확인...');
    const { data: sameDayMetadata } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%2025-12-05%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameDayMetadata && sameDayMetadata.length > 0) {
      console.log(`✅ 같은 날짜의 이미지 ${sameDayMetadata.length}개 발견:\n`);
      sameDayMetadata.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}`);
        console.log(`   생성일: ${img.created_at}\n`);
      });
    }

    // 4. 비슷한 파일명을 가진 이미지 찾기 (155번이 아닌)
    console.log('🔍 비슷한 파일명을 가진 다른 메시지 이미지 찾기...');
    const { data: similarImages } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('source', 'mms')
      .eq('channel', 'sms')
      .ilike('image_url', '%mms-%')
      .not('image_url', 'like', '%mms-155-%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarImages && similarImages.length > 0) {
      console.log(`✅ 비슷한 파일명을 가진 이미지 ${similarImages.length}개 발견:\n`);
      similarImages.forEach(img => {
        const msgId = img.tags?.find(tag => tag.startsWith('sms-'))?.replace('sms-', '') || '알 수 없음';
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   이미지 URL: ${img.image_url}`);
        console.log(`   파일명: ${img.image_url.split('/').pop()}\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('💡 권장 사항:');
    console.log('   1. 이미지가 존재하지 않으면, 갤러리에서 비슷한 이미지를 선택하세요');
    console.log('   2. 또는 같은 날짜의 다른 메시지 이미지를 사용하세요');
    console.log('   3. 새로운 이미지를 업로드하여 사용할 수도 있습니다');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check155ImageExists();








