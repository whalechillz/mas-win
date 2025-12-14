import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);

      case 'POST':
        const { 
          name, 
          phone, 
          date, 
          time, 
          club, // 기존 호환성을 위해 유지
          notes,
          service_type,
          email,
          current_distance,
          age_group,
          duration,
          location,
          customer_profile_id,
          // 새로운 필드들
          club_brand,
          club_loft,
          club_shaft,
          trajectory,
          shot_shape
        } = body;

        if (!name || !phone || !date || !time) {
          return res.status(400).json({ error: '필수 필드가 누락되었습니다. (name, phone, date, time)' });
        }

        // 전화번호 정규화
        const normalizedPhone = phone.replace(/[\s\-+]/g, '');
        
        // 고객 정보 자동 매칭 또는 생성 (전화번호 우선, 없으면 이름으로 검색)
        let matchedCustomerId = customer_profile_id || null;
        let finalPhone = normalizedPhone;
        
        if (!matchedCustomerId && normalizedPhone) {
          // 1. 전화번호로 고객 찾기
          const { data: customer } = await supabase
            .from('customers')
            .select('id, phone, name')
            .eq('phone', normalizedPhone)
            .single();
          
          if (customer) {
            matchedCustomerId = customer.id;
            finalPhone = customer.phone; // 정규화된 전화번호 사용
          }
        }
        
        // 2. 전화번호로 못 찾았고 이름이 있으면 이름으로 검색
        if (!matchedCustomerId && name && name.trim()) {
          const cleanName = name.trim();
          const { data: customers } = await supabase
            .from('customers')
            .select('id, name, phone')
            .ilike('name', `%${cleanName}%`)
            .order('visit_count', { ascending: false }) // 방문 횟수가 많은 것 우선
            .limit(1);
          
          if (customers && customers.length > 0) {
            const matchedCustomer = customers[0];
            matchedCustomerId = matchedCustomer.id;
            
            // 전화번호가 없거나 다르면 고객의 실제 전화번호 사용
            if (matchedCustomer.phone && (!normalizedPhone || normalizedPhone !== matchedCustomer.phone)) {
              finalPhone = matchedCustomer.phone;
            }
            
            // 고객 이름이 더 정확하면 고객 이름 사용
            if (matchedCustomer.name && matchedCustomer.name !== cleanName) {
              // 고객 이름이 더 정확한 경우 (예: "장태희" vs "장태희 방문시타")
              const customerNameLength = matchedCustomer.name.length;
              const inputNameLength = cleanName.length;
              
              // 고객 이름이 더 짧고 입력 이름에 포함되어 있으면 고객 이름 사용
              if (customerNameLength < inputNameLength && cleanName.includes(matchedCustomer.name)) {
                // 이름은 고객 이름으로 업데이트 (예약 생성 시)
              }
            }
          }
        }
        
        // 3. 여전히 고객을 못 찾았으면 새로 생성
        if (!matchedCustomerId) {
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: name.trim(),
              phone: finalPhone || normalizedPhone,
              email: email || null,
              first_inquiry_date: date,
              visit_count: 0,
              customer_grade: 'NONE'
            })
            .select('id')
            .single();
          
          if (!createError && newCustomer) {
            matchedCustomerId = newCustomer.id;
          }
        }

        // 고객 정보 업데이트 (방문 횟수, 최근 방문일, 평균 비거리, 탄도, 구질)
        const customerPhoneForUpdate = finalPhone || normalizedPhone;
        if (matchedCustomerId && customerPhoneForUpdate) {
          try {
            await supabase.rpc('increment_customer_visit_count', {
              customer_phone: customerPhoneForUpdate,
            });
          } catch (rpcError) {
            // 함수가 없으면 직접 업데이트
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('visit_count, last_visit_date, avg_distance, preferred_trajectory, typical_shot_shape')
              .eq('phone', customerPhoneForUpdate)
              .single();
            
            if (existingCustomer) {
              const updateData: any = {
                visit_count: (existingCustomer.visit_count || 0) + 1,
                last_visit_date: date,
              };

              // 평균 비거리 업데이트 (기존 값이 없거나 새 값이 더 크면 업데이트)
              if (current_distance) {
                const newDistance = parseInt(current_distance);
                if (!existingCustomer.avg_distance || newDistance > existingCustomer.avg_distance) {
                  updateData.avg_distance = newDistance;
                }
              }

              // 탄도 업데이트 (기존 값이 없으면 업데이트)
              if (trajectory && !existingCustomer.preferred_trajectory) {
                updateData.preferred_trajectory = trajectory;
              }

              // 구질 업데이트 (기존 값이 없으면 업데이트)
              if (shot_shape && !existingCustomer.typical_shot_shape) {
                updateData.typical_shot_shape = shot_shape;
              }

              await supabase
                .from('customers')
                .update(updateData)
                .eq('phone', customerPhoneForUpdate);
            }
          }
        }

        // 이름 정규화: "방문시타", "AS" 같은 접미사 제거
        let normalizedName = name.trim();
        const nameSuffixes = [' 방문시타', ' 방문', 'AS', 'as', ' A/S'];
        for (const suffix of nameSuffixes) {
          if (normalizedName.endsWith(suffix)) {
            normalizedName = normalizedName.slice(0, -suffix.length).trim();
            break;
          }
        }
        
        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert({
            customer_profile_id: matchedCustomerId,
            name: normalizedName,
            phone: finalPhone || normalizedPhone,
            date,
            time,
            club: club || (() => {
              if (club_brand) {
                let clubStr = club_brand;
                if (club_loft) clubStr += ` ${club_loft}°`;
                if (club_shaft) clubStr += ` ${club_shaft}`;
                return clubStr;
              }
              return '';
            })(),
            notes,
            service_type: service_type || '마쓰구 드라이버 시타서비스',
            email,
            current_distance,
            age_group,
            duration: duration || 60,
            location: location || 'Massgoo Studio',
            status: 'pending',
            attendance_status: 'pending',
            // 새로운 필드들
            club_brand: club_brand || null,
            club_loft: club_loft ? parseFloat(club_loft) : null,
            club_shaft: club_shaft || null,
            trajectory: trajectory || null,
            shot_shape: shot_shape || null
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // 예약 생성 후 알림 발송 (비동기, 실패해도 예약은 성공 처리)
        try {
          // ⭐ 수정: baseUrl을 더 안정적으로 설정
          const protocol = req.headers['x-forwarded-proto'] || (req.headers.origin?.startsWith('https') ? 'https' : 'http');
          const host = req.headers.host || process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000';
          const baseUrl = `${protocol}://${host}`;
          
          console.log('📡 예약 생성 알림 발송 시작:', { baseUrl, bookingId: newBooking.id });
          
          // 예약 설정 조회
          const { data: settings } = await supabase
            .from('booking_settings')
            .select('notify_on_received_slack, notify_on_received_staff_sms, notify_on_received_customer_sms')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

          // ⭐ 수정: Promise.all로 병렬 처리하되, 각각 await하여 실제 발송 확인
          const notificationPromises = [];

          // 고객 알림 (예약 접수 확인)
          if (settings?.notify_on_received_customer_sms !== false) {
            notificationPromises.push(
              fetch(`${baseUrl}/api/bookings/notify-customer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: newBooking.id,
                  notificationType: 'booking_received',
                  bookingData: newBooking, // 최신 예약 정보 직접 전달
                }),
              })
                .then(async (res) => {
                  const result = await res.json();
                  console.log('✅ 고객 알림 발송 결과:', result);
                  return result;
                })
                .catch(err => {
                  console.error('❌ 고객 알림 발송 오류:', err);
                  return { success: false, error: err.message };
                })
            );
          }

          // 관리자 Slack 알림
          if (settings?.notify_on_received_slack !== false) {
            notificationPromises.push(
              fetch(`${baseUrl}/api/slack/booking-notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'booking_created',
                  bookingId: newBooking.id,
                }),
              })
                .then(async (res) => {
                  const result = await res.json();
                  console.log('✅ Slack 알림 발송 결과:', result);
                  return { success: res.ok, result };
                })
                .catch(err => {
                  console.error('❌ Slack 알림 발송 오류:', err);
                  return { success: false, error: err.message };
                })
            );
          }

          // 관리자 SMS 알림
          if (settings?.notify_on_received_staff_sms !== false) {
            notificationPromises.push(
              fetch(`${baseUrl}/api/bookings/notify-staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: newBooking.id,
                  notificationType: 'received',
                  bookingData: newBooking, // 최신 예약 정보 직접 전달
                }),
              })
                .then(async (res) => {
                  const result = await res.json();
                  console.log('✅ 관리자 SMS 알림 발송 결과:', result);
                  return result;
                })
                .catch(err => {
                  console.error('❌ 관리자 SMS 알림 발송 오류:', err);
                  return { success: false, error: err.message };
                })
            );
          }

          // ⭐ 수정: 모든 알림을 병렬로 실행하되, 결과를 기다림 (최대 5초 타임아웃)
          if (notificationPromises.length > 0) {
            await Promise.race([
              Promise.all(notificationPromises),
              new Promise((resolve) => setTimeout(resolve, 5000)) // 5초 타임아웃
            ]);
            console.log('📡 예약 생성 알림 발송 완료');
          }
        } catch (notificationError) {
          // 알림 실패해도 예약은 성공 처리
          console.error('❌ 알림 발송 중 오류 (무시):', notificationError);
        }

        return res.status(201).json(newBooking);

      case 'PUT':
        const { id, ...updateData } = body;

        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json(updatedBooking);

      case 'DELETE':
        const { id: deleteId } = query;

        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Bookings API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 
