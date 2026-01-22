/**
 * 기존 메시지 1 초안 삭제 스크립트
 * ID 448, 449, 450 삭제
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

async function deleteOldDrafts() {
  console.log('='.repeat(80));
  console.log('🗑️  기존 메시지 1 초안 삭제');
  console.log('='.repeat(80));
  console.log('');

  const idsToDelete = [448, 449, 450];

  try {
    for (const id of idsToDelete) {
      console.log(`🗑️  ID ${id} 삭제 중...`);
      
      const { data, error } = await supabase
        .from('channel_sms')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error(`   ❌ 삭제 실패:`, error);
      } else {
        if (data && data.length > 0) {
          console.log(`   ✅ 삭제 완료: ID ${id}`);
        } else {
          console.log(`   ⚠️  ID ${id}를 찾을 수 없습니다.`);
        }
      }
    }

    console.log('');
    console.log('✅ 삭제 작업 완료!');
    console.log('');
    console.log('📌 남은 초안:');
    console.log('   - ID 452: 청크 1/3 (200명)');
    console.log('   - ID 453: 청크 2/3 (200명)');
    console.log('   - ID 454: 청크 3/3 (76명)');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  deleteOldDrafts()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { deleteOldDrafts };
