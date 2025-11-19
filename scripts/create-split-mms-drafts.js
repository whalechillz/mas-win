const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 기존 메시지 ID (명령줄 인자로 전달)
const SOURCE_MESSAGE_ID = process.argv[2];

// 메시지 내용
const MESSAGE_TEXT = "[마쓰구 골드2] 첫 구매 특별 혜택! \"마제스티보다 20m 더 멀리\" 시니어 비거리 +30m 보장 2년 헤드보증 + 무료 피팅 ☆ https://www.masgolf.co.kr/products/gold2-sapphire";

// 이미지 URL 배열 (6개) - 나중에 업로드할 예정이므로 빈 값으로 설정
const IMAGE_URLS = [
  null,  // 그룹 1 (200명) - 나중에 업로드
  null,  // 그룹 2 (200명) - 나중에 업로드
  null,  // 그룹 3 (200명) - 나중에 업로드
  null,  // 그룹 4 (200명) - 나중에 업로드
  null,  // 그룹 5 (200명) - 나중에 업로드
  null,  // 그룹 6 (108명) - 나중에 업로드
];

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 수신자 분할 함수
function splitRecipients(recipients, groupSizes) {
  const groups = [];
  let startIndex = 0;
  
  for (const size of groupSizes) {
    groups.push(recipients.slice(startIndex, startIndex + size));
    startIndex += size;
  }
  
  return groups;
}

// 메인 함수
async function createSplitDrafts() {
  console.log('🚀 MMS 분할 발송 초안 생성 시작...\n');

  if (!SOURCE_MESSAGE_ID) {
    console.error('❌ 기존 메시지 ID가 필요합니다.');
    console.log('   사용법: node scripts/create-split-mms-drafts.js [메시지_ID]');
    process.exit(1);
  }

  // 1. 기존 메시지 조회
  console.log(`🔍 기존 메시지 조회 중... (ID: ${SOURCE_MESSAGE_ID})`);
  const { data: sourceMessage, error: fetchError } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', SOURCE_MESSAGE_ID)
    .single();

  if (fetchError || !sourceMessage) {
    console.error('❌ 메시지를 찾을 수 없습니다:', fetchError?.message);
    process.exit(1);
  }

  console.log(`✅ 메시지 발견: ID=${sourceMessage.id}`);
  console.log(`   수신자 수: ${sourceMessage.recipient_numbers?.length || 0}명`);
  console.log(`   메시지 내용: ${(sourceMessage.message_text || '').substring(0, 50)}...\n`);

  // 2. 수신자 추출
  const allRecipients = sourceMessage.recipient_numbers || [];
  
  if (allRecipients.length === 0) {
    console.error('❌ 수신자 목록이 비어있습니다.');
    process.exit(1);
  }

  if (allRecipients.length !== 1108) {
    console.warn(`⚠️ 수신자 수가 1108명이 아닙니다. (현재: ${allRecipients.length}명)`);
    console.log('   계속 진행합니다...\n');
  }

  console.log(`📊 수신자 분할 계획:`);
  console.log(`   전체: ${allRecipients.length}명`);
  console.log(`   그룹 1-5: 각 200명 (총 1000명)`);
  console.log(`   그룹 6: ${allRecipients.length - 1000}명\n`);

  // 3. 수신자 분할
  const groupSizes = [200, 200, 200, 200, 200, allRecipients.length - 1000];
  const recipientGroups = splitRecipients(allRecipients, groupSizes);

  console.log(`✅ 수신자 분할 완료:`);
  recipientGroups.forEach((group, index) => {
    console.log(`   그룹 ${index + 1}: ${group.length}명`);
  });
  console.log('');

  // 4. 각 그룹별로 초안 생성
  const createdDrafts = [];

  for (let i = 0; i < recipientGroups.length; i++) {
    const group = recipientGroups[i];
    const imageUrl = IMAGE_URLS[i];
    const note = `비구매자 1308명중 1차 헤드 이미지 ${String.fromCharCode(65 + i)}`; // A, B, C, D, E, F

    console.log(`\n📝 그룹 ${i + 1} 초안 생성 중...`);
    console.log(`   수신자: ${group.length}명`);
    console.log(`   이미지: ${imageUrl || '(나중에 업로드 예정)'}`);
    console.log(`   코멘트: ${note}`);

    // 하이픈 형식으로 변환
    const formattedRecipients = group.map(formatPhoneNumber);

    try {
      // API 호출
      const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: MESSAGE_TEXT,
          type: 'MMS', // MMS로 설정
          status: 'draft',
          calendar_id: sourceMessage.calendar_id || null,
          recipientNumbers: formattedRecipients,
          imageUrl: imageUrl || null, // 이미지는 나중에 업로드
          shortLink: sourceMessage.short_link || null,
          note: note // 코멘트 추가
        })
      });

      const result = await response.json();

      if (result.success) {
        const draftId = result.smsContent?.id || result.smsId;
        createdDrafts.push({
          group: i + 1,
          id: draftId,
          recipients: group.length,
          imageUrl: imageUrl,
          note: note
        });
        
        console.log(`   ✅ 초안 생성 완료! (ID: ${draftId})`);
      } else {
        console.error(`   ❌ 초안 생성 실패: ${result.message}`);
        console.error(`   응답:`, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(`   ❌ API 호출 오류:`, error.message);
    }
  }

  // 5. 결과 요약
  console.log(`\n\n📊 생성 결과 요약:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  createdDrafts.forEach(draft => {
    console.log(`그룹 ${draft.group}:`);
    console.log(`  ID: ${draft.id}`);
    console.log(`  수신자: ${draft.recipients}명`);
    console.log(`  이미지: ${draft.imageUrl}`);
    console.log(`  코멘트: ${draft.note}`);
    console.log(`  편집 페이지: ${LOCAL_URL}/admin/sms?id=${draft.id}`);
    console.log('');
  });
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 총 ${createdDrafts.length}개의 초안이 생성되었습니다.`);
  console.log(`\n💡 다음 단계:`);
  console.log(`   1. 각 초안의 이미지 URL을 확인하고 필요시 수정`);
  console.log(`   2. SMS 편집 페이지에서 각 초안을 확인`);
  console.log(`   3. 발송 또는 예약 발송 설정`);
}

createSplitDrafts();

