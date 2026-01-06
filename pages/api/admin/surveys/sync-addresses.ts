import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { customerIds } = req.body; // 개별 동기화 시 특정 고객 ID 배열, 없으면 전체

    // 주소 정규화 함수 (공백 제거 및 정규화)
    const normalizeForCompare = (addr: string | null | undefined): string => {
      if (!addr) return '';
      return addr.trim().replace(/\s+/g, ' '); // 앞뒤 공백 제거, 중간 공백 정규화
    };

    const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];

    // 고객 조회: customerIds가 있으면 해당 고객만, 없으면 전체
    let customersQuery = supabase.from('customers').select('id, phone, address');

    if (customerIds && customerIds.length > 0) {
      customersQuery = customersQuery.in('id', customerIds);
    }

    const { data: customers, error: customersError } = await customersQuery;

    if (customersError) {
      console.error('고객 조회 오류:', customersError);
      return res.status(500).json({
        success: false,
        message: '고객 조회 중 오류가 발생했습니다.',
      });
    }

    if (!customers || customers.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동기화할 고객이 없습니다.',
        data: { updated: 0, total: 0 },
      });
    }

    // 각 고객의 설문 주소 조회 및 동기화 필요 여부 확인
    const updates = await Promise.all(
      customers.map(async (customer) => {
        // 가장 최근 설문의 실제 주소 조회
        const { data: surveys } = await supabase
          .from('surveys')
          .select('address')
          .eq('phone', customer.phone)
          .not('address', 'is', null)
          .neq('address', '')
          .not('address', 'like', '[%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!surveys || surveys.length === 0 || !surveys[0].address) {
          return null;
        }

        const surveyAddress = surveys[0].address.trim();
        // 플레이스홀더가 아닌 실제 주소만 사용
        if (placeholders.includes(surveyAddress)) {
          return null;
        }

        // 고객관리 주소 정규화
        const customerAddr = normalizeForCompare(customer.address);
        const normalizedSurveyAddr = normalizeForCompare(surveyAddress);

        // 동기화 조건:
        // 1. 고객관리 주소가 없거나 플레이스홀더인 경우
        // 2. 또는 고객관리 주소와 설문 주소가 다른 경우 (정규화 후 비교)
        const shouldSync =
          !customerAddr ||
          customerAddr.startsWith('[') ||
          customerAddr === 'N/A' ||
          customerAddr !== normalizedSurveyAddr;

        if (shouldSync) {
          return {
            customer_id: customer.id,
            address: surveyAddress, // 원본 주소 저장 (trim만 적용)
          };
        }

        return null;
      }),
    );

    const validUpdates = updates.filter((u) => u !== null) as Array<{
      customer_id: number;
      address: string;
    }>;

    if (validUpdates.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동기화할 고객이 없습니다. (설문 주소가 플레이스홀더이거나 없음)',
        data: { updated: 0, total: customers.length },
      });
    }

    // 일괄 업데이트
    let updatedCount = 0;
    const errors: string[] = [];

    for (const update of validUpdates) {
      const { error } = await supabase
        .from('customers')
        .update({ address: update.address })
        .eq('id', update.customer_id);

      if (error) {
        console.error(`고객 ${update.customer_id} 업데이트 오류:`, error);
        errors.push(`고객 ID ${update.customer_id}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `${updatedCount}명의 고객 주소가 업데이트되었습니다.${errors.length > 0 ? ` (${errors.length}건 실패)` : ''}`,
      data: {
        updated: updatedCount,
        total: customers.length,
        valid: validUpdates.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('주소 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '주소 동기화 중 오류가 발생했습니다.',
    });
  }
}

