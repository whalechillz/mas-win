/**
 * 11월 14일 데이터를 JSON 파일에서 Supabase로 동기화 (API 사용)
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
  const month = '2025-11';

  // 11월 14일 데이터만 추출하여 calendar-save API 형식으로 변환
  const syncCalendarData = {
    month,
    profileContent: {
      account1: {
        ...calendarData.profileContent.account1,
        dailySchedule: calendarData.profileContent.account1.dailySchedule.filter(
          s => s.date === targetDate
        )
      },
      account2: {
        ...calendarData.profileContent.account2,
        dailySchedule: calendarData.profileContent.account2.dailySchedule.filter(
          s => s.date === targetDate
        )
      }
    },
    kakaoFeed: {
      dailySchedule: (calendarData.kakaoFeed?.dailySchedule || []).filter(
        s => s.date === targetDate
      )
    }
  };

  // API 호출
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/kakao-content/calendar-save`;

  console.log(`📡 API 호출: ${apiUrl}`);
  console.log(`📅 동기화 대상: ${targetDate}\n`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        month,
        calendarData: syncCalendarData
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 동기화 성공!');
      console.log(`   저장된 항목: ${result.savedCount || 0}개`);
      
      if (result.partialSuccess) {
        console.log(`   ⚠️ 일부 항목 저장 실패: ${result.errors?.length || 0}개`);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            console.log(`      - ${err.date} ${err.account}: ${err.error}`);
          });
        }
      }

      // 동기화된 데이터 확인
      console.log('\n📋 동기화된 데이터:');
      
      // Account1
      const account1Data = syncCalendarData.profileContent.account1.dailySchedule[0];
      if (account1Data) {
        console.log('\n  Account1 (MAS GOLF):');
        console.log(`    배경: ${account1Data.background?.image || 'N/A'}`);
        console.log(`    프로필: ${account1Data.profile?.image || 'N/A'}`);
        console.log(`    메시지: ${account1Data.message || 'N/A'}`);
      }

      // Account2
      const account2Data = syncCalendarData.profileContent.account2.dailySchedule[0];
      if (account2Data) {
        console.log('\n  Account2 (MASGOLF Tech):');
        console.log(`    배경: ${account2Data.background?.image || 'N/A'}`);
        console.log(`    프로필: ${account2Data.profile?.image || 'N/A'}`);
        console.log(`    메시지: ${account2Data.message || 'N/A'}`);
      }

    } else {
      console.error('❌ 동기화 실패:', result.message || '알 수 없는 오류');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ API 호출 오류:', error.message);
    console.error('\n💡 로컬 서버가 실행 중인지 확인하세요: npm run dev');
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

