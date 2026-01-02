import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 1. 선물 지급 완료된 고객 목록 조회 (2025-12-18 이후)
    const { data: gifts, error: giftsError } = await supabase
      .from('customer_gifts')
      .select(`
        id,
        customer_id,
        survey_id,
        delivery_date,
        delivery_status,
        customers:customer_id (
          id,
          name,
          phone
        ),
        products:product_id (
          id,
          name
        )
      `)
      .eq('delivery_status', 'sent')
      .gte('delivery_date', '2025-12-18')
      .order('delivery_date', { ascending: false });

    if (giftsError) {
      console.error('[admin/surveys/check-and-update-gifts] 선물 조회 오류:', giftsError);
      return res.status(500).json({
        success: false,
        message: '선물 기록 조회에 실패했습니다.',
      });
    }

    const giftList = gifts || [];
    console.log(`[admin/surveys/check-and-update-gifts] 선물 지급 완료 건수: ${giftList.length}`);

    // 전화번호 정규화 함수 (하이픈 제거)
    const normalizePhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return phone.replace(/[-\s]/g, '');
    };

    // 2. 설문에 연결되지 않은 선물 찾기 (전화번호 및 이름으로 매칭 시도)
    const giftsWithoutSurvey = giftList.filter((g) => !g.survey_id);
    const surveyLinks: Array<{ giftId: number; surveyId: string }> = [];

    for (const gift of giftsWithoutSurvey) {
      const customer = gift.customers as any;
      if (!customer) continue;

      const normalizedCustomerPhone = normalizePhone(customer.phone);
      const customerName = customer.name?.trim();

      if (normalizedCustomerPhone) {
        // 1차: 전화번호로 정확히 매칭
        const { data: surveysByPhone } = await supabase
          .from('surveys')
          .select('id, phone, name')
          .limit(100);

        const matchingSurvey = surveysByPhone?.find((s) => {
          const normalizedSurveyPhone = normalizePhone(s.phone);
          return normalizedSurveyPhone === normalizedCustomerPhone;
        });

        if (matchingSurvey) {
          surveyLinks.push({
            giftId: gift.id,
            surveyId: matchingSurvey.id,
          });
          continue;
        }
      }

      // 2차: 이름으로 매칭 (전화번호가 없거나 매칭 실패한 경우)
      if (customerName) {
        const { data: surveysByName } = await supabase
          .from('surveys')
          .select('id, name, phone')
          .ilike('name', customerName)
          .limit(10);

        // 이름이 정확히 일치하는 설문 찾기
        const exactNameMatch = surveysByName?.find(
          (s) => s.name?.trim() === customerName,
        );

        if (exactNameMatch && !surveyLinks.find((l) => l.giftId === gift.id)) {
          surveyLinks.push({
            giftId: gift.id,
            surveyId: exactNameMatch.id,
          });
        }
      }
    }

    // 3. 설문 연결 업데이트
    let linkedCount = 0;
    for (const link of surveyLinks) {
      const { error: updateError } = await supabase
        .from('customer_gifts')
        .update({ survey_id: link.surveyId })
        .eq('id', link.giftId);

      if (!updateError) {
        linkedCount++;
      }
    }

    // 4. 선물 지급 완료된 설문의 gift_delivered 업데이트
    const { data: giftsWithSurvey } = await supabase
      .from('customer_gifts')
      .select('survey_id')
      .eq('delivery_status', 'sent')
      .gte('delivery_date', '2025-12-18')
      .not('survey_id', 'is', null);

    const surveyIds = [
      ...new Set(
        (giftsWithSurvey || [])
          .map((g) => g.survey_id)
          .filter(Boolean) as string[],
      ),
    ];

    let updatedCount = 0;
    if (surveyIds.length > 0) {
      const { data: updatedSurveys, error: updateError } = await supabase
        .from('surveys')
        .update({ gift_delivered: true })
        .in('id', surveyIds)
        .eq('gift_delivered', false)
        .select('id');

      if (updateError) {
        console.error('[admin/surveys/check-and-update-gifts] 설문 업데이트 오류:', updateError);
      } else {
        updatedCount = updatedSurveys?.length || 0;
      }
    }

    // 5. 최종 상태 확인
    const { data: finalGifts } = await supabase
      .from('customer_gifts')
      .select(`
        id,
        survey_id,
        delivery_date,
        customers:customer_id (
          name,
          phone
        ),
        products:product_id (
          name
        )
      `)
      .eq('delivery_status', 'sent')
      .gte('delivery_date', '2025-12-18')
      .order('delivery_date', { ascending: false });

    const { data: finalSurveys } = await supabase
      .from('surveys')
      .select('id, name, phone, gift_delivered')
      .in(
        'id',
        (finalGifts || [])
          .map((g) => g.survey_id)
          .filter(Boolean) as string[],
      );

    return res.status(200).json({
      success: true,
      message: '확인 및 업데이트가 완료되었습니다.',
      summary: {
        totalGifts: giftList.length,
        giftsWithSurvey: (finalGifts || []).filter((g) => g.survey_id).length,
        giftsWithoutSurvey: (finalGifts || []).filter((g) => !g.survey_id).length,
        surveysChecked: (finalSurveys || []).filter((s) => s.gift_delivered).length,
        surveysNotChecked: (finalSurveys || []).filter((s) => !s.gift_delivered).length,
        linkedCount,
        updatedCount,
      },
      gifts: finalGifts?.map((g) => ({
        id: g.id,
        customerName: (g.customers as any)?.name,
        customerPhone: (g.customers as any)?.phone,
        productName: (g.products as any)?.name,
        deliveryDate: g.delivery_date,
        surveyId: g.survey_id,
        hasSurvey: !!g.survey_id,
      })),
      surveys: finalSurveys?.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        giftDelivered: s.gift_delivered,
      })),
    });
  } catch (error: any) {
    console.error('[admin/surveys/check-and-update-gifts] 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

