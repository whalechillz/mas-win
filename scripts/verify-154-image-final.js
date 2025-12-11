/**
 * 154번 메시지 이미지 최종 확인
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

async function verify154ImageFinal() {
  console.log('🔍 154번 메시지 이미지 최종 확인...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. channel_sms에서 154번 메시지 정보 조회
    console.log('📋 1단계: channel_sms 테이블 조회...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}`);
    console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);

    // 2. image_url에서 날짜 추출
    let dateFolder = null;
    let folderPath = null;
    
    if (message.image_url) {
      // URL에서 날짜와 메시지 ID 추출
      // 예: https://.../originals/mms/2025-12-05/154/mms-154-1764902209781.jpg
      const urlMatch = message.image_url.match(/originals\/mms\/(\d{4}-\d{2}-\d{2})\/(\d+)\//);
      if (urlMatch) {
        dateFolder = urlMatch[1];
        const msgId = urlMatch[2];
        folderPath = `originals/mms/${dateFolder}/${msgId}`;
        console.log(`📅 image_url에서 추출한 정보:`);
        console.log(`   날짜 폴더: ${dateFolder}`);
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   폴더 경로: ${folderPath}\n`);
      } else {
        console.log('⚠️ image_url에서 날짜/메시지 ID를 추출할 수 없습니다.\n');
      }
    }

    // 3. 가능한 모든 날짜 폴더 확인
    const possibleDates = ['2025-12-04', '2025-12-05'];
    
    for (const date of possibleDates) {
      const testFolderPath = `originals/mms/${date}/${messageId}`;
      console.log(`📁 확인 중: ${testFolderPath}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(testFolderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error(`   ❌ 조회 실패: ${listError.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ⚠️ 파일 없음\n`);
        continue;
      }

      // 이미지 파일만 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
      });

      if (imageFiles.length > 0) {
        console.log(`   ✅ ${imageFiles.length}개 이미지 파일 발견:\n`);
        imageFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.name}`);
          console.log(`         크기: ${file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`         생성일: ${file.created_at || '알 수 없음'}`);
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${testFolderPath}/${file.name}`);
          console.log(`         URL: ${urlData?.publicUrl || '생성 실패'}\n`);
        });
      } else {
        console.log(`   ⚠️ 이미지 파일 없음 (${files.length}개 항목 중 이미지 없음)\n`);
      }
    }

    // 4. image_metadata에서 154번 관련 메타데이터 조회
    console.log('📋 4단계: image_metadata 테이블 조회...\n');
    
    // 방법 1: tags로 조회 (sms-154)
    const { data: metadataByTag, error: metaTagError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', ['sms-154']);

    console.log(`   tags에 "sms-154" 포함으로 조회:`);
    if (metaTagError) {
      console.error(`   ❌ 조회 실패: ${metaTagError.message}\n`);
    } else if (metadataByTag && metadataByTag.length > 0) {
      console.log(`   ✅ ${metadataByTag.length}개 메타데이터 발견:\n`);
      metadataByTag.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.image_url}`);
        console.log(`      folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`      source: ${meta.source || '(없음)'}`);
        console.log(`      channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log(`   ⚠️ 메타데이터 없음\n`);
    }

    // 방법 2: image_url로 직접 조회
    if (message.image_url) {
      console.log(`   image_url="${message.image_url}"로 조회:`);
      const { data: metadataByUrl, error: metaUrlError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message.image_url)
        .maybeSingle();

      if (metaUrlError) {
        console.error(`   ❌ 조회 실패: ${metaUrlError.message}\n`);
      } else if (metadataByUrl) {
        console.log(`   ✅ 메타데이터 발견:\n`);
        console.log(`      folder_path: ${metadataByUrl.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(metadataByUrl.tags || [])}`);
        console.log(`      source: ${metadataByUrl.source || '(없음)'}`);
        console.log(`      channel: ${metadataByUrl.channel || '(없음)'}\n`);
      } else {
        console.log(`   ⚠️ 메타데이터 없음\n`);
      }
    }

    // 5. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약:\n');
    console.log(`1. channel_sms.image_url: ${message.image_url || '(없음)'}`);
    if (folderPath) {
      console.log(`2. 추정 폴더 경로: ${folderPath}`);
    }
    console.log(`3. image_metadata (tags: sms-154): ${metadataByTag && metadataByTag.length > 0 ? `${metadataByTag.length}개` : '없음'}\n`);
    
    // 6. 권장 사항
    console.log('💡 권장 사항:\n');
    if (!message.image_url) {
      console.log('   ⚠️ channel_sms.image_url이 없습니다. 이미지를 설정해야 합니다.\n');
    } else if (metadataByTag && metadataByTag.length > 0) {
      const hasMetadata = metadataByTag.some(meta => meta.folder_path && meta.folder_path.includes(`/${messageId}`));
      if (hasMetadata) {
        console.log('   ✅ 메타데이터가 있습니다. "갤러리에서 선택" 시 이미지가 표시되어야 합니다.\n');
      } else {
        console.log('   ⚠️ 메타데이터는 있지만 folder_path가 메시지 ID 폴더와 일치하지 않습니다.');
        console.log('   ⚠️ 상위 폴더로 자동 이동하는 현재 방식이 적절합니다.\n');
      }
    } else {
      console.log('   ⚠️ image_metadata에 메타데이터가 없습니다.');
      console.log('   ⚠️ 메타데이터를 생성하면 "갤러리에서 선택" 시 바로 표시됩니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verify154ImageFinal();

 * 154번 메시지 이미지 최종 확인
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

async function verify154ImageFinal() {
  console.log('🔍 154번 메시지 이미지 최종 확인...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. channel_sms에서 154번 메시지 정보 조회
    console.log('📋 1단계: channel_sms 테이블 조회...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}`);
    console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);

    // 2. image_url에서 날짜 추출
    let dateFolder = null;
    let folderPath = null;
    
    if (message.image_url) {
      // URL에서 날짜와 메시지 ID 추출
      // 예: https://.../originals/mms/2025-12-05/154/mms-154-1764902209781.jpg
      const urlMatch = message.image_url.match(/originals\/mms\/(\d{4}-\d{2}-\d{2})\/(\d+)\//);
      if (urlMatch) {
        dateFolder = urlMatch[1];
        const msgId = urlMatch[2];
        folderPath = `originals/mms/${dateFolder}/${msgId}`;
        console.log(`📅 image_url에서 추출한 정보:`);
        console.log(`   날짜 폴더: ${dateFolder}`);
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   폴더 경로: ${folderPath}\n`);
      } else {
        console.log('⚠️ image_url에서 날짜/메시지 ID를 추출할 수 없습니다.\n');
      }
    }

    // 3. 가능한 모든 날짜 폴더 확인
    const possibleDates = ['2025-12-04', '2025-12-05'];
    
    for (const date of possibleDates) {
      const testFolderPath = `originals/mms/${date}/${messageId}`;
      console.log(`📁 확인 중: ${testFolderPath}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(testFolderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error(`   ❌ 조회 실패: ${listError.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ⚠️ 파일 없음\n`);
        continue;
      }

      // 이미지 파일만 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
      });

      if (imageFiles.length > 0) {
        console.log(`   ✅ ${imageFiles.length}개 이미지 파일 발견:\n`);
        imageFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.name}`);
          console.log(`         크기: ${file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`         생성일: ${file.created_at || '알 수 없음'}`);
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${testFolderPath}/${file.name}`);
          console.log(`         URL: ${urlData?.publicUrl || '생성 실패'}\n`);
        });
      } else {
        console.log(`   ⚠️ 이미지 파일 없음 (${files.length}개 항목 중 이미지 없음)\n`);
      }
    }

    // 4. image_metadata에서 154번 관련 메타데이터 조회
    console.log('📋 4단계: image_metadata 테이블 조회...\n');
    
    // 방법 1: tags로 조회 (sms-154)
    const { data: metadataByTag, error: metaTagError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', ['sms-154']);

    console.log(`   tags에 "sms-154" 포함으로 조회:`);
    if (metaTagError) {
      console.error(`   ❌ 조회 실패: ${metaTagError.message}\n`);
    } else if (metadataByTag && metadataByTag.length > 0) {
      console.log(`   ✅ ${metadataByTag.length}개 메타데이터 발견:\n`);
      metadataByTag.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.image_url}`);
        console.log(`      folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`      source: ${meta.source || '(없음)'}`);
        console.log(`      channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log(`   ⚠️ 메타데이터 없음\n`);
    }

    // 방법 2: image_url로 직접 조회
    if (message.image_url) {
      console.log(`   image_url="${message.image_url}"로 조회:`);
      const { data: metadataByUrl, error: metaUrlError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message.image_url)
        .maybeSingle();

      if (metaUrlError) {
        console.error(`   ❌ 조회 실패: ${metaUrlError.message}\n`);
      } else if (metadataByUrl) {
        console.log(`   ✅ 메타데이터 발견:\n`);
        console.log(`      folder_path: ${metadataByUrl.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(metadataByUrl.tags || [])}`);
        console.log(`      source: ${metadataByUrl.source || '(없음)'}`);
        console.log(`      channel: ${metadataByUrl.channel || '(없음)'}\n`);
      } else {
        console.log(`   ⚠️ 메타데이터 없음\n`);
      }
    }

    // 5. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약:\n');
    console.log(`1. channel_sms.image_url: ${message.image_url || '(없음)'}`);
    if (folderPath) {
      console.log(`2. 추정 폴더 경로: ${folderPath}`);
    }
    console.log(`3. image_metadata (tags: sms-154): ${metadataByTag && metadataByTag.length > 0 ? `${metadataByTag.length}개` : '없음'}\n`);
    
    // 6. 권장 사항
    console.log('💡 권장 사항:\n');
    if (!message.image_url) {
      console.log('   ⚠️ channel_sms.image_url이 없습니다. 이미지를 설정해야 합니다.\n');
    } else if (metadataByTag && metadataByTag.length > 0) {
      const hasMetadata = metadataByTag.some(meta => meta.folder_path && meta.folder_path.includes(`/${messageId}`));
      if (hasMetadata) {
        console.log('   ✅ 메타데이터가 있습니다. "갤러리에서 선택" 시 이미지가 표시되어야 합니다.\n');
      } else {
        console.log('   ⚠️ 메타데이터는 있지만 folder_path가 메시지 ID 폴더와 일치하지 않습니다.');
        console.log('   ⚠️ 상위 폴더로 자동 이동하는 현재 방식이 적절합니다.\n');
      }
    } else {
      console.log('   ⚠️ image_metadata에 메타데이터가 없습니다.');
      console.log('   ⚠️ 메타데이터를 생성하면 "갤러리에서 선택" 시 바로 표시됩니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verify154ImageFinal();

 * 154번 메시지 이미지 최종 확인
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

async function verify154ImageFinal() {
  console.log('🔍 154번 메시지 이미지 최종 확인...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. channel_sms에서 154번 메시지 정보 조회
    console.log('📋 1단계: channel_sms 테이블 조회...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}`);
    console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);

    // 2. image_url에서 날짜 추출
    let dateFolder = null;
    let folderPath = null;
    
    if (message.image_url) {
      // URL에서 날짜와 메시지 ID 추출
      // 예: https://.../originals/mms/2025-12-05/154/mms-154-1764902209781.jpg
      const urlMatch = message.image_url.match(/originals\/mms\/(\d{4}-\d{2}-\d{2})\/(\d+)\//);
      if (urlMatch) {
        dateFolder = urlMatch[1];
        const msgId = urlMatch[2];
        folderPath = `originals/mms/${dateFolder}/${msgId}`;
        console.log(`📅 image_url에서 추출한 정보:`);
        console.log(`   날짜 폴더: ${dateFolder}`);
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   폴더 경로: ${folderPath}\n`);
      } else {
        console.log('⚠️ image_url에서 날짜/메시지 ID를 추출할 수 없습니다.\n');
      }
    }

    // 3. 가능한 모든 날짜 폴더 확인
    const possibleDates = ['2025-12-04', '2025-12-05'];
    
    for (const date of possibleDates) {
      const testFolderPath = `originals/mms/${date}/${messageId}`;
      console.log(`📁 확인 중: ${testFolderPath}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(testFolderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error(`   ❌ 조회 실패: ${listError.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ⚠️ 파일 없음\n`);
        continue;
      }

      // 이미지 파일만 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
      });

      if (imageFiles.length > 0) {
        console.log(`   ✅ ${imageFiles.length}개 이미지 파일 발견:\n`);
        imageFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.name}`);
          console.log(`         크기: ${file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`         생성일: ${file.created_at || '알 수 없음'}`);
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${testFolderPath}/${file.name}`);
          console.log(`         URL: ${urlData?.publicUrl || '생성 실패'}\n`);
        });
      } else {
        console.log(`   ⚠️ 이미지 파일 없음 (${files.length}개 항목 중 이미지 없음)\n`);
      }
    }

    // 4. image_metadata에서 154번 관련 메타데이터 조회
    console.log('📋 4단계: image_metadata 테이블 조회...\n');
    
    // 방법 1: tags로 조회 (sms-154)
    const { data: metadataByTag, error: metaTagError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', ['sms-154']);

    console.log(`   tags에 "sms-154" 포함으로 조회:`);
    if (metaTagError) {
      console.error(`   ❌ 조회 실패: ${metaTagError.message}\n`);
    } else if (metadataByTag && metadataByTag.length > 0) {
      console.log(`   ✅ ${metadataByTag.length}개 메타데이터 발견:\n`);
      metadataByTag.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.image_url}`);
        console.log(`      folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`      source: ${meta.source || '(없음)'}`);
        console.log(`      channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log(`   ⚠️ 메타데이터 없음\n`);
    }

    // 방법 2: image_url로 직접 조회
    if (message.image_url) {
      console.log(`   image_url="${message.image_url}"로 조회:`);
      const { data: metadataByUrl, error: metaUrlError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message.image_url)
        .maybeSingle();

      if (metaUrlError) {
        console.error(`   ❌ 조회 실패: ${metaUrlError.message}\n`);
      } else if (metadataByUrl) {
        console.log(`   ✅ 메타데이터 발견:\n`);
        console.log(`      folder_path: ${metadataByUrl.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(metadataByUrl.tags || [])}`);
        console.log(`      source: ${metadataByUrl.source || '(없음)'}`);
        console.log(`      channel: ${metadataByUrl.channel || '(없음)'}\n`);
      } else {
        console.log(`   ⚠️ 메타데이터 없음\n`);
      }
    }

    // 5. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약:\n');
    console.log(`1. channel_sms.image_url: ${message.image_url || '(없음)'}`);
    if (folderPath) {
      console.log(`2. 추정 폴더 경로: ${folderPath}`);
    }
    console.log(`3. image_metadata (tags: sms-154): ${metadataByTag && metadataByTag.length > 0 ? `${metadataByTag.length}개` : '없음'}\n`);
    
    // 6. 권장 사항
    console.log('💡 권장 사항:\n');
    if (!message.image_url) {
      console.log('   ⚠️ channel_sms.image_url이 없습니다. 이미지를 설정해야 합니다.\n');
    } else if (metadataByTag && metadataByTag.length > 0) {
      const hasMetadata = metadataByTag.some(meta => meta.folder_path && meta.folder_path.includes(`/${messageId}`));
      if (hasMetadata) {
        console.log('   ✅ 메타데이터가 있습니다. "갤러리에서 선택" 시 이미지가 표시되어야 합니다.\n');
      } else {
        console.log('   ⚠️ 메타데이터는 있지만 folder_path가 메시지 ID 폴더와 일치하지 않습니다.');
        console.log('   ⚠️ 상위 폴더로 자동 이동하는 현재 방식이 적절합니다.\n');
      }
    } else {
      console.log('   ⚠️ image_metadata에 메타데이터가 없습니다.');
      console.log('   ⚠️ 메타데이터를 생성하면 "갤러리에서 선택" 시 바로 표시됩니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verify154ImageFinal();

 * 154번 메시지 이미지 최종 확인
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

async function verify154ImageFinal() {
  console.log('🔍 154번 메시지 이미지 최종 확인...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. channel_sms에서 154번 메시지 정보 조회
    console.log('📋 1단계: channel_sms 테이블 조회...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}`);
    console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);

    // 2. image_url에서 날짜 추출
    let dateFolder = null;
    let folderPath = null;
    
    if (message.image_url) {
      // URL에서 날짜와 메시지 ID 추출
      // 예: https://.../originals/mms/2025-12-05/154/mms-154-1764902209781.jpg
      const urlMatch = message.image_url.match(/originals\/mms\/(\d{4}-\d{2}-\d{2})\/(\d+)\//);
      if (urlMatch) {
        dateFolder = urlMatch[1];
        const msgId = urlMatch[2];
        folderPath = `originals/mms/${dateFolder}/${msgId}`;
        console.log(`📅 image_url에서 추출한 정보:`);
        console.log(`   날짜 폴더: ${dateFolder}`);
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   폴더 경로: ${folderPath}\n`);
      } else {
        console.log('⚠️ image_url에서 날짜/메시지 ID를 추출할 수 없습니다.\n');
      }
    }

    // 3. 가능한 모든 날짜 폴더 확인
    const possibleDates = ['2025-12-04', '2025-12-05'];
    
    for (const date of possibleDates) {
      const testFolderPath = `originals/mms/${date}/${messageId}`;
      console.log(`📁 확인 중: ${testFolderPath}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(testFolderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error(`   ❌ 조회 실패: ${listError.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ⚠️ 파일 없음\n`);
        continue;
      }

      // 이미지 파일만 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
      });

      if (imageFiles.length > 0) {
        console.log(`   ✅ ${imageFiles.length}개 이미지 파일 발견:\n`);
        imageFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.name}`);
          console.log(`         크기: ${file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`         생성일: ${file.created_at || '알 수 없음'}`);
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${testFolderPath}/${file.name}`);
          console.log(`         URL: ${urlData?.publicUrl || '생성 실패'}\n`);
        });
      } else {
        console.log(`   ⚠️ 이미지 파일 없음 (${files.length}개 항목 중 이미지 없음)\n`);
      }
    }

    // 4. image_metadata에서 154번 관련 메타데이터 조회
    console.log('📋 4단계: image_metadata 테이블 조회...\n');
    
    // 방법 1: tags로 조회 (sms-154)
    const { data: metadataByTag, error: metaTagError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', ['sms-154']);

    console.log(`   tags에 "sms-154" 포함으로 조회:`);
    if (metaTagError) {
      console.error(`   ❌ 조회 실패: ${metaTagError.message}\n`);
    } else if (metadataByTag && metadataByTag.length > 0) {
      console.log(`   ✅ ${metadataByTag.length}개 메타데이터 발견:\n`);
      metadataByTag.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.image_url}`);
        console.log(`      folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`      source: ${meta.source || '(없음)'}`);
        console.log(`      channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log(`   ⚠️ 메타데이터 없음\n`);
    }

    // 방법 2: image_url로 직접 조회
    if (message.image_url) {
      console.log(`   image_url="${message.image_url}"로 조회:`);
      const { data: metadataByUrl, error: metaUrlError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message.image_url)
        .maybeSingle();

      if (metaUrlError) {
        console.error(`   ❌ 조회 실패: ${metaUrlError.message}\n`);
      } else if (metadataByUrl) {
        console.log(`   ✅ 메타데이터 발견:\n`);
        console.log(`      folder_path: ${metadataByUrl.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(metadataByUrl.tags || [])}`);
        console.log(`      source: ${metadataByUrl.source || '(없음)'}`);
        console.log(`      channel: ${metadataByUrl.channel || '(없음)'}\n`);
      } else {
        console.log(`   ⚠️ 메타데이터 없음\n`);
      }
    }

    // 5. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약:\n');
    console.log(`1. channel_sms.image_url: ${message.image_url || '(없음)'}`);
    if (folderPath) {
      console.log(`2. 추정 폴더 경로: ${folderPath}`);
    }
    console.log(`3. image_metadata (tags: sms-154): ${metadataByTag && metadataByTag.length > 0 ? `${metadataByTag.length}개` : '없음'}\n`);
    
    // 6. 권장 사항
    console.log('💡 권장 사항:\n');
    if (!message.image_url) {
      console.log('   ⚠️ channel_sms.image_url이 없습니다. 이미지를 설정해야 합니다.\n');
    } else if (metadataByTag && metadataByTag.length > 0) {
      const hasMetadata = metadataByTag.some(meta => meta.folder_path && meta.folder_path.includes(`/${messageId}`));
      if (hasMetadata) {
        console.log('   ✅ 메타데이터가 있습니다. "갤러리에서 선택" 시 이미지가 표시되어야 합니다.\n');
      } else {
        console.log('   ⚠️ 메타데이터는 있지만 folder_path가 메시지 ID 폴더와 일치하지 않습니다.');
        console.log('   ⚠️ 상위 폴더로 자동 이동하는 현재 방식이 적절합니다.\n');
      }
    } else {
      console.log('   ⚠️ image_metadata에 메타데이터가 없습니다.');
      console.log('   ⚠️ 메타데이터를 생성하면 "갤러리에서 선택" 시 바로 표시됩니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verify154ImageFinal();

 * 154번 메시지 이미지 최종 확인
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

async function verify154ImageFinal() {
  console.log('🔍 154번 메시지 이미지 최종 확인...\n');
  console.log('='.repeat(60));

  const messageId = 154;

  try {
    // 1. channel_sms에서 154번 메시지 정보 조회
    console.log('📋 1단계: channel_sms 테이블 조회...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   image_url: ${message.image_url || '(없음)'}`);
    console.log(`   created_at: ${message.created_at || '(없음)'}`);
    console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);

    // 2. image_url에서 날짜 추출
    let dateFolder = null;
    let folderPath = null;
    
    if (message.image_url) {
      // URL에서 날짜와 메시지 ID 추출
      // 예: https://.../originals/mms/2025-12-05/154/mms-154-1764902209781.jpg
      const urlMatch = message.image_url.match(/originals\/mms\/(\d{4}-\d{2}-\d{2})\/(\d+)\//);
      if (urlMatch) {
        dateFolder = urlMatch[1];
        const msgId = urlMatch[2];
        folderPath = `originals/mms/${dateFolder}/${msgId}`;
        console.log(`📅 image_url에서 추출한 정보:`);
        console.log(`   날짜 폴더: ${dateFolder}`);
        console.log(`   메시지 ID: ${msgId}`);
        console.log(`   폴더 경로: ${folderPath}\n`);
      } else {
        console.log('⚠️ image_url에서 날짜/메시지 ID를 추출할 수 없습니다.\n');
      }
    }

    // 3. 가능한 모든 날짜 폴더 확인
    const possibleDates = ['2025-12-04', '2025-12-05'];
    
    for (const date of possibleDates) {
      const testFolderPath = `originals/mms/${date}/${messageId}`;
      console.log(`📁 확인 중: ${testFolderPath}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(testFolderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error(`   ❌ 조회 실패: ${listError.message}\n`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ⚠️ 파일 없음\n`);
        continue;
      }

      // 이미지 파일만 필터링
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase();
        return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
      });

      if (imageFiles.length > 0) {
        console.log(`   ✅ ${imageFiles.length}개 이미지 파일 발견:\n`);
        imageFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.name}`);
          console.log(`         크기: ${file.metadata?.size || '알 수 없음'} bytes`);
          console.log(`         생성일: ${file.created_at || '알 수 없음'}`);
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${testFolderPath}/${file.name}`);
          console.log(`         URL: ${urlData?.publicUrl || '생성 실패'}\n`);
        });
      } else {
        console.log(`   ⚠️ 이미지 파일 없음 (${files.length}개 항목 중 이미지 없음)\n`);
      }
    }

    // 4. image_metadata에서 154번 관련 메타데이터 조회
    console.log('📋 4단계: image_metadata 테이블 조회...\n');
    
    // 방법 1: tags로 조회 (sms-154)
    const { data: metadataByTag, error: metaTagError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', ['sms-154']);

    console.log(`   tags에 "sms-154" 포함으로 조회:`);
    if (metaTagError) {
      console.error(`   ❌ 조회 실패: ${metaTagError.message}\n`);
    } else if (metadataByTag && metadataByTag.length > 0) {
      console.log(`   ✅ ${metadataByTag.length}개 메타데이터 발견:\n`);
      metadataByTag.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.image_url}`);
        console.log(`      folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`      source: ${meta.source || '(없음)'}`);
        console.log(`      channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log(`   ⚠️ 메타데이터 없음\n`);
    }

    // 방법 2: image_url로 직접 조회
    if (message.image_url) {
      console.log(`   image_url="${message.image_url}"로 조회:`);
      const { data: metadataByUrl, error: metaUrlError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', message.image_url)
        .maybeSingle();

      if (metaUrlError) {
        console.error(`   ❌ 조회 실패: ${metaUrlError.message}\n`);
      } else if (metadataByUrl) {
        console.log(`   ✅ 메타데이터 발견:\n`);
        console.log(`      folder_path: ${metadataByUrl.folder_path || '(없음)'}`);
        console.log(`      tags: ${JSON.stringify(metadataByUrl.tags || [])}`);
        console.log(`      source: ${metadataByUrl.source || '(없음)'}`);
        console.log(`      channel: ${metadataByUrl.channel || '(없음)'}\n`);
      } else {
        console.log(`   ⚠️ 메타데이터 없음\n`);
      }
    }

    // 5. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약:\n');
    console.log(`1. channel_sms.image_url: ${message.image_url || '(없음)'}`);
    if (folderPath) {
      console.log(`2. 추정 폴더 경로: ${folderPath}`);
    }
    console.log(`3. image_metadata (tags: sms-154): ${metadataByTag && metadataByTag.length > 0 ? `${metadataByTag.length}개` : '없음'}\n`);
    
    // 6. 권장 사항
    console.log('💡 권장 사항:\n');
    if (!message.image_url) {
      console.log('   ⚠️ channel_sms.image_url이 없습니다. 이미지를 설정해야 합니다.\n');
    } else if (metadataByTag && metadataByTag.length > 0) {
      const hasMetadata = metadataByTag.some(meta => meta.folder_path && meta.folder_path.includes(`/${messageId}`));
      if (hasMetadata) {
        console.log('   ✅ 메타데이터가 있습니다. "갤러리에서 선택" 시 이미지가 표시되어야 합니다.\n');
      } else {
        console.log('   ⚠️ 메타데이터는 있지만 folder_path가 메시지 ID 폴더와 일치하지 않습니다.');
        console.log('   ⚠️ 상위 폴더로 자동 이동하는 현재 방식이 적절합니다.\n');
      }
    } else {
      console.log('   ⚠️ image_metadata에 메타데이터가 없습니다.');
      console.log('   ⚠️ 메타데이터를 생성하면 "갤러리에서 선택" 시 바로 표시됩니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verify154ImageFinal();







