import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 1. 전체 상품 목록 조회 (활성 상품만)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category, normal_price, sale_price, is_active')
      .eq('is_active', true);

    if (productsError) throw productsError;

    // 2. 모든 재고 트랜잭션 조회
    const { data: transactions, error: transactionsError } = await supabase
      .from('inventory_transactions')
      .select('product_id, quantity, tx_type, tx_date')
      .order('tx_date', { ascending: false });

    if (transactionsError) throw transactionsError;

    // 3. 상품별 재고 수량 계산
    const productStockMap: Record<number, number> = {};
    transactions?.forEach((tx) => {
      if (!productStockMap[tx.product_id]) {
        productStockMap[tx.product_id] = 0;
      }
      productStockMap[tx.product_id] += tx.quantity || 0;
    });

    // 4. 전체 재고 현황 계산
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalValue = 0;
    const categoryStats: Record<
      string,
      { count: number; quantity: number; value: number }
    > = {};

    products?.forEach((product) => {
      const stock = productStockMap[product.id] || 0;
      if (stock > 0) {
        totalProducts++;
        totalQuantity += stock;
        // 재고 가치 계산 (할인가 우선, 없으면 정상가)
        const price = product.sale_price || product.normal_price || 0;
        totalValue += stock * price;

        // 카테고리별 통계
        const category = product.category || '기타';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, quantity: 0, value: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].quantity += stock;
        categoryStats[category].value += stock * price;
      }
    });

    // 5. 재고 부족 상품 (재고 0 이하)
    const lowStockProducts = products
      ?.filter((p) => (productStockMap[p.id] || 0) <= 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || '기타',
        stock: productStockMap[p.id] || 0,
      }))
      .slice(0, 20); // 최대 20개

    // 6. 최근 입고/출고 이력 (최근 20건)
    const recentTransactions = transactions
      ?.slice(0, 20)
      .map((tx) => {
        const product = products?.find((p) => p.id === tx.product_id);
        return {
          id: tx.product_id,
          product_name: product?.name || '알 수 없음',
          tx_type: tx.tx_type,
          quantity: tx.quantity,
          tx_date: tx.tx_date,
        };
      });

    // 7. 카테고리별 통계를 배열로 변환
    const categoryStatsArray = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
    }));

    // 8. 선물 통계 조회
    const { data: giftStats, error: giftStatsError } = await supabase
      .from('inventory_dashboard_view')
      .select('*')
      .single();

    if (giftStatsError) {
      console.warn('[admin/inventory/dashboard] 선물 통계 조회 실패:', giftStatsError);
    }

    // 9. 최근 선물 지급 이력 조회
    const { data: recentGifts, error: recentGiftsError } = await supabase
      .from('customer_gifts')
      .select(
        `
        id,
        customer_id,
        product_id,
        gift_text,
        quantity,
        delivery_date,
        delivery_type,
        delivery_status,
        note,
        created_at,
        customers:customer_id (id, name, phone),
        products:product_id (id, name, category)
      `,
      )
      .neq('delivery_status', 'canceled')
      .order('delivery_date', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(30);

    if (recentGiftsError) {
      console.warn('[admin/inventory/dashboard] 선물 이력 조회 실패:', recentGiftsError);
    }

    // 10. 재고 출고 이력 (선물 vs 판매 구분)
    const { data: outboundTransactions, error: outboundError } = await supabase
      .from('inventory_transactions')
      .select('id, product_id, quantity, tx_type, tx_date, note, related_gift_id')
      .eq('tx_type', 'outbound')
      .order('tx_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(30);

    if (outboundError) {
      console.warn('[admin/inventory/dashboard] 출고 이력 조회 실패:', outboundError);
    }

    // 출고 이력에 선물/판매 구분 추가
    const enrichedOutbound = await Promise.all(
      (outboundTransactions || []).map(async (tx) => {
        const product = products?.find((p) => p.id === tx.product_id);
        let outboundType = '기타';
        let customerName = null;

        // 판매 여부 확인 (note에 판매/구매 키워드)
        if (tx.note && (tx.note.includes('판매') || tx.note.includes('구매'))) {
          outboundType = '판매';
          // note에서 고객명 추출 시도
          const nameMatch = tx.note.match(/(?:판매|구매)[:\s]*([가-힣\s]+)/);
          if (nameMatch) {
            customerName = nameMatch[1].trim();
          }
        } else {
          // 선물 여부 확인 (같은 날짜, 같은 상품의 선물 기록)
          const txDateStr = tx.tx_date ? new Date(tx.tx_date).toISOString().split('T')[0] : null;
          const matchingGift = recentGifts?.find(
            (g) => {
              if (g.product_id !== tx.product_id || !g.delivery_date || !txDateStr) {
                return false;
              }
              const giftDateStr = new Date(g.delivery_date).toISOString().split('T')[0];
              return giftDateStr === txDateStr;
            },
          );
          if (matchingGift) {
            outboundType = '선물';
            customerName = (matchingGift.customers as any)?.name || null;
          }
        }

        return {
          id: tx.id,
          product_id: tx.product_id,
          product_name: product?.name || '알 수 없음',
          category: product?.category || '기타',
          tx_type: tx.tx_type,
          quantity: tx.quantity,
          tx_date: tx.tx_date,
          note: tx.note,
          outbound_type: outboundType,
          customer_name: customerName,
          related_gift_id: (tx as any).related_gift_id || null,
        };
      }),
    );

    // 11. 카테고리별 선물 통계
    const categoryGiftStats: Record<
      string,
      { customer_count: number; gift_count: number; total_quantity: number }
    > = {};

    recentGifts?.forEach((gift) => {
      const category = (gift.products as any)?.category || '기타';
      if (!categoryGiftStats[category]) {
        categoryGiftStats[category] = {
          customer_count: 0,
          gift_count: 0,
          total_quantity: 0,
        };
      }
      categoryGiftStats[category].gift_count++;
      categoryGiftStats[category].total_quantity += gift.quantity || 0;
    });

    // 고유 고객 수 계산
    Object.keys(categoryGiftStats).forEach((category) => {
      const uniqueCustomers = new Set(
        recentGifts
          ?.filter((g) => ((g.products as any)?.category || '기타') === category)
          .map((g) => g.customer_id) || [],
      );
      categoryGiftStats[category].customer_count = uniqueCustomers.size;
    });

    const categoryGiftStatsArray = Object.entries(categoryGiftStats).map(([category, stats]) => ({
      category,
      ...stats,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        totalQuantity,
        totalValue,
      },
      giftStats: giftStats || {
        total_gift_customers: 0,
        total_gift_count: 0,
        total_gift_quantity: 0,
        total_sale_count: 0,
        total_sale_quantity: 0,
      },
      categoryStats: categoryStatsArray,
      categoryGiftStats: categoryGiftStatsArray,
      lowStockProducts: lowStockProducts || [],
      recentTransactions: recentTransactions || [],
      recentGifts: (recentGifts || []).map((g) => ({
        id: g.id,
        customer_id: g.customer_id,
        customer_name: (g.customers as any)?.name || '알 수 없음',
        customer_phone: (g.customers as any)?.phone || '',
        product_id: g.product_id,
        product_name: (g.products as any)?.name || g.gift_text || '사은품',
        product_category: (g.products as any)?.category || '기타',
        quantity: g.quantity,
        delivery_date: g.delivery_date,
        delivery_type: g.delivery_type,
        delivery_status: g.delivery_status,
        note: g.note,
        created_at: g.created_at,
      })),
      outboundHistory: enrichedOutbound,
    });
  } catch (error: any) {
    console.error('[admin/inventory/dashboard] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '재고 대시보드 데이터 조회에 실패했습니다.',
    });
  }
}








