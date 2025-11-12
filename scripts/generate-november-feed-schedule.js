/**
 * 11월 카카오 피드 스케줄 자동 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-november-feed-schedule.js
 */

const fs = require('fs');
const path = require('path');

const CALENDAR_DIR = path.join(__dirname, '../docs/content-calendar');
const calendarFile = path.join(CALENDAR_DIR, '2025-11.json');
const feedScheduleFile = path.join(CALENDAR_DIR, 'kakao-feed-schedule.json');

// 카테고리 로테이션 (4일 주기)
const categories = [
  "젊은 골퍼의 스윙",
  "매장의 모습",
  "피팅 상담의 모습",
  "시니어 골퍼의 스윙"
];

// 11월 날짜의 일년 중 몇 번째 날인지 계산
function getDayOfYear(year, month, day) {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// 카테고리별 이미지 프롬프트 풀
function getImagePrompt(category, index) {
  const prompts = {
    "젊은 골퍼의 스윙": [
      "젊은 골퍼가 골프장에서 드라이버 스윙하는 모습, 역광, 감성적인 톤, 전문 사진",
      "30대 골퍼가 완벽한 폼으로 드라이버 스윙, 골프장 배경, 자연광",
      "젊은 골퍼의 역동적인 스윙 순간, 고속 셔터, 역광 효과",
      "젊은 골퍼가 드라이버로 멀리 보내는 순간, 자신감 있는 표정, 골프장 배경"
    ],
    "매장의 모습": [
      "MASSGOO 매장 내부, 고급스러운 골프 장비 전시, 따뜻한 조명, 현대적인 인테리어",
      "수원 갤러리아 광교 MASSGOO 매장, 골프 드라이버 전시대, 전문적인 분위기",
      "MASSGOO 매장 카운터, 골프 장비 정렬, 고객 맞이하는 따뜻한 공간",
      "MASSGOO 매장 전경, 깔끔한 인테리어, 골프 드라이버 전시, 고급스러운 분위기"
    ],
    "피팅 상담의 모습": [
      "전문 피터가 고객에게 드라이버 피팅 상담하는 모습, 친근한 분위기, 신뢰감",
      "피팅 룸에서 골퍼와 피터가 함께 드라이버를 테스트하는 모습, 전문적이고 따뜻한 분위기",
      "시니어 골퍼가 피터와 함께 드라이버를 선택하는 모습, 만족스러운 표정",
      "피팅 상담 중인 모습, 골퍼와 피터가 함께 드라이버를 검토하는 따뜻한 장면"
    ],
    "시니어 골퍼의 스윙": [
      "60대 골퍼가 자신감 있게 드라이버 스윙하는 모습, 활기찬 표정, 골프장 배경",
      "시니어 골퍼의 우아한 스윙, 경험과 기술이 느껴지는 포즈, 자연스러운 표정",
      "은퇴 후 골프에 집중하는 시니어 골퍼, 만족스러운 스윙, 따뜻한 분위기",
      "시니어 골퍼가 완벽한 폼으로 드라이버 스윙, 자신감 있는 자세, 골프장 배경"
    ]
  };
  
  const categoryPrompts = prompts[category] || [];
  return categoryPrompts[index % categoryPrompts.length];
}

// 카테고리별 캡션 풀
function getCaption(category, index) {
  const captions = {
    "젊은 골퍼의 스윙": [
      "오늘도 멋진 스윙으로 시작하세요",
      "완벽한 스윙을 위한 첫걸음",
      "비거리 향상의 시작",
      "당신의 골프 인생을 바꿔보세요"
    ],
    "매장의 모습": [
      "수원 갤러리아 광교에서 만나요",
      "전문 피팅을 경험해보세요",
      "당신만의 드라이버를 찾아보세요",
      "MASSGOO에서 최적의 드라이버를 만나보세요"
    ],
    "피팅 상담의 모습": [
      "맞춤 피팅으로 비거리를 늘려보세요",
      "전문가와 함께 최적의 드라이버를 찾아보세요",
      "개인 맞춤 피팅으로 골프를 바꿔보세요",
      "당신만의 드라이버를 찾는 여정을 시작하세요"
    ],
    "시니어 골퍼의 스윙": [
      "나이에 상관없이 비거리 향상이 가능합니다",
      "시니어 골퍼도 비거리 20m 증가 가능",
      "은퇴 후 골프 인생을 바꿔보세요",
      "60대도 가능한 비거리 향상, 지금 시작하세요"
    ]
  };
  
  const categoryCaptions = captions[category] || [];
  return categoryCaptions[index % categoryCaptions.length];
}

// 11월 날짜별 피드 스케줄 생성 (11일~30일)
function generateNovemberFeedSchedule() {
  const dailySchedule = [];
  let promptIndex1 = 0;
  let promptIndex2 = 0;
  let captionIndex1 = 0;
  let captionIndex2 = 0;
  
  for (let day = 11; day <= 30; day++) {
    const date = `2025-11-${String(day).padStart(2, '0')}`;
    const dayOfYear = getDayOfYear(2025, 11, day);
    
    // 계정 1: 4일 주기 로테이션
    const category1 = categories[(dayOfYear - 1) % 4];
    
    // 계정 2: 계정 1의 다음 카테고리 (다양성 확보)
    const category2 = categories[dayOfYear % 4];
    
    dailySchedule.push({
      date: date,
      account1: {
        imageCategory: category1,
        imagePrompt: getImagePrompt(category1, promptIndex1),
        caption: getCaption(category1, captionIndex1),
        status: "planned",
        created: false,
        createdAt: null
      },
      account2: {
        imageCategory: category2,
        imagePrompt: getImagePrompt(category2, promptIndex2),
        caption: getCaption(category2, captionIndex2),
        status: "planned",
        created: false,
        createdAt: null
      }
    });
    
    // 인덱스 증가 (다양한 프롬프트/캡션 사용)
    promptIndex1++;
    promptIndex2++;
    captionIndex1++;
    captionIndex2++;
  }
  
  return dailySchedule;
}

// 캘린더 파일 업데이트
function updateCalendarWithFeed() {
  if (!fs.existsSync(calendarFile)) {
    console.error(`❌ 캘린더 파일을 찾을 수 없습니다: ${calendarFile}`);
    console.log('💡 먼저 2025-11.json 파일을 생성해주세요.');
    return false;
  }
  
  try {
    const calendar = JSON.parse(fs.readFileSync(calendarFile, 'utf-8'));
    
    // 피드 스케줄 생성
    const feedSchedule = generateNovemberFeedSchedule();
    
    // 캘린더에 피드 스케줄 추가
    if (!calendar.kakaoFeed) {
      calendar.kakaoFeed = {
        accounts: [
          {
            name: "카카오 채널 피드 1",
            account: "010-6669-9000",
            type: "브랜딩 피드",
            frequency: "매일"
          },
          {
            name: "카카오 채널 피드 2",
            account: "010-5704-0013",
            type: "브랜딩 피드",
            frequency: "매일"
          }
        ],
        dailySchedule: []
      };
    }
    
    calendar.kakaoFeed.dailySchedule = feedSchedule;
    
    // 파일 저장
    fs.writeFileSync(calendarFile, JSON.stringify(calendar, null, 2), 'utf-8');
    
    console.log('✅ 11월 피드 스케줄 생성 완료!');
    console.log(`📅 총 ${feedSchedule.length}일의 피드 계획이 생성되었습니다.`);
    console.log(`📱 계정 1: ${calendar.kakaoFeed.accounts[0].account}`);
    console.log(`📱 계정 2: ${calendar.kakaoFeed.accounts[1].account}`);
    
    return true;
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  }
}

// 메인 실행
if (require.main === module) {
  console.log('🚀 11월 카카오 피드 스케줄 생성 시작...\n');
  const success = updateCalendarWithFeed();
  
  if (success) {
    console.log('\n✅ 작업 완료!');
    console.log('📝 다음 단계: scripts/auto-create-hub-content.js 실행하여 자동 생성 시작');
  } else {
    console.log('\n❌ 작업 실패');
    process.exit(1);
  }
}

module.exports = { generateNovemberFeedSchedule, updateCalendarWithFeed };



