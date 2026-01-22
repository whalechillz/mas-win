import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 고객 세그먼트 관리 API
 * 
 * GET /api/admin/customer-segments - 세그먼트 목록 조회
 * POST /api/admin/customer-segments - 새 세그먼트 생성
 * PUT /api/admin/customer-segments?id={id} - 세그먼트 수정
 * DELETE /api/admin/customer-segments?id={id} - 세그먼트 삭제
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: 세그먼트 목록 조회
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('세그먼트 목록 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '세그먼트 목록을 불러올 수 없습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    // POST: 새 세그먼트 생성
    if (req.method === 'POST') {
      const { name, description, filter_config } = req.body;

      if (!name || !filter_config) {
        return res.status(400).json({
          success: false,
          message: '세그먼트명과 필터 설정이 필요합니다.'
        });
      }

      // 필터 설정으로 수신자 수 계산
      const recipientCount = await calculateRecipientCount(filter_config);

      const { data, error } = await supabase
        .from('customer_segments')
        .insert({
          name,
          description: description || null,
          filter_config,
          recipient_count: recipientCount,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('세그먼트 생성 오류:', error);
        return res.status(500).json({
          success: false,
          message: '세그먼트 생성에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data
      });
    }

    // PUT: 세그먼트 수정
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, description, filter_config } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '세그먼트 ID가 필요합니다.'
        });
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (filter_config) {
        updateData.filter_config = filter_config;
        // 필터 설정 변경 시 수신자 수 재계산
        updateData.recipient_count = await calculateRecipientCount(filter_config);
      }

      const { data, error } = await supabase
        .from('customer_segments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('세그먼트 수정 오류:', error);
        return res.status(500).json({
          success: false,
          message: '세그먼트 수정에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data
      });
    }

    // DELETE: 세그먼트 삭제
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '세그먼트 ID가 필요합니다.'
        });
      }

      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('세그먼트 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          message: '세그먼트 삭제에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '세그먼트가 삭제되었습니다.'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error: any) {
    console.error('세그먼트 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 필터 설정으로 수신자 수 계산
 */
async function calculateRecipientCount(filterConfig: any): Promise<number> {
  try {
    // Supabase에서 직접 조회하여 정확한 수 계산
    let query = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('opt_out', false)
      .not('phone', 'is', null);

    // 구매 여부 필터
    if (filterConfig.purchased === 'true') {
      query = query.not('last_purchase_date', 'is', null);
    } else if (filterConfig.purchased === 'false') {
      query = query.is('last_purchase_date', null);
    }

    // VIP 레벨 필터
    if (filterConfig.vipLevel) {
      query = query.eq('vip_level', filterConfig.vipLevel);
    }

    // 구매 경과 기간 필터 (구매자만)
    if (filterConfig.purchased === 'true' && filterConfig.purchaseYears) {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filterConfig.purchaseYears) {
        case '0-1':
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case '1-3':
          cutoffDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
          query = query.lt('last_purchase_date', cutoffDate.toISOString());
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          query = query.gte('last_purchase_date', cutoffDate.toISOString());
          break;
        case '3-5':
          cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          query = query.lt('last_purchase_date', cutoffDate.toISOString());
          cutoffDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
          query = query.gte('last_purchase_date', cutoffDate.toISOString());
          break;
        case '5+':
          cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          query = query.lt('last_purchase_date', cutoffDate.toISOString());
          break;
      }
    }

    // 최근 연락일 필터 (비구매자만)
    if (filterConfig.purchased === 'false' && filterConfig.contactDays) {
      const days = parseInt(filterConfig.contactDays);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query = query.or(`last_contact_date.gte.${cutoffDate.toISOString()},first_inquiry_date.gte.${cutoffDate.toISOString()}`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('수신자 수 계산 오류:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('수신자 수 계산 오류:', error);
    return 0;
  }
}
