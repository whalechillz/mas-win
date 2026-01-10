/**
 * 제품 합성용 제품 데이터베이스
 * AI 이미지 생성 시 마쓰구 드라이버 제품을 합성하기 위한 제품 정보
 */

export type ProductCategory = 'driver' | 'cap' | 'apparel' | 'accessory';
export type CompositionTarget = 'hands' | 'head' | 'body' | 'accessory';
export type HatType = 'bucket' | 'baseball' | 'visor';
export type DriverPart = 'crown' | 'sole' | 'face' | 'full';

export interface ProductForComposition {
  id: string;
  name: string;
  category: ProductCategory; // 'driver' | 'cap' | 'apparel' | 'accessory'
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
  description?: string;
  features?: string[];
  // ✅ 샤프트 및 배지 이미지 추가
  shaftImageUrl?: string; // 샤프트 이미지 URL (검정색 샤프트 참조용)
  badgeImageUrl?: string; // 배지 이미지 URL (배지 참조용)
  shaftLogoImageUrl?: string; // 샤프트 로고 이미지 URL (선택)
}

/**
 * 7개 마쓰구 드라이버 제품 목록
 * AI 이미지 합성 시 사용할 제품 정보
 */
export const PRODUCTS_FOR_COMPOSITION: ProductForComposition[] = [
  {
    id: 'secret-force-gold-2-muziik',
    name: '시크리트포스 골드 2 MUZIIK',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-force-gold-2-muziik/secret-force-gold-2-sole-500.webp',
    referenceImages: [
      '/main/products/secret-force-gold-2-muziik/massgoo_sf_gold2_muz_11.webp',
      '/main/products/secret-force-gold-2-muziik/massgoo_sf_gold2_muz_12.webp',
      '/main/products/secret-force-gold-2-muziik/massgoo_sf_gold2_muz_13.webp',
      '/main/products/secret-force-gold-2-muziik/massgoo_sf_gold2_muz_14_b.webp',
      '/main/products/secret-force-gold-2-muziik/massgoo_sf_gold2_muz_15.webp',
    ],
    slug: 'secret-force-gold-2-muziik',
    description: '오토플렉스 티타늄 샤프트, ONE-FLEX A200·A215',
    features: ['오토플렉스 티타늄 샤프트', 'ONE-FLEX A200·A215', '무제한 2년 헤드 보증'],
  },
  {
    id: 'secret-weapon-black-muziik',
    name: '시크리트웨폰 블랙 MUZIIK',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-weapon-black-muziik/secret-weapon-black-sole-500.webp',
    referenceImages: [
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_11.webp',
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_12.webp',
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_13.webp',
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_14_b.webp',
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_15.webp',
      '/main/products/secret-weapon-black-muziik/massgoo_sw_black_muz_18.webp',
    ],
    slug: 'secret-weapon-black-muziik',
    description: '풀 티타늄 4X 샤프트, 40g대, 최대 X 플렉스',
    features: ['풀 티타늄 4X 샤프트', '40g대, 최대 X 플렉스', '2년 헤드 보증(최대 3회)'],
  },
  {
    id: 'secret-force-gold-2',
    name: '시크리트포스 골드 2',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-force-gold-2/secret-force-gold-2-sole-500.webp',
    referenceImages: [
      '/main/products/secret-force-gold-2/gold2_01.jpg',
      '/main/products/secret-force-gold-2/gold2_02.jpg',
      '/main/products/secret-force-gold-2/gold2_03.jpg',
      '/main/products/secret-force-gold-2/gold2_04.jpg',
      '/main/products/secret-force-gold-2/gold2_05.jpg',
      '/main/products/secret-force-gold-2/gold2_06.jpg',
      '/main/products/secret-force-gold-2/gold2_07.jpg',
    ],
    slug: 'secret-force-gold-2',
    description: 'DAT55G+ Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
    features: ['DAT55G+ Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
  },
  {
    id: 'secret-force-pro-3',
    name: '시크리트포스 PRO 3',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-force-pro-3/secret-force-pro-3-sole-500.webp',
    referenceImages: [
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-01.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-02.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-03.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-04.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-05.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-06.webp',
      '/main/products/secret-force-pro-3/secret-force-pro-3-gallery-07.webp',
    ],
    slug: 'secret-force-pro-3',
    description: 'DAT55G 티타늄, 2.3mm 페이스, COR 0.86',
    features: ['DAT55G 티타늄', '2.3mm 페이스', 'COR 0.86'],
  },
  {
    id: 'secret-force-v3',
    name: '시크리트포스 V3',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-force-v3/secret-force-v3-sole-350-bg.webp',
    referenceImages: [
      '/main/products/secret-force-v3/secret-force-v3-gallery-02.webp',
      '/main/products/secret-force-v3/secret-force-v3-gallery-03.webp',
      '/main/products/secret-force-v3/secret-force-v3-gallery-04.webp',
      '/main/products/secret-force-v3/secret-force-v3-gallery-05.webp',
      '/main/products/secret-force-v3/secret-force-v3-gallery-06.webp',
      '/main/products/secret-force-v3/secret-force-v3-gallery-07.webp',
    ],
    slug: 'secret-force-v3',
    description: 'DAT55G 티타늄, 2.4mm 페이스, COR 0.85',
    features: ['DAT55G 티타늄', '2.4mm 페이스', 'COR 0.85'],
  },
  {
    id: 'secret-weapon-black',
    name: '시크리트웨폰 블랙',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-weapon-black/secret-weapon-black-sole-500.webp',
    referenceImages: [
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-01.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-02.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-03.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-04.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-05.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-06.webp',
      '/main/products/secret-weapon-black/secret-weapon-black-gallery-07.webp',
    ],
    slug: 'secret-weapon-black',
    description: 'SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
    features: ['SP700 Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
  },
  {
    id: 'secret-weapon-gold-4-1',
    name: '시크리트웨폰 골드 4.1',
    category: 'driver' as ProductCategory,
    compositionTarget: 'hands' as CompositionTarget,
    imageUrl: '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-sole-500.webp',
    referenceImages: [
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-01.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-02.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-03.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-04.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-05.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-06.webp',
      '/main/products/secret-weapon-gold-4-1/secret-weapon-gold-4-1-gallery-07.webp',
    ],
    slug: 'secret-weapon-gold-4-1',
    description: 'SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87',
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
 * @param backgroundType 배경 타입 (모자 합성 전용): 'natural' | 'studio' | 'product-page'
 * @returns 합성 프롬프트
 */
export function generateCompositionPrompt(
  product: ProductForComposition, 
  useReferenceImages: boolean = false,
  driverPart: DriverPart = 'full',
  backgroundType: 'natural' | 'studio' | 'product-page' = 'natural'
): string {
  // 합성 타겟에 따라 프롬프트 생성
  if (product.compositionTarget === 'head') {
    // 모자 합성 프롬프트
    const hatTypeText = product.hatType === 'bucket' ? '버킷햇' : 
                       product.hatType === 'baseball' ? '야구모자' : 
                       product.hatType === 'visor' ? '비저' : '모자';
    
    let prompt = `Place the ${product.name} ${hatTypeText} on the person's head. The hat should fit naturally on the head, maintaining the person's facial features, hair, and all other elements exactly the same.`;

    // 배경 타입 지시
    if (backgroundType === 'studio') {
      prompt += ` The background should be a professional studio setting with clean, neutral background (white, gray, or subtle gradient). Professional product photography style with even lighting, no distracting elements.`;
    } else if (backgroundType === 'product-page') {
      prompt += ` The background should be a professional product photography studio setting with clean, minimalist background (white or light gray). High-end e-commerce product page style with professional lighting, soft shadows, and no distracting elements. The person should be positioned as if modeling the product for a product catalog or e-commerce website.`;
    } else {
      // natural: 배경 완전히 유지
      prompt += ` Keep the original background, lighting, shadows, and entire scene exactly as it is. Do not modify, regenerate, or change any part of the image except placing the hat on the person's head. The background must remain completely unchanged.`;
    }
    
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
    
    // 🔥 개선: 각도 매칭 강화 지시
    if (useReferenceImages && product.referenceImages && product.referenceImages.length > 0) {
      prompt += ` 

CRITICAL ANGLE MATCHING INSTRUCTIONS:
1. Analyze the original driver head's exact 3D orientation:
   - Viewing angle (front, side, 3/4, top, bottom)
   - Tilt angle (club face open/closed)
   - Rotation (around shaft axis)
   - Perspective (camera distance and angle)

2. Compare with all provided reference images and select the one with the closest matching angle.

3. Transform the selected product image to match the EXACT angle:
   - Apply geometric transformation (rotation, perspective warp, scale)
   - Match the 3D position and orientation precisely
   - Do NOT simply overlay - transform to match geometry

4. Match lighting and shadows:
   - Analyze original lighting direction and intensity
   - Apply matching shadows and reflections
   - Ensure seamless integration

The replacement must be geometrically accurate and photorealistic.`;
    } else {
      // 참조 이미지가 없는 경우에도 각도 매칭 강조
      prompt += ` 

CRITICAL: The new driver head must match the EXACT angle, tilt, rotation, and perspective of the original driver head. Analyze the original driver's 3D orientation carefully:
- Match the viewing angle (front, side, 3/4 view, etc.)
- Match the tilt angle (how much the club face is open/closed)
- Match the rotation (how the club is rotated around the shaft axis)
- Match the perspective (distance and camera angle)
- Match the lighting direction and intensity
- Match the shadow direction and shape

Transform the product image to match the exact perspective. Do NOT simply overlay - apply geometric transformation (rotation, perspective warp, scale) to align perfectly with the original driver's 3D position and orientation. The replacement must be geometrically accurate - ensure the new driver head appears at the exact same angle as the original.`;
    }
    
    prompt += ` Maintain natural shadows and reflections that match the original lighting. 

CRITICAL SHAFT COLOR INSTRUCTION:
- The driver shaft must be BLACK (matte black or dark graphite black)
- Do NOT change the shaft to any other color (no silver, gold, red, blue, or any other colors)
- The shaft should maintain its original position and angle
- If the shaft is visible, it must remain BLACK throughout its entire length
- The shaft color should match professional golf club standards: matte black graphite shaft
- The shaft should connect seamlessly to the driver head with no visible gaps or misalignment

BADGE INSTRUCTION:
- If the product has a badge or logo on the head, ensure it matches the reference images exactly
- The badge position, size, and design must be accurate
- Do NOT add or remove badges that are not in the reference images
- Badge colors and text must match the reference images precisely`;

    // ✅ 샤프트 이미지 참조 추가
    if (product.shaftImageUrl) {
      prompt += ` 

SHAFT REFERENCE:
- Use the provided shaft reference image to match the exact shaft design, color, and texture
- The shaft must be BLACK (matte black) as shown in the reference image
- Match the shaft's diameter, taper, and any graphics or logos on the shaft
- Ensure the shaft connects seamlessly to the driver head`;
    }
    
    // ✅ 배지 이미지 참조 추가
    if (product.badgeImageUrl) {
      prompt += ` 

BADGE REFERENCE:
- Use the provided badge reference image to match the exact badge design, position, and color
- The badge must be placed in the exact same position as shown in the reference image
- Match the badge size, shape, and any text or graphics on the badge`;
    }
    
    prompt += ` The replacement should be seamless and realistic, with the new driver head appearing as if it was originally part of the image.`;
    
    return prompt;
  } else if (product.compositionTarget === 'accessory') {
    // 액세서리(파우치백/클러치백) 합성 프롬프트
    let prompt = '';
    
    // 제품 타입에 따라 다른 프롬프트
    if (product.category === 'accessory' && (product.name.includes('클러치') || product.name.includes('clutch') || product.name.includes('파우치') || product.name.includes('pouch'))) {
      // 클러치백/파우치백: 손에 들고 있거나 자연스럽게 배치
      prompt = `Place the ${product.name} (clutch bag/pouch) in the person's hand or naturally positioned near them. The clutch bag should be held naturally in the person's hand with a relaxed, comfortable grip, or placed naturally on a surface (table, ground, or golf bag) if the person is not holding it. The bag should maintain its natural shape and proportions, with the MASSGOO × MUZIIK logo clearly visible if present. Keep the person's pose, facial expression, clothing, and all other elements exactly the same.`;
      
      // 배경 타입 지시
      if (backgroundType === 'studio') {
        prompt += ` The background should be a professional studio setting with clean, neutral background (white, gray, or subtle gradient). Professional product photography style with even lighting, no distracting elements.`;
      } else if (backgroundType === 'product-page') {
        prompt += ` The background should be a professional product photography studio setting with clean, minimalist background (white or light gray). High-end e-commerce product page style with professional lighting, soft shadows, and no distracting elements. The person should be positioned as if modeling the product for a product catalog or e-commerce website.`;
      } else {
        prompt += ` Keep the original background exactly as it is.`;
      }
      
      // 참조 이미지 사용 지시
      if (useReferenceImages && product.referenceImages && product.referenceImages.length > 0) {
        prompt += ` Use the provided reference images to match the exact angle, perspective, and lighting of the clutch bag.`;
      }
      
      prompt += ` The clutch bag should match the lighting, shadows, and perspective of the scene. Maintain natural shadows and reflections. The bag should appear as if it was originally part of the image, seamlessly integrated into the scene.`;
    } else {
      // 기타 액세서리
      prompt = `Place the ${product.name} naturally with the person. The accessory should be positioned naturally (in hand, on person, or nearby) maintaining realistic proportions and positioning. Keep all other elements exactly the same.`;
    }
    
    return prompt;
  } else {
    // 기타 제품 (향후 확장)
    return `Place the ${product.name} on the person. Keep all other elements exactly the same.`;
  }
}

/**
 * 제품 이미지 URL을 절대 URL로 변환 (Supabase Storage 경로 지원)
 * @param imageUrl 상대 경로 또는 절대 URL
 * @param baseUrl 기본 URL (선택사항, 사용 안 함 - getProductImageUrl이 처리)
 * @returns 절대 URL
 */
export function getAbsoluteImageUrl(imageUrl: string, baseUrl?: string): string {
  if (!imageUrl) return '';
  
  // 이미 절대 URL인 경우
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // getProductImageUrl을 사용하여 Supabase Storage 경로로 변환
  // 이 함수는 /main/products/... 경로를 originals/products/...로 자동 변환하고
  // Supabase Storage 공개 URL을 생성합니다
  const { getProductImageUrl } = require('./product-image-url');
  return getProductImageUrl(imageUrl);
}

/**
 * 제품 색상 변경 프롬프트 생성
 * 로고와 텍스트는 그대로 유지하고 제품 색상만 변경
 * @param product 제품 정보
 * @param targetColor 변경할 색상 (예: 'red', 'blue', 'navy', 'beige')
 * @param compositionTarget 합성 타겟
 * @returns 색상 변경 프롬프트
 */
export function generateColorChangePrompt(
  product: ProductForComposition,
  targetColor: string,
  compositionTarget: CompositionTarget
): string {
  const colorNames: Record<string, string> = {
    'red': '빨간색',
    'orange': '주황색',
    'yellow': '노란색',
    'green': '초록색',
    'blue': '파란색',
    'navy': '네이비 블루',
    'purple': '보라색',
    'black': '검은색',
    'white': '흰색',
    'gray': '회색',
    'grey': '회색',
    'brown': '갈색',
    'beige': '베이지색',
    'khaki': '카키색'
  };

  const colorName = colorNames[targetColor.toLowerCase()] || targetColor;
  const productName = compositionTarget === 'head' ? '모자' : '드라이버';

  if (compositionTarget === 'head') {
    return `Change ONLY the hat's fabric color to ${colorName} while keeping:
- The logo, text, and branding exactly the same (same position, size, color, and design)
- The hat's shape, style, fit, and all structural elements exactly the same
- All other elements of the image unchanged
The color change should be natural and realistic, maintaining proper lighting, shadows, and fabric texture. The logo and text should remain completely unchanged.`;
  } else if (compositionTarget === 'hands' && product.category === 'driver') {
    return `Change ONLY the driver head's color to ${colorName} while keeping:
- All logos, text, and branding exactly the same (same position, size, color, and design)
- The driver's shape, design, and all structural elements exactly the same
- All other elements of the image unchanged
The color change should be natural and realistic, maintaining proper lighting and shadows.`;
  } else {
    return `Change ONLY the ${productName}'s color to ${colorName} while keeping all logos, text, branding, and structural elements exactly the same.`;
  }
}


/**
 * 이미지 URL에서 .png를 .webp로 자동 변환
 * @param url 이미지 URL
 * @returns 변환된 이미지 URL
 */
function convertPngToWebp(url: string | null | undefined): string {
  if (!url) return '';
  // .png로 끝나는 경우 .webp로 변환
  if (url.endsWith('.png')) {
    return url.replace(/\.png$/, '.webp');
  }
  return url;
}

/**
 * JSONB 객체의 모든 값에서 .png를 .webp로 변환
 * @param obj JSONB 객체 (color_variants 등)
 * @returns 변환된 객체
 */
function convertPngToWebpInObject(obj: any): Record<string, string> {
  if (!obj || typeof obj !== 'object') return {};
  const converted: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      converted[key] = convertPngToWebp(value);
    } else {
      converted[key] = value as string;
    }
  }
  return converted;
}

/**
 * 배열의 모든 요소에서 .png를 .webp로 변환
 * @param arr 문자열 배열
 * @returns 변환된 배열
 */
function convertPngToWebpInArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => typeof item === 'string' ? convertPngToWebp(item) : item);
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
      // .png를 .webp로 자동 변환하고, getAbsoluteImageUrl로 경로 변환
      return data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category as ProductCategory,
        compositionTarget: p.composition_target as CompositionTarget,
        imageUrl: getAbsoluteImageUrl(convertPngToWebp(p.image_url)), // 경로 변환 추가
        referenceImages: convertPngToWebpInArray(p.reference_images || []).map(img => getAbsoluteImageUrl(img)), // 배열 내부도 변환
        driverParts: p.driver_parts ? {
          crown: p.driver_parts.crown ? convertPngToWebpInArray(p.driver_parts.crown).map(img => getAbsoluteImageUrl(img)) : undefined,
          sole: p.driver_parts.sole ? convertPngToWebpInArray(p.driver_parts.sole).map(img => getAbsoluteImageUrl(img)) : undefined,
          face: p.driver_parts.face ? convertPngToWebpInArray(p.driver_parts.face).map(img => getAbsoluteImageUrl(img)) : undefined,
        } : undefined,
        hatType: p.hat_type as HatType | undefined,
        slug: p.slug,
        description: p.description,
        features: p.features || [],
        // ✅ 샤프트 및 배지 이미지 추가
        shaftImageUrl: p.shaft_image_url ? getAbsoluteImageUrl(convertPngToWebp(p.shaft_image_url)) : undefined,
        badgeImageUrl: p.badge_image_url ? getAbsoluteImageUrl(convertPngToWebp(p.badge_image_url)) : undefined,
        shaftLogoImageUrl: p.shaft_logo_image_url ? getAbsoluteImageUrl(convertPngToWebp(p.shaft_logo_image_url)) : undefined,
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
    const supabaseProducts = await getProductsFromSupabase(undefined, target);
    // Supabase에서 데이터가 있으면 반환, 없으면 fallback 사용
    if (supabaseProducts.length > 0) {
      return supabaseProducts;
    }
    // 빈 배열이면 fallback 사용
    console.log(`⚠️ Supabase에서 ${target} 타겟 제품이 없어 fallback 데이터 사용`);
    return PRODUCTS_FOR_COMPOSITION.filter(p => p.compositionTarget === target);
  } catch (error) {
    console.error('❌ 합성 타겟별 제품 조회 실패:', error);
    // Fallback: 기존 하드코딩된 데이터 사용
    return PRODUCTS_FOR_COMPOSITION.filter(p => p.compositionTarget === target);
  }
}

