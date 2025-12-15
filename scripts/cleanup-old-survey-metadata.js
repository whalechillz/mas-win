// 230~238, 259, 263 설문용 메시지에서 예전 survey 경로 메타데이터 제거
// - folder_path LIKE 'originals/mms/2025-12-15/survey%'
// - solapi-* 태그는 유지 (이미 별도 스크립트에서 생성됨)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_SMS_IDS = [230,231,232,233,234,235,236,237,238,259,263];

async function main() {
  console.log('='.repeat(80));
  console.log('🧹 설문용 survey 경로 메타데이터 정리');
  console.log('='.repeat(80));

  // 1. 대상 메시지들의 태그 패턴 생성
  const smsTags = TARGET_SMS_IDS.map(id => `sms-${id}`);

  // 2. 해당 sms 태그를 포함하고, survey 폴더를 가리키는 메타데이터 조회
  const { data, error } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags')
    .like('folder_path', 'originals/mms/2025-12-15/survey%');

  if (error) {
    console.error('❌ image_metadata 조회 실패:', error.message);
    process.exit(1);
  }

  const targets = (data || []).filter(row => {
    const tags = Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []);
    return tags.some(t => smsTags.includes(t));
  });

  console.log('📊 삭제 대상 메타데이터 개수:', targets.length);

  if (targets.length === 0) {
    console.log('ℹ️ 삭제할 survey 메타데이터가 없습니다.');
    process.exit(0);
  }

  for (const row of targets) {
    console.log(`🗑️ 메타데이터 삭제 id=${row.id}, folder_path=${row.folder_path}`);
    const { error: delErr } = await supabase
      .from('image_metadata')
      .delete()
      .eq('id', row.id);
    if (delErr) {
      console.error('  ❌ 삭제 실패:', delErr.message);
    }
  }

  console.log('\n✅ survey 경로 메타데이터 정리 완료');
}

main().then(()=>process.exit(0)).catch(err=>{console.error(err);process.exit(1);});
