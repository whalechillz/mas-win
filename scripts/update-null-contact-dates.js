/**
 * last_contact_date가 NULL인 고객들을 2011-01-01로 업데이트하는 스크립트
 * 
 * 사용법:
 *   node scripts/update-null-contact-dates.js [--dry-run] [--apply]
 * 
 * --dry-run: 실제 업데이트 없이 영향받을 고객 수만 확인
 * --apply: 실제로 업데이트 실행 (기본값은 dry-run)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_DATE = '2011-01-01T00:00:00+09:00'; // 한국 시간 기준

async function updateNullContactDates() {
  const isDryRun = !process.argv.includes('--apply');
  const hasDryRunFlag = process.argv.includes('--dry-run');

  if (isDryRun && !hasDryRunFlag) {
    console.log('⚠️  DRY-RUN 모드입니다. 실제 업데이트를 하려면 --apply 플래그를 추가하세요.\n');
  }

  try {
    console.log('📊 last_contact_date가 NULL인 고객 조회 중...\n');

    // NULL인 고객 조회
    const { data: nullCustomers, error: selectError, count } = await supabase
      .from('customers')
      .select('id, name, phone, last_contact_date', { count: 'exact' })
      .is('last_contact_date', null);

    if (selectError) {
      throw selectError;
    }

    const nullCount = count || 0;

    if (nullCount === 0) {
      console.log('✅ last_contact_date가 NULL인 고객이 없습니다.');
      return;
    }

    console.log(`📋 발견된 NULL 고객 수: ${nullCount}명\n`);

    // 샘플 데이터 표시 (최대 10명)
    if (nullCustomers && nullCustomers.length > 0) {
      console.log('📝 샘플 데이터 (최대 10명):');
      nullCustomers.slice(0, 10).forEach((c, idx) => {
        console.log(`   ${idx + 1}. ID: ${c.id}, 이름: ${c.name || '-'}, 전화: ${c.phone || '-'}`);
      });
      if (nullCustomers.length > 10) {
        console.log(`   ... 외 ${nullCustomers.length - 10}명\n`);
      } else {
        console.log('');
      }
    }

    if (isDryRun) {
      console.log('🔍 DRY-RUN 모드: 실제 업데이트는 수행하지 않습니다.');
      console.log(`   업데이트될 고객 수: ${nullCount}명`);
      console.log(`   설정될 날짜: ${DEFAULT_DATE.split('T')[0]} (2011-01-01)\n`);
      console.log('💡 실제 업데이트를 실행하려면:');
      console.log('   node scripts/update-null-contact-dates.js --apply\n');
      return;
    }

    // 실제 업데이트
    console.log('🔄 업데이트 실행 중...\n');

    const { data: updatedData, error: updateError } = await supabase
      .from('customers')
      .update({ last_contact_date: DEFAULT_DATE })
      .is('last_contact_date', null)
      .select('id, name, phone');

    if (updateError) {
      throw updateError;
    }

    const updatedCount = updatedData?.length || 0;

    console.log(`✅ 업데이트 완료!`);
    console.log(`   업데이트된 고객 수: ${updatedCount}명`);
    console.log(`   설정된 날짜: ${DEFAULT_DATE.split('T')[0]} (2011-01-01)\n`);

    // 업데이트된 고객 샘플 표시
    if (updatedData && updatedData.length > 0) {
      console.log('📝 업데이트된 고객 샘플 (최대 10명):');
      updatedData.slice(0, 10).forEach((c, idx) => {
        console.log(`   ${idx + 1}. ID: ${c.id}, 이름: ${c.name || '-'}, 전화: ${c.phone || '-'}`);
      });
      if (updatedData.length > 10) {
        console.log(`   ... 외 ${updatedData.length - 10}명\n`);
      } else {
        console.log('');
      }
    }

    console.log('✨ 작업이 완료되었습니다!\n');
    console.log('💡 이제 /admin/customers 페이지에서 "최근 연락" 컬럼으로 정렬하면');
    console.log('   2011-01-01로 설정된 고객들이 맨 아래에 표시됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
updateNullContactDates();








