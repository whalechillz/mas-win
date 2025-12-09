/**
 * 솔라피 기준으로 실제 전송된 이미지를 DB에 수동 동기화
 * 
 * 사용자가 솔라피 콘솔에서 확인한 정보를 바탕으로 업데이트
 * 
 * 규칙:
 * - 149-155번: 솔라피에 이미지+내용 전송됨 → DB에 Solapi imageId 추가
 * - 159, 160, 161번: 솔라피에 이미지+내용 전송됨 → DB 업데이트 (이미 있으면 유지)
 * - 157, 158번: 솔라피에 이미지 없음, DB에는 있음 → DB에서 이미지 제거
 * - 148번: 솔라피에 이미지 없음, DB에도 없음 → 그대로
 * - 140-147번: 이미지를 빼고 보냈으므로 업로드 불필요 → DB에서 이미지 제거
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

// 솔라피 기준 동기화 규칙
const syncRules = {
  // 솔라피에 이미지 전송됨 → DB에 Solapi imageId 추가/유지
  addImage: [149, 150, 151, 152, 153, 154, 155, 159, 160, 161],
  
  // 솔라피에 이미지 없음 → DB에서 이미지 제거
  removeImage: [140, 141, 142, 143, 144, 145, 146, 147, 157, 158],
  
  // 솔라피에 이미지 없음, DB에도 없음 → 그대로 (변경 없음)
  noChange: [148]
};

async function manualSyncImages() {
  console.log('='.repeat(100));
  console.log('🔄 솔라피 기준 이미지 수동 동기화');
  console.log('='.repeat(100));
  console.log('');

  // 1. 모든 메시지 조회
  const allMessageIds = [
    ...syncRules.addImage,
    ...syncRules.removeImage,
    ...syncRules.noChange
  ];

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', allMessageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  console.log(`📋 총 ${messages.length}개 메시지 확인\n`);

  const updates = [];
  const results = [];

  // 2. 각 메시지에 대해 규칙 적용
  for (const msg of messages) {
    const msgId = msg.id;
    const currentImageUrl = msg.image_url;
    const isInAddList = syncRules.addImage.includes(msgId);
    const isInRemoveList = syncRules.removeImage.includes(msgId);
    const isInNoChangeList = syncRules.noChange.includes(msgId);

    console.log(`\n📨 메시지 ID: ${msgId}`);
    console.log(`   상태: ${msg.status}`);
    console.log(`   타입: ${msg.message_type}`);
    console.log(`   현재 DB image_url: ${currentImageUrl ? (currentImageUrl.substring(0, 50) + '...') : '(없음)'}`);

    let action = null;
    let newImageUrl = null;

    if (isInAddList) {
      // 솔라피에 이미지 전송됨 → DB에 Solapi imageId 추가/유지
      if (!currentImageUrl || !/^[A-Z0-9]+$/i.test(currentImageUrl)) {
        // DB에 이미지가 없거나 HTTP URL인 경우
        // ⚠️ 실제 Solapi imageId는 솔라피 콘솔에서 확인 필요
        // 현재는 DB에 있는 Solapi imageId를 유지하거나, 없으면 스킵
        if (currentImageUrl && /^[A-Z0-9]+$/i.test(currentImageUrl) && currentImageUrl.length > 10) {
          // 이미 Solapi imageId가 있으면 유지
          action = '유지';
          newImageUrl = currentImageUrl;
          console.log(`   ✅ 솔라피: 이미지 전송됨 → DB에 Solapi imageId 유지`);
        } else {
          // Solapi imageId가 없으면 스킵 (수동으로 업로드 필요)
          action = '스킵 (수동 업로드 필요)';
          console.log(`   ⚠️ 솔라피: 이미지 전송됨 → DB에 Solapi imageId 없음 (수동 업로드 필요)`);
        }
      } else {
        // 이미 Solapi imageId가 있으면 유지
        action = '유지';
        newImageUrl = currentImageUrl;
        console.log(`   ✅ 솔라피: 이미지 전송됨 → DB에 Solapi imageId 유지`);
      }
    } else if (isInRemoveList) {
      // 솔라피에 이미지 없음 → DB에서 이미지 제거
      if (currentImageUrl) {
        action = '제거';
        newImageUrl = null;
        console.log(`   🗑️ 솔라피: 이미지 없음 → DB에서 이미지 제거`);
      } else {
        action = '이미 없음';
        console.log(`   ✅ 솔라피: 이미지 없음 → DB에도 이미지 없음 (변경 불필요)`);
      }
    } else if (isInNoChangeList) {
      // 변경 없음
      action = '변경 없음';
      console.log(`   ℹ️ 솔라피: 이미지 없음 → DB에도 이미지 없음 (변경 없음)`);
    } else {
      action = '규칙 없음';
      console.log(`   ⚠️ 규칙에 없는 메시지`);
    }

    if (action === '제거' || (action === '유지' && newImageUrl !== currentImageUrl)) {
      updates.push({
        id: msgId,
        action,
        currentImageUrl,
        newImageUrl
      });
    }

    results.push({
      id: msgId,
      action,
      currentImageUrl: currentImageUrl ? '있음' : '없음',
      newImageUrl: newImageUrl ? '있음' : '없음'
    });
  }

  // 3. 업데이트 실행
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 동기화 계획:');
  console.log(`   총 확인: ${results.length}개`);
  console.log(`   업데이트 필요: ${updates.length}개`);

  if (updates.length > 0) {
    console.log('\n⚠️ 업데이트할 메시지:');
    updates.forEach(item => {
      console.log(`   - 메시지 ID ${item.id}: ${item.action}`);
      if (item.action === '제거') {
        console.log(`     현재: ${item.currentImageUrl ? (item.currentImageUrl.substring(0, 50) + '...') : '(없음)'}`);
        console.log(`     변경: (없음)`);
      } else if (item.action === '유지') {
        console.log(`     Solapi imageId 유지: ${item.newImageUrl.substring(0, 50)}...`);
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n💾 DB 업데이트 진행 중...\n');

    let updateSuccess = 0;
    let updateFail = 0;

    for (const item of updates) {
      try {
        const updateData = {
          image_url: item.newImageUrl,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('channel_sms')
          .update(updateData)
          .eq('id', item.id);

        if (updateError) {
          console.error(`   ❌ 메시지 ID ${item.id} 업데이트 실패: ${updateError.message}`);
          updateFail++;
        } else {
          console.log(`   ✅ 메시지 ID ${item.id}: ${item.action} 완료`);
          updateSuccess++;
        }
      } catch (error) {
        console.error(`   ❌ 메시지 ID ${item.id} 업데이트 오류: ${error.message}`);
        updateFail++;
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📊 업데이트 결과:');
    console.log(`   ✅ 성공: ${updateSuccess}개`);
    if (updateFail > 0) {
      console.log(`   ❌ 실패: ${updateFail}개`);
    }
  } else {
    console.log('\n✅ 업데이트가 필요한 메시지가 없습니다.');
  }

  // 4. 수동 업로드 필요한 메시지 확인
  console.log('\n' + '='.repeat(100));
  console.log('\n📌 수동 업로드가 필요한 메시지:');
  
  const needsManualUpload = results.filter(r => 
    syncRules.addImage.includes(r.id) && 
    r.currentImageUrl === '없음' &&
    !/^[A-Z0-9]+$/i.test(messages.find(m => m.id === r.id)?.image_url || '')
  );

  if (needsManualUpload.length > 0) {
    console.log(`   총 ${needsManualUpload.length}개 메시지에 이미지를 수동으로 업로드해야 합니다:\n`);
    needsManualUpload.forEach(item => {
      const msg = messages.find(m => m.id === item.id);
      console.log(`   - 메시지 ID ${item.id}:`);
      console.log(`     솔라피에는 이미지가 전송되었지만 DB에 Solapi imageId가 없습니다.`);
      console.log(`     해결: 에디터에서 이미지를 다시 업로드하거나, 솔라피 콘솔에서 imageId를 확인하여 수동으로 입력`);
    });
  } else {
    console.log('   없음');
  }

  console.log('\n✅ 동기화 완료!');
}

manualSyncImages();


