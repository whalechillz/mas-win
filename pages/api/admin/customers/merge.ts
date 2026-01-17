/**
 * 고객 병합 API
 * 
 * 전화번호가 바뀐 고객을 병합하는 기능
 * - 소스 고객의 bookings를 타겟 고객으로 이동
 * - 소스 고객의 이전 전화번호를 타겟 고객의 previous_phones에 추가
 * - 소스 고객 삭제 (또는 is_merged 플래그 설정)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 인증 체크
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sourceCustomerId, targetCustomerId } = req.body;

    if (!sourceCustomerId || !targetCustomerId) {
      return res.status(400).json({ 
        error: 'sourceCustomerId와 targetCustomerId가 필요합니다.' 
      });
    }

    if (sourceCustomerId === targetCustomerId) {
      return res.status(400).json({ 
        error: '소스 고객과 타겟 고객이 같을 수 없습니다.' 
      });
    }

    console.log(`🔄 고객 병합 시작: ${sourceCustomerId} → ${targetCustomerId}`);

    // 1. 소스 고객 정보 조회
    const { data: sourceCustomer, error: sourceError } = await supabase
      .from('customers')
      .select('id, name, phone, previous_phones')
      .eq('id', sourceCustomerId)
      .single();

    if (sourceError || !sourceCustomer) {
      return res.status(404).json({ 
        error: `소스 고객을 찾을 수 없습니다: ${sourceCustomerId}` 
      });
    }

    // 2. 타겟 고객 정보 조회
    const { data: targetCustomer, error: targetError } = await supabase
      .from('customers')
      .select('id, name, phone, previous_phones')
      .eq('id', targetCustomerId)
      .single();

    if (targetError || !targetCustomer) {
      return res.status(404).json({ 
        error: `타겟 고객을 찾을 수 없습니다: ${targetCustomerId}` 
      });
    }

    console.log(`   소스: ${sourceCustomer.name} (${sourceCustomer.phone})`);
    console.log(`   타겟: ${targetCustomer.name} (${targetCustomer.phone})`);

    // 3. 소스 고객의 bookings 개수 확인
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_profile_id', sourceCustomerId);

    console.log(`   이동할 예약: ${bookingsCount || 0}건`);

    // 4. bookings의 customer_profile_id를 타겟 고객으로 업데이트
    if (bookingsCount && bookingsCount > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ customer_profile_id: targetCustomerId })
        .eq('customer_profile_id', sourceCustomerId);

      if (updateError) {
        console.error('❌ bookings 업데이트 오류:', updateError);
        return res.status(500).json({ 
          error: '예약 정보 업데이트 실패',
          details: updateError.message 
        });
      }

      console.log(`   ✅ ${bookingsCount}건의 예약을 타겟 고객으로 이동 완료`);
    }

    // 5. 타겟 고객의 previous_phones에 소스 고객의 전화번호 추가
    const previousPhones = Array.isArray(targetCustomer.previous_phones) 
      ? [...targetCustomer.previous_phones] 
      : [];

    // 소스 고객의 전화번호가 없으면 추가
    if (sourceCustomer.phone && !previousPhones.includes(sourceCustomer.phone)) {
      previousPhones.push(sourceCustomer.phone);
    }

    // 소스 고객의 previous_phones도 병합
    if (Array.isArray(sourceCustomer.previous_phones)) {
      sourceCustomer.previous_phones.forEach((phone: string) => {
        if (phone && !previousPhones.includes(phone)) {
          previousPhones.push(phone);
        }
      });
    }

    // 타겟 고객의 previous_phones 업데이트
    if (previousPhones.length > 0) {
      const { error: updatePhonesError } = await supabase
        .from('customers')
        .update({ previous_phones: previousPhones })
        .eq('id', targetCustomerId);

      if (updatePhonesError) {
        console.warn('⚠️ previous_phones 업데이트 실패 (계속 진행):', updatePhonesError);
      } else {
        console.log(`   ✅ 이전 전화번호 이력 업데이트: ${previousPhones.length}개`);
      }
    }

    // 6. 소스 고객 삭제
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', sourceCustomerId);

    if (deleteError) {
      console.error('❌ 고객 삭제 오류:', deleteError);
      return res.status(500).json({ 
        error: '고객 삭제 실패',
        details: deleteError.message 
      });
    }

    console.log(`   ✅ 소스 고객 삭제 완료`);

    return res.status(200).json({
      success: true,
      message: '고객 병합이 완료되었습니다.',
      data: {
        sourceCustomer: {
          id: sourceCustomerId,
          name: sourceCustomer.name,
          phone: sourceCustomer.phone
        },
        targetCustomer: {
          id: targetCustomerId,
          name: targetCustomer.name,
          phone: targetCustomer.phone
        },
        movedBookings: bookingsCount || 0,
        previousPhonesCount: previousPhones.length
      }
    });

  } catch (error: any) {
    console.error('❌ 고객 병합 오류:', error);
    return res.status(500).json({ 
      error: '고객 병합 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
