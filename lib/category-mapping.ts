// 카테고리 매핑 시스템
// 브랜드 전략 콘텐츠 유형과 발행 카테고리 간의 매핑

// 브랜드 전략 콘텐츠 유형 (AI 생성용)
export type BrandStrategyContentType = 
  | "골프 정보" 
  | "튜토리얼" 
  | "고객 후기" 
  | "고객 스토리" 
  | "이벤트";

// 발행 카테고리 (사용자 친화적)
export type PublishCategory = 
  | "골프 정보"
  | "제품 정보"
  | "고객 후기" 
  | "브랜드 스토리"
  | "이벤트"
  | "기술 및 성능";

// 카테고리 매핑 테이블
export const CATEGORY_MAPPING: Record<BrandStrategyContentType, PublishCategory> = {
  "골프 정보": "골프 정보",
  "튜토리얼": "골프 정보", // 튜토리얼은 골프 정보로 통합
  "고객 후기": "고객 후기",
  "고객 스토리": "브랜드 스토리", // 고객 스토리는 브랜드 스토리로
  "이벤트": "이벤트"
};

// 발행 카테고리 목록
export const PUBLISH_CATEGORIES: PublishCategory[] = [
  "골프 정보",
  "제품 정보", 
  "고객 후기",
  "브랜드 스토리",
  "이벤트",
  "기술 및 성능"
];

// 브랜드 전략 콘텐츠 유형 목록
export const BRAND_STRATEGY_CONTENT_TYPES: BrandStrategyContentType[] = [
  "골프 정보",
  "튜토리얼",
  "고객 후기", 
  "고객 스토리",
  "이벤트"
];

// 브랜드 전략 콘텐츠 유형을 발행 카테고리로 변환
export const getPublishCategory = (contentType: BrandStrategyContentType): PublishCategory => {
  return CATEGORY_MAPPING[contentType] || "골프 정보";
};

// 발행 카테고리에서 브랜드 전략 콘텐츠 유형으로 역변환
export const getBrandStrategyContentType = (publishCategory: PublishCategory): BrandStrategyContentType => {
  const reverseMapping = Object.entries(CATEGORY_MAPPING).find(
    ([_, publishCat]) => publishCat === publishCategory
  );
  return reverseMapping ? reverseMapping[0] as BrandStrategyContentType : "골프 정보";
};

// 카테고리 설명
export const CATEGORY_DESCRIPTIONS: Record<PublishCategory, string> = {
  "골프 정보": "골프 기술, 팁, 정보 제공",
  "제품 정보": "제품 소개, 기능, 특징",
  "고객 후기": "고객 사용 후기, 리뷰",
  "브랜드 스토리": "브랜드 스토리, 고객 스토리",
  "이벤트": "프로모션, 이벤트, 특별 할인",
  "기술 및 성능": "기술적 특징, 성능 분석"
};

// 브랜드 전략 콘텐츠 유형 설명
export const BRAND_STRATEGY_DESCRIPTIONS: Record<BrandStrategyContentType, string> = {
  "골프 정보": "순수 정보 제공, 브랜드 언급 최소화",
  "튜토리얼": "교육적 콘텐츠, 자연스러운 브랜드 언급", 
  "고객 후기": "사회적 증명 활용, 브랜드 신뢰도 강화",
  "고객 스토리": "감정적 연결, 강력한 브랜드 스토리텔링",
  "이벤트": "마케팅 중심, 적극적 브랜드 홍보"
};
