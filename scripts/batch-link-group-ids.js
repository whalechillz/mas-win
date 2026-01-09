/**
 * 여러 그룹 ID를 메시지에 일괄 연결하는 스크립트
 * 
 * 사용법:
 * node scripts/batch-link-group-ids.js
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

// 그룹 ID와 메시지 ID 매핑
const mappings = [
  { groupId: 'G4V20260109010121ZE7OGCLQSPLFXUU', messageId: 325 },
  { groupId: 'G4V20260109012603HPIPFLKGYF2RBSR', messageId: 326 },
  { groupId: 'G4V20260109094505XIRWUOMXAMSTRNC', messageId: 327 },
  { groupId: 'G4V20260109101717W0BIANHAVUIIFOY', messageId: 328 },
];

async function linkGroupIds() {
  console.log(`\n🔄 그룹 ID 일괄 연결 시작...\n`);

  for (const { groupId, messageId } of mappings) {
    try {
      console.log(`\n📋 처리 중: 메시지 ID ${messageId} ← 그룹 ID ${groupId}`);

      // 1. 메시지 존재 확인
      const { data: message, error: fetchError } = await supabase
        .from('channel_sms')
        .select('id, solapi_group_id, sent_at, status, created_at')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        console.error(`   ❌ 메시지 ID ${messageId}를 찾을 수 없습니다.`);
        continue;
      }

      console.log(`   ✅ 메시지 발견: 상태=${message.status}, 현재 그룹ID=${message.solapi_group_id || '없음'}`);

      // 2. 기존 그룹 ID 확인
      const existingGroupIds = message.solapi_group_id 
        ? message.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
        : [];

      if (existingGroupIds.includes(groupId)) {
        console.log(`   ℹ️  이미 연결되어 있습니다.`);
        continue;
      }

      // 3. 그룹 ID 추가
      existingGroupIds.push(groupId);
      const newGroupIdsString = existingGroupIds.join(',');

      // 4. 업데이트
      const updateData = {
        solapi_group_id: newGroupIdsString,
        updated_at: new Date().toISOString()
      };

      // 상태가 'draft'이면 'sent'로 변경
      if (message.status === 'draft') {
        updateData.status = 'sent';
      }

      const { error: updateError } = await supabase
        .from('channel_sms')
        .update(updateData)
        .eq('id', messageId);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ 그룹 ID 연결 완료!`);
        console.log(`      새 그룹 IDs: ${newGroupIdsString}`);
        if (updateData.status) {
          console.log(`      상태 업데이트: ${message.status} → ${updateData.status}`);
        }
      }

      // 5. 짧은 대기 (API 제한 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ 오류 발생:`, error.message);
    }
  }

  console.log(`\n✅ 일괄 연결 완료!\n`);
}

linkGroupIds()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
