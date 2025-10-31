import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * VIP 레벨 자동 분류 함수
 * - Platinum: 최근 3개월 이내 구매
 * - Gold: 최근 6개월 이내 구매
 * - Silver: 최근 1년 이내 구매 또는 구매 경과 기간 1-3년
 * - Bronze: 구매자이지만 최근 구매가 1년 이상 전
 * - null: 비구매자
 */
function calculateVipLevel(lastPurchaseDate: string | null, firstPurchaseDate: string | null): string | null {
  if (!lastPurchaseDate && !firstPurchaseDate) {
    return null; // 비구매자
  }

  const purchaseDate = lastPurchaseDate || firstPurchaseDate;
  if (!purchaseDate) return null;

  const now = new Date();
  const purchase = new Date(purchaseDate);
  const monthsSincePurchase = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsSincePurchase <= 3) {
    return 'platinum';
  } else if (monthsSincePurchase <= 6) {
    return 'gold';
  } else if (monthsSincePurchase <= 12) {
    return 'silver';
  } else if (monthsSincePurchase <= 36) {
    // 1-3년: Silver (재구매 유도 대상)
    return 'silver';
  } else {
    // 3년 이상: Bronze (장기 미구매자)
    return 'bronze';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 모든 고객 조회
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, last_purchase_date, first_purchase_date, vip_level');

    if (fetchError) {
      throw new Error(`고객 조회 실패: ${fetchError.message}`);
    }

    if (!customers || customers.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: '업데이트할 고객이 없습니다.',
        stats: { total: 0, updated: 0 }
      });
    }

    // VIP 레벨 계산 및 업데이트
    const updates: Array<{ id: number; vip_level: string | null }> = [];
    const stats = {
      total: customers.length,
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      noPurchase: 0,
      unchanged: 0,
      updated: 0
    };

    for (const customer of customers) {
      const newVipLevel = calculateVipLevel(
        customer.last_purchase_date,
        customer.first_purchase_date
      );

      // 변경이 필요한 경우만 업데이트
      if (customer.vip_level !== newVipLevel) {
        updates.push({
          id: customer.id,
          vip_level: newVipLevel
        });
        stats.updated++;

        if (newVipLevel === 'platinum') stats.platinum++;
        else if (newVipLevel === 'gold') stats.gold++;
        else if (newVipLevel === 'silver') stats.silver++;
        else if (newVipLevel === 'bronze') stats.bronze++;
        else stats.noPurchase++;
      } else {
        stats.unchanged++;
        if (customer.vip_level === 'platinum') stats.platinum++;
        else if (customer.vip_level === 'gold') stats.gold++;
        else if (customer.vip_level === 'silver') stats.silver++;
        else if (customer.vip_level === 'bronze') stats.bronze++;
        else stats.noPurchase++;
      }
    }

    // 배치 업데이트 (100개씩)
    if (updates.length > 0) {
      const CHUNK = 100;
      for (let i = 0; i < updates.length; i += CHUNK) {
        const batch = updates.slice(i, i + CHUNK);
        
        // 각 업데이트를 개별적으로 실행 (Supabase upsert는 한 번에 여러 개 업데이트가 어려움)
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ vip_level: update.vip_level, updated_at: new Date().toISOString() })
            .eq('id', update.id);

          if (updateError) {
            console.error(`VIP 레벨 업데이트 실패 (ID: ${update.id}):`, updateError);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `${stats.updated}명의 VIP 레벨이 업데이트되었습니다.`,
      stats: {
        ...stats,
        distribution: {
          platinum: stats.platinum,
          gold: stats.gold,
          silver: stats.silver,
          bronze: stats.bronze,
          noPurchase: stats.noPurchase
        }
      }
    });

  } catch (error: any) {
    console.error('VIP 레벨 업데이트 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'VIP 레벨 업데이트 중 오류가 발생했습니다.'
    });
  }
}
