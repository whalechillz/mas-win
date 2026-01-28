/**
 * OCR 관련 컬럼 추가 마이그레이션 실행 스크립트
 * Supabase 대시보드에서 직접 실행하는 것을 권장합니다.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🔄 OCR 스키마 마이그레이션 실행 중...\n');

  const sqlFilePath = path.join(__dirname, '../database/add-ocr-extracted-to-image-assets.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL 파일을 찾을 수 없습니다: ${sqlFilePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // SQL 문장 분리 (세미콜론 기준)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 실행할 SQL 문장 수: ${statements.length}개\n`);

  // Supabase는 직접 SQL 실행을 지원하지 않으므로
  // 각 ALTER TABLE 문을 Supabase 클라이언트로 실행 시도
  // 하지만 ALTER TABLE은 Supabase JS 클라이언트로 직접 실행할 수 없으므로
  // 사용자에게 Supabase 대시보드에서 실행하도록 안내

  console.log('⚠️  Supabase는 보안상의 이유로 ALTER TABLE 문을 JS 클라이언트로 직접 실행할 수 없습니다.');
  console.log('📋 다음 단계를 따라주세요:\n');
  console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('2. 프로젝트 선택');
  console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
  console.log('4. "New query" 클릭');
  console.log(`5. 다음 파일 내용을 복사하여 붙여넣기: ${sqlFilePath}`);
  console.log('6. "Run" 버튼 클릭 (또는 Cmd/Ctrl + Enter)\n');

  // SQL 내용 출력
  console.log('📄 실행할 SQL 내용:\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n✅ 위 SQL을 Supabase 대시보드에서 실행하세요.\n');

  // 대안: 컬럼 존재 여부 확인
  console.log('🔍 현재 image_assets 테이블 구조 확인 중...\n');
  
  try {
    // 테이블 구조를 직접 확인할 수는 없지만, 
    // ocr_extracted 컬럼이 있는지 확인하기 위해 샘플 쿼리 실행
    const { data, error } = await supabase
      .from('image_assets')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ image_assets 테이블 접근 오류:', error.message);
    } else {
      console.log('✅ image_assets 테이블 접근 가능');
    }
  } catch (err) {
    console.error('❌ 테이블 확인 중 오류:', err.message);
  }

  console.log('\n💡 팁: 마이그레이션 실행 후 다음 명령으로 확인할 수 있습니다:');
  console.log('   node scripts/check-ocr-columns.js\n');
}

executeMigration().catch(console.error);
