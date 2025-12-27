/**
 * Supabase 대시보드에서 실행할 SQL 출력
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '../database/extend-products-table-for-drivers.sql');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ SQL 파일을 찾을 수 없습니다: ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('═'.repeat(80));
console.log('📋 Supabase 대시보드에서 실행할 SQL');
console.log('═'.repeat(80));
console.log('');
console.log(sql);
console.log('');
console.log('═'.repeat(80));
console.log('📋 실행 방법:');
console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
console.log('2. 프로젝트 선택');
console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('4. 위의 SQL을 복사하여 붙여넣기');
console.log('5. "Run" 버튼 클릭');
console.log('═'.repeat(80));

