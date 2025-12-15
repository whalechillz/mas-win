/**
 * 솔라피에서 실제 전송된 이미지의 Solapi imageId를 DB에 복원
 * 
 * 이전에 제거된 이미지를 솔라피 콘솔에서 확인한 정보를 바탕으로 복원
 * 
 * 규칙:
 * - 149-155번: 솔라피에 이미지 전송됨 → 솔라피 콘솔에서 확인한 imageId를 DB에 업데이트
 * - 159, 160, 161번: 솔라피에 이미지 전송됨 → 솔라피 콘솔에서 확인한 imageId를 DB에 업데이트
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

// 솔라피에서 확인한 imageId 매핑 (솔라피 콘솔에서 확인 필요)
// ⚠️ 실제 imageId는 솔라피 콘솔에서 확인하여 업데이트해야 합니다
const solapiImageIdMap = {
  // 149-155번: 같은 이미지 사용 (148번에서 복사했던 이미지)
  // 실제 imageId는 솔라피 콘솔에서 확인 필요
  149: null, // 'ST01FZ251204102654100YtuFM06Qspg' (확인 필요)
  150: null, // 'ST01FZ251204102654100YtuFM06Qspg' (확인 필요)
  151: null, // 확인 필요
  152: null, // 확인 필요
  153: null, // 'ST01FZ251204102654100YtuFM06Qspg' (확인 필요)
  154: null, // 'ST01FZ251204102654100YtuFM06Qspg' (확인 필요)
  155: null, // 'ST01FZ251204102654100YtuFM06Qspg' (확인 필요)
  
  // 159, 160, 161번: 각각 다른 이미지일 수 있음
  159: null, // 확인 필요
  160: null, // 확인 필요
  161: null, // 확인 필요
};

async function restoreSolapiImageIds() {
  console.log('='.repeat(100));
  console.log('🔄 솔라피 imageId 복원');
  console.log('='.repeat(100));
  console.log('');

  // 1. 메시지 조회
  const messageIds = Object.keys(solapiImageIdMap).map(Number);
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  console.log(`📋 총 ${messages.length}개 메시지 확인\n`);

  // 2. 솔라피 그룹 ID로 실제 전송된 이미지 확인
  console.log('🔍 솔라피 그룹 ID 확인:\n');
  
  const needsImageId = [];
  
  for (const msg of messages) {
    console.log(`📨 메시지 ID: ${msg.id}`);
    console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
    console.log(`   현재 DB image_url: ${msg.image_url || '(없음)'}`);
    
    if (msg.solapi_group_id && !msg.image_url) {
      needsImageId.push({
        id: msg.id,
        groupId: msg.solapi_group_id.split(',')[0].trim(),
        currentImageUrl: msg.image_url
      });
      console.log(`   ⚠️ 솔라피 그룹 ID는 있지만 DB에 imageId가 없습니다.`);
    } else if (msg.image_url && /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10) {
      console.log(`   ✅ DB에 Solapi imageId가 이미 있습니다: ${msg.image_url.substring(0, 30)}...`);
    }
    console.log('');
  }

  console.log('='.repeat(100));
  console.log('\n📌 다음 단계:');
  console.log('   1. 솔라피 콘솔에서 각 메시지 그룹의 실제 전송된 이미지 imageId 확인');
  console.log('   2. 확인한 imageId를 아래 스크립트의 solapiImageIdMap에 입력');
  console.log('   3. 스크립트를 다시 실행하여 DB 업데이트');
  console.log('\n💡 솔라피 콘솔에서 확인하는 방법:');
  console.log('   - 각 메시지 그룹 ID로 메시지 상세 조회');
  console.log('   - MMS 타입 메시지의 imageId 확인');
  console.log('   - 또는 메시지 목록에서 imageId 확인');

  if (needsImageId.length > 0) {
    console.log('\n⚠️ imageId가 필요한 메시지:');
    needsImageId.forEach(item => {
      console.log(`   - 메시지 ID ${item.id}: 그룹 ID ${item.groupId}`);
    });
  }
}

restoreSolapiImageIds();












