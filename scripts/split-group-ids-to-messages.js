/**
 * 메시지 ID 325의 그룹 ID들을 분리하여 메시지 ID 326, 327, 328에 연결하는 스크립트
 * 
 * 사용법:
 * node scripts/split-group-ids-to-messages.js
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

async function splitGroupIds() {
  console.log(`\n🔄 그룹 ID 분리 및 연결 시작...\n`);

  // 1. 메시지 ID 325 조회
  const { data: sourceMessage, error: sourceError } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 325)
    .single();

  if (sourceError || !sourceMessage) {
    console.error('❌ 메시지 ID 325를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 메시지 ID 325 발견`);
  console.log(`   현재 그룹 IDs: ${sourceMessage.solapi_group_id || '없음'}`);

  // 2. 각 그룹 ID를 해당 메시지 ID에 연결
  for (const { groupId, messageId } of mappings) {
    try {
      console.log(`\n📋 처리 중: 메시지 ID ${messageId} ← 그룹 ID ${groupId}`);

      if (messageId === 325) {
        // 325는 첫 번째 그룹 ID만 남기고 나머지 제거
        const updateData = {
          solapi_group_id: groupId,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('channel_sms')
          .update(updateData)
          .eq('id', 325);

        if (updateError) {
          console.error(`   ❌ 업데이트 실패:`, updateError.message);
        } else {
          console.log(`   ✅ 메시지 ID 325 업데이트 완료!`);
          console.log(`      그룹 ID: ${groupId}`);
        }
      } else {
        // 326, 327, 328은 새 메시지 생성 또는 기존 메시지 업데이트
        // 먼저 메시지가 존재하는지 확인
        const { data: existingMessage, error: checkError } = await supabase
          .from('channel_sms')
          .select('id, solapi_group_id')
          .eq('id', messageId)
          .single();

        if (existingMessage) {
          // 기존 메시지가 있으면 그룹 ID 추가
          const existingGroupIds = existingMessage.solapi_group_id 
            ? existingMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
            : [];

          if (existingGroupIds.includes(groupId)) {
            console.log(`   ℹ️  이미 연결되어 있습니다.`);
            continue;
          }

          existingGroupIds.push(groupId);
          const newGroupIdsString = existingGroupIds.join(',');

          const updateData = {
            solapi_group_id: newGroupIdsString,
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('channel_sms')
            .update(updateData)
            .eq('id', messageId);

          if (updateError) {
            console.error(`   ❌ 업데이트 실패:`, updateError.message);
          } else {
            console.log(`   ✅ 메시지 ID ${messageId} 업데이트 완료!`);
            console.log(`      새 그룹 IDs: ${newGroupIdsString}`);
          }
        } else {
          // 새 메시지 생성 (메시지 ID 325를 복사하여 생성)
          const newMessage = {
            id: messageId,
            message_type: sourceMessage.message_type || 'MMS',
            message_text: sourceMessage.message_text || '',
            recipient_numbers: sourceMessage.recipient_numbers || [],
            status: 'sent',
            solapi_group_id: groupId,
            solapi_message_id: null,
            sent_at: sourceMessage.sent_at || new Date().toISOString(),
            sent_count: sourceMessage.sent_count || 1,
            success_count: sourceMessage.success_count || 1,
            fail_count: sourceMessage.fail_count || 0,
            group_statuses: sourceMessage.group_statuses || [],
            message_category: sourceMessage.message_category || null,
            message_subcategory: sourceMessage.message_subcategory || null,
            created_at: sourceMessage.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from('channel_sms')
            .insert(newMessage);

          if (insertError) {
            console.error(`   ❌ 메시지 생성 실패:`, insertError.message);
          } else {
            console.log(`   ✅ 메시지 ID ${messageId} 생성 완료!`);
            console.log(`      그룹 ID: ${groupId}`);
          }
        }
      }

      // 짧은 대기 (API 제한 방지)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ 오류 발생:`, error.message);
    }
  }

  console.log(`\n✅ 분리 및 연결 완료!\n`);
}

splitGroupIds()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
