import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 공통으로 사용하는 컬럼 목록 (SELECT 시 재사용)
const PRODUCT_SELECT_COLUMNS =
  'id, name, sku, category, color, size, legacy_name, is_gift, is_sellable, is_active, normal_price, sale_price, is_component, condition, product_type, slug, subtitle, badge_left, badge_right, badge_left_color, badge_right_color, border_color, features, specifications, display_order, detail_images, composition_images, gallery_images';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
      case 'PATCH':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[admin/products] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // distinctCategories 파라미터가 있으면 카테고리 목록만 반환
    if (req.query.distinctCategories === 'true') {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .neq('category', '');
      
      if (error) {
        throw error;
      }
      
      // 중복 제거 및 정렬
      const categories = Array.from(
        new Set(
          (data || [])
            .map((p: any) => p.category)
            .filter((cat: string | null) => cat && cat.trim() !== '')
        )
      ).sort();
      
      return res.status(200).json({
        success: true,
        categories,
      });
    }

    const isGiftOnly = req.query.isGift === 'true';
    const includeInactive = req.query.includeInactive === 'true';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const isSellable =
      typeof req.query.isSellable === 'string' ? req.query.isSellable === 'true' : undefined;
    const isActive =
      typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined;
    const minPrice =
      typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined;
    const maxPrice =
      typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined;
    const isComponentParam = req.query.isComponent as string | undefined;
    const isComponent =
      isComponentParam === 'true' ? true : isComponentParam === 'false' ? false : undefined;
    const condition =
      typeof req.query.condition === 'string' ? req.query.condition.trim() : '';
    const productType =
      typeof req.query.productType === 'string' ? req.query.productType.trim() : '';

    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const allowedSortColumns = [
      'name',
      'sku',
      'category',
      'color',
      'size',
      'normal_price',
      'sale_price',
      'is_gift',
      'is_sellable',
      'is_active',
      'is_component',
      'condition',
    ];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
    const ascending = sortOrder === 'asc';

    let query = supabase
      .from('products')
      .select(`
        ${PRODUCT_SELECT_COLUMNS},
        product_composition!product_composition_product_id_fkey (
          id,
          name,
          slug
        )
      `)
      .order(sortColumn, { ascending });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    } else if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (isGiftOnly) {
      query = query.eq('is_gift', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (isSellable !== undefined) {
      query = query.eq('is_sellable', isSellable);
    }

    if (isComponent !== undefined) {
      query = query.eq('is_component', isComponent);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
      query = query.gte('normal_price', minPrice);
    }
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
      query = query.lte('normal_price', maxPrice);
    }

    if (q) {
      // 이름/sku/legacy_name 부분 검색
      query = query.or(
        `name.ilike.%${q}%,sku.ilike.%${q}%,legacy_name.ilike.%${q}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 디버깅: 제품 합성 관리 데이터 확인
    if (data && data.length > 0) {
      const sampleWithComp = data.find((p: any) => p.product_composition);
      const masLimited = data.find((p: any) => p.name?.includes('MAS 한정판'));
      if (sampleWithComp) {
        console.log('[admin/products][GET] Sample product with composition:', {
          id: sampleWithComp.id,
          name: sampleWithComp.name,
          product_composition: sampleWithComp.product_composition,
          compositionType: Array.isArray(sampleWithComp.product_composition) ? 'array' : typeof sampleWithComp.product_composition,
        });
      }
      if (masLimited) {
        console.log('[admin/products][GET] MAS Limited product:', {
          id: masLimited.id,
          name: masLimited.name,
          sku: masLimited.sku,
          slug: masLimited.slug,
          product_composition: masLimited.product_composition,
        });
      }
      if (!sampleWithComp && !masLimited) {
        console.log('[admin/products][GET] No products with composition found. Total products:', data.length);
      }
    }

    return res.status(200).json({
      success: true,
      products: data ?? [],
    });
  } catch (error: any) {
    console.error('[admin/products][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 목록 조회에 실패했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      sku,
      slug,
      category,
      color,
      size,
      legacy_name,
      is_gift = false,
      is_sellable = false,
      is_active = true,
      normal_price,
      sale_price,
      is_component = false,
      condition = 'new',
      detail_images,
      product_type,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ success: false, message: '상품명(name)은 필수입니다.' });
    }

    // ✅ SKU 중복 체크 (SKU가 제공된 경우)
    if (sku && sku.trim() !== '') {
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('sku', sku.trim())
        .maybeSingle();

      if (checkError) {
        console.error('[admin/products][POST] SKU 중복 체크 오류:', checkError);
        return res.status(500).json({
          success: false,
          message: 'SKU 중복 체크 중 오류가 발생했습니다.',
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `SKU "${sku}"는 이미 사용 중입니다. (제품: ${existingProduct.name})`,
        });
      }
    }

    // slug 생성: 전달된 slug 우선, 없으면 SKU에서 변환, 그것도 없으면 제품명에서 생성
    let productSlug = slug;
    if (!productSlug && sku) {
      productSlug = sku.toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    if (!productSlug && name) {
      productSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속된 하이픈 제거
        .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
    }

    // ✅ slug 중복 체크 및 자동 고유 slug 생성
    if (productSlug) {
      let baseSlug = productSlug;
      let uniqueSlug = baseSlug;
      let counter = 1;
      let isUnique = false;

      while (!isUnique && counter < 100) {
        // 중복 체크
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id, name, slug')
          .eq('slug', uniqueSlug)
          .maybeSingle();

        if (checkError) {
          console.error('[admin/products][POST] slug 중복 체크 오류:', checkError);
          return res.status(500).json({
            success: false,
            message: 'slug 중복 체크 중 오류가 발생했습니다.',
          });
        }

        if (!existingProduct) {
          // 고유한 slug 발견
          isUnique = true;
          productSlug = uniqueSlug;
        } else {
          // 중복 발견, 다음 번호 시도
          counter++;
          uniqueSlug = `${baseSlug}-${counter}`;
        }
      }

      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: `slug "${baseSlug}"와 유사한 slug가 너무 많이 존재합니다. 다른 제품명이나 SKU를 사용해주세요.`,
        });
      }

      // slug가 변경된 경우 로그 출력
      if (productSlug !== baseSlug) {
        console.log(`[admin/products][POST] slug 중복으로 자동 변경: ${baseSlug} -> ${productSlug}`);
      }
    }

    const payload: any = {
      name,
      sku: sku || null,
      slug: productSlug || null,
      category: category || null,
      color: color || null,
      size: size || null,
      legacy_name: legacy_name || null,
      is_gift: Boolean(is_gift),
      is_sellable: Boolean(is_sellable),
      is_active: Boolean(is_active),
      is_component: Boolean(is_component),
      condition: condition || 'new',
    };

    // product_type이 있으면 추가
    if (product_type) {
      payload.product_type = product_type;
    }

    if (normal_price !== undefined && normal_price !== null && normal_price !== '') {
      payload.normal_price = Number(normal_price);
    }
    if (sale_price !== undefined && sale_price !== null && sale_price !== '') {
      payload.sale_price = Number(sale_price);
    }
    if (detail_images !== undefined) {
      payload.detail_images = Array.isArray(detail_images) ? detail_images : [];
    }

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select(PRODUCT_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[admin/products][POST] ERROR', error);
      
      // slug 중복 오류를 더 명확하게 전달
      if (error.message && error.message.includes('duplicate key value violates unique constraint') && error.message.includes('idx_products_slug_unique')) {
        return res.status(400).json({
          success: false,
          message: `제품 slug가 중복됩니다. 제품명이나 SKU를 변경해주세요. (slug: ${productSlug || '자동 생성됨'})`,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || '상품 생성에 실패했습니다.',
      });
    }

    // 합성 데이터 자동 생성 (옵션이 활성화된 경우)
    const createComposition = req.body.createComposition !== false; // 기본값: true
    const needsComposition = 
      createComposition &&
      data.category && 
      !['component', 'weight_pack', 'ball', 'tshirt'].includes(data.category) &&
      data.is_component !== true;

    console.log('[admin/products][POST] 합성 데이터 생성 조건 확인:', {
      createComposition,
      category: data.category,
      isComponent: data.is_component,
      needsComposition,
    });

    if (needsComposition) {
      // slug 생성: products.slug 우선, 없으면 SKU에서 변환, 그것도 없으면 제품명에서 생성
      let compositionSlug = data.slug;
      
      if (!compositionSlug && data.sku) {
        compositionSlug = data.sku.toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      }
      
      // SKU도 없으면 제품명에서 slug 생성
      if (!compositionSlug && data.name) {
        compositionSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
          .replace(/\s+/g, '-') // 공백을 하이픈으로
          .replace(/-+/g, '-') // 연속된 하이픈 제거
          .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
      }
      
      if (compositionSlug) {
        // 카테고리 매핑
        // product_composition 테이블의 category 체크 제약 조건: 'cap', 'driver', 'accessory', 'apparel'만 허용
        // data.category 정규화 (대소문자, 공백 제거)
        const normalizedCategory = data.category ? data.category.toLowerCase().trim() : null;
        
        console.log('[admin/products][POST] 카테고리 매핑:', {
          originalCategory: data.category,
          normalizedCategory,
          productType: data.product_type,
        });
        
        let compCategory = 'accessory'; // 기본값: 'accessory' (체크 제약 조건 허용 값)
        let compTarget = 'hands';
        
        if (normalizedCategory === 'driver' || data.product_type === 'driver') {
          compCategory = 'driver';
          compTarget = 'hands';
        } else if (normalizedCategory === 'cap' || normalizedCategory === 'bucket_hat' || normalizedCategory === 'bucket-hat') {
          compCategory = 'hat'; // DB 체크 제약 조건에 맞춰 'hat' 사용
          compTarget = 'head';
        } else if (normalizedCategory === 'clutch' || normalizedCategory === 'bag') {
          compCategory = 'accessory';
          compTarget = 'hands';
        } else if (normalizedCategory === 'apparel' || normalizedCategory === 'tshirt') {
          compCategory = 'apparel';
          compTarget = 'body';
        }
        
        console.log('[admin/products][POST] 최종 카테고리:', {
          compCategory,
          compTarget,
        });

        // ✅ 카테고리 검증 및 변환: cap -> hat (DB 체크 제약 조건에 맞춤)
        // 실제 DB 체크 제약 조건: 'driver', 'accessory', 'apparel', 'hat'만 허용
        const allowedCategories = ['hat', 'driver', 'accessory', 'apparel'];
        
        // cap을 hat으로 변환 (DB 스키마에 맞춤)
        if (compCategory === 'cap') {
          compCategory = 'hat';
          console.log('[admin/products][POST] ✅ 카테고리 변환: cap -> hat');
        }
        
        if (!allowedCategories.includes(compCategory)) {
          console.error('[admin/products][POST] ❌ 허용되지 않은 카테고리:', compCategory);
          compCategory = 'accessory'; // 기본값으로 강제 설정
          console.log('[admin/products][POST] ✅ 카테고리를 기본값으로 변경:', compCategory);
        }

        const compositionData = {
          product_id: data.id,
          name: data.name,
          slug: compositionSlug,
          category: compCategory, // 검증된 카테고리만 사용
          composition_target: compTarget,
          image_url: data.detail_images && data.detail_images.length > 0 ? data.detail_images[0] : '',
          reference_images: data.detail_images || [],
          is_active: data.is_active,
          display_order: 0,
        };
        
        console.log('[admin/products][POST] 삽입할 합성 데이터:', {
          category: compositionData.category,
          slug: compositionData.slug,
          name: compositionData.name,
        });
        
        const { error: compError } = await supabase
          .from('product_composition')
          .insert([compositionData]);
        
        if (compError) {
          console.error('[admin/products][POST] 합성 데이터 생성 실패:', compError);
          // 사용자에게 알림 (제품 생성은 성공했지만 합성 데이터 생성 실패)
          return res.status(201).json({
            success: true,
            message: '상품이 생성되었습니다. 단, 제품 합성 관리 데이터 생성에 실패했습니다: ' + compError.message,
            product: data,
            compositionError: compError.message,
          });
        } else {
          console.log('[admin/products][POST] 합성 데이터 자동 생성 완료:', compositionSlug);
          
          // ✅ Phase 3: composition 폴더에 이미지 복사
          if (data.detail_images && data.detail_images.length > 0) {
            const firstImage = data.detail_images[0];
            
            try {
              // 이미지 URL에서 파일 경로 추출
              const imagePathMatch = firstImage.match(/\/blog-images\/(.+?)(?:\?|$)/);
              if (imagePathMatch) {
                const sourcePath = decodeURIComponent(imagePathMatch[1]);
                
                // composition 폴더 경로 결정
                const compositionFolder = compCategory === 'hat' || compCategory === 'accessory'
                  ? `originals/goods/${compositionSlug}/composition`
                  : `originals/products/${compositionSlug}/composition`;
                
                // 파일명 추출
                const fileName = sourcePath.split('/').pop();
                if (fileName) {
                  const targetPath = `${compositionFolder}/${fileName}`;
                  
                  // 원본 파일 다운로드
                  const { data: fileData, error: downloadError } = await supabase.storage
                    .from('blog-images')
                    .download(sourcePath);
                  
                  if (!downloadError && fileData) {
                    // composition 폴더에 업로드
                    const { error: uploadError } = await supabase.storage
                      .from('blog-images')
                      .upload(targetPath, fileData, {
                        contentType: 'image/webp',
                        cacheControl: '3600',
                        upsert: false
                      });
                    
                    if (uploadError) {
                      console.warn('[admin/products][POST] composition 폴더 이미지 복사 실패:', uploadError);
                    } else {
                      console.log('[admin/products][POST] composition 폴더 이미지 복사 완료:', targetPath);
                      
                      // product_composition의 image_url을 composition 폴더 경로로 업데이트
                      const compositionImageUrl = supabase.storage
                        .from('blog-images')
                        .getPublicUrl(targetPath).data.publicUrl;
                      
                      await supabase
                        .from('product_composition')
                        .update({ image_url: compositionImageUrl })
                        .eq('product_id', data.id);
                    }
                  } else {
                    console.warn('[admin/products][POST] 원본 이미지 다운로드 실패:', downloadError);
                  }
                }
              }
            } catch (copyError) {
              console.warn('[admin/products][POST] composition 폴더 이미지 복사 중 오류:', copyError);
              // 이미지 복사 실패해도 제품 생성은 성공으로 처리
            }
          }
        }
      } else {
        console.warn('[admin/products][POST] slug가 없어 합성 데이터를 생성할 수 없습니다. 제품명:', data.name);
        return res.status(201).json({
          success: true,
          message: '상품이 생성되었습니다. 단, slug가 없어 제품 합성 관리 데이터를 생성할 수 없습니다.',
          product: data,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: '상품이 생성되었습니다.',
      product: data,
    });
  } catch (error: any) {
    console.error('[admin/products][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 생성 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      name,
      sku,
      category,
      color,
      size,
      legacy_name,
      is_gift,
      is_sellable,
      is_active,
      normal_price,
      sale_price,
      is_component,
      condition,
      detail_images,
      subtitle,
      badge_left,
      badge_right,
      badge_left_color,
      badge_right_color,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: '상품 ID가 필요합니다.' });
    }

    const update: any = {};

    if (name !== undefined) update.name = name;
    if (sku !== undefined) update.sku = sku && sku.trim() !== '' ? sku.trim() : null;
    if (category !== undefined) update.category = category && category.trim() !== '' ? category.trim() : null;
    if (color !== undefined) update.color = color && color.trim() !== '' ? color.trim() : null;
    if (size !== undefined) update.size = size && size.trim() !== '' ? size.trim() : null;
    if (legacy_name !== undefined) update.legacy_name = legacy_name || null;
    if (is_gift !== undefined) update.is_gift = Boolean(is_gift);
    if (is_sellable !== undefined) update.is_sellable = Boolean(is_sellable);
    if (is_active !== undefined) update.is_active = Boolean(is_active);
    if (is_component !== undefined) update.is_component = Boolean(is_component);
    if (condition !== undefined) update.condition = condition || 'new';

    if (normal_price !== undefined) {
      update.normal_price =
        normal_price === null || normal_price === '' ? null : Number(normal_price);
    }
    if (sale_price !== undefined) {
      update.sale_price =
        sale_price === null || sale_price === '' ? null : Number(sale_price);
    }
    if (detail_images !== undefined) {
      update.detail_images = Array.isArray(detail_images) ? detail_images : [];
    }

    // 드라이버 제품 전용 필드
    if (subtitle !== undefined) update.subtitle = subtitle && subtitle.trim() !== '' ? subtitle.trim() : null;
    if (badge_left !== undefined) update.badge_left = badge_left && badge_left.trim() !== '' ? badge_left.trim() : null;
    if (badge_right !== undefined) update.badge_right = badge_right && badge_right.trim() !== '' ? badge_right.trim() : null;
    if (badge_left_color !== undefined) update.badge_left_color = badge_left_color && badge_left_color.trim() !== '' ? badge_left_color.trim() : null;
    if (badge_right_color !== undefined) update.badge_right_color = badge_right_color && badge_right_color.trim() !== '' ? badge_right_color.trim() : null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: '변경할 값이 없습니다.' });
    }

    // SKU 중복 체크 (SKU가 변경되는 경우)
    if (update.sku !== undefined && update.sku !== null && update.sku.trim() !== '') {
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('sku', update.sku.trim())
        .neq('id', id) // 현재 제품 제외
        .maybeSingle();

      if (checkError) {
        console.error('[admin/products][PUT] SKU 중복 체크 오류:', checkError);
        return res.status(500).json({
          success: false,
          message: 'SKU 중복 체크 중 오류가 발생했습니다.',
        });
      }

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `SKU "${update.sku}"가 이미 다른 제품("${existingProduct.name}")에서 사용 중입니다.`,
        });
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select(PRODUCT_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[admin/products][PUT] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '상품 수정에 실패했습니다.',
      });
    }

    // 합성 데이터 생성 (옵션이 활성화되고 합성 데이터가 없는 경우)
    const createComposition = req.body.createComposition === true;
    if (createComposition) {
      // 기존 합성 데이터 확인
      const { data: existingComposition } = await supabase
        .from('product_composition')
        .select('id')
        .eq('product_id', id)
        .maybeSingle();

      // 합성 데이터가 없고, 합성이 필요한 카테고리인 경우에만 생성
      if (!existingComposition) {
        const needsComposition = 
          data.category && 
          !['component', 'weight_pack', 'ball', 'tshirt'].includes(data.category) &&
          data.is_component !== true;

        if (needsComposition) {
          // slug 생성: products.slug 우선, 없으면 SKU에서 변환, 그것도 없으면 제품명에서 생성
          let compositionSlug = data.slug;
          
          if (!compositionSlug && data.sku) {
            compositionSlug = data.sku.toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          }
          
          if (!compositionSlug && data.name) {
            compositionSlug = data.name
              .toLowerCase()
              .replace(/[^a-z0-9가-힣\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
          }
          
            if (compositionSlug) {
            const normalizedCategory = data.category ? data.category.toLowerCase().trim() : null;
            
            let compCategory = 'accessory';
            let compTarget = 'hands';
            
            if (normalizedCategory === 'driver' || data.product_type === 'driver') {
              compCategory = 'driver';
              compTarget = 'hands';
            } else if (normalizedCategory === 'cap' || normalizedCategory === 'bucket_hat' || normalizedCategory === 'bucket-hat') {
              compCategory = 'hat'; // DB 체크 제약 조건에 맞춰 'hat' 사용
              compTarget = 'head';
            } else if (normalizedCategory === 'clutch' || normalizedCategory === 'bag') {
              compCategory = 'accessory';
              compTarget = 'hands';
            } else if (normalizedCategory === 'apparel' || normalizedCategory === 'tshirt') {
              compCategory = 'apparel';
              compTarget = 'body';
            }

            // ✅ 카테고리 검증 및 변환: cap -> hat (DB 체크 제약 조건에 맞춤)
            // 실제 DB 체크 제약 조건: 'driver', 'accessory', 'apparel', 'hat'만 허용
            const allowedCategories = ['hat', 'driver', 'accessory', 'apparel'];
            
            // cap을 hat으로 변환 (DB 스키마에 맞춤)
            if (compCategory === 'cap') {
              compCategory = 'hat';
              console.log('[admin/products][PUT] ✅ 카테고리 변환: cap -> hat');
            }
            
            if (!allowedCategories.includes(compCategory)) {
              console.error('[admin/products][PUT] ❌ 허용되지 않은 카테고리:', compCategory);
              compCategory = 'accessory'; // 기본값으로 강제 설정
              console.log('[admin/products][PUT] ✅ 카테고리를 기본값으로 변경:', compCategory);
            }

            const compositionData = {
              product_id: data.id,
              name: data.name,
              slug: compositionSlug,
              category: compCategory, // 검증된 카테고리만 사용
              composition_target: compTarget,
              image_url: data.detail_images && data.detail_images.length > 0 ? data.detail_images[0] : '',
              reference_images: data.detail_images || [],
              is_active: data.is_active,
              display_order: 0,
            };
            
            console.log('[admin/products][PUT] 삽입할 합성 데이터:', {
              category: compositionData.category,
              slug: compositionData.slug,
              name: compositionData.name,
            });
            
            const { error: compError } = await supabase
              .from('product_composition')
              .insert([compositionData]);
            
            if (compError) {
              console.error('[admin/products][PUT] 합성 데이터 생성 실패:', compError);
            } else {
              console.log('[admin/products][PUT] 합성 데이터 자동 생성 완료:', compositionSlug);
              
              // ✅ Phase 3: composition 폴더에 이미지 복사
              if (data.detail_images && data.detail_images.length > 0) {
                const firstImage = data.detail_images[0];
                
                try {
                  const imagePathMatch = firstImage.match(/\/blog-images\/(.+?)(?:\?|$)/);
                  if (imagePathMatch) {
                    const sourcePath = decodeURIComponent(imagePathMatch[1]);
                    const compositionFolder = compCategory === 'hat' || compCategory === 'accessory'
                      ? `originals/goods/${compositionSlug}/composition`
                      : `originals/products/${compositionSlug}/composition`;
                    const fileName = sourcePath.split('/').pop();
                    
                    if (fileName) {
                      const targetPath = `${compositionFolder}/${fileName}`;
                      const { data: fileData, error: downloadError } = await supabase.storage
                        .from('blog-images')
                        .download(sourcePath);
                      
                      if (!downloadError && fileData) {
                        const { error: uploadError } = await supabase.storage
                          .from('blog-images')
                          .upload(targetPath, fileData, {
                            contentType: 'image/webp',
                            cacheControl: '3600',
                            upsert: false
                          });
                        
                        if (!uploadError) {
                          const compositionImageUrl = supabase.storage
                            .from('blog-images')
                            .getPublicUrl(targetPath).data.publicUrl;
                          
                          await supabase
                            .from('product_composition')
                            .update({ image_url: compositionImageUrl })
                            .eq('product_id', data.id);
                          
                          console.log('[admin/products][PUT] composition 폴더 이미지 복사 완료:', targetPath);
                        }
                      }
                    }
                  }
                } catch (copyError) {
                  console.warn('[admin/products][PUT] composition 폴더 이미지 복사 중 오류:', copyError);
                }
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다.',
      product: data,
    });
  } catch (error: any) {
    console.error('[admin/products][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 수정 중 서버 오류가 발생했습니다.',
    });
  }
}

// DELETE는 실제 삭제 대신 is_active=false 로 소프트 삭제
// X-Hard-Delete 헤더가 있으면 실제 삭제 수행
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const idParam = req.query.id ?? (req.body && req.body.id);
    const id = typeof idParam === 'string' ? Number(idParam) : idParam;
    const hardDelete = req.headers['x-hard-delete'] === 'true';

    if (!id) {
      return res.status(400).json({ success: false, message: '상품 ID가 필요합니다.' });
    }

    if (hardDelete) {
      // 실제 삭제: 재고 이력도 함께 삭제
      // 1. 재고 이력 삭제
      const { error: inventoryError } = await supabase
        .from('inventory_transactions')
        .delete()
        .eq('product_id', id);

      if (inventoryError) {
        console.error('[admin/products][DELETE] Inventory deletion error', inventoryError);
        return res.status(500).json({
          success: false,
          message: '재고 이력 삭제 중 오류가 발생했습니다.',
        });
      }

      // 2. 제품 삭제
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[admin/products][DELETE] ERROR', deleteError);
        return res.status(500).json({
          success: false,
          message: deleteError.message || '상품 삭제에 실패했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        message: '상품이 완전히 삭제되었습니다.',
      });
    } else {
      // 소프트 삭제: is_active = false
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
        .select(PRODUCT_SELECT_COLUMNS)
        .single();

      if (error) {
        console.error('[admin/products][DELETE] ERROR', error);
        return res.status(500).json({
          success: false,
          message: error.message || '상품 비활성화에 실패했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        message: '상품이 비활성화되었습니다.',
        product: data,
      });
    }
  } catch (error: any) {
    console.error('[admin/products][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 삭제 중 서버 오류가 발생했습니다.',
    });
  }
}





