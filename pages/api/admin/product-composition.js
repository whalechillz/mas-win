// 제품 합성 관리 API
// Supabase product_composition 테이블 기반

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  try {
    const supabase = createServerSupabase();

    switch (req.method) {
      case 'GET':
        // 제품 목록 조회
        const { category, target, active } = req.query;
        
        let query = supabase
          .from('product_composition')
          .select('*')
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
