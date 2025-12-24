-- 제품 합성 관리용 굿즈/사은품 제품 일괄 입력 SQL
-- Supabase SQL Editor에서 실행하세요
-- 마쓰구 화이트캡은 이미 입력되었으므로 제외

-- 2. 마쓰구 블랙캡
INSERT INTO product_composition (
  name, display_name, category, composition_target, image_url,
  reference_images, slug, hat_type, is_active, display_order
) VALUES (
  '마쓰구 블랙캡',
  'MASSGOO 블랙캡',
  'hat',
  'head',
  '/main/products/goods/massgoo-black-cap-front.webp',
  '["/main/products/goods/massgoo-black-cap-front.webp", "/main/products/goods/massgoo-black-cap-side.webp"]'::jsonb,
  'massgoo-black-cap',
  'baseball',
  true,
  2
) ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  reference_images = EXCLUDED.reference_images,
  updated_at = NOW();

-- 3. MAS 한정판 모자(그레이)
INSERT INTO product_composition (
  name, display_name, category, composition_target, image_url,
  reference_images, slug, hat_type, is_active, display_order
) VALUES (
  'MAS 한정판 모자(그레이)',
  'MAS Limited Edition Cap (Gray)',
  'hat',
  'head',
  '/main/products/goods/mas-limited-cap-gray-front.webp',
  '["/main/products/goods/mas-limited-cap-gray-front.webp", "/main/products/goods/mas-limited-cap-gray-side.webp"]'::jsonb,
  'mas-limited-cap-gray',
  'baseball',
  true,
  3
) ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  reference_images = EXCLUDED.reference_images,
  badge = NULL,
  updated_at = NOW();

-- 4. MAS 한정판 모자(블랙)
INSERT INTO product_composition (
  name, display_name, category, composition_target, image_url,
  reference_images, slug, hat_type, is_active, display_order
) VALUES (
  'MAS 한정판 모자(블랙)',
  'MAS Limited Edition Cap (Black)',
  'hat',
  'head',
  '/main/products/goods/mas-limited-cap-black-front.webp',
  '["/main/products/goods/mas-limited-cap-black-front.webp", "/main/products/goods/mas-limited-cap-black-side.webp"]'::jsonb,
  'mas-limited-cap-black',
  'baseball',
  true,
  4
) ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  reference_images = EXCLUDED.reference_images,
  badge = NULL,
  updated_at = NOW();

-- 5. MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)
INSERT INTO product_composition (
  name, display_name, category, composition_target, image_url,
  reference_images, slug, is_active, display_order
) VALUES (
  'MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)',
  'MASSGOO × MUZIIK Premium Clutch Bag (Beige)',
  'accessory',
  'accessory',
  '/main/products/goods/massgoo-muziik-clutch-beige-front.webp',
  '["/main/products/goods/massgoo-muziik-clutch-beige-front.webp", "/main/products/goods/massgoo-muziik-clutch-beige-back.webp"]'::jsonb,
  'massgoo-muziik-clutch-beige',
  true,
  5
) ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  reference_images = EXCLUDED.reference_images,
  updated_at = NOW();

-- 6. MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)
INSERT INTO product_composition (
  name, display_name, category, composition_target, image_url,
  reference_images, slug, is_active, display_order
) VALUES (
  'MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)',
  'MASSGOO × MUZIIK Premium Clutch Bag (Gray)',
  'accessory',
  'accessory',
  '/main/products/goods/massgoo-muziik-clutch-gray-front.webp',
  '["/main/products/goods/massgoo-muziik-clutch-gray-front.webp", "/main/products/goods/massgoo-muziik-clutch-gray-back.webp"]'::jsonb,
  'massgoo-muziik-clutch-gray',
  true,
  6
) ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  reference_images = EXCLUDED.reference_images,
  updated_at = NOW();

-- 7. 마쓰구 갈색 쇼핑백 (추가 제품)
-- 참고: 이미지 파일이 준비되면 추가하세요
-- INSERT INTO product_composition (
--   name, display_name, category, composition_target, image_url,
--   reference_images, slug, is_active, display_order
-- ) VALUES (
--   '마쓰구 갈색 쇼핑백',
--   'MASSGOO Brown Tote Bag',
--   'accessory',
--   'accessory',
--   '/main/products/goods/massgoo-tote-bag-brown-front.webp',
--   '["/main/products/goods/massgoo-tote-bag-brown-front.webp", "/main/products/goods/massgoo-tote-bag-brown-back.webp"]'::jsonb,
--   'massgoo-tote-bag-brown',
--   true,
--   7
-- ) ON CONFLICT (slug) DO UPDATE SET
--   image_url = EXCLUDED.image_url,
--   reference_images = EXCLUDED.reference_images,
--   updated_at = NOW();

