require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const TARGET_PHONE = '01066699000';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findKakaoUuid() {
  console.log('🔍 카카오 친구 UUID 찾기 시작...');
  console.log(`📞 대상 전화번호: ${TARGET_PHONE}\n`);

  try {
    // 전화번호 정규화
    const normalizedPhone = TARGET_PHONE.replace(/[^0-9]/g, '');
    console.log(`📱 정규화된 전화번호: ${normalizedPhone}\n`);

    // 데이터베이스에서 조회
    console.log('1️⃣ 데이터베이스에서 친구 정보 조회 중...');
    const { data: mapping, error } = await supabase
      .from('kakao_friend_mappings')
      .select('uuid, phone, nickname, thumbnail_image, synced_at')
      .eq('phone', normalizedPhone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드를 찾을 수 없음
        console.log('❌ 데이터베이스에 해당 전화번호의 친구 정보가 없습니다.\n');
        console.log('💡 해결 방법:');
        console.log('   1. 카카오 개발자 콘솔에서 UUID를 확인하세요');
        console.log('   2. /admin/kakao-friends 페이지에서 친구를 등록하세요');
        console.log('   3. 또는 아래 방법으로 UUID를 확인할 수 있습니다:\n');
        
        // 전체 친구 목록 확인
        console.log('2️⃣ 전체 친구 목록 확인 중...');
        const { data: allFriends, error: listError } = await supabase
          .from('kakao_friend_mappings')
          .select('uuid, phone, nickname')
          .limit(10);

        if (!listError && allFriends && allFriends.length > 0) {
          console.log(`   등록된 친구 수: ${allFriends.length}명`);
          console.log('   등록된 친구 목록:');
          allFriends.forEach((friend, index) => {
            console.log(`   ${index + 1}. 전화번호: ${friend.phone || '-'}, UUID: ${friend.uuid}, 닉네임: ${friend.nickname || '-'}`);
          });
        } else {
          console.log('   등록된 친구가 없습니다.');
        }
      } else {
        console.error('❌ 데이터베이스 조회 오류:', error);
      }
      return;
    }

    if (!mapping) {
      console.log('❌ 해당 전화번호의 친구 정보를 찾을 수 없습니다.');
      return;
    }

    // 성공
    console.log('✅ 친구 정보를 찾았습니다!\n');
    console.log('📋 친구 정보:');
    console.log(`   UUID: ${mapping.uuid}`);
    console.log(`   전화번호: ${mapping.phone || '-'}`);
    console.log(`   닉네임: ${mapping.nickname || '-'}`);
    console.log(`   등록일: ${mapping.synced_at ? new Date(mapping.synced_at).toLocaleString('ko-KR') : '-'}`);
    
    if (mapping.thumbnail_image) {
      console.log(`   프로필 이미지: ${mapping.thumbnail_image}`);
    }

    console.log('\n💡 이 UUID를 사용하여 친구톡을 발송할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
findKakaoUuid().catch(console.error);
