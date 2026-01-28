/**
 * 스캔 서류 분류 시스템 데이터베이스 스키마 생성
 * 
 * Supabase는 직접 SQL 실행을 지원하지 않으므로,
 * 이 스크립트는 SQL을 출력하고 Supabase 대시보드에서 실행하도록 안내합니다.
 */

const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '../database/create-scanned-documents-schema.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL 파일을 찾을 수 없습니다:', sqlFilePath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFilePath, 'utf8');

console.log('='.repeat(80));
console.log('📋 Supabase 대시보드에서 실행할 SQL');
console.log('='.repeat(80));
console.log('');
console.log(sql);
console.log('');
console.log('='.repeat(80));
console.log('');
console.log('📝 실행 방법:');
console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
console.log('2. 프로젝트 선택');
console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('4. "New query" 클릭');
console.log('5. 위의 SQL을 복사하여 붙여넣기');
console.log('6. "Run" 버튼 클릭 (또는 Cmd/Ctrl + Enter)');
console.log('7. "Success" 메시지 확인');
console.log('');
console.log('✅ SQL 실행 후 다음 명령으로 기존 데이터 분류를 진행하세요:');
console.log('   node scripts/classify-existing-scanned-documents.js');
console.log('');
