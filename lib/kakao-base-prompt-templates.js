/**
 * 카카오 콘텐츠 요일별 Base Prompt 템플릿
 * 
 * 구조:
 * - Account1 (시니어 중심, 골드·브라운 톤): 7요일 × 3템플릿 = 21개
 * - Account2 (하이테크 중심, 블루·그레이 톤): 7요일 × 3템플릿 = 21개
 * - 타입별: background, profile, feed
 * 
 * 사용 방법:
 * - 주차별로 템플릿 인덱스 순환 (1주차: 0, 2주차: 1, 3주차: 2, 4주차: 0)
 * - 요일별 테마에 맞는 템플릿 자동 선택
 */

// Account1 (시니어 중심, 골드·브라운 톤) - 배경 이미지
const ACCOUNT1_BACKGROUND_TEMPLATES = {
  monday: [
    "해돋이 산악 명문코스, 설악산 인근 프리미엄 골프장, 따뜻한 골드 톤, 감성적 분위기",
    "일출과 함께하는 절경 골프코스, 지리산 인근 챔피언십 코스, 따뜻한 조명, 웅장한 풍경",
    "아침 안개 속 프리미엄 골프장, 산악 코스의 웅장함, 골드·브라운 톤, 자연스러운 분위기"
  ],
  tuesday: [
    "MASSGOO 매장 외관, 프리미엄 느낌의 따뜻한 조명, 골드·브라운 톤, 시니어 골퍼를 위한 공간",
    "전문 피팅 매장 외관, 따뜻한 인테리어 조명, 골드 톤, 따뜻한 분위기",
    "프리미엄 골프 매장, 따뜻한 분위기, 골드 톤 조명, 감성적 공간"
  ],
  wednesday: [
    "MASSGOO 매장 인테리어, 피팅 공간, 따뜻한 조명, 골드·브라운 톤, 편안한 분위기",
    "전문 피팅 룸, 따뜻한 조명, 골드 톤, 시니어 골퍼를 위한 공간",
    "프리미엄 매장 내부, 따뜻한 분위기, 골드 톤 조명, 감성적 인테리어"
  ],
  thursday: [
    "시니어 골퍼 스윙 순간, 따뜻한 골드 톤, 감성적 분위기, 자연스러운 동작",
    "골프 스윙 장면, 따뜻한 조명, 골드·브라운 톤, 시니어 골퍼의 우아함",
    "드라이버 스윙 컷, 따뜻한 분위기, 골드 톤, 감성적 순간"
  ],
  friday: [
    "샤프트/헤드 클로즈업, 따뜻한 골드 톤, 전문적 분위기, 프리미엄 느낌",
    "피팅 장비 클로즈업, 따뜻한 조명, 골드·브라운 톤, 전문적 공간",
    "하이테크 피팅 도구, 따뜻한 톤, 골드 톤 조명, 감성적 분위기"
  ],
  saturday: [
    "해변/해안 명문코스, 제주도 해안 코스, 따뜻한 골드 톤, 감성적 분위기",
    "부산 해안 골프장, 따뜻한 조명, 골드·브라운 톤, 자연스러운 풍경",
    "해안 프리미엄 코스, 따뜻한 분위기, 골드 톤, 감성적 장면"
  ],
  sunday: [
    "따뜻한 자연, 노을, 감성적 분위기, 골드·브라운 톤, 편안한 느낌",
    "일몰 골프장, 따뜻한 조명, 골드 톤, 감성적 순간",
    "자연 풍경, 노을, 따뜻한 분위기, 골드 톤, 휴식의 감성"
  ]
};

// Account1 (시니어 중심, 골드·브라운 톤) - 프로필 이미지
const ACCOUNT1_PROFILE_TEMPLATES = {
  monday: [
    "시니어 골퍼 실루엣, 따뜻한 골드 톤, 감성적 분위기, 우아한 포즈",
    "대표님 실루엣, 따뜻한 조명, 골드·브라운 톤, 품격 있는 분위기",
    "시니어 골퍼 인물형, 따뜻한 톤, 감성적 순간"
  ],
  tuesday: [
    "시니어 골퍼 정면, 따뜻한 표정, 골드 톤, 감성적 분위기",
    "골퍼 정면 포즈, 따뜻한 조명, 골드·브라운 톤, 친근한 느낌",
    "시니어 골퍼 얼굴, 따뜻한 분위기, 골드 톤, 감성적 표정"
  ],
  wednesday: [
    "시니어 골퍼 스윙, 따뜻한 골드 톤, 감성적 분위기, 우아한 동작",
    "골프 스윙 순간, 따뜻한 조명, 골드·브라운 톤, 자연스러운 움직임",
    "시니어 스윙 컷, 따뜻한 분위기, 골드 톤, 감성적 순간"
  ],
  thursday: [
    "드라이버 헤드 클로즈업, 골드 톤, 따뜻한 조명, 프리미엄 느낌",
    "골프 드라이버 클로즈업, 골드·브라운 톤, 전문적 분위기",
    "제품 클로즈업, 따뜻한 톤, 골드 톤 조명, 감성적 분위기"
  ],
  friday: [
    "고객 응대 컷, 따뜻한 분위기, 골드 톤, 친근한 느낌",
    "매장 상담 장면, 따뜻한 조명, 골드·브라운 톤, 감성적 공간",
    "고객 서비스 컷, 따뜻한 분위기, 골드 톤, 편안한 느낌"
  ],
  saturday: [
    "MASSGOO 로고 강조형, 골드 톤, 따뜻한 조명, 프리미엄 느낌",
    "브랜드 강조 컷, 골드·브라운 톤, 감성적 분위기",
    "로고 강조형, 따뜻한 톤, 골드 톤 조명, 품격 있는 느낌"
  ],
  sunday: [
    "잔디, 노을, 골프공 등, 따뜻한 골드 톤, 감성적 분위기",
    "자연 감성 컷, 따뜻한 조명, 골드·브라운 톤, 편안한 느낌",
    "감성적 장면, 따뜻한 분위기, 골드 톤, 휴식의 감성"
  ]
};

// Account1 (시니어 중심, 골드·브라운 톤) - 피드 이미지
const ACCOUNT1_FEED_TEMPLATES = {
  monday: [
    "시니어 골퍼 스윙 순간, 따뜻한 골드 톤, 감성적 분위기, 우아한 동작",
    "골프 스윙 장면, 따뜻한 조명, 골드·브라운 톤, 시니어 골퍼의 우아함",
    "드라이버 스윙 컷, 따뜻한 분위기, 골드 톤, 감성적 순간"
  ],
  tuesday: [
    "피팅 상담 장면, 따뜻한 골드 톤, 친근한 분위기, 편안한 느낌",
    "매장 상담 컷, 따뜻한 조명, 골드·브라운 톤, 감성적 공간",
    "고객 서비스 장면, 따뜻한 분위기, 골드 톤, 친근한 느낌"
  ],
  wednesday: [
    "MASSGOO 매장 내부, 따뜻한 골드 톤, 감성적 분위기, 편안한 공간",
    "프리미엄 매장 인테리어, 따뜻한 조명, 골드·브라운 톤, 감성적 공간",
    "전문 피팅 공간, 따뜻한 분위기, 골드 톤, 편안한 느낌"
  ],
  thursday: [
    "젊은 골퍼 스윙, 따뜻한 골드 톤, 활기찬 분위기, 역동적 동작",
    "골프 스윙 장면, 따뜻한 조명, 골드·브라운 톤, 활기찬 느낌",
    "스윙 컷, 따뜻한 분위기, 골드 톤, 역동적 순간"
  ],
  friday: [
    "드라이버 제품 컷, 따뜻한 골드 톤, 프리미엄 느낌, 감성적 분위기",
    "골프 드라이버 클로즈업, 골드·브라운 톤, 전문적 분위기",
    "제품 컷, 따뜻한 톤, 골드 톤 조명, 프리미엄 느낌"
  ],
  saturday: [
    "감성적 골프 장면, 따뜻한 골드 톤, 자연스러운 분위기, 편안한 느낌",
    "자연 감성 컷, 따뜻한 조명, 골드·브라운 톤, 편안한 느낌",
    "감성적 장면, 따뜻한 분위기, 골드 톤, 휴식의 감성"
  ],
  sunday: [
    "시니어 골퍼의 일상, 따뜻한 골드 톤, 감성적 분위기, 편안한 느낌",
    "골프 라이프 컷, 따뜻한 조명, 골드·브라운 톤, 여유로운 느낌",
    "일상 골프 장면, 따뜻한 분위기, 골드 톤, 편안한 순간"
  ]
};

// Account2 (하이테크 중심, 블루·그레이 톤) - 배경 이미지
const ACCOUNT2_BACKGROUND_TEMPLATES = {
  monday: [
    "스코틀랜드 스타일 골프코스, St. Andrews 스타일, 쿨 블루·그레이 톤, 현대적 디자인",
    "클래식 명문코스, Royal Troon 스타일, 쿨 톤, 하이테크 감성",
    "유럽 스타일 프리미엄 코스, 쿨 블루·그레이 톤, 현대적 분위기"
  ],
  tuesday: [
    "MASSGOO 매장 외관, 현대적 하이테크 외관, 쿨 블루·그레이 톤, 전문적 분위기",
    "하이테크 매장, 현대적 디자인, 쿨 톤, 혁신적 공간",
    "프리미엄 매장 외관, 쿨 블루·그레이 톤, 현대적 분위기"
  ],
  wednesday: [
    "하이테크 피팅 공간, 전문적 분위기, 쿨 블루·그레이 톤, 혁신적 인테리어",
    "전문 피팅 룸, 현대적 디자인, 쿨 톤, 하이테크 감성",
    "프리미엄 피팅 공간, 쿨 블루·그레이 톤, 전문적 분위기"
  ],
  thursday: [
    "젊은 골퍼 스윙 순간, 쿨 블루·그레이 톤, 혁신적 분위기, 역동적 동작",
    "골프 스윙 장면, 현대적 조명, 쿨 톤, 젊은 골퍼의 역동성",
    "드라이버 스윙 컷, 쿨 블루·그레이 톤, 혁신적 순간"
  ],
  friday: [
    "샤프트/헤드 클로즈업, 쿨 블루·그레이 톤, 전문적 분위기, 하이테크 느낌",
    "피팅 장비 클로즈업, 현대적 조명, 쿨 톤, 혁신적 공간",
    "하이테크 피팅 도구, 쿨 블루·그레이 톤, 전문적 분위기"
  ],
  saturday: [
    "유럽 명문코스, 스페인 프리미엄 코스, 쿨 블루·그레이 톤, 현대적 디자인",
    "포르투갈 프리미엄 코스, 쿨 톤, 하이테크 감성",
    "유럽 스타일 프리미엄 코스, 쿨 블루·그레이 톤, 혁신적 분위기"
  ],
  sunday: [
    "감성 조명, 기술적 감성, 쿨 블루·그레이 톤, 현대적 분위기",
    "하이테크 감성 컷, 쿨 톤, 혁신적 순간",
    "기술적 감성, 쿨 블루·그레이 톤, 현대적 분위기"
  ]
};

// Account2 (하이테크 중심, 블루·그레이 톤) - 프로필 이미지
const ACCOUNT2_PROFILE_TEMPLATES = {
  monday: [
    "젊은 골퍼 스윙 순간, 쿨 블루·그레이 톤, 혁신적 분위기, 역동적 동작",
    "골프 스윙 장면, 현대적 조명, 쿨 톤, 젊은 골퍼의 역동성",
    "젊은 골퍼 스윙 컷, 쿨 블루·그레이 톤, 혁신적 순간"
  ],
  tuesday: [
    "젊은 골퍼 정면, 전문적 표정, 쿨 블루·그레이 톤, 현대적 분위기",
    "골퍼 정면 포즈, 현대적 조명, 쿨 톤, 혁신적 느낌",
    "젊은 골퍼 얼굴, 쿨 블루·그레이 톤, 전문적 표정"
  ],
  wednesday: [
    "젊은 골퍼 스윙, 쿨 블루·그레이 톤, 혁신적 분위기, 역동적 동작",
    "골프 스윙 순간, 현대적 조명, 쿨 톤, 젊은 골퍼의 역동성",
    "젊은 스윙 컷, 쿨 블루·그레이 톤, 혁신적 순간"
  ],
  thursday: [
    "드라이버 헤드 클로즈업, 쿨 블루·그레이 톤, 현대적 조명, 하이테크 느낌",
    "골프 드라이버 클로즈업, 쿨 톤, 전문적 분위기",
    "제품 클로즈업, 쿨 블루·그레이 톤, 혁신적 분위기"
  ],
  friday: [
    "피팅 상담 컷, 전문적 분위기, 쿨 블루·그레이 톤, 하이테크 느낌",
    "매장 상담 장면, 현대적 조명, 쿨 톤, 혁신적 공간",
    "피팅 서비스 컷, 쿨 블루·그레이 톤, 전문적 느낌"
  ],
  saturday: [
    "MASSGOO 로고 강조형, 쿨 블루·그레이 톤, 현대적 조명, 하이테크 느낌",
    "브랜드 강조 컷, 쿨 톤, 혁신적 분위기",
    "로고 강조형, 쿨 블루·그레이 톤, 전문적 느낌"
  ],
  sunday: [
    "기술적 감성 컷, 쿨 블루·그레이 톤, 현대적 분위기, 혁신적 순간",
    "하이테크 감성 컷, 쿨 톤, 전문적 느낌",
    "기술적 장면, 쿨 블루·그레이 톤, 혁신적 분위기"
  ]
};

// Account2 (하이테크 중심, 블루·그레이 톤) - 피드 이미지
const ACCOUNT2_FEED_TEMPLATES = {
  monday: [
    "시니어 골퍼 스윙, 쿨 블루·그레이 톤, 전문적 분위기, 정확한 동작",
    "골프 스윙 장면, 현대적 조명, 쿨 톤, 정밀한 기술",
    "스윙 컷, 쿨 블루·그레이 톤, 전문적 순간"
  ],
  tuesday: [
    "하이테크 피팅 상담, 쿨 블루·그레이 톤, 전문적 분위기, 혁신적 공간",
    "피팅 상담 장면, 현대적 조명, 쿨 톤, 하이테크 감성",
    "전문 피팅 컷, 쿨 블루·그레이 톤, 혁신적 느낌"
  ],
  wednesday: [
    "하이테크 매장, 쿨 블루·그레이 톤, 현대적 분위기, 전문적 공간",
    "프리미엄 매장 인테리어, 현대적 조명, 쿨 톤, 하이테크 감성",
    "전문 매장 공간, 쿨 블루·그레이 톤, 혁신적 분위기"
  ],
  thursday: [
    "젊은 골퍼 스윙, 쿨 블루·그레이 톤, 혁신적 분위기, 역동적 동작",
    "골프 스윙 장면, 현대적 조명, 쿨 톤, 젊은 골퍼의 역동성",
    "스윙 컷, 쿨 블루·그레이 톤, 혁신적 순간"
  ],
  friday: [
    "드라이버 제품 컷, 쿨 블루·그레이 톤, 하이테크 느낌, 전문적 분위기",
    "골프 드라이버 클로즈업, 쿨 톤, 혁신적 분위기",
    "제품 컷, 쿨 블루·그레이 톤, 하이테크 느낌"
  ],
  saturday: [
    "기술적 감성 컷, 쿨 블루·그레이 톤, 현대적 분위기, 혁신적 순간",
    "하이테크 감성 컷, 쿨 톤, 전문적 느낌",
    "기술적 장면, 쿨 블루·그레이 톤, 혁신적 분위기"
  ],
  sunday: [
    "젊은 골퍼의 일상, 쿨 블루·그레이 톤, 현대적 분위기, 혁신적 느낌",
    "골프 라이프 컷, 현대적 조명, 쿨 톤, 전문적 느낌",
    "일상 골프 장면, 쿨 블루·그레이 톤, 혁신적 순간"
  ]
};

