/**
 * 솔라피 콘솔에서 확인한 imageId를 DB에 업데이트
 * 
 * 사용 방법:
 * 1. 솔라피 콘솔에서 각 메시지 그룹의 실제 전송된 imageId 확인
 * 2. 아래 solapiImageIdMap에 확인한 imageId 입력
 * 3. 스크립트 실행
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

// ⚠️ 솔라피 콘솔에서 확인한 실제 imageId를 여기에 입력하세요
// 형식: { 메시지ID: 'Solapi imageId' }
const solapiImageIdMap = {
  // 149-155번: 솔라피에 이미지 전송됨
  // ⚠️ 실제 imageId는 솔라피 콘솔에서 확인하여 입력 필요
  149: null, // 예: 'ST01FZ251204102654100YtuFM06Qspg'
  150: null, // 예: 'ST01FZ251204102654100YtuFM06Qspg'
  151: null, // 예: 'ST01FZ2512050138137617fF3wjofCxt'
  152: null, // 예: 'ST01FZ251205013547080bK2E3oUnkzM'
  153: null, // 예: 'ST01FZ251204102654100YtuFM06Qspg'
  154: null, // 예: 'ST01FZ251204102654100YtuFM06Qspg'
  155: null, // 예: 'ST01FZ251204102654100YtuFM06Qspg'
  
  // 159, 160, 161번: 솔라피에 이미지 전송됨
  159: null, // 예: 'ST01FZ251204085341061K8azbQsphms'
  160: null, // 예: 'ST01FZ251204101209840HNfySlrY4wQ'
  161: null, // 예: 'ST01FZ251205012637810F9fN6NeBlVv'
};

async function updateImagesFromSolapiConsole() {
  console.log('='.repeat(100));
  console.log('🔄 솔라피 콘솔 기준 이미지 업데이트');
  console.log('='.repeat(100));
  console.log('');

  // 1. 입력된 imageId 확인
  const hasImageIds = Object.entries(solapiImageIdMap).filter(([id, imageId]) => imageId !== null);
  
  if (hasImageIds.length === 0) {
    console.log('⚠️ solapiImageIdMap에 imageId가 입력되지 않았습니다.');
    console.log('\n📌 사용 방법:');
    console.log('   1. 솔라피 콘솔에서 각 메시지 그룹의 실제 전송된 imageId 확인');
    console.log('   2. 이 스크립트의 solapiImageIdMap에 imageId 입력');
    console.log('   3. 스크립트 다시 실행');
    console.log('\n💡 솔라피 콘솔에서 확인하는 방법:');
    console.log('   - 메시지 로그 페이지 접속');
    console.log('   - 각 메시지 그룹 ID로 상세 조회');
    console.log('   - MMS 타입 메시지의 imageId 확인');
    return;
  }

  console.log(`📋 입력된 imageId: ${hasImageIds.length}개\n`);

  // 2. 메시지 조회
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

  const updates = [];

  // 3. 각 메시지에 대해 imageId 업데이트
  for (const msg of messages) {
    const targetImageId = solapiImageIdMap[msg.id];
    
    if (!targetImageId) {
      console.log(`\n📨 메시지 ID: ${msg.id} - imageId 미입력 (건너뜀)`);
      continue;
    }

    console.log(`\n📨 메시지 ID: ${msg.id}`);
    console.log(`   현재 DB image_url: ${msg.image_url || '(없음)'}`);
    console.log(`   업데이트할 imageId: ${targetImageId.substring(0, 50)}...`);

    if (msg.image_url === targetImageId) {
      console.log(`   ✅ 이미 올바른 imageId가 설정되어 있습니다.`);
      continue;
    }

    updates.push({
      id: msg.id,
      currentImageUrl: msg.image_url,
      newImageId: targetImageId
    });
  }

  // 4. DB 업데이트
  if (updates.length === 0) {
    console.log('\n✅ 업데이트가 필요한 메시지가 없습니다.');
    return;
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n💾 DB 업데이트 진행 중...\n');

  let updateSuccess = 0;
  let updateFail = 0;

  for (const item of updates) {
    try {
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: item.newImageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`   ❌ 메시지 ID ${item.id} 업데이트 실패: ${updateError.message}`);
        updateFail++;
      } else {
        console.log(`   ✅ 메시지 ID ${item.id}: imageId 업데이트 완료`);
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
  console.log('\n✅ 동기화 완료!');
}

updateImagesFromSolapiConsole();


