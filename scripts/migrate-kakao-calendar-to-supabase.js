/**
 * 카카오톡 캘린더 JSON 파일을 Supabase로 마이그레이션
 * 
 * 사용법:
 * node scripts/migrate-kakao-calendar-to-supabase.js [YYYY-MM]
 * 
 * 예시:
 * node scripts/migrate-kakao-calendar-to-supabase.js 2025-11
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 마이그레이션 함수
async function migrateCalendar(month) {
  const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', `${month}.json`);
  
  if (!fs.existsSync(calendarPath)) {
    console.error(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarPath}`);
    process.exit(1);
  }

  console.log(`📖 캘린더 파일 읽기: ${calendarPath}`);
  const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf-8'));

  let profileCount = 0;
  let feedCount = 0;
  let errors = [];

  // 프로필 콘텐츠 마이그레이션
  if (calendarData.profileContent) {
    for (const accountKey of ['account1', 'account2']) {
      const accountData = calendarData.profileContent[accountKey];
      if (!accountData || !accountData.dailySchedule) continue;

      console.log(`\n📝 ${accountKey} 프로필 콘텐츠 마이그레이션 중...`);

      for (const schedule of accountData.dailySchedule) {
        try {
          const profileData = {
            date: schedule.date,
            account: accountKey,
            background_image_url: schedule.background?.imageUrl || null,
            background_prompt: schedule.background?.prompt || null,
            background_base_prompt: schedule.background?.basePrompt || null,
            background_image: schedule.background?.image || null,
            profile_image_url: schedule.profile?.imageUrl || null,
            profile_prompt: schedule.profile?.prompt || null,
            profile_base_prompt: schedule.profile?.basePrompt || null,
            profile_image: schedule.profile?.image || null,
            message: schedule.message || null,
            status: schedule.status || 'planned',
            created: schedule.created || false,
            published_at: schedule.publishedAt || null
          };

          const { data, error } = await supabase
            .from('kakao_profile_content')
            .upsert(profileData, {
              onConflict: 'date,account',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`  ❌ ${schedule.date} 저장 실패:`, error.message);
            errors.push({ date: schedule.date, account: accountKey, error: error.message });
          } else {
            profileCount++;
            console.log(`  ✅ ${schedule.date} 저장 완료`);
          }
        } catch (error) {
          console.error(`  ❌ ${schedule.date} 처리 오류:`, error.message);
          errors.push({ date: schedule.date, account: accountKey, error: error.message });
        }
      }
    }
  }

  // 피드 콘텐츠 마이그레이션
  if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
    console.log(`\n📱 피드 콘텐츠 마이그레이션 중...`);

    for (const feed of calendarData.kakaoFeed.dailySchedule) {
      for (const accountKey of ['account1', 'account2']) {
        const feedData = feed[accountKey];
        if (!feedData) continue;

        try {
          const feedRecord = {
            date: feed.date,
            account: accountKey,
            image_category: feedData.imageCategory || null,
            image_prompt: feedData.imagePrompt || null,
            caption: feedData.caption || null,
            image_url: feedData.imageUrl || null,
            url: feedData.url || null,
            status: feedData.status || 'planned',
            created: feedData.created || false
          };

          const { data, error } = await supabase
            .from('kakao_feed_content')
            .upsert(feedRecord, {
              onConflict: 'date,account',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`  ❌ ${feed.date} ${accountKey} 피드 저장 실패:`, error.message);
            errors.push({ date: feed.date, account: accountKey, type: 'feed', error: error.message });
          } else {
            feedCount++;
            console.log(`  ✅ ${feed.date} ${accountKey} 피드 저장 완료`);
          }
        } catch (error) {
          console.error(`  ❌ ${feed.date} ${accountKey} 피드 처리 오류:`, error.message);
          errors.push({ date: feed.date, account: accountKey, type: 'feed', error: error.message });
        }
      }
    }
  }

  // 결과 요약
  console.log(`\n✅ 마이그레이션 완료!`);
  console.log(`   - 프로필 콘텐츠: ${profileCount}개 저장`);
  console.log(`   - 피드 콘텐츠: ${feedCount}개 저장`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  오류 발생: ${errors.length}개`);
    errors.forEach(err => {
      console.log(`   - ${err.date} ${err.account}${err.type ? ' (' + err.type + ')' : ''}: ${err.error}`);
    });
  }
}

// 실행
const month = process.argv[2] || '2025-11';
console.log(`🚀 카카오톡 캘린더 마이그레이션 시작: ${month}\n`);
migrateCalendar(month).catch(console.error);

