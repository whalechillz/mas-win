const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function loadAll(tableName) {
  let allData = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${tableName} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

async function bulkUpdateBookingStatus() {
  const apply = process.argv.includes('--apply');

  console.log('🔄 예약 상태 일괄 업데이트 시작...\n');
  if (!apply) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }

  // 모든 예약 데이터 로드
  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);

  // 현재 상태 분석
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  const attendanceCounts = {
    pending: 0,
    attended: 0,
    no_show: 0,
    cancelled: 0,
  };

  const toUpdate = [];

  for (const booking of allBookings) {
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);
    const isPast = bookingDate < today;

    // 현재 상태 카운트
    const status = booking.status || 'pending';
    const attendance = booking.attendance_status || 'pending';
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    attendanceCounts[attendance] = (attendanceCounts[attendance] || 0) + 1;

    // 업데이트 대상 결정
    // 1) 노쇼는 제외하고, 과거 날짜이고 대기중인 경우 완료/참석으로 변경
    if (booking.attendance_status !== 'no_show' && isPast) {
      const updates = {};

      // status가 pending이거나 없으면 completed로
      if (!status || status === 'pending') {
        updates.status = 'completed';
      }

      // attendance_status가 pending이거나 없으면 attended로
      if (!attendance || attendance === 'pending') {
        updates.attendance_status = 'attended';
      }

      if (Object.keys(updates).length > 0) {
        toUpdate.push({
          id: booking.id,
          name: booking.name,
          date: booking.date,
          currentStatus: status,
          currentAttendance: attendance,
          updates,
        });
      }
    }

    // 2) "예약: 완료" 인 경우는 모두 "참석: 참석" 으로 맞추기 (노쇼는 그대로 유지)
    if (status === 'completed' && attendance !== 'attended' && attendance !== 'no_show') {
      toUpdate.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        currentStatus: status,
        currentAttendance: attendance,
        updates: {
          ...(booking.attendance_status !== 'attended' ? { attendance_status: 'attended' } : {}),
        },
      });
    }
  }

  console.log('📊 현재 상태 분석:');
  console.log(`   예약 상태:`);
  console.log(`     - 대기중: ${statusCounts.pending}건`);
  console.log(`     - 확정: ${statusCounts.confirmed}건`);
  console.log(`     - 완료: ${statusCounts.completed}건`);
  console.log(`     - 취소: ${statusCounts.cancelled}건`);
  console.log(`   참석 상태:`);
  console.log(`     - 대기: ${attendanceCounts.pending}건`);
  console.log(`     - 참석: ${attendanceCounts.attended}건`);
  console.log(`     - 노쇼: ${attendanceCounts.no_show}건`);
  console.log(`     - 취소: ${attendanceCounts.cancelled}건\n`);

  console.log(`📋 업데이트 대상: ${toUpdate.length}건\n`);

  if (toUpdate.length > 0) {
    console.log('샘플 (처음 10건):');
    toUpdate.slice(0, 10).forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name} (${item.date})`);
      console.log(`      현재: status=${item.currentStatus}, attendance=${item.currentAttendance}`);
      console.log(`      변경: ${JSON.stringify(item.updates)}`);
    });
    if (toUpdate.length > 10) {
      console.log(`   ... 외 ${toUpdate.length - 10}건\n`);
    }
  }

  if (!apply) {
    console.log('\n💡 --apply 옵션을 추가하면 실제 업데이트가 수행됩니다.');
    console.log('   node scripts/bulk-update-booking-status.js --apply\n');
    return;
  }

  console.log('\n⚠️  실제 업데이트를 시작합니다...\n');

  let successCount = 0;
  let errorCount = 0;

  // 청크 단위로 업데이트 (한 번에 너무 많이 하지 않기 위해)
  const chunkSize = 100;
  for (let i = 0; i < toUpdate.length; i += chunkSize) {
    const chunk = toUpdate.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update(item.updates)
          .eq('id', item.id);

        if (error) {
          console.error(`❌ 업데이트 실패 (ID: ${item.id}, ${item.name}):`, error.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`   진행 중: ${successCount}/${toUpdate.length}건 완료...`);
          }
        }
      } catch (err) {
        console.error(`❌ 예외 발생 (ID: ${item.id}):`, err.message);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}건`);
  console.log(`❌ 실패: ${errorCount}건`);
  console.log(`📋 총 대상: ${toUpdate.length}건\n`);

  console.log('✅ 작업 완료!\n');
}

bulkUpdateBookingStatus()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });

