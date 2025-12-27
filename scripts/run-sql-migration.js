/**
 * SQL 마이그레이션 파일을 Supabase에 실행하는 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLMigration(sqlFilePath) {
  console.log(`🔄 SQL 마이그레이션 실행: ${sqlFilePath}\n`);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL 파일을 찾을 수 없습니다: ${sqlFilePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // SQL을 세미콜론으로 분리하여 각 문장 실행
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`📝 실행할 SQL 문장 수: ${statements.length}개\n`);

  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // COMMENT 문은 건너뛰기 (Supabase에서 지원하지 않을 수 있음)
    if (statement.toUpperCase().includes('COMMENT ON')) {
      console.log(`⏭️  건너뜀 (COMMENT 문): ${statement.substring(0, 50)}...`);
      continue;
    }

    try {
      console.log(`[${i + 1}/${statements.length}] 실행 중...`);
      console.log(`  ${statement.substring(0, 100)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // exec_sql 함수가 없을 수 있으므로 직접 쿼리 실행 시도
        // Supabase는 직접 SQL 실행을 지원하지 않으므로, 각 ALTER TABLE 문을 개별적으로 처리
        console.log(`  ⚠️  RPC 함수 없음, 직접 실행 시도...`);
        
        // ALTER TABLE 문인 경우 직접 처리 불가능
        // Supabase 대시보드에서 수동 실행 필요
        console.log(`  ⚠️  이 SQL은 Supabase 대시보드에서 수동 실행이 필요합니다.`);
        results.failed.push({
          statement: statement.substring(0, 100),
          error: 'Supabase는 직접 SQL 실행을 지원하지 않습니다. 대시보드에서 실행하세요.'
        });
      } else {
        console.log(`  ✅ 성공`);
        results.success.push(statement.substring(0, 100));
      }
    } catch (error) {
      console.error(`  ❌ 실패: ${error.message}`);
      results.failed.push({
        statement: statement.substring(0, 100),
        error: error.message
      });
    }
    console.log('');
  }

  console.log('\n📊 실행 요약:');
  console.log(`  ✅ 성공: ${results.success.length}개`);
  console.log(`  ❌ 실패: ${results.failed.length}개`);

  if (results.failed.length > 0) {
    console.log('\n⚠️  일부 SQL 문은 Supabase 대시보드에서 수동 실행이 필요합니다.');
    console.log('   Supabase 대시보드 → SQL Editor에서 다음 파일을 실행하세요:');
    console.log(`   ${sqlFilePath}`);
  }

  return results;
}

// 명령줄 인자로 SQL 파일 경로 받기
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ 사용법: node scripts/run-sql-migration.js <sql-file-path>');
  console.error('예: node scripts/run-sql-migration.js database/extend-products-table-for-drivers.sql');
  process.exit(1);
}

runSQLMigration(sqlFile).catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});

