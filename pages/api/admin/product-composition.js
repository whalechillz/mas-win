// 제품 합성 관리 API
// Supabase product_composition 테이블 기반

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  try {
    const supabase = createServerSupabase();

    switch (req.method) {
      case 'GET':
        // 제품 목록 조회 (products 테이블과 조인)
        const { category, target, active } = req.query;
        
        let query = supabase
          .from('product_composition')
          .select(`
            *,
            products:product_id (
              id,
              name,
              slug,
              category,
              is_active
            )
          `)
          .order('display_order', { ascending: true });

        // 필터 적용
        if (category) {
          query = query.eq('category', category);
        }
        if (target) {
          query = query.eq('composition_target', target);
        }
        if (active !== undefined) {
          query = query.eq('is_active', active === 'true');
        }

        const { data: products, error } = await query;

        if (error) {
          console.error('❌ Supabase 쿼리 오류:', error);
          throw error;
        }

        return res.status(200).json({
          success: true,
          products: products || []
        });

      case 'POST':
        // 제품 생성 (product_composition + products 테이블에 동시 생성)
        const newProduct = req.body;
        
        console.log('[admin/product-composition][POST] 제품 추가 요청:', {
          name: newProduct.name,
          category: newProduct.category,
          slug: newProduct.slug,
        });

        // ✅ 1단계: products 테이블에 제품 생성
        let productId = null;
        
        // 카테고리 매핑: product_composition.category -> products.category
        // product_composition: 'hat', 'driver', 'accessory', 'apparel'
        // products: 'cap', 'driver', 'accessory', 'apparel', 'component', 'weight_pack', 'ball', 'tshirt', 'clutch', 'bag'
        let productCategory = 'accessory';
        if (newProduct.category === 'hat') {
          productCategory = 'cap'; // hat -> cap 변환
        } else if (newProduct.category === 'driver') {
          productCategory = 'driver';
        } else if (newProduct.category === 'apparel') {
          productCategory = 'apparel';
        } else if (newProduct.category === 'accessory') {
          productCategory = 'accessory';
        }

        // SKU 생성: slug에서 변환 (없으면 제품명에서 생성)
        let productSku = null;
        if (newProduct.slug) {
          productSku = newProduct.slug.toUpperCase().replace(/-/g, '_');
        } else if (newProduct.name) {
          // 제품명에서 slug 생성 후 SKU 변환
          const slugFromName = newProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          productSku = slugFromName.toUpperCase().replace(/-/g, '_');
        }

        // slug 생성: 전달된 slug 우선, 없으면 제품명에서 생성
        let productSlug = newProduct.slug;
        if (!productSlug && newProduct.name) {
          productSlug = newProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        }

        // detail_images 생성: image_url과 reference_images 결합
        const detailImages = [];
        if (newProduct.image_url) {
          detailImages.push(newProduct.image_url);
        }
        if (newProduct.reference_images && Array.isArray(newProduct.reference_images)) {
          detailImages.push(...newProduct.reference_images.filter(img => img && img !== newProduct.image_url));
        }

        const productData = {
          name: newProduct.name,
          sku: productSku,
          slug: productSlug,
          category: productCategory,
          is_gift: false,
          is_sellable: false,
          is_active: newProduct.is_active !== false,
          detail_images: detailImages.length > 0 ? detailImages : null,
          needs_composition: true, // 합성 관리에서 추가된 제품은 합성 필요
        };

        console.log('[admin/product-composition][POST] products 테이블에 추가할 데이터:', {
          name: productData.name,
          sku: productData.sku,
          slug: productData.slug,
          category: productData.category,
        });

        const { data: createdProductInProducts, error: productCreateError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (productCreateError) {
          console.error('[admin/product-composition][POST] ❌ products 테이블 생성 오류:', productCreateError);
          // products 생성 실패해도 product_composition은 생성 시도
          console.warn('[admin/product-composition][POST] ⚠️ products 생성 실패, product_composition만 생성 시도');
        } else {
          productId = createdProductInProducts.id;
          console.log('[admin/product-composition][POST] ✅ products 테이블 생성 성공:', {
            productId,
            name: createdProductInProducts.name,
          });
        }

        // ✅ 2단계: product_composition 테이블에 제품 생성
        const compositionData = {
          ...newProduct,
          product_id: productId, // products 테이블의 ID 연결
        };

        // 카테고리 변환: cap -> hat (DB 체크 제약 조건에 맞춤)
        if (compositionData.category === 'cap') {
          compositionData.category = 'hat';
          console.log('[admin/product-composition][POST] ✅ 카테고리 변환: cap -> hat');
        }

        const { data: createdProduct, error: createError } = await supabase
          .from('product_composition')
          .insert([compositionData])
          .select()
          .single();

        if (createError) {
          console.error('[admin/product-composition][POST] ❌ product_composition 테이블 생성 오류:', createError);
          
          // product_composition 생성 실패 시 products도 롤백
          if (productId) {
            console.log('[admin/product-composition][POST] 🔄 products 롤백 시도:', productId);
            await supabase
              .from('products')
              .delete()
              .eq('id', productId);
          }
          
          throw createError;
        }

        console.log('[admin/product-composition][POST] ✅ product_composition 테이블 생성 성공:', {
          compositionId: createdProduct.id,
          productId: createdProduct.product_id,
        });

        return res.status(201).json({
          success: true,
          product: createdProduct,
          productInProducts: createdProductInProducts || null, // products 테이블 생성 결과도 반환
        });

      case 'PUT':
        // 제품 수정 (product_composition + products 테이블 동시 업데이트)
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            error: '제품 ID가 필요합니다.'
          });
        }

        console.log('[admin/product-composition][PUT] 제품 수정 요청:', {
          id,
          name: updateData.name,
          category: updateData.category,
        });

        // ✅ 1단계: product_composition 테이블 업데이트
        // 카테고리 변환: cap -> hat (DB 체크 제약 조건에 맞춤)
        const compositionUpdateData = { ...updateData };
        if (compositionUpdateData.category === 'cap') {
          compositionUpdateData.category = 'hat';
          console.log('[admin/product-composition][PUT] ✅ 카테고리 변환: cap -> hat');
        }

        const { data: updatedProduct, error: updateError } = await supabase
          .from('product_composition')
          .update(compositionUpdateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('[admin/product-composition][PUT] ❌ product_composition 업데이트 오류:', updateError);
          throw updateError;
        }

        console.log('[admin/product-composition][PUT] ✅ product_composition 업데이트 성공:', {
          compositionId: updatedProduct.id,
          productId: updatedProduct.product_id,
        });

        // ✅ 2단계: products 테이블도 업데이트 (product_id가 있는 경우)
        let updatedProductInProducts = null;
        if (updatedProduct.product_id) {
          // 카테고리 매핑: product_composition.category -> products.category
          let productCategory = 'accessory';
          if (updatedProduct.category === 'hat') {
            productCategory = 'cap';
          } else if (updatedProduct.category === 'driver') {
            productCategory = 'driver';
          } else if (updatedProduct.category === 'apparel') {
            productCategory = 'apparel';
          } else if (updatedProduct.category === 'accessory') {
            productCategory = 'accessory';
          }

          // detail_images 생성: image_url과 reference_images 결합
          const detailImages = [];
          if (updatedProduct.image_url) {
            detailImages.push(updatedProduct.image_url);
          }
          if (updatedProduct.reference_images && Array.isArray(updatedProduct.reference_images)) {
            detailImages.push(...updatedProduct.reference_images.filter(img => img && img !== updatedProduct.image_url));
          }

          const productUpdateData = {
            name: updatedProduct.name,
            category: productCategory,
            is_active: updatedProduct.is_active,
            detail_images: detailImages.length > 0 ? detailImages : null,
            needs_composition: true,
          };

          // slug가 변경된 경우 SKU도 업데이트
          if (updatedProduct.slug) {
            productUpdateData.slug = updatedProduct.slug;
            productUpdateData.sku = updatedProduct.slug.toUpperCase().replace(/-/g, '_');
          }

          console.log('[admin/product-composition][PUT] products 테이블 업데이트 시도:', {
            productId: updatedProduct.product_id,
            name: productUpdateData.name,
            category: productUpdateData.category,
          });

          const { data: updatedProductData, error: productUpdateError } = await supabase
            .from('products')
            .update(productUpdateData)
            .eq('id', updatedProduct.product_id)
            .select()
            .single();

          if (productUpdateError) {
            console.error('[admin/product-composition][PUT] ⚠️ products 업데이트 오류 (무시):', productUpdateError);
            // products 업데이트 실패해도 product_composition 업데이트는 성공으로 처리
          } else {
            updatedProductInProducts = updatedProductData;
            console.log('[admin/product-composition][PUT] ✅ products 업데이트 성공');
          }
        } else {
          console.log('[admin/product-composition][PUT] ⚠️ product_id가 없어 products 업데이트 건너뜀');
        }

        return res.status(200).json({
          success: true,
          product: updatedProduct,
          productInProducts: updatedProductInProducts, // products 테이블 업데이트 결과도 반환
        });

      case 'DELETE':
        // 제품 삭제
        const { id: deleteId } = req.query;
        const isHardDelete = req.headers['x-hard-delete'] === 'true';
        
        if (!deleteId) {
          return res.status(400).json({
            success: false,
            error: '제품 ID가 필요합니다.'
          });
        }

        if (isHardDelete) {
          // 완전 삭제
          const { error: deleteError } = await supabase
            .from('product_composition')
            .delete()
            .eq('id', deleteId);

          if (deleteError) {
            console.error('❌ 제품 완전 삭제 오류:', deleteError);
            throw deleteError;
          }

          return res.status(200).json({
            success: true,
            message: '제품이 완전히 삭제되었습니다.'
          });
        } else {
          // 비활성화 (기존 동작)
          const { error: deleteError } = await supabase
            .from('product_composition')
            .update({ is_active: false })
            .eq('id', deleteId);

          if (deleteError) {
            console.error('❌ 제품 비활성화 오류:', deleteError);
            throw deleteError;
          }

          return res.status(200).json({
            success: true,
            message: '제품이 비활성화되었습니다.'
          });
        }

      case 'PATCH':
        // 순서 변경
        const { id: orderId, direction } = req.body;
        
        if (!orderId || !direction) {
          return res.status(400).json({
            success: false,
            error: '제품 ID와 방향(up/down)이 필요합니다.'
          });
        }

        // 현재 제품 조회
        const { data: currentProduct, error: currentError } = await supabase
          .from('product_composition')
          .select('id, display_order')
          .eq('id', orderId)
          .single();

        if (currentError || !currentProduct) {
          return res.status(404).json({
            success: false,
            error: '제품을 찾을 수 없습니다.'
          });
        }

        const currentOrder = currentProduct.display_order;
        const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

        // 같은 순서를 가진 다른 제품 찾기
        const { data: swapProduct, error: swapError } = await supabase
          .from('product_composition')
          .select('id')
          .eq('display_order', newOrder)
          .neq('id', orderId)
          .maybeSingle();

        if (swapError) {
          console.error('❌ 순서 변경 오류:', swapError);
          throw swapError;
        }

        // 트랜잭션: 두 제품의 순서 교환
        if (swapProduct) {
          // 다른 제품의 순서를 현재 제품의 순서로 변경
          await supabase
            .from('product_composition')
            .update({ display_order: currentOrder })
            .eq('id', swapProduct.id);
        }

        // 현재 제품의 순서 변경
        const { data: updatedOrderProduct, error: updateOrderError } = await supabase
          .from('product_composition')
          .update({ display_order: newOrder, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select()
          .single();

        if (updateOrderError) {
          console.error('❌ 순서 변경 오류:', updateOrderError);
          throw updateOrderError;
        }

        return res.status(200).json({
          success: true,
          product: updatedOrderProduct
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('❌ 제품 합성 API 오류:', error);
    console.error('❌ 에러 상세:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      method: req.method
    });
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}
