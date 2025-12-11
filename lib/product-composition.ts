/**
 * 제품 합성용 제품 데이터베이스
 * AI 이미지 생성 시 마쓰구 드라이버 제품을 합성하기 위한 제품 정보
 */

export type ProductCategory = 'driver' | 'hat' | 'apparel' | 'accessory';
export type CompositionTarget = 'hands' | 'head' | 'body' | 'accessory';
export type HatType = 'bucket' | 'baseball' | 'visor';
export type DriverPart = 'crown' | 'sole' | 'face' | 'full';

export interface ProductForComposition {
  id: string;
  name: string;
  displayName: string;
  category: ProductCategory; // 'driver' | 'hat' | 'apparel' | 'accessory'
  compositionTarget: CompositionTarget; // 'hands' | 'head' | 'body' | 'accessory'
  imageUrl: string; // 제품 단독 이미지 URL (합성에 사용)
  referenceImages?: string[]; // 다양한 각도의 참조 이미지 배열 (뱃지/문구 없는 순수 헤드)
  driverParts?: {
    crown?: string[];
    sole?: string[];
    face?: string[];
  };
  hatType?: HatType; // 'bucket' | 'baseball' | 'visor'
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
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/gold2-sapphire/secret-force-gold-2-sole-500.webp',
    referenceImages: [
      '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_11.webp',
      '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_12.webp',
      '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_13.webp',
      '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_14_b.webp',
      '/main/products/gold2-sapphire/massgoo_sf_gold2_muz_15.webp',
    ],
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
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/black-beryl/secret-weapon-black-sole-500.webp',
    referenceImages: [
      '/main/products/black-beryl/massgoo_sw_black_muz_11.webp',
      '/main/products/black-beryl/massgoo_sw_black_muz_12.webp',
      '/main/products/black-beryl/massgoo_sw_black_muz_13.webp',
      '/main/products/black-beryl/massgoo_sw_black_muz_14_b.webp',
      '/main/products/black-beryl/massgoo_sw_black_muz_15.webp',
      '/main/products/black-beryl/massgoo_sw_black_muz_18.webp',
    ],
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
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/gold2/secret-force-gold-2-sole-500.webp',
    referenceImages: [
      '/main/products/gold2/gold2_01.jpg',
      '/main/products/gold2/gold2_02.jpg',
      '/main/products/gold2/gold2_03.jpg',
      '/main/products/gold2/gold2_04.jpg',
      '/main/products/gold2/gold2_05.jpg',
      '/main/products/gold2/gold2_06.jpg',
      '/main/products/gold2/gold2_07.jpg',
    ],
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
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/pro3/secret-force-pro-3-sole-500.webp',
    referenceImages: [
      '/main/products/pro3/secret-force-pro-3-gallery-01.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-02.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-03.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-04.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-05.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-06.webp',
      '/main/products/pro3/secret-force-pro-3-gallery-07.webp',
    ],
    slug: 'secret-force-pro-3',
    description: 'DAT55G 티타늄, 2.3mm 페이스, COR 0.86',
    price: '1,150,000원',
    features: ['DAT55G 티타늄', '2.3mm 페이스', 'COR 0.86'],
  },
  {
    id: 'v3',
    name: '시크리트포스 V3',
    displayName: '시크리트포스 V3',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/v3/secret-force-v3-sole-350-bg.webp',
    referenceImages: [
      '/main/products/v3/secret-force-v3-gallery-02.webp',
      '/main/products/v3/secret-force-v3-gallery-03.webp',
      '/main/products/v3/secret-force-v3-gallery-04.webp',
      '/main/products/v3/secret-force-v3-gallery-05.webp',
      '/main/products/v3/secret-force-v3-gallery-06.webp',
      '/main/products/v3/secret-force-v3-gallery-07.webp',
    ],
    slug: 'secret-force-v3',
    description: 'DAT55G 티타늄, 2.4mm 페이스, COR 0.85',
    price: '950,000원',
    features: ['DAT55G 티타늄', '2.4mm 페이스', 'COR 0.85'],
  },
  {
    id: 'weapon-black',
    name: '시크리트웨폰 블랙',
    displayName: '시크리트웨폰 블랙',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/black-weapon/secret-weapon-black-sole-500.webp',
    referenceImages: [
      '/main/products/black-weapon/secret-weapon-black-gallery-01.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-02.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-03.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-04.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-05.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-06.webp',
      '/main/products/black-weapon/secret-weapon-black-gallery-07.webp',
    ],
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
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/gold-weapon4/secret-weapon-gold-4-1-sole-500.webp',
    referenceImages: [
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-01.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-02.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-03.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-04.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-05.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-06.webp',
      '/main/products/gold-weapon4/secret-weapon-gold-4-1-gallery-07.webp',
    ],
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
 * 로고 교체용 프롬프트 생성
 * @returns 로고 교체 프롬프트
 */
export function generateLogoReplacementPrompt(): string {
  return `Additionally, replace any text, logo, or branding on the person's cap, hat, or clothing with "MASSGOO" logo. If there is any text like "SGOO", "MASGOO", or other variations, replace it with "MASSGOO". The MASSGOO logo should be clearly visible and readable, maintaining the same style, size, and position as the original logo. Ensure natural integration with proper lighting and shadows.`;
}

/**
 * 제품 합성용 프롬프트 생성
 * @param product 제품 정보
 * @param useReferenceImages 참조 이미지 사용 여부
 * @param driverPart 드라이버 부위 (드라이버 전용): 'crown' | 'sole' | 'face' | 'full'
 * @returns 합성 프롬프트
 */
export function generateCompositionPrompt(
  product: ProductForComposition, 
  useReferenceImages: boolean = false,
  driverPart: DriverPart = 'full'
): string {
  // 합성 타겟에 따라 프롬프트 생성
  if (product.compositionTarget === 'head') {
    // 모자 합성 프롬프트
    const hatTypeText = product.hatType === 'bucket' ? '버킷햇' : 
                       product.hatType === 'baseball' ? '야구모자' : 
                       product.hatType === 'visor' ? '비저' : '모자';
    
    let prompt = `Place the ${product.name} ${hatTypeText} on the person's head. The hat should fit naturally on the head, maintaining the person's facial features, hair, and all other elements exactly the same.`;
    
    if (useReferenceImages && product.referenceImages && product.referenceImages.length > 0) {
      prompt += ` Use the provided reference images to match the exact angle, perspective, and lighting of the hat on the person's head.`;
    }
    
    prompt += ` The hat should match the person's head size, angle, lighting, and shadows. Maintain natural shadows and reflections. The hat should appear as if it was originally part of the image, with the MASSGOO logo clearly visible if present.`;
    
    return prompt;
  } else if (product.compositionTarget === 'hands' && product.category === 'driver') {
    // 드라이버 합성 프롬프트
    let prompt = '';
    
    if (driverPart === 'crown') {
      prompt = `Replace ONLY the crown (top part) of the golf driver head in the person's hands with the crown of the ${product.name} driver head. Keep the sole, face, hands, grip position, body posture, and all other elements exactly the same.`;
    } else if (driverPart === 'sole') {
      prompt = `Replace ONLY the sole (bottom part) of the golf driver head in the person's hands with the sole of the ${product.name} driver head. Keep the crown, face, hands, grip position, body posture, and all other elements exactly the same.`;
    } else if (driverPart === 'face') {
      prompt = `Replace ONLY the face (striking surface) of the golf driver head in the person's hands with the face of the ${product.name} driver head. Keep the crown, sole, hands, grip position, body posture, and all other elements exactly the same.`;
    } else {
      // full (기본)
      prompt = `Replace ONLY the golf driver head in the person's hands with the ${product.name} driver head. Keep the person's hands, grip position, body posture, and all other elements exactly the same.`;
    }
    
    if (useReferenceImages && product.referenceImages && product.referenceImages.length > 0) {
      prompt += ` Use the provided reference images to match the exact angle, perspective, and lighting of the driver in the person's hands.`;
    }
    
    prompt += ` The new driver head (or part) should match the original driver's angle, position, lighting, and shadows. Maintain natural shadows and reflections. The driver shaft can remain unchanged if visible. The replacement should be seamless and realistic, with the new driver head appearing as if it was originally part of the image.`;
    
    return prompt;
  } else {
    // 기타 제품 (향후 확장)
    return `Place the ${product.name} on the person. Keep all other elements exactly the same.`;
  }
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


/**
 * Supabase에서 제품 목록 가져오기 (클라이언트 사이드)
 * @param category 제품 카테고리 필터 (선택)
 * @param target 합성 타겟 필터 (선택)
 * @param active 활성화된 제품만 (기본: true)
 * @returns 제품 목록
 */
export async function getProductsFromSupabase(
  category?: ProductCategory,
  target?: CompositionTarget,
  active: boolean = true
): Promise<ProductForComposition[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (target) params.append('target', target);
    if (active !== undefined) params.append('active', String(active));

    const response = await fetch(`/api/admin/product-composition?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    if (data.success && data.products) {
      // Supabase 데이터를 ProductForComposition 형식으로 변환
      return data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        displayName: p.display_name || p.name,
        category: p.category as ProductCategory,
        compositionTarget: p.composition_target as CompositionTarget,
        imageUrl: p.image_url,
        referenceImages: p.reference_images || [],
        driverParts: p.driver_parts || undefined,
        hatType: p.hat_type as HatType | undefined,
        slug: p.slug,
        badge: p.badge,
        description: p.description,
        price: p.price,
        features: p.features || [],
      }));
    }

    // 데이터가 없으면 빈 배열 반환 (Fallback으로 넘어감)
    return [];
  } catch (error) {
    console.error('❌ Supabase에서 제품 목록 가져오기 실패:', error);
    // Fallback: 기존 하드코딩된 데이터에서 필터링하여 반환
    let filtered = PRODUCTS_FOR_COMPOSITION;
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (target) {
      filtered = filtered.filter(p => p.compositionTarget === target);
    }
    return filtered;
  }
}

/**
 * Supabase에서 제품 ID로 제품 정보 조회 (클라이언트 사이드)
 * @param productId 제품 ID
 * @returns 제품 정보 또는 undefined
 */
export async function getProductByIdFromSupabase(productId: string): Promise<ProductForComposition | undefined> {
  try {
    const products = await getProductsFromSupabase();
    return products.find(p => p.id === productId || p.slug === productId);
  } catch (error) {
    console.error('❌ Supabase에서 제품 조회 실패:', error);
    // Fallback: 기존 하드코딩된 데이터 사용
    return getProductById(productId);
  }
}

/**
 * 카테고리별 제품 목록 조회 (Supabase 우선, Fallback: 하드코딩)
 * @param category 제품 카테고리
 * @returns 제품 목록
 */
export async function getProductsByCategory(category: ProductCategory): Promise<ProductForComposition[]> {
  try {
    return await getProductsFromSupabase(category);
  } catch (error) {
    console.error('❌ 카테고리별 제품 조회 실패:', error);
    // Fallback: 기존 하드코딩된 데이터 사용
    return PRODUCTS_FOR_COMPOSITION.filter(p => p.category === category);
  }
}

/**
 * 합성 타겟별 제품 목록 조회 (Supabase 우선, Fallback: 하드코딩)
 * @param target 합성 타겟
 * @returns 제품 목록
 */
export async function getProductsByTarget(target: CompositionTarget): Promise<ProductForComposition[]> {
  try {
    return await getProductsFromSupabase(undefined, target);
  } catch (error) {
    console.error('❌ 합성 타겟별 제품 조회 실패:', error);
    // Fallback: 기존 하드코딩된 데이터 사용
    return PRODUCTS_FOR_COMPOSITION.filter(p => p.compositionTarget === target);
  }
}
