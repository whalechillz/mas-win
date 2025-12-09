/**
 * 특정 예약의 전화번호를 수동으로 교정/삭제하는 스크립트
 *
 * - 심재홍: 0415626761 → 01021073388
 * - David Tian: 80188474 → 예약 삭제
 * - 이관욱: 0312150013 → 01037701435
 * - 김동광: 010,5275,2924 → 01052752924
 *
 * 사용법:
 *   node scripts/fix-specific-invalid-phones.js --dry-run
 *   node scripts/fix-specific-invalid-phones.js --apply
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSpecificInvalidPhones() {
  const apply = process.argv.includes('--apply');

  console.log('🔧 특정 잘못된 전화번호 교정/삭제 스크립트 실행...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 내용만 출력합니다.\n');

  // 1. 심재홍: 0415626761 → 01021073388
  const targets = [
    {
      label: '심재홍',
      oldPhone: '0415626761',
      newPhone: '01021073388'
    },
    {
      label: '이관욱(매장 번호)',
      oldPhone: '0312150013',
      newPhone: '01037701435'
    },
    {
      label: '김동광(콤마 포함)',
      oldPhone: '010,5275,2924',
      newPhone: '01052752924'
    }
  ];

  for (const t of targets) {
    console.log(`\n[${t.label}] ${t.oldPhone} → ${t.newPhone}`);

    const { data: bookings, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, name, phone, date, time')
      .eq('phone', t.oldPhone);

    if (bookingErr) {
      console.error('  ❌ 예약 조회 오류:', bookingErr);
      continue;
    }

    console.log(`  - 해당 예약 수: ${bookings.length}건`);
    bookings.forEach(b => {
      console.log(`    · [booking] id=${b.id}, name=${b.name}, date=${b.date} ${b.time}, phone=${b.phone}`);
    });

    const { data: customers, error: customerErr } = await supabase
      .from('customers')
      .select('id, name, phone, visit_count')
      .eq('phone', t.oldPhone);

    if (customerErr) {
      console.error('  ❌ 고객 조회 오류:', customerErr);
      continue;
    }

    console.log(`  - 해당 고객 수: ${customers.length}명`);
    customers.forEach(c => {
      console.log(`    · [customer] id=${c.id}, name=${c.name}, phone=${c.phone}, visits=${c.visit_count}`);
    });

    if (!apply) continue;

    if (bookings.length > 0) {
      const { error: updateBookingsErr } = await supabase
        .from('bookings')
        .update({ phone: t.newPhone })
        .eq('phone', t.oldPhone);

      if (updateBookingsErr) {
        console.error('  ❌ 예약 전화번호 업데이트 실패:', updateBookingsErr);
      } else {
        console.log(`  ✅ 예약 ${bookings.length}건 전화번호 업데이트 완료`);
      }
    }

    if (customers.length > 0) {
      const { error: updateCustomersErr } = await supabase
        .from('customers')
        .update({ phone: t.newPhone })
        .eq('phone', t.oldPhone);

      if (updateCustomersErr) {
        console.error('  ❌ 고객 전화번호 업데이트 실패:', updateCustomersErr);
      } else {
        console.log(`  ✅ 고객 ${customers.length}명 전화번호 업데이트 완료`);
      }
    }
  }

  // 2. David Tian: 80188474 → 예약 삭제
  console.log('\n[David Tian] 80188474 → 예약 삭제');

  const { data: davidBookings, error: davidErr } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time')
    .eq('phone', '80188474');

  if (davidErr) {
    console.error('  ❌ 예약 조회 오류:', davidErr);
  } else {
    console.log(`  - 해당 예약 수: ${davidBookings.length}건`);
    davidBookings.forEach(b => {
      console.log(`    · [booking] id=${b.id}, name=${b.name}, date=${b.date} ${b.time}, phone=${b.phone}`);
    });

    if (apply && davidBookings.length > 0) {
      const ids = davidBookings.map(b => b.id);
      const { error: deleteErr } = await supabase
        .from('bookings')
        .delete()
        .in('id', ids);

      if (deleteErr) {
        console.error('  ❌ 예약 삭제 실패:', deleteErr);
      } else {
        console.log(`  ✅ 예약 ${ids.length}건 삭제 완료`);
      }
    }
  }

  console.log('\n✅ 특정 전화번호 교정 스크립트 완료\n');
}

fixSpecificInvalidPhones().catch(err => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});








