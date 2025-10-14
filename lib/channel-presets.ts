// 채널별 이미지 사이즈 프리셋 정의
// - 콘텐츠 캘린더의 멀티채널 사이즈 요구사항을 반영한 기본값

export type SizePreset = {
  key: string;
  width: number;
  height: number; // 0 이면 가변 높이(세로 자유)
  fit?: 'cover' | 'contain' | 'inside' | 'outside';
};

export const CHANNEL_PRESETS: Record<string, { label: string; sizes: SizePreset[] }> = {
  blog: {
    label: '블로그',
    sizes: [
      { key: 'featured', width: 1600, height: 900 }, // 대표 이미지
      { key: 'content', width: 1200, height: 0 }, // 본문 내 가변 폭
      { key: 'thumb', width: 400, height: 225 }, // 목록 썸네일
    ],
  },
  naver: {
    label: '네이버(포스트/블로그)',
    sizes: [
      { key: 'feed', width: 1200, height: 675 },
      { key: 'square', width: 1200, height: 1200 },
    ],
  },
  kakao: {
    label: '카카오(친구톡/채널)',
    sizes: [
      { key: 'square', width: 1080, height: 1080 },
      { key: 'story', width: 1080, height: 1920 },
      { key: 'wide', width: 1200, height: 628 },
    ],
  },
  instagram: {
    label: '인스타그램',
    sizes: [
      { key: 'square', width: 1080, height: 1080 },
      { key: 'portrait', width: 1080, height: 1350 },
      { key: 'story', width: 1080, height: 1920 },
      { key: 'land', width: 1200, height: 628 },
    ],
  },
  facebook: {
    label: '페이스북',
    sizes: [
      { key: 'feed', width: 1200, height: 628 },
      { key: 'square', width: 1200, height: 1200 },
      { key: 'cover', width: 820, height: 312 },
    ],
  },
  x: {
    label: 'X(트위터)',
    sizes: [
      { key: 'card', width: 1200, height: 675 },
      { key: 'square', width: 1200, height: 1200 },
    ],
  },
  youtube: {
    label: '유튜브',
    sizes: [
      { key: 'thumb', width: 1280, height: 720 },
      { key: 'cover', width: 2560, height: 1440 },
    ],
  },
  display: {
    label: '디스플레이 광고',
    sizes: [
      { key: '300x250', width: 300, height: 250 },
      { key: '336x280', width: 336, height: 280 },
      { key: '728x90', width: 728, height: 90 },
      { key: '300x600', width: 300, height: 600 },
      { key: '320x100', width: 320, height: 100 },
      { key: '970x250', width: 970, height: 250 },
      { key: '1600x900', width: 1600, height: 900 },
    ],
  },
  etc: {
    label: '기타',
    sizes: [
      { key: 'square', width: 1024, height: 1024 },
      { key: 'wide', width: 1600, height: 900 },
    ],
  },
};

export type SourceType = 'scraped' | 'uploaded' | 'generated' | 'derived';


