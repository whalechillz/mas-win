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
        // 제품 생성
        const newProduct = req.body;
        
        const { data: createdProduct, error: createError } = await supabase
          .from('product_composition')
          .insert([newProduct])
          .select()
          .single();

        if (createError) {
          console.error('❌ 제품 생성 오류:', createError);
          throw createError;
        }

        return res.status(201).json({
          success: true,
          product: createdProduct
        });

      case 'PUT':
        // 제품 수정
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            error: '제품 ID가 필요합니다.'
          });
        }

        const { data: updatedProduct, error: updateError } = await supabase
          .from('product_composition')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ 제품 수정 오류:', updateError);
          throw updateError;
        }

        return res.status(200).json({
          success: true,
          product: updatedProduct
        });

      case 'DELETE':
        // 제품 삭제 (실제로는 is_active = false로 설정)
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({
            success: false,
            error: '제품 ID가 필요합니다.'
          });
        }

        const { error: deleteError } = await supabase
          .from('product_composition')
          .update({ is_active: false })
          .eq('id', deleteId);

        if (deleteError) {
          console.error('❌ 제품 삭제 오류:', deleteError);
          throw deleteError;
        }

        return res.status(200).json({
          success: true,
          message: '제품이 비활성화되었습니다.'
        });

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
