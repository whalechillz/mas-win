import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { name, phone, date, time, service_type, location, notes } = req.body;
    
    // 필수 필드 검증
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ 
        error: '이름, 전화번호, 날짜, 시간은 필수입니다.' 
      });
    }
    
    // 전화번호 정규화
    const normalizedPhone = phone.replace(/[\s\-+]/g, '');
    
    // 기존 고객 정보 조회
    let customerId = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    }
    
    // 예약 생성
    const bookingData: any = {
      name,
      phone: normalizedPhone,
      date,
      time,
      service_type: service_type || '마쓰구 드라이버 시타서비스',
      location: location || 'Massgoo Studio',
      duration: 60,
      status: 'confirmed',
      notes: notes || null,
    };
    
    if (customerId) {
      bookingData.customer_profile_id = customerId;
    }
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    
    if (bookingError) {
      // 중복 예약 확인
      if (bookingError.code === '23505') {
        return res.status(409).json({ 
          error: '이미 해당 시간에 예약이 있습니다.' 
        });
      }
      throw bookingError;
    }
    
    // 고객 정보가 없으면 생성
    if (!customerId) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name,
          phone: normalizedPhone,
        })
        .select()
        .single();
      
      if (newCustomer) {
        // 예약에 고객 ID 연결
        await supabase
          .from('bookings')
          .update({ customer_profile_id: newCustomer.id })
          .eq('id', booking.id);
        
        booking.customer_profile_id = newCustomer.id;
      }
    } else {
      // 기존 고객의 방문 횟수 업데이트
      await supabase.rpc('increment_customer_visit_count', {
        customer_phone: normalizedPhone,
      }).catch(() => {
        // 함수가 없으면 직접 업데이트
        supabase
          .from('customers')
          .update({ 
            visit_count: supabase.raw('visit_count + 1'),
            last_visit_date: date,
          })
          .eq('phone', normalizedPhone);
      });
    }
    
    return res.status(201).json({ booking });
  } catch (error: any) {
    console.error('빠른 예약 추가 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}

