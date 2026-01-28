/**
 * 이남구 고객 이미지 최종 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyLeenamguImages() {
  console.log('🔍 이남구 고객 이미지 최종 확인...\n');

  try {
    // DB 이미지 조회 (여러 패턴 시도)
    const { data: dbImages1, error: dbError1 } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, created_at')
      .ilike('file_path', 'originals/customers/leenamgu-8768/%');

    const { data: dbImages2, error: dbError2 } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, created_at')
      .ilike('file_path', '%leenamgu-8768%');

    console.log(`📊 DB 이미지 (패턴 1): ${dbImages1?.length || 0}개`);
    if (dbError1) {
      console.log(`   오류: ${dbError1.message}`);
    }

    console.log(`📊 DB 이미지 (패턴 2): ${dbImages2?.length || 0}개`);
    if (dbError2) {
      console.log(`   오류: ${dbError2.message}`);
    }

    const dbImages = dbImages1 || dbImages2 || [];

    if (dbImages.length > 0) {
      console.log('\n📋 DB 이미지 목록:\n');
      dbImages.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ${img.filename || '파일명 없음'}`);
        console.log(`      file_path: ${img.file_path}`);
        console.log(`      ID: ${img.id}\n`);
      });
    }

    // Storage 파일 확인
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768/2024-10-29', {
        limit: 1000
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
    } else {
      const files = (storageFiles || []).filter(f => f.id);
      console.log(`\n📦 Storage 실제 파일: ${files.length}개\n`);
      files.forEach((file, idx) => {
        console.log(`   ${idx + 1}. ${file.name}`);
      });
    }

    console.log('\n📊 최종 결과:\n');
    console.log(`   Storage 실제 파일: ${(storageFiles || []).filter(f => f.id).length}개`);
    console.log(`   DB 메타데이터: ${dbImages.length}개`);
    console.log(`   동기화 상태: ${dbImages.length === (storageFiles || []).filter(f => f.id).length ? '✅ 일치' : '❌ 불일치'}`);

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

verifyLeenamguImages().catch(console.error);
