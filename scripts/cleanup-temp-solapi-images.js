/**
 * temp/solapi/ 폴더의 모든 임시 이미지 파일 삭제
 * get-image-preview API가 생성한 임시 파일들을 정리합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTempImages() {
  console.log('='.repeat(100));
  console.log('🗑️ temp/solapi/ 폴더 임시 이미지 정리');
  console.log('='.repeat(100));
  console.log('');

  try {
    // temp/solapi/ 폴더의 모든 파일 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('temp/solapi', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('✅ 삭제할 임시 파일이 없습니다.');
      return;
    }

    console.log(`📋 발견된 임시 파일: ${files.length}개`);
    console.log('');

    // 파일 경로 생성
    const filePaths = files.map(f => `temp/solapi/${f.name}`);
    
    // 파일 삭제
    console.log('🗑️ 파일 삭제 중...');
    const { data: deletedFiles, error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove(filePaths);

    if (deleteError) {
      console.error('❌ 파일 삭제 실패:', deleteError.message);
      return;
    }

    console.log(`✅ ${files.length}개 임시 파일 삭제 완료!`);
    console.log('');

    // 삭제된 파일 목록 출력 (처음 10개만)
    const previewCount = Math.min(10, files.length);
    console.log('삭제된 파일 목록 (처음 10개):');
    files.slice(0, previewCount).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
    });
    if (files.length > previewCount) {
      console.log(`   ... 외 ${files.length - previewCount}개`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

cleanupTempImages();


