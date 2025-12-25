// 관리자 메뉴 구조 정의
export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  description?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  menus: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: 'hub',
    name: '허브 시스템',
    icon: '🎯',
    color: 'purple',
    description: '콘텐츠 분기 및 통합 관리',
    menus: [
      { id: 'hub-main', name: '허브 시스템', icon: '🎯', path: '/admin/content-calendar-hub', description: '콘텐츠 캘린더 및 통합 관리' },
      { id: 'multichannel', name: '멀티채널 대시보드', icon: '📊', path: '/admin/multichannel-dashboard', description: '모든 채널 통합 대시보드' },
      { id: 'blog', name: '블로그 관리', icon: '📝', path: '/admin/blog', description: '블로그 게시물 작성 및 관리' },
      { id: 'naver-blog', name: '네이버 블로그', icon: '📝', path: '/admin/naver-blog-advanced', description: '네이버 블로그 게시물 관리' },
      { id: 'funnel', name: '퍼널 관리', icon: '🔄', path: '/admin/funnel-editor', description: '마케팅 퍼널 관리' },
      { id: 'category', name: '카테고리 관리', icon: '📂', path: '/admin/category-management', description: '콘텐츠 카테고리 관리' },
    ]
  },
  {
    id: 'gallery',
    name: '갤러리 관리',
    icon: '🖼️',
    color: 'blue',
    description: '이미지 및 제품 합성 관리',
    menus: [
      { id: 'gallery-main', name: '갤러리 관리', icon: '🖼️', path: '/admin/gallery', description: '이미지 갤러리 관리' },
      { id: 'ai-image', name: 'AI 이미지 생성', icon: '🎨', path: '/admin/ai-image-generator', description: 'AI를 이용한 이미지 생성' },
      { id: 'product-composition', name: '제품 합성 관리', icon: '🛍️', path: '/admin/product-composition', description: '제품 이미지 합성 관리' },
    ]
  },
  {
    id: 'customer',
    name: '고객 관리',
    icon: '👥',
    color: 'indigo',
    description: '고객 및 예약 관리',
    menus: [
      { id: 'customers', name: '고객', icon: '👥', path: '/admin/customers', description: '고객 정보 관리' },
      { id: 'surveys', name: '설문 관리', icon: '📋', path: '/admin/surveys', description: '고객 설문 조사 관리' },
      { id: 'booking', name: '시타예약', icon: '📅', path: '/admin/booking', description: '시타 예약 관리' },
    ]
  },
  {
    id: 'daily-content',
    name: '데일리 콘텐츠',
    icon: '📱',
    color: 'pink',
    description: '소셜 미디어 및 메시지 콘텐츠 관리',
    menus: [
      { id: 'sms', name: 'SMS 관리', icon: '📱', path: '/admin/sms-list', description: 'SMS 발송 관리' },
      { id: 'kakao', name: '카카오 채널', icon: '💬', path: '/admin/kakao', description: '카카오 채널 관리' },
      { id: 'kakao-content', name: '카톡 콘텐츠', icon: '💬', path: '/admin/kakao-content', description: '카카오톡 콘텐츠 관리' },
      { id: 'instagram', name: '인스타그램', icon: '📷', path: '/admin/instagram', description: '인스타그램 콘텐츠 관리' },
      { id: 'shorts', name: '쇼츠', icon: '🎬', path: '/admin/shorts', description: '쇼츠 콘텐츠 관리' },
      { id: 'facebook', name: '페이스북', icon: '👤', path: '/admin/facebook', description: '페이스북 콘텐츠 관리' },
      { id: 'threads', name: '쓰레드', icon: '🧵', path: '/admin/threads', description: '쓰레드 콘텐츠 관리' },
      { id: 'twitter', name: 'X (트위터)', icon: '🐦', path: '/admin/twitter', description: 'X(트위터) 콘텐츠 관리' },
      { id: 'tiktok', name: '틱톡', icon: '🎵', path: '/admin/tiktok', description: '틱톡 콘텐츠 관리' },
    ]
  },
  {
    id: 'system',
    name: '시스템',
    icon: '⚙️',
    color: 'gray',
    description: '시스템 설정, 분석 및 AI 관리',
    menus: [
      { id: 'dashboard', name: '대시보드', icon: '📊', path: '/admin/dashboard', description: '통합 대시보드' },
      { id: 'analytics', name: '분석', icon: '📊', path: '/admin/analytics', description: '데이터 분석 및 통계' },
      { id: 'marketing', name: '마케팅', icon: '📈', path: '/admin/marketing', description: '마케팅 캠페인 관리' },
      { id: 'google-ads', name: '구글 광고', icon: '🎯', path: '/admin/google-ads', description: '구글 광고 관리' },
      { id: 'ai-dashboard', name: 'AI 관리', icon: '🤖', path: '/admin/ai-dashboard', description: 'AI 시스템 관리' },
      { id: 'team', name: '계정 관리', icon: '👨‍💼', path: '/admin/team', description: '관리자 계정 관리' },
    ]
  },
  {
    id: 'inventory',
    name: '재고 & 물류',
    icon: '📦',
    color: 'orange',
    description: '재고 및 공급업체 관리',
    menus: [
      { id: 'products', name: '굿즈 / 사은품', icon: '🎁', path: '/admin/products', description: '굿즈 및 사은품 관리' },
      { id: 'inventory', name: '재고 대시보드', icon: '📦', path: '/admin/inventory/dashboard', description: '재고 현황 대시보드' },
      { id: 'suppliers', name: '공급업체', icon: '🏢', path: '/admin/suppliers', description: '공급업체 관리' },
    ]
  },
  {
    id: 'finance',
    name: '재무',
    icon: '💰',
    color: 'green',
    description: '경비 및 지출 관리',
    menus: [
      { id: 'expenses', name: '경비 / 지출', icon: '💰', path: '/admin/finance/expenses', description: '경비 및 지출 관리' },
    ]
  },
];

// 색상 클래스 매핑
export const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
};