// 통합 템플릿 객체
const ACCOUNT1_TEMPLATES = {
  background: ACCOUNT1_BACKGROUND_TEMPLATES,
  profile: ACCOUNT1_PROFILE_TEMPLATES,
  feed: ACCOUNT1_FEED_TEMPLATES
};

const ACCOUNT2_TEMPLATES = {
  background: ACCOUNT2_BACKGROUND_TEMPLATES,
  profile: ACCOUNT2_PROFILE_TEMPLATES,
  feed: ACCOUNT2_FEED_TEMPLATES
};

/**
 * 요일별 템플릿 가져오기
 * @param {string} accountType - 'account1' | 'account2'
 * @param {string} type - 'background' | 'profile' | 'feed'
 * @param {string} dayOfWeek - 'monday' | 'tuesday' | ... | 'sunday'
 * @returns {string[]} 템플릿 배열
 */
function getTemplates(accountType, type, dayOfWeek) {
  const templates = accountType === 'account1' ? ACCOUNT1_TEMPLATES : ACCOUNT2_TEMPLATES;
  return templates[type]?.[dayOfWeek] || [];
}

/**
 * 주차별 템플릿 인덱스 계산
 * @param {string} date - YYYY-MM-DD 형식의 날짜
 * @returns {number} 템플릿 인덱스 (0, 1, 2)
 */
function getTemplateIndex(date) {
  const dayOfMonth = new Date(date).getDate();
  const weekNumber = Math.ceil(dayOfMonth / 7);
  return (weekNumber - 1) % 3; // 0, 1, 2 순환
}

/**
 * Base Prompt 생성
 * @param {string} date - YYYY-MM-DD 형식의 날짜
 * @param {string} accountType - 'account1' | 'account2'
 * @param {string} type - 'background' | 'profile' | 'feed'
 * @param {string} weeklyTheme - 주차별 테마 (선택적)
 * @returns {string} 생성된 basePrompt
 */
function generateBasePrompt(date, accountType, type, weeklyTheme = null) {
  // 요일 계산
  const dateObj = new Date(date);
  const dayOfWeekIndex = dateObj.getDay(); // 0=일요일, 6=토요일
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[dayOfWeekIndex];

  // 템플릿 가져오기
  const templates = getTemplates(accountType, type, dayOfWeek);
  if (templates.length === 0) {
    // 기본값 반환
    return accountType === 'account1' 
      ? '절경 골프장 배경, 따뜻한 골드 톤'
      : '하이테크 매장, 쿨 블루·그레이 톤';
  }

  // 주차별 템플릿 인덱스 계산
  const templateIndex = getTemplateIndex(date);
  const basePrompt = templates[templateIndex] || templates[0];

  // 주차별 테마 반영 (선택적)
  if (weeklyTheme) {
    return `${basePrompt}, ${weeklyTheme} 테마 반영`;
  }

  return basePrompt;
}

module.exports = {
  ACCOUNT1_TEMPLATES,
  ACCOUNT2_TEMPLATES,
  ACCOUNT1_BACKGROUND_TEMPLATES,
  ACCOUNT1_PROFILE_TEMPLATES,
  ACCOUNT1_FEED_TEMPLATES,
  ACCOUNT2_BACKGROUND_TEMPLATES,
  ACCOUNT2_PROFILE_TEMPLATES,
  ACCOUNT2_FEED_TEMPLATES,
  getTemplates,
  getTemplateIndex,
  generateBasePrompt
};
