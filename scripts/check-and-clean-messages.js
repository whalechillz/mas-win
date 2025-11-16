/**
 * 카카오톡 프로필 메시지 및 피드 캡션 자동 점검 및 정리 스크립트
 * "json { message:" 패턴 및 따옴표 제거
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 메시지 정리 함수
function cleanMessage(message) {
  if (!message || typeof message !== 'string') return message;
  
  let cleaned = message.trim();
  
  // "json { message: " 패턴 제거
  cleaned = cleaned.replace(/^json\s*\{\s*message\s*:\s*/i, '');
  cleaned = cleaned.replace(/\s*\}\s*$/i, '');
  
  // 따옴표 제거 (앞뒤 따옴표)
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');
  
  return cleaned.trim() || null;
}

// 캡션 정리 함수
function cleanCaption(caption) {
  if (!caption || typeof caption !== 'string') return caption;
  
  let cleaned = caption.trim();
  
  // 따옴표 제거 (앞뒤 따옴표)
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');
  
  return cleaned.trim() || null;
}

async function checkAndCleanMessages() {
  console.log('🔍 카카오톡 메시지 점검 시작...\n');
  
  // 프로필 메시지 조회
  const { data: profileData, error: profileError } = await supabase
    .from('kakao_profile_content')
    .select('id, date, account, message')
    .not('message', 'is', null)
    .neq('message', '');
  
  if (profileError) {
    console.error('❌ 프로필 메시지 조회 오류:', profileError);
    return;
  }
  
  // 피드 캡션 조회
  const { data: feedData, error: feedError } = await supabase
    .from('kakao_feed_content')
    .select('id, date, account, caption')
    .not('caption', 'is', null)
    .neq('caption', '');
  
  if (feedError) {
    console.error('❌ 피드 캡션 조회 오류:', feedError);
    return;
  }
  
  const profileProblems = [];
  const feedProblems = [];
  let profileCleaned = 0;
  let feedCleaned = 0;
  
  // 프로필 메시지 점검
  console.log(`📋 프로필 메시지 ${profileData.length}개 점검 중...`);
  for (const item of profileData) {
    const original = item.message;
    const cleaned = cleanMessage(original);
    
    if (cleaned !== original) {
      const hasJsonPattern = /json\s*\{\s*message\s*:/i.test(original);
      const hasQuotes = /^["'`]|["'`]$/.test(original);
      
      profileProblems.push({
        id: item.id,
        date: item.date,
        account: item.account,
        original,
        cleaned,
        issues: {
          jsonPattern: hasJsonPattern,
          quotes: hasQuotes
        }
      });
      
      // Supabase 업데이트
      const { error: updateError } = await supabase
        .from('kakao_profile_content')
        .update({ message: cleaned })
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`❌ 업데이트 실패 (${item.date} ${item.account}):`, updateError);
      } else {
        profileCleaned++;
      }
    }
  }
  
  // 피드 캡션 점검
  console.log(`📋 피드 캡션 ${feedData.length}개 점검 중...`);
  for (const item of feedData) {
    const original = item.caption;
    const cleaned = cleanCaption(original);
    
    if (cleaned !== original) {
      const hasQuotes = /^["'`]|["'`]$/.test(original);
      
      feedProblems.push({
        id: item.id,
        date: item.date,
        account: item.account,
        original,
        cleaned,
        issues: {
          quotes: hasQuotes
        }
      });
      
      // Supabase 업데이트
      const { error: updateError } = await supabase
        .from('kakao_feed_content')
        .update({ caption: cleaned })
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`❌ 업데이트 실패 (${item.date} ${item.account}):`, updateError);
      } else {
        feedCleaned++;
      }
    }
  }
  
  // 결과 출력
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 점검 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`프로필 메시지: ${profileData.length}개 중 ${profileProblems.length}개 문제 발견, ${profileCleaned}개 정리 완료`);
  console.log(`피드 캡션: ${feedData.length}개 중 ${feedProblems.length}개 문제 발견, ${feedCleaned}개 정리 완료`);
  
  if (profileProblems.length > 0) {
    console.log('\n📝 프로필 메시지 문제 목록:');
    profileProblems.forEach(p => {
      const issues = [];
      if (p.issues.jsonPattern) issues.push('json 패턴');
      if (p.issues.quotes) issues.push('따옴표');
      console.log(`  - ${p.date} ${p.account} [${issues.join(', ')}]`);
      console.log(`    "${p.original}" → "${p.cleaned}"`);
    });
  }
  
  if (feedProblems.length > 0) {
    console.log('\n📝 피드 캡션 문제 목록:');
    feedProblems.forEach(p => {
      console.log(`  - ${p.date} ${p.account} [따옴표]`);
      console.log(`    "${p.original}" → "${p.cleaned}"`);
    });
  }
  
  if (profileProblems.length === 0 && feedProblems.length === 0) {
    console.log('\n✅ 모든 메시지가 정상입니다!');
  } else {
    console.log(`\n✅ 총 ${profileCleaned + feedCleaned}개 메시지 정리 완료`);
  }
}

checkAndCleanMessages()
  .then(() => {
    console.log('\n✅ 점검 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 점검 중 오류 발생:', error);
    process.exit(1);
  });

