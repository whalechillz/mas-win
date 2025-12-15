/**
 * 메시지 233, 234, 235, 259를 베트남 버전(B)으로 변경
 * - message_text를 베트남 문구로 교체
 * - note의 버전 표기를 B(베트남)으로 교체
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_IDS = [233, 234, 235, 259];
const VIETNAM_TEXT = `[MASSGOO X MUZIIK] 콜라보 기념 설문 조사

신짜오! 햇살 가득한 베트남 겨울 필드

힘 빼고 휘둘러도, 거리는 충분합니다

선호하는 샤프트 설문 참여 시 특별 선물 증정!
- 스타일리시한 버킷햇
- 콜라보 골프모자

☆ 참여하기:
https://www.masgolf.co.kr/survey

☆ 전화 상담만 해도 특별 선물!
080-028-8888 (무료)`;

function toVietnamNote(note) {
  if (!note || typeof note !== 'string') return 'A/B/C 테스트 - 베트남 버전';
  // 버전 부분만 교체
  const replaced = note.replace(/(A|B|C)\([^)]*\)/g, 'B(베트남)');
  // 중복 방지를 위해 한번 더 정제
  return replaced.includes('베트남') ? replaced : `${replaced} - 베트남`;
}

async function main() {
  console.log('='.repeat(100));
  console.log('📝 메시지 233, 234, 235, 259 베트남 버전 업데이트');
  console.log('='.repeat(100));

  const { data: rows, error } = await supabase
    .from('channel_sms')
    .select('id, message_text, note')
    .in('id', TARGET_IDS)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 조회 실패:', error.message);
    process.exit(1);
  }

  for (const row of rows) {
    const newNote = toVietnamNote(row.note);
    const { error: updErr } = await supabase
      .from('channel_sms')
      .update({
        message_text: VIETNAM_TEXT,
        note: newNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id);

    if (updErr) {
      console.error(`❌ ID ${row.id} 업데이트 실패:`, updErr.message);
    } else {
      console.log(`✅ ID ${row.id} 업데이트 완료 | note: ${newNote}`);
    }
  }

  console.log('\n✅ 모든 작업 완료');
}

main();
