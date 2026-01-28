/**
 * OCR 관련 컬럼 존재 여부 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('🔍 OCR 관련 컬럼 확인 중...\n');

  const requiredColumns = [
    'ocr_extracted',
    'ocr_text',
    'ocr_confidence',
    'ocr_processed_at'
  ];

  const results = {
    exists: [],
    missing: []
  };

  // 각 컬럼이 존재하는지 확인 (샘플 데이터로 INSERT 시도하여 확인)
  for (const column of requiredColumns) {
    try {
      // 임시 UUID 생성
      const testId = '00000000-0000-0000-0000-000000000000';
      
      // 컬럼 존재 여부를 확인하기 위해 SELECT 쿼리 실행
      // 실제로는 컬럼이 없으면 에러가 발생함
      const { error } = await supabase
        .from('image_assets')
        .select(column)
        .limit(0);
      
      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          results.missing.push(column);
          console.log(`❌ ${column}: 없음`);
        } else {
          // 다른 오류 (테이블이 없거나 권한 문제 등)
          console.log(`⚠️  ${column}: 확인 불가 (${error.message})`);
        }
      } else {
        results.exists.push(column);
        console.log(`✅ ${column}: 존재함`);
      }
    } catch (err) {
      // 컬럼이 없으면 에러 발생
      if (err.message.includes('column') || err.message.includes('does not exist')) {
        results.missing.push(column);
        console.log(`❌ ${column}: 없음`);
      } else {
        console.log(`⚠️  ${column}: 확인 중 오류 (${err.message})`);
      }
    }
  }

  console.log('\n📊 확인 결과:');
  console.log(`  ✅ 존재하는 컬럼: ${results.exists.length}개`);
  console.log(`  ❌ 없는 컬럼: ${results.missing.length}개`);

  if (results.missing.length > 0) {
    console.log('\n⚠️  다음 컬럼이 없습니다:');
    results.missing.forEach(col => console.log(`   - ${col}`));
    console.log('\n💡 다음 명령으로 마이그레이션을 실행하세요:');
    console.log('   node scripts/execute-ocr-schema-migration.js');
    console.log('   (또는 Supabase 대시보드에서 직접 실행)');
  } else {
    console.log('\n✅ 모든 OCR 관련 컬럼이 존재합니다!');
  }
}

checkColumns().catch(console.error);
