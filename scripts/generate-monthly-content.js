/**
 * 월별, 주별, 일별 콘텐츠 및 이미지 프롬프트 자동 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-monthly-content.js [month]
 * 
 * 예시:
 * node scripts/generate-monthly-content.js 2025-11
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 월별 전략 기반 콘텐츠 생성
async function generateHubContent(date, strategy, weeklyTheme, contentType) {
  const prompt = `
마쓰구골프(MASGOLF)를 위한 허브 콘텐츠를 생성해주세요.

**월별 전략**:
- 테마: ${strategy.theme}
- 타겟 오디언스: ${strategy.targetAudience}
- 콘텐츠 유형: ${contentType}

**주별 테마**: ${weeklyTheme}

**날짜**: ${date}

**생성 요구사항**:
1. **제목**: 60자 이내, SEO 최적화, 클릭 유도력, 감정적 훅 포함
2. **요약**: 150-200자, 핵심 메시지, 명확한 CTA 포함 (SMS, 네이버 블로그용)
3. **간단한 개요**: 300-400자, 상세 설명, 구체적 혜택, 다음 단계 안내

**톤앤매너**:
- 감정적 연결을 만드는 스토리텔링
- 고객의 실제 고민과 해결책 제시
- 자연스러운 대화체 톤앤매너
- 구체적이고 현실적인 사례
- 전문적이지만 친근한 브랜드 톤

**응답 형식 (JSON)**:
{
  "title": "제목",
  "summary": "요약",
  "overview": "간단한 개요"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.8
    });

    const content = JSON.parse(response.choices[0].message.content.trim());
    return content;
  } catch (error) {
    console.error(`콘텐츠 생성 오류 (${date}):`, error.message);
    return null;
  }
}

// 이미지 프롬프트 개선
async function enhanceImagePrompt(basePrompt, accountType, weeklyTheme) {
  const tone = accountType === 'account1' 
    ? '따뜻한 골드·브라운 톤, 감성적인 분위기, 시니어 골퍼 중심'
    : '쿨 블루·그레이 톤, 현대적인 분위기, 젊은 골퍼 중심';

  const prompt = `
다음 이미지 프롬프트를 개선해주세요.

**원본 프롬프트**: ${basePrompt}
**계정 타입**: ${accountType === 'account1' ? '시니어 중심 감성형' : '하이테크 중심 혁신형'}
**톤**: ${tone}
**주별 테마**: ${weeklyTheme}

**개선 요구사항**:
1. 구체적이고 시각적으로 명확한 설명
2. 색상, 조명, 분위기 명시
3. 골프 관련 요소 포함
4. 브랜드 일관성 유지
5. 100자 이내로 간결하게

**개선된 프롬프트**:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`프롬프트 개선 오류:`, error.message);
    return basePrompt; // 원본 반환
  }
}

// 주차 계산
function getWeekNumber(dateStr) {
  const date = new Date(dateStr);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const pastDaysOfYear = (date - firstDay) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
}

// 주별 테마 가져오기
function getWeeklyTheme(weekNumber, weeklyThemes) {
  const weekKey = `week${weekNumber}`;
  return weeklyThemes[weekKey] || weeklyThemes.week1;
}

// 콘텐츠 유형 로테이션
function getContentType(dayIndex, contentTypes) {
  const types = Object.keys(contentTypes);
  const weights = Object.values(contentTypes);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  // 가중치 기반 랜덤 선택
  let random = Math.random() * totalWeight;
  for (let i = 0; i < types.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return types[i];
    }
  }
  return types[0];
}

// 메인 함수
async function main() {
  const month = process.argv[2] || '2025-11';
  const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', `${month}.json`);

  if (!fs.existsSync(calendarPath)) {
    console.error(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarPath}`);
    process.exit(1);
  }

  console.log(`📅 ${month} 캘린더 콘텐츠 생성 시작...\n`);

  const calendar = JSON.parse(fs.readFileSync(calendarPath, 'utf-8'));
  const { strategy, profileContent } = calendar;

  // 허브 콘텐츠 생성 (일별)
  if (!calendar.contents) {
    calendar.contents = [];
  }

  // 11월 11일부터 30일까지 콘텐츠 생성
  for (let day = 11; day <= 30; day++) {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    
    // 이미 생성된 콘텐츠가 있는지 확인
    const existingContent = calendar.contents.find(c => c.date === dateStr);
    if (existingContent && existingContent.created) {
      console.log(`⏭️  ${dateStr}: 이미 생성된 콘텐츠 건너뛰기`);
      continue;
    }

    const weekNumber = getWeekNumber(dateStr);
    const weeklyTheme = getWeeklyTheme(weekNumber, profileContent.account1.weeklyThemes);
    const contentType = getContentType(day - 11, strategy.contentTypes);

    console.log(`📝 ${dateStr} 콘텐츠 생성 중... (주차: ${weekNumber}, 테마: ${weeklyTheme}, 유형: ${contentType})`);

    try {
      const content = await generateHubContent(dateStr, strategy, weeklyTheme, contentType);
      
      if (content) {
        const hubContent = {
          date: dateStr,
          title: content.title,
          summary: content.summary,
          overview: content.overview,
          type: contentType,
          channels: ["blog", "sms", "kakao", "naver_blog"],
          status: "planned",
          created: false
        };

        // 기존 콘텐츠가 있으면 업데이트, 없으면 추가
        const index = calendar.contents.findIndex(c => c.date === dateStr);
        if (index >= 0) {
          calendar.contents[index] = hubContent;
        } else {
          calendar.contents.push(hubContent);
        }

        console.log(`✅ ${dateStr} 콘텐츠 생성 완료: ${content.title.substring(0, 40)}...`);
      }

      // API 호출 제한을 피하기 위해 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ ${dateStr} 콘텐츠 생성 실패:`, error.message);
    }
  }

  // 이미지 프롬프트 개선 (프로필 콘텐츠)
  console.log(`\n🎨 이미지 프롬프트 개선 시작...\n`);

  for (const accountKey of ['account1', 'account2']) {
    const account = profileContent[accountKey];
    console.log(`📸 ${account.name} 프롬프트 개선 중...`);

    for (let i = 0; i < account.dailySchedule.length; i++) {
      const schedule = account.dailySchedule[i];
      const weekNumber = getWeekNumber(schedule.date);
      const weeklyTheme = getWeeklyTheme(weekNumber, account.weeklyThemes);

      // 배경 프롬프트 개선
      if (schedule.background.prompt && !schedule.background.enhanced) {
        console.log(`  - ${schedule.date} 배경 프롬프트 개선 중...`);
        const enhancedPrompt = await enhanceImagePrompt(
          schedule.background.prompt,
          accountKey,
          weeklyTheme
        );
        schedule.background.prompt = enhancedPrompt;
        schedule.background.enhanced = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 프로필 프롬프트 개선
      if (schedule.profile.prompt && !schedule.profile.enhanced) {
        console.log(`  - ${schedule.date} 프로필 프롬프트 개선 중...`);
        const enhancedPrompt = await enhanceImagePrompt(
          schedule.profile.prompt,
          accountKey,
          weeklyTheme
        );
        schedule.profile.prompt = enhancedPrompt;
        schedule.profile.enhanced = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // 피드 이미지 프롬프트 개선
  if (calendar.kakaoFeed && calendar.kakaoFeed.dailySchedule) {
    console.log(`\n📱 피드 이미지 프롬프트 개선 시작...\n`);

    for (const feed of calendar.kakaoFeed.dailySchedule) {
      const weekNumber = getWeekNumber(feed.date);
      const weeklyTheme = getWeeklyTheme(weekNumber, profileContent.account1.weeklyThemes);

      for (const accountKey of ['account1', 'account2']) {
        if (feed[accountKey] && feed[accountKey].imagePrompt && !feed[accountKey].enhanced) {
          console.log(`  - ${feed.date} ${accountKey} 피드 프롬프트 개선 중...`);
          const enhancedPrompt = await enhanceImagePrompt(
            feed[accountKey].imagePrompt,
            accountKey,
            weeklyTheme
          );
          feed[accountKey].imagePrompt = enhancedPrompt;
          feed[accountKey].enhanced = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  // 파일 저장
  fs.writeFileSync(calendarPath, JSON.stringify(calendar, null, 2), 'utf-8');
  console.log(`\n✅ ${month} 캘린더 업데이트 완료!`);
  console.log(`📁 저장 위치: ${calendarPath}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateHubContent, enhanceImagePrompt };

