/**
 * 제품 합성용 제품 데이터베이스
 * AI 이미지 생성 시 마쓰구 드라이버 제품을 합성하기 위한 제품 정보
 */

export interface ProductForComposition {
  id: string;
  name: string;
  displayName: string;
  category: string;
  imageUrl: string; // 제품 단독 이미지 URL (합성에 사용)
  slug: string;
  badge?: string;
  description?: string;
  price?: string;
  features?: string[];
}

/**
 * 7개 마쓰구 드라이버 제품 목록
 * AI 이미지 합성 시 사용할 제품 정보
 */
export const PRODUCTS_FOR_COMPOSITION: ProductForComposition[] = [
  {
    id: 'gold2-sapphire',
    name: '시크리트포스 골드 2 MUZIIK',
    displayName: '시크리트포스 골드 2 MUZIIK',
    category: 'MUZIIK 협업 제품',
    imageUrl: '/main/products/gold2-sapphire/secret-force-gold-2-sole-500.webp',
    slug: 'gold2-sapphire',
    badge: 'BEST',
    description: '오토플렉스 티타늄 샤프트, ONE-FLEX A200·A215',
    price: '2,200,000원',
    features: ['오토플렉스 티타늄 샤프트', 'ONE-FLEX A200·A215', '무제한 2년 헤드 보증'],
  },
  {
    id: 'black-beryl',
    name: '시크리트웨폰 블랙 MUZIIK',
    displayName: '시크리트웨폰 블랙 MUZIIK',
    category: 'MUZIIK 협업 제품',
    imageUrl: '/main/products/black-beryl/secret-weapon-black-sole-500.webp',
    slug: 'black-beryl',
    badge: 'LIMITED',
    description: '풀 티타늄 4X 샤프트, 40g대, 최대 X 플렉스',
    price: '2,200,000원',
    features: ['풀 티타늄 4X 샤프트', '40g대, 최대 X 플렉스', '2년 헤드 보증(최대 3회)'],
  },
  {
    id: 'gold2',
    name: '시크리트포스 골드 2',
    displayName: '시크리트포스 골드 2',
    category: '프리미엄 드라이버',
    imageUrl: '/main/products/gold2/secret-force-gold-2-sole-500.webp',
    slug: 'gold2',
    badge: 'BEST',
    description: 'DAT55G+ Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
    price: '1,700,000원',
    features: ['DAT55G+ Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
  },
  {
    id: 'pro3',
    name: '시크리트포스 PRO 3',
    displayName: '시크리트포스 PRO 3',
    category: '고반발 드라이버',
    imageUrl: '/main/products/pro3/secret-force-pro-3-sole-500.webp',
    slug: 'secret-force-pro-3',
    description: 'DAT55G 티타늄, 2.3mm 페이스, COR 0.86',
    price: '1,150,000원',
    features: ['DAT55G 티타늄', '2.3mm 페이스', 'COR 0.86'],
  },
  {
    id: 'v3',
    name: '시크리트포스 V3',
    displayName: '시크리트포스 V3',
    category: '투어 드라이버',
    imageUrl: '/main/products/v3/secret-force-v3-sole-350-bg.webp',
    slug: 'secret-force-v3',
    description: 'DAT55G 티타늄, 2.4mm 페이스, COR 0.85',
    price: '950,000원',
    features: ['DAT55G 티타늄', '2.4mm 페이스', 'COR 0.85'],
  },
  {
    id: 'weapon-black',
    name: '시크리트웨폰 블랙',
    displayName: '시크리트웨폰 블랙',
    category: '프리미엄 리미티드',
    imageUrl: '/main/products/black-weapon/secret-weapon-black-sole-500.webp',
    slug: 'secret-weapon-black',
    badge: 'LIMITED',
    description: 'SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
    price: '1,700,000원',
    features: ['SP700 Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
  },
  {
    id: 'weapon-gold-4-1',
    name: '시크리트웨폰 골드 4.1',
    displayName: '시크리트웨폰 골드 4.1',
    category: '프리미엄 드라이버',
    imageUrl: '/main/products/gold-weapon4/secret-weapon-gold-4-1-sole-500.webp',
    slug: 'secret-weapon-gold-4-1',
    description: 'SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
    price: '1,700,000원',
    features: ['SP700 Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
  },
];

/**
 * 제품 ID로 제품 정보 조회
 * @param productId 제품 ID
 * @returns 제품 정보 또는 undefined
 */
export function getProductById(productId: string): ProductForComposition | undefined {
  return PRODUCTS_FOR_COMPOSITION.find((product) => product.id === productId);
}

/**
 * 모든 제품 목록 조회
 * @returns 제품 목록 배열
 */
export function getAllProducts(): ProductForComposition[] {
  return PRODUCTS_FOR_COMPOSITION;
}

/**
 * 제품 ID 목록 조회
 * @returns 제품 ID 배열
 */
export function getProductIds(): string[] {
  return PRODUCTS_FOR_COMPOSITION.map((product) => product.id);
}

/**
 * 제품이 존재하는지 확인
 * @param productId 제품 ID
 * @returns 존재 여부
 */
export function productExists(productId: string): boolean {
  return PRODUCTS_FOR_COMPOSITION.some((product) => product.id === productId);
}

/**
 * 제품 합성용 프롬프트 생성
 * @param product 제품 정보
 * @returns 합성 프롬프트
 */
export function generateCompositionPrompt(product: ProductForComposition): string {
  return `Replace the golf driver in the person's hands with the ${product.name}, maintaining natural lighting, shadows, and seamless integration. The driver should look realistic and naturally held, with proper perspective and proportions matching the person's grip.`;
}

/**
 * 제품 이미지 URL을 절대 URL로 변환
 * @param imageUrl 상대 경로 또는 절대 URL
 * @param baseUrl 기본 URL (선택사항)
 * @returns 절대 URL
 */
export function getAbsoluteImageUrl(imageUrl: string, baseUrl?: string): string {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${imageUrl}`;
}

