/**
 * 11월 14일 데이터를 JSON 파일에서 Supabase로 동기화
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncNovember14() {
  console.log('🔄 11월 14일 데이터 동기화 시작...\n');

  // JSON 파일 읽기
  const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', '2025-11.json');
  
  if (!fs.existsSync(calendarPath)) {
    console.error(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarPath}`);
    process.exit(1);
  }

  const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
  const targetDate = '2025-11-14';

  // Account1 데이터 추출
  const account1Schedule = calendarData.profileContent?.account1?.dailySchedule?.find(
    s => s.date === targetDate
  );

  // Account2 데이터 추출
  const account2Schedule = calendarData.profileContent?.account2?.dailySchedule?.find(
    s => s.date === targetDate
  );

  if (!account1Schedule && !account2Schedule) {
    console.error(`❌ ${targetDate} 데이터를 찾을 수 없습니다.`);
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;

  // Account1 동기화
  if (account1Schedule) {
    console.log('📝 Account1 데이터 동기화 중...');
    try {
      const profileData = {
        date: account1Schedule.date,
        account: 'account1',
        background_image_url: account1Schedule.background?.imageUrl || null,
        background_prompt: account1Schedule.background?.prompt || null,
        background_base_prompt: account1Schedule.background?.basePrompt || null,
        background_image: account1Schedule.background?.image || null,
        profile_image_url: account1Schedule.profile?.imageUrl || null,
        profile_prompt: account1Schedule.profile?.prompt || null,
        profile_base_prompt: account1Schedule.profile?.basePrompt || null,
        profile_image: account1Schedule.profile?.image || null,
        message: account1Schedule.message || null,
        status: account1Schedule.status || 'planned',
        created: account1Schedule.created || false,
        published_at: account1Schedule.publishedAt || null
      };

      const { data, error } = await supabase
        .from('kakao_profile_content')
        .upsert(profileData, {
          onConflict: 'date,account',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`  ❌ Account1 저장 실패:`, error.message);
        errorCount++;
      } else {
        console.log(`  ✅ Account1 저장 완료`);
        console.log(`     배경: ${profileData.background_image || 'N/A'}`);
        console.log(`     프로필: ${profileData.profile_image || 'N/A'}`);
        console.log(`     메시지: ${profileData.message || 'N/A'}`);
        successCount++;
      }
    } catch (error) {
      console.error(`  ❌ Account1 처리 오류:`, error.message);
      errorCount++;
    }
  }

  // Account2 동기화
  if (account2Schedule) {
    console.log('\n📝 Account2 데이터 동기화 중...');
    try {
      const profileData = {
        date: account2Schedule.date,
        account: 'account2',
        background_image_url: account2Schedule.background?.imageUrl || null,
        background_prompt: account2Schedule.background?.prompt || null,
        background_base_prompt: account2Schedule.background?.basePrompt || null,
        background_image: account2Schedule.background?.image || null,
        profile_image_url: account2Schedule.profile?.imageUrl || null,
        profile_prompt: account2Schedule.profile?.prompt || null,
        profile_base_prompt: account2Schedule.profile?.basePrompt || null,
        profile_image: account2Schedule.profile?.image || null,
        message: account2Schedule.message || null,
        status: account2Schedule.status || 'planned',
        created: account2Schedule.created || false,
        published_at: account2Schedule.publishedAt || null
      };

      const { data, error } = await supabase
        .from('kakao_profile_content')
        .upsert(profileData, {
          onConflict: 'date,account',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`  ❌ Account2 저장 실패:`, error.message);
        errorCount++;
      } else {
        console.log(`  ✅ Account2 저장 완료`);
        console.log(`     배경: ${profileData.background_image || 'N/A'}`);
        console.log(`     프로필: ${profileData.profile_image || 'N/A'}`);
        console.log(`     메시지: ${profileData.message || 'N/A'}`);
        successCount++;
      }
    } catch (error) {
      console.error(`  ❌ Account2 처리 오류:`, error.message);
      errorCount++;
    }
  }

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 동기화 결과:');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
  console.log('='.repeat(50));

  if (errorCount > 0) {
    process.exit(1);
  }
}

// 실행
syncNovember14()
  .then(() => {
    console.log('\n✅ 동기화 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 동기화 중 오류 발생:', error);
    process.exit(1);
  });

