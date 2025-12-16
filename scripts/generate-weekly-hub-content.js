/**
 * 주간 허브 콘텐츠 자동 생성 스크립트
 * 
 * 요일별 콘텐츠 타입에 맞춰 허브 콘텐츠를 생성합니다.
 * - 월/수/금: 비거리 비법 시리즈
 * - 화: 유용한 정보
 * - 목: 제품/브랜드 콘텐츠
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 요일별 콘텐츠 타입
const CONTENT_TYPES = {
  monday: 'distance_tips_series',    // 비거리 비법 시리즈
  tuesday: 'useful_info',            // 유용한 정보
  wednesday: 'distance_tips_series', // 비거리 비법 시리즈
  thursday: 'product_brand',         // 제품/브랜드
  friday: 'distance_tips_series'     // 비거리 비법 시리즈
};

// 비거리 비법 시리즈 주제 풀
const DISTANCE_TIPS_SERIES = [
  '스윙 속도 향상의 5가지 비법',
  '임팩트 포인트 최적화로 비거리 20m 늘리기',
  '시니어 골퍼를 위한 비거리 향상 특별 가이드',
  '드라이버 헤드 스피드 측정과 개선 방법',
  '스윙 궤적과 비거리의 관계',
  '백스윙에서 비거리를 만드는 비밀',
  '다운스윙 가속화 기술',
  '임팩트 순간의 파워 전달법',
  '클럽 피팅과 비거리 최적화',
  '샤프트 선택이 비거리에 미치는 영향',
  '헤드 로프트와 비거리의 관계',
  '시니어 골퍼의 비거리 향상 사례 연구'
];

// 유용한 정보 주제 풀
const USEFUL_INFO_TOPICS = [
  '골프채 파손 보험 가입 가이드',
  '골프장에서의 건강 관리법',
  '시니어 골퍼를 위한 운동 가이드',
  '골프 부상 예방법',
  '골프 장비 관리와 수명 연장',
  '골프 라운딩 전 준비 운동',
  '골프 라운딩 중 수분 보충 가이드',
  '골프 라운딩 후 회복 운동',
  '골프 관절 보호 운동법',
  '골프 근력 강화 운동법'
];

// 제품/브랜드 콘텐츠 주제 풀
const PRODUCT_BRAND_TOPICS = [
  '시크리트웨폰 블랙 + MUZIIK 베릴 소개',
  '시크리트포스 GOLD 2 + MUZIIK 사파이어 소개',
  'PRO3 + MUZIIK 소개',
  '네이버 스마트 스토어 이용 가이드',
  'MUZIIK 티타늄 샤프트 기술 소개',
  '설문 결과 기반 제품 추천'
];

/**
 * 요일별 콘텐츠 생성
 */
async function generateWeeklyHubContent(startDate, weeks = 1) {
  try {
    console.log(`📅 주간 허브 콘텐츠 생성 시작 (${weeks}주)\n`);

    const results = [];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    let currentDate = new Date(startDate);
    let seriesIndex = 0;
    let usefulInfoIndex = 0;
    let productBrandIndex = 0;

    for (let week = 0; week < weeks; week++) {
      console.log(`\n📆 ${week + 1}주차 콘텐츠 생성...`);

      for (const day of daysOfWeek) {
        // 주말이면 건너뛰기
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const contentType = CONTENT_TYPES[day];
        
        let title = '';
        let summary = '';
        let contentBody = '';

        // 콘텐츠 타입별 주제 선택
        switch (contentType) {
          case 'distance_tips_series':
            if (seriesIndex >= DISTANCE_TIPS_SERIES.length) {
              seriesIndex = 0; // 순환
            }
            title = `[비거리 비법 시리즈 ${seriesIndex + 1}편] ${DISTANCE_TIPS_SERIES[seriesIndex]}`;
            summary = `${DISTANCE_TIPS_SERIES[seriesIndex]}에 대한 실전 가이드입니다. 전문 피터의 노하우를 공개합니다.`;
            contentBody = `# ${title}\n\n## 들어가며\n\n비거리 향상은 모든 골퍼의 꿈입니다. ${DISTANCE_TIPS_SERIES[seriesIndex]}에 대해 자세히 알아보겠습니다.\n\n## 핵심 내용\n\n[golfdistillery.com, golfclubsadvisor.com 소스 기반 상세 내용 작성 예정]\n\n## 마무리\n\n이 가이드를 따라하시면 비거리 향상을 경험하실 수 있습니다. 더 자세한 상담이 필요하시면 시타 체험을 예약해주세요.`;
            seriesIndex++;
            break;

          case 'useful_info':
            if (usefulInfoIndex >= USEFUL_INFO_TOPICS.length) {
              usefulInfoIndex = 0; // 순환
            }
            title = USEFUL_INFO_TOPICS[usefulInfoIndex];
            summary = `${USEFUL_INFO_TOPICS[usefulInfoIndex]}에 대한 실용 가이드입니다.`;
            contentBody = `# ${title}\n\n## 왜 필요한가?\n\n[문제 제시 및 필요성]\n\n## 상세 정보\n\n[구체적인 정보 제공]\n\n## 실전 팁\n\n[실용적인 조언]`;
            usefulInfoIndex++;
            break;

          case 'product_brand':
            if (productBrandIndex >= PRODUCT_BRAND_TOPICS.length) {
              productBrandIndex = 0; // 순환
            }
            title = PRODUCT_BRAND_TOPICS[productBrandIndex];
            summary = `${PRODUCT_BRAND_TOPICS[productBrandIndex]}에 대한 정보입니다.`;
            contentBody = `# ${title}\n\n## 개요\n\n[제품/브랜드 소개]\n\n## 핵심 특징\n\n[주요 내용]\n\n## 자세한 정보\n\n[상세 정보]`;
            productBrandIndex++;
            break;
        }

        // 허브 콘텐츠 생성
        const hubContent = {
          title,
          summary,
          content_body: contentBody,
          content_date: dateStr,
          is_hub_content: true,
          hub_priority: 1,
          auto_derive_channels: ['blog', 'sms', 'naver_blog', 'kakao'],
          channel_status: {
            blog: { status: '미연결', post_id: null, created_at: null },
            sms: { status: '미발행', post_id: null, created_at: null },
            naver_blog: { status: '미발행', post_id: null, created_at: null },
            kakao: { status: '미발행', post_id: null, created_at: null }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdHub, error: hubError } = await supabase
          .from('cc_content_calendar')
          .insert(hubContent)
          .select()
          .single();

        if (hubError) {
          console.error(`❌ ${dateStr} (${day}) 허브 콘텐츠 생성 실패:`, hubError.message);
          continue;
        }

        console.log(`✅ ${dateStr} (${day}): ${title}`);
        results.push({
          date: dateStr,
          day,
          hubId: createdHub.id,
          title
        });

        // 다음 날짜로 이동
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 주말 건너뛰기
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log(`\n🎉 주간 허브 콘텐츠 생성 완료!`);
    console.log(`   총 생성: ${results.length}개\n`);

    return results;

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const startDate = args[0] || new Date().toISOString().split('T')[0];
  const weeks = parseInt(args[1]) || 1;

  generateWeeklyHubContent(startDate, weeks)
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateWeeklyHubContent };

