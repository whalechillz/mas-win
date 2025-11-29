/**
 * 136번 메시지의 group_statuses 확인 스크립트
 * 
 * 사용법:
 * node scripts/check-message-136-group-statuses.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessage136() {
  console.log('\n🔍 136번 메시지 group_statuses 확인 시작...\n');

  try {
    // 1. 136번 메시지 조회
    const { data: message, error: fetchError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 136)
      .single();

    if (fetchError || !message) {
      console.error(`❌ 메시지를 찾을 수 없습니다: ${fetchError?.message}`);
      process.exit(1);
    }

    console.log('✅ 메시지 조회 성공:');
    console.log(`   - ID: ${message.id}`);
    console.log(`   - 상태: ${message.status}`);
    console.log(`   - 수신자 수: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   - 솔라피 그룹 ID: ${message.solapi_group_id || '없음'}`);
    console.log(`   - 성공 건수: ${message.success_count || 0}건`);
    console.log(`   - 실패 건수: ${message.fail_count || 0}건`);
    console.log(`   - 총 발송: ${message.sent_count || 0}건\n`);

    // 2. group_statuses 확인
    const groupStatuses = message.group_statuses || [];
    console.log(`📋 group_statuses 개수: ${groupStatuses.length}개\n`);

    if (groupStatuses.length === 0) {
      console.log('ℹ️ group_statuses가 비어있습니다.');
    } else {
      console.log('📊 group_statuses 상세:');
      groupStatuses.forEach((status, idx) => {
        console.log(`\n   [${idx + 1}] 그룹 ID: ${status.groupId || '없음'}`);
        console.log(`      - 성공: ${status.successCount || 0}건`);
        console.log(`      - 실패: ${status.failCount || 0}건`);
        console.log(`      - 발송중: ${status.sendingCount || 0}건`);
        console.log(`      - 총: ${status.totalCount || 0}건`);
        console.log(`      - 마지막 동기화: ${status.lastSyncedAt || '없음'}`);
      });

      // 3. 집계 계산
      const aggregateCounts = groupStatuses.reduce(
        (acc, statusEntry) => {
          acc.success += statusEntry.successCount || 0;
          acc.fail += statusEntry.failCount || 0;
          acc.sending += statusEntry.sendingCount || 0;
          acc.total += statusEntry.totalCount || 0;
          return acc;
        },
        { success: 0, fail: 0, sending: 0, total: 0 }
      );

      console.log(`\n📊 집계 결과:`);
      console.log(`   - 성공: ${aggregateCounts.success}건`);
      console.log(`   - 실패: ${aggregateCounts.fail}건`);
      console.log(`   - 발송중: ${aggregateCounts.sending}건`);
      console.log(`   - 총: ${aggregateCounts.total}건`);

      // 4. 유효한 그룹 ID 확인
      const validGroupIds = message.solapi_group_id 
        ? message.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
        : [];

      console.log(`\n🔍 유효성 검증:`);
      console.log(`   - 유효한 그룹 IDs: ${validGroupIds.join(', ') || '없음'}`);
      
      const invalidStatuses = groupStatuses.filter(status => {
        if (validGroupIds.length === 0) return false;
        return !validGroupIds.includes(status.groupId);
      });

      if (invalidStatuses.length > 0) {
        console.log(`\n⚠️ 유효하지 않은 그룹 ID 발견: ${invalidStatuses.length}개`);
        invalidStatuses.forEach((status, idx) => {
          console.log(`   [${idx + 1}] 그룹 ID: ${status.groupId} (메시지의 solapi_group_id에 없음)`);
        });
      }

      // 5. 중복 확인
      const groupIdCounts = {};
      groupStatuses.forEach(status => {
        const gid = status.groupId;
        if (!groupIdCounts[gid]) {
          groupIdCounts[gid] = [];
        }
        groupIdCounts[gid].push(status);
      });

      const duplicates = Object.entries(groupIdCounts).filter(([gid, statuses]) => statuses.length > 1);
      if (duplicates.length > 0) {
        console.log(`\n⚠️ 중복된 그룹 ID 발견: ${duplicates.length}개`);
        duplicates.forEach(([gid, statuses]) => {
          console.log(`   그룹 ID: ${gid} (${statuses.length}번 중복)`);
          statuses.forEach((status, idx) => {
            console.log(`      [${idx + 1}] 성공: ${status.successCount}, 실패: ${status.failCount}, 총: ${status.totalCount}`);
          });
        });
      }
    }

    console.log('\n✅ 확인 완료!\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkMessage136();

