/**
 * 메시지 1 (50km 이내 고객) 청크를 SMS 초안으로 저장하는 스크립트
 * 
 * 사용법:
 * node scripts/save-message1-drafts.js [JSON파일경로]
 * 
 * 예시:
 * node scripts/save-message1-drafts.js scripts/message-chunks/message1-chunks-2026-01-20T02-08-07.json
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 메시지 1 템플릿 (변수 포함)
// 호칭은 버튼에서 선택하므로 메시지에는 {name}만 입력
const MESSAGE_1_TEMPLATE = `[마쓰구골프] {name}, 근거리 시타 특별 초대!

{name}, 약 {distance_km}km 거리에 계시는 고객님을 위한 특별 혜택입니다!

[근거리 특별 혜택]
• 마쓰구 티타늄 샤프트 (뮤직 장착) 신제품 시타
• 맞춤형 피팅 서비스 무료 제공
• 직접 방문 시 추가 할인 적용

힘 빼고 휘둘러도, 거리는 충분합니다
가까운 거리에서 직접 체험해보세요!

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 온라인 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888
☎ 매장 문의: 031-215-0013

KGFA 1급 피팅 전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.

마쓰구 수원본점
수원시 영통구 법조로149번길 200`;

async function saveMessage1Drafts(jsonFilePath) {
  console.log('='.repeat(80));
  console.log('💾 메시지 1 (50km 이내 고객) 청크를 SMS 초안으로 저장');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. JSON 파일 읽기
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${jsonFilePath}`);
      process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    console.log(`📄 JSON 파일 로드 완료: ${jsonFilePath}`);
    console.log(`   총 ${jsonData.length}개 청크`);
    console.log('');

    const savedDrafts = [];

    // 2. 각 청크별로 초안 저장
    for (let chunkIndex = 0; chunkIndex < jsonData.length; chunkIndex++) {
      const chunk = jsonData[chunkIndex];
      const chunkNumber = chunk.청크번호 || chunkIndex + 1;
      const totalChunks = chunk.총청크수 || jsonData.length;

      console.log(`📝 청크 ${chunkNumber}/${totalChunks} 저장 중... (${chunk.고객수}명)`);

      // 수신자 번호 목록 추출
      const recipientNumbers = chunk.메시지목록.map(msg => msg.전화번호).filter(Boolean);

      if (recipientNumbers.length === 0) {
        console.log(`   ⚠️  수신자가 없어 건너뜁니다.`);
        continue;
      }

      // 메모 생성
      const note = `메시지 1 (50km 이내) - 청크 ${chunkNumber}/${totalChunks} (${chunk.시작순번}~${chunk.끝순번}번, 총 ${chunk.고객수}명)`;

      // 초안 데이터 구성
      const draftData = {
        message: MESSAGE_1_TEMPLATE, // 템플릿 (변수 포함)
        type: 'LMS', // LMS 타입 (변수 치환이 필요하므로)
        status: 'draft',
        recipientNumbers: recipientNumbers,
        note: note,
        honorific: '고객님' // 호칭 설정 (버튼에서 선택)
      };

      // Supabase에 저장
      const { data: savedDraft, error: saveError } = await supabase
        .from('channel_sms')
        .insert({
          message_text: draftData.message,
          message_type: draftData.type,
          status: draftData.status,
          recipient_numbers: draftData.recipientNumbers,
          note: draftData.note,
          honorific: draftData.honorific,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.error(`   ❌ 저장 실패:`, saveError);
        continue;
      }

      console.log(`   ✅ 저장 완료: ID ${savedDraft.id}`);
      savedDrafts.push({
        청크번호: chunkNumber,
        SMS_ID: savedDraft.id,
        고객수: chunk.고객수,
        수신자수: recipientNumbers.length,
        메모: note
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('📊 저장 결과 요약');
    console.log('='.repeat(80));
    console.log(`총 청크 수: ${jsonData.length}개`);
    console.log(`저장된 초안: ${savedDrafts.length}개`);
    console.log('');

    if (savedDrafts.length > 0) {
      console.log('저장된 초안 목록:');
      savedDrafts.forEach(draft => {
        console.log(`  - 청크 ${draft.청크번호}: SMS ID ${draft.SMS_ID} (${draft.고객수}명)`);
      });
      console.log('');

      // 저장 결과를 파일로 저장
      const resultFile = jsonFilePath.replace('.json', '-drafts-saved.json');
      fs.writeFileSync(resultFile, JSON.stringify(savedDrafts, null, 2), 'utf-8');
      console.log(`💾 저장 결과가 저장되었습니다: ${resultFile}`);
      console.log('');

      console.log('✅ 모든 초안 저장 완료!');
      console.log('');
      console.log('📌 다음 단계:');
      console.log('   1. /admin/sms 페이지에서 초안 탭 확인');
      console.log('   2. 각 청크별 초안을 열어서 수신자 확인');
      console.log('   3. 이미지 첨부 (메시지 1용 이미지)');
      console.log('   4. 발송 실행');
    }

    return savedDrafts;

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  // 명령줄 인자에서 JSON 파일 경로 가져오기
  const jsonFilePath = process.argv[2] || 'scripts/message-chunks/message1-chunks-2026-01-20T02-08-07.json';
  
  // 상대 경로를 절대 경로로 변환
  const absolutePath = path.isAbsolute(jsonFilePath) 
    ? jsonFilePath 
    : path.join(process.cwd(), jsonFilePath);

  saveMessage1Drafts(absolutePath)
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { saveMessage1Drafts };
