/**
 * 메시지 230~238을 베트남(B) 버전으로 변경
 * - message_text를 베트남 문구로 교체
 * - note에 기존 버전 -> B(베트남) 변경 이력 기록
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_IDS = [230, 231, 232, 233, 234, 235, 236, 237, 238];
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

function detectVersion(note) {
  if (!note) return '알수없음';
  const m = note.match(/(A|B|C)\([^)]*\)/);
  if (m) {
    const v = m[1];
    if (v === 'A') return 'A(태국)';
    if (v === 'B') return 'B(베트남)';
    if (v === 'C') return 'C(일본)';
    return m[0];
  }
  return '알수없음';
}

function buildNote(oldNote) {
  const from = detectVersion(oldNote);
  const base = oldNote || '';
  const marker = `변경: ${from} -> B(베트남)`;
  if (base.includes(marker)) return base; // 이미 기록됨
  return base ? `${base} | ${marker}` : marker;
}

async function main() {
  console.log('='.repeat(100));
  console.log('📝 메시지 230~238 베트남 버전 업데이트');
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
    const newNote = buildNote(row.note);
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
      console.log(`✅ ID ${row.id} 업데이트 완료 | ${newNote}`);
    }
  }

  console.log('\n✅ 모든 작업 완료');
}

main();
