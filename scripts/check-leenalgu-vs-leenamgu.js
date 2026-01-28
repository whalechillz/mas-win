/**
 * leenalgu-8768 vs leenamgu-8768 폴더 비교 및 확인
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

async function checkLeenalguVsLeenamgu() {
  console.log('🔍 leenalgu-8768 vs leenamgu-8768 비교 중...\n');

  try {
    // 1. Storage 폴더 확인
    console.log('📦 Storage 폴더 확인:\n');
    
    const { data: leenalguFiles, error: leenalguError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenalgu-8768', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    const { data: leenamguFiles, error: leenamguError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    console.log('📁 leenalgu-8768:');
    if (leenalguError) {
      console.log(`   ❌ 오류: ${leenalguError.message}`);
    } else if (!leenalguFiles || leenalguFiles.length === 0) {
      console.log('   📂 폴더가 비어있거나 존재하지 않음');
    } else {
      console.log(`   📂 ${leenalguFiles.length}개 항목`);
      leenalguFiles.forEach((item, idx) => {
        if (idx < 10) {
          console.log(`      - ${item.name}${item.id ? ` (${item.metadata?.size || 0} bytes)` : ''}`);
        }
      });
      if (leenalguFiles.length > 10) {
        console.log(`      ... 외 ${leenalguFiles.length - 10}개`);
      }
    }

    console.log('\n📁 leenamgu-8768:');
    if (leenamguError) {
      console.log(`   ❌ 오류: ${leenamguError.message}`);
    } else if (!leenamguFiles || leenamguFiles.length === 0) {
      console.log('   📂 폴더가 비어있거나 존재하지 않음');
    } else {
      console.log(`   📂 ${leenamguFiles.length}개 항목`);
      leenamguFiles.forEach((item, idx) => {
        if (idx < 10) {
          console.log(`      - ${item.name}${item.id ? ` (${item.metadata?.size || 0} bytes)` : ''}`);
        }
      });
      if (leenamguFiles.length > 10) {
        console.log(`      ... 외 ${leenamguFiles.length - 10}개`);
      }
    }

    // 2. 데이터베이스에서 이미지 확인
    console.log('\n📊 데이터베이스 이미지 확인:\n');

    const { data: leenalguImages, error: leenalguImagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', 'originals/customers/leenalgu-8768/%')
      .limit(100);

    const { data: leenamguImages, error: leenamguImagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', 'originals/customers/leenamgu-8768/%')
      .limit(100);

    console.log('📸 leenalgu-8768 이미지 (DB):');
    if (leenalguImagesError) {
      console.log(`   ❌ 오류: ${leenalguImagesError.message}`);
    } else if (!leenalguImages || leenalguImages.length === 0) {
      console.log('   📂 DB에 이미지 없음');
    } else {
      console.log(`   📸 ${leenalguImages.length}개 이미지`);
      leenalguImages.slice(0, 5).forEach((img) => {
        console.log(`      - ${img.filename || img.id}`);
        console.log(`        file_path: ${img.file_path?.substring(0, 80)}...`);
      });
      if (leenalguImages.length > 5) {
        console.log(`      ... 외 ${leenalguImages.length - 5}개`);
      }
    }

    console.log('\n📸 leenamgu-8768 이미지 (DB):');
    if (leenamguImagesError) {
      console.log(`   ❌ 오류: ${leenamguImagesError.message}`);
    } else if (!leenamguImages || leenamguImages.length === 0) {
      console.log('   📂 DB에 이미지 없음');
    } else {
      console.log(`   📸 ${leenamguImages.length}개 이미지`);
      leenamguImages.slice(0, 5).forEach((img) => {
        console.log(`      - ${img.filename || img.id}`);
        console.log(`        file_path: ${img.file_path?.substring(0, 80)}...`);
      });
      if (leenamguImages.length > 5) {
        console.log(`      ... 외 ${leenamguImages.length - 5}개`);
      }
    }

    // 3. 고객 정보 확인
    console.log('\n👤 고객 정보 확인:\n');

    const { data: leenalguCustomer } = await supabase
      .from('customers')
      .select('id, name, folder_name, phone')
      .eq('folder_name', 'leenalgu-8768')
      .limit(1);

    const { data: leenamguCustomer } = await supabase
      .from('customers')
      .select('id, name, folder_name, phone')
      .eq('folder_name', 'leenamgu-8768')
      .limit(1);

    console.log('👤 leenalgu-8768 고객:');
    if (leenalguCustomer && leenalguCustomer.length > 0) {
      const c = leenalguCustomer[0];
      console.log(`   ✅ 존재: ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'})`);
    } else {
      console.log('   ❌ 고객 정보 없음');
    }

    console.log('\n👤 leenamgu-8768 고객:');
    if (leenamguCustomer && leenamguCustomer.length > 0) {
      const c = leenamguCustomer[0];
      console.log(`   ✅ 존재: ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'})`);
    } else {
      console.log('   ❌ 고객 정보 없음');
    }

    // 4. 삭제 권장 여부 판단
    console.log('\n💡 삭제 권장 여부:\n');

    const leenalguHasFiles = leenalguFiles && leenalguFiles.length > 0;
    const leenamguHasFiles = leenamguFiles && leenamguFiles.length > 0;
    const leenalguHasImages = leenalguImages && leenalguImages.length > 0;
    const leenamguHasImages = leenamguImages && leenamguImages.length > 0;
    const leenalguHasCustomer = leenalguCustomer && leenalguCustomer.length > 0;
    const leenamguHasCustomer = leenamguCustomer && leenamguCustomer.length > 0;

    if (!leenalguHasFiles && !leenalguHasImages && !leenalguHasCustomer) {
      console.log('   ✅ leenalgu-8768 삭제 가능:');
      console.log('      - Storage 폴더 없음 또는 비어있음');
      console.log('      - DB 이미지 없음');
      console.log('      - 고객 정보 없음');
    } else if (leenalguHasFiles || leenalguHasImages) {
      console.log('   ⚠️  leenalgu-8768 삭제 전 확인 필요:');
      if (leenalguHasFiles) {
        console.log(`      - Storage에 ${leenalguFiles.length}개 항목 존재`);
      }
      if (leenalguHasImages) {
        console.log(`      - DB에 ${leenalguImages.length}개 이미지 존재`);
        console.log('      - 먼저 leenamgu-8768로 이동 후 삭제 권장');
      }
    }

    if (leenamguHasCustomer) {
      console.log(`\n   ✅ leenamgu-8768이 정식 고객 폴더입니다.`);
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkLeenalguVsLeenamgu().catch(console.error);
