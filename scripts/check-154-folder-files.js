/**
 * 154번 폴더의 모든 파일 확인
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

async function check154FolderFiles() {
  console.log('🔍 154번 폴더의 모든 파일 확인...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-04/154';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      console.error('상세 오류:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('⚠️ 폴더가 비어있습니다. 파일이 없습니다.\n');
      
      // 상위 폴더 확인
      console.log('📁 상위 폴더 확인 중...\n');
      const parentPath = 'originals/mms/2025-12-04';
      const { data: parentFiles, error: parentError } = await supabase.storage
        .from('blog-images')
        .list(parentPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (parentError) {
        console.error('❌ 상위 폴더 조회 실패:', parentError.message);
      } else if (parentFiles && parentFiles.length > 0) {
        console.log(`✅ 상위 폴더 (${parentPath})에 ${parentFiles.length}개 항목 발견:\n`);
        parentFiles.forEach((file, index) => {
          const isFolder = !file.id;
          const type = isFolder ? '📁 폴더' : '📄 파일';
          console.log(`  ${index + 1}. ${type}: ${file.name}`);
          if (file.id) {
            console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
            console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
          }
        });
      } else {
        console.log(`⚠️ 상위 폴더 (${parentPath})도 비어있습니다.\n`);
      }
      
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    const otherFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return !imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 이미지 파일: ${imageFiles.length}개`);
    console.log(`📄 기타 파일: ${otherFiles.length}개\n`);

    // 각 파일 상세 정보 출력
    if (imageFiles.length > 0) {
      console.log('📸 이미지 파일 목록:\n');
      imageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
        console.log(`     수정일: ${file.updated_at || '알 수 없음'}`);
        
        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${file.name}`);
        console.log(`     URL: ${urlData?.publicUrl || '생성 실패'}\n`);
      });
    }

    if (otherFiles.length > 0) {
      console.log('📄 기타 파일 목록:\n');
      otherFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}\n`);
      });
    }

    // 2. channel_sms 테이블에서 154번 메시지 정보 확인
    console.log('\n📋 channel_sms 테이블에서 154번 메시지 정보 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', 154)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
    } else if (message) {
      console.log('✅ 메시지 정보:');
      console.log(`   ID: ${message.id}`);
      console.log(`   image_url: ${message.image_url || '(없음)'}`);
      console.log(`   created_at: ${message.created_at || '(없음)'}`);
      console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);
      
      if (message.image_url) {
        // image_url이 현재 폴더의 파일과 일치하는지 확인
        const urlFileName = message.image_url.split('/').pop();
        const matchingFile = imageFiles.find(f => f.name === urlFileName);
        if (matchingFile) {
          console.log(`✅ image_url의 파일이 폴더에 존재합니다: ${urlFileName}\n`);
        } else {
          console.log(`⚠️ image_url의 파일이 폴더에 없습니다: ${urlFileName}\n`);
        }
      }
    } else {
      console.log('⚠️ 154번 메시지를 찾을 수 없습니다.\n');
    }

    // 3. image_metadata 테이블에서 154번 관련 메타데이터 확인
    console.log('📋 image_metadata 테이블에서 154번 관련 메타데이터 확인...\n');
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .or(`folder_path.eq.${folderPath},tags.cs.{sms-154}`);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else if (metadata && metadata.length > 0) {
      console.log(`✅ 메타데이터 ${metadata.length}개 발견:\n`);
      metadata.forEach((meta, index) => {
        console.log(`  ${index + 1}. ${meta.image_url}`);
        console.log(`     folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`     tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`     source: ${meta.source || '(없음)'}`);
        console.log(`     channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log('⚠️ 관련 메타데이터가 없습니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check154FolderFiles();

 * 154번 폴더의 모든 파일 확인
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

async function check154FolderFiles() {
  console.log('🔍 154번 폴더의 모든 파일 확인...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-04/154';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      console.error('상세 오류:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('⚠️ 폴더가 비어있습니다. 파일이 없습니다.\n');
      
      // 상위 폴더 확인
      console.log('📁 상위 폴더 확인 중...\n');
      const parentPath = 'originals/mms/2025-12-04';
      const { data: parentFiles, error: parentError } = await supabase.storage
        .from('blog-images')
        .list(parentPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (parentError) {
        console.error('❌ 상위 폴더 조회 실패:', parentError.message);
      } else if (parentFiles && parentFiles.length > 0) {
        console.log(`✅ 상위 폴더 (${parentPath})에 ${parentFiles.length}개 항목 발견:\n`);
        parentFiles.forEach((file, index) => {
          const isFolder = !file.id;
          const type = isFolder ? '📁 폴더' : '📄 파일';
          console.log(`  ${index + 1}. ${type}: ${file.name}`);
          if (file.id) {
            console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
            console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
          }
        });
      } else {
        console.log(`⚠️ 상위 폴더 (${parentPath})도 비어있습니다.\n`);
      }
      
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    const otherFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return !imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 이미지 파일: ${imageFiles.length}개`);
    console.log(`📄 기타 파일: ${otherFiles.length}개\n`);

    // 각 파일 상세 정보 출력
    if (imageFiles.length > 0) {
      console.log('📸 이미지 파일 목록:\n');
      imageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
        console.log(`     수정일: ${file.updated_at || '알 수 없음'}`);
        
        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${file.name}`);
        console.log(`     URL: ${urlData?.publicUrl || '생성 실패'}\n`);
      });
    }

    if (otherFiles.length > 0) {
      console.log('📄 기타 파일 목록:\n');
      otherFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}\n`);
      });
    }

    // 2. channel_sms 테이블에서 154번 메시지 정보 확인
    console.log('\n📋 channel_sms 테이블에서 154번 메시지 정보 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', 154)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
    } else if (message) {
      console.log('✅ 메시지 정보:');
      console.log(`   ID: ${message.id}`);
      console.log(`   image_url: ${message.image_url || '(없음)'}`);
      console.log(`   created_at: ${message.created_at || '(없음)'}`);
      console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);
      
      if (message.image_url) {
        // image_url이 현재 폴더의 파일과 일치하는지 확인
        const urlFileName = message.image_url.split('/').pop();
        const matchingFile = imageFiles.find(f => f.name === urlFileName);
        if (matchingFile) {
          console.log(`✅ image_url의 파일이 폴더에 존재합니다: ${urlFileName}\n`);
        } else {
          console.log(`⚠️ image_url의 파일이 폴더에 없습니다: ${urlFileName}\n`);
        }
      }
    } else {
      console.log('⚠️ 154번 메시지를 찾을 수 없습니다.\n');
    }

    // 3. image_metadata 테이블에서 154번 관련 메타데이터 확인
    console.log('📋 image_metadata 테이블에서 154번 관련 메타데이터 확인...\n');
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .or(`folder_path.eq.${folderPath},tags.cs.{sms-154}`);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else if (metadata && metadata.length > 0) {
      console.log(`✅ 메타데이터 ${metadata.length}개 발견:\n`);
      metadata.forEach((meta, index) => {
        console.log(`  ${index + 1}. ${meta.image_url}`);
        console.log(`     folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`     tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`     source: ${meta.source || '(없음)'}`);
        console.log(`     channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log('⚠️ 관련 메타데이터가 없습니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check154FolderFiles();

 * 154번 폴더의 모든 파일 확인
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

async function check154FolderFiles() {
  console.log('🔍 154번 폴더의 모든 파일 확인...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-04/154';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      console.error('상세 오류:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('⚠️ 폴더가 비어있습니다. 파일이 없습니다.\n');
      
      // 상위 폴더 확인
      console.log('📁 상위 폴더 확인 중...\n');
      const parentPath = 'originals/mms/2025-12-04';
      const { data: parentFiles, error: parentError } = await supabase.storage
        .from('blog-images')
        .list(parentPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (parentError) {
        console.error('❌ 상위 폴더 조회 실패:', parentError.message);
      } else if (parentFiles && parentFiles.length > 0) {
        console.log(`✅ 상위 폴더 (${parentPath})에 ${parentFiles.length}개 항목 발견:\n`);
        parentFiles.forEach((file, index) => {
          const isFolder = !file.id;
          const type = isFolder ? '📁 폴더' : '📄 파일';
          console.log(`  ${index + 1}. ${type}: ${file.name}`);
          if (file.id) {
            console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
            console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
          }
        });
      } else {
        console.log(`⚠️ 상위 폴더 (${parentPath})도 비어있습니다.\n`);
      }
      
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    const otherFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return !imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 이미지 파일: ${imageFiles.length}개`);
    console.log(`📄 기타 파일: ${otherFiles.length}개\n`);

    // 각 파일 상세 정보 출력
    if (imageFiles.length > 0) {
      console.log('📸 이미지 파일 목록:\n');
      imageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
        console.log(`     수정일: ${file.updated_at || '알 수 없음'}`);
        
        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${file.name}`);
        console.log(`     URL: ${urlData?.publicUrl || '생성 실패'}\n`);
      });
    }

    if (otherFiles.length > 0) {
      console.log('📄 기타 파일 목록:\n');
      otherFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}\n`);
      });
    }

    // 2. channel_sms 테이블에서 154번 메시지 정보 확인
    console.log('\n📋 channel_sms 테이블에서 154번 메시지 정보 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', 154)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
    } else if (message) {
      console.log('✅ 메시지 정보:');
      console.log(`   ID: ${message.id}`);
      console.log(`   image_url: ${message.image_url || '(없음)'}`);
      console.log(`   created_at: ${message.created_at || '(없음)'}`);
      console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);
      
      if (message.image_url) {
        // image_url이 현재 폴더의 파일과 일치하는지 확인
        const urlFileName = message.image_url.split('/').pop();
        const matchingFile = imageFiles.find(f => f.name === urlFileName);
        if (matchingFile) {
          console.log(`✅ image_url의 파일이 폴더에 존재합니다: ${urlFileName}\n`);
        } else {
          console.log(`⚠️ image_url의 파일이 폴더에 없습니다: ${urlFileName}\n`);
        }
      }
    } else {
      console.log('⚠️ 154번 메시지를 찾을 수 없습니다.\n');
    }

    // 3. image_metadata 테이블에서 154번 관련 메타데이터 확인
    console.log('📋 image_metadata 테이블에서 154번 관련 메타데이터 확인...\n');
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .or(`folder_path.eq.${folderPath},tags.cs.{sms-154}`);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else if (metadata && metadata.length > 0) {
      console.log(`✅ 메타데이터 ${metadata.length}개 발견:\n`);
      metadata.forEach((meta, index) => {
        console.log(`  ${index + 1}. ${meta.image_url}`);
        console.log(`     folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`     tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`     source: ${meta.source || '(없음)'}`);
        console.log(`     channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log('⚠️ 관련 메타데이터가 없습니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check154FolderFiles();

 * 154번 폴더의 모든 파일 확인
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

async function check154FolderFiles() {
  console.log('🔍 154번 폴더의 모든 파일 확인...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-04/154';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      console.error('상세 오류:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('⚠️ 폴더가 비어있습니다. 파일이 없습니다.\n');
      
      // 상위 폴더 확인
      console.log('📁 상위 폴더 확인 중...\n');
      const parentPath = 'originals/mms/2025-12-04';
      const { data: parentFiles, error: parentError } = await supabase.storage
        .from('blog-images')
        .list(parentPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (parentError) {
        console.error('❌ 상위 폴더 조회 실패:', parentError.message);
      } else if (parentFiles && parentFiles.length > 0) {
        console.log(`✅ 상위 폴더 (${parentPath})에 ${parentFiles.length}개 항목 발견:\n`);
        parentFiles.forEach((file, index) => {
          const isFolder = !file.id;
          const type = isFolder ? '📁 폴더' : '📄 파일';
          console.log(`  ${index + 1}. ${type}: ${file.name}`);
          if (file.id) {
            console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
            console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
          }
        });
      } else {
        console.log(`⚠️ 상위 폴더 (${parentPath})도 비어있습니다.\n`);
      }
      
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    const otherFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return !imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 이미지 파일: ${imageFiles.length}개`);
    console.log(`📄 기타 파일: ${otherFiles.length}개\n`);

    // 각 파일 상세 정보 출력
    if (imageFiles.length > 0) {
      console.log('📸 이미지 파일 목록:\n');
      imageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
        console.log(`     수정일: ${file.updated_at || '알 수 없음'}`);
        
        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${file.name}`);
        console.log(`     URL: ${urlData?.publicUrl || '생성 실패'}\n`);
      });
    }

    if (otherFiles.length > 0) {
      console.log('📄 기타 파일 목록:\n');
      otherFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}\n`);
      });
    }

    // 2. channel_sms 테이블에서 154번 메시지 정보 확인
    console.log('\n📋 channel_sms 테이블에서 154번 메시지 정보 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', 154)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
    } else if (message) {
      console.log('✅ 메시지 정보:');
      console.log(`   ID: ${message.id}`);
      console.log(`   image_url: ${message.image_url || '(없음)'}`);
      console.log(`   created_at: ${message.created_at || '(없음)'}`);
      console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);
      
      if (message.image_url) {
        // image_url이 현재 폴더의 파일과 일치하는지 확인
        const urlFileName = message.image_url.split('/').pop();
        const matchingFile = imageFiles.find(f => f.name === urlFileName);
        if (matchingFile) {
          console.log(`✅ image_url의 파일이 폴더에 존재합니다: ${urlFileName}\n`);
        } else {
          console.log(`⚠️ image_url의 파일이 폴더에 없습니다: ${urlFileName}\n`);
        }
      }
    } else {
      console.log('⚠️ 154번 메시지를 찾을 수 없습니다.\n');
    }

    // 3. image_metadata 테이블에서 154번 관련 메타데이터 확인
    console.log('📋 image_metadata 테이블에서 154번 관련 메타데이터 확인...\n');
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .or(`folder_path.eq.${folderPath},tags.cs.{sms-154}`);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else if (metadata && metadata.length > 0) {
      console.log(`✅ 메타데이터 ${metadata.length}개 발견:\n`);
      metadata.forEach((meta, index) => {
        console.log(`  ${index + 1}. ${meta.image_url}`);
        console.log(`     folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`     tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`     source: ${meta.source || '(없음)'}`);
        console.log(`     channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log('⚠️ 관련 메타데이터가 없습니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check154FolderFiles();

 * 154번 폴더의 모든 파일 확인
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

async function check154FolderFiles() {
  console.log('🔍 154번 폴더의 모든 파일 확인...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-04/154';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      console.error('상세 오류:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('⚠️ 폴더가 비어있습니다. 파일이 없습니다.\n');
      
      // 상위 폴더 확인
      console.log('📁 상위 폴더 확인 중...\n');
      const parentPath = 'originals/mms/2025-12-04';
      const { data: parentFiles, error: parentError } = await supabase.storage
        .from('blog-images')
        .list(parentPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (parentError) {
        console.error('❌ 상위 폴더 조회 실패:', parentError.message);
      } else if (parentFiles && parentFiles.length > 0) {
        console.log(`✅ 상위 폴더 (${parentPath})에 ${parentFiles.length}개 항목 발견:\n`);
        parentFiles.forEach((file, index) => {
          const isFolder = !file.id;
          const type = isFolder ? '📁 폴더' : '📄 파일';
          console.log(`  ${index + 1}. ${type}: ${file.name}`);
          if (file.id) {
            console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
            console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
          }
        });
      } else {
        console.log(`⚠️ 상위 폴더 (${parentPath})도 비어있습니다.\n`);
      }
      
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    const otherFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return !imageExtensions.some(extName => ext.endsWith(extName)) && file.name !== '.keep.png';
    });

    console.log(`📸 이미지 파일: ${imageFiles.length}개`);
    console.log(`📄 기타 파일: ${otherFiles.length}개\n`);

    // 각 파일 상세 정보 출력
    if (imageFiles.length > 0) {
      console.log('📸 이미지 파일 목록:\n');
      imageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}`);
        console.log(`     수정일: ${file.updated_at || '알 수 없음'}`);
        
        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${file.name}`);
        console.log(`     URL: ${urlData?.publicUrl || '생성 실패'}\n`);
      });
    }

    if (otherFiles.length > 0) {
      console.log('📄 기타 파일 목록:\n');
      otherFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     크기: ${file.metadata?.size || '알 수 없음'} bytes`);
        console.log(`     생성일: ${file.created_at || '알 수 없음'}\n`);
      });
    }

    // 2. channel_sms 테이블에서 154번 메시지 정보 확인
    console.log('\n📋 channel_sms 테이블에서 154번 메시지 정보 확인...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, image_url, created_at, sent_at')
      .eq('id', 154)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 실패:', messageError.message);
    } else if (message) {
      console.log('✅ 메시지 정보:');
      console.log(`   ID: ${message.id}`);
      console.log(`   image_url: ${message.image_url || '(없음)'}`);
      console.log(`   created_at: ${message.created_at || '(없음)'}`);
      console.log(`   sent_at: ${message.sent_at || '(없음)'}\n`);
      
      if (message.image_url) {
        // image_url이 현재 폴더의 파일과 일치하는지 확인
        const urlFileName = message.image_url.split('/').pop();
        const matchingFile = imageFiles.find(f => f.name === urlFileName);
        if (matchingFile) {
          console.log(`✅ image_url의 파일이 폴더에 존재합니다: ${urlFileName}\n`);
        } else {
          console.log(`⚠️ image_url의 파일이 폴더에 없습니다: ${urlFileName}\n`);
        }
      }
    } else {
      console.log('⚠️ 154번 메시지를 찾을 수 없습니다.\n');
    }

    // 3. image_metadata 테이블에서 154번 관련 메타데이터 확인
    console.log('📋 image_metadata 테이블에서 154번 관련 메타데이터 확인...\n');
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .or(`folder_path.eq.${folderPath},tags.cs.{sms-154}`);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else if (metadata && metadata.length > 0) {
      console.log(`✅ 메타데이터 ${metadata.length}개 발견:\n`);
      metadata.forEach((meta, index) => {
        console.log(`  ${index + 1}. ${meta.image_url}`);
        console.log(`     folder_path: ${meta.folder_path || '(없음)'}`);
        console.log(`     tags: ${JSON.stringify(meta.tags || [])}`);
        console.log(`     source: ${meta.source || '(없음)'}`);
        console.log(`     channel: ${meta.channel || '(없음)'}\n`);
      });
    } else {
      console.log('⚠️ 관련 메타데이터가 없습니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

check154FolderFiles();

































