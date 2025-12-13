import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Solapi API 설정
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send';

// 날짜 포맷팅 (예: 2025-11-27 → 2025년 11월 27일)
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  } catch {
    return dateStr;
  }
}

// 시간 포맷팅 (예: 14:00 → 오후 2시)
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}시${minutes !== '00' ? ` ${minutes}분` : ''}`;
  } catch {
    return timeStr;
  }
}

function getKoreaTime(): string {
  const now = new Date();
  return now.toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  const numbers = phone.replace(/[^0-9]/g, '');
  if (numbers.startsWith('82')) {
    return '0' + numbers.substring(2);
  }
  return numbers;
}

// 전화번호 포맷팅 (010XXXXXXXX → 010-XXXX-XXXX)
function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  return phone;
}

// 메시지 길이에 따라 자동으로 SMS/LMS 결정
function determineMessageType(text: string): 'SMS' | 'LMS' {
  const estimatedBytes = Buffer.from(text, 'utf8').length;
  
  if (estimatedBytes <= 90) {
    return 'SMS';
  } else {
    return 'LMS'; // 2000바이트까지 가능
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { bookingId, notificationType = 'confirmed', bookingData } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: '예약 ID가 필요합니다.' });
    }

    // 예약 정보 조회 (bookingData가 있으면 사용, 없으면 DB에서 조회)
    let booking;
    if (bookingData) {
      // 최신 예약 데이터를 직접 사용 (시간 변경 시 최신 정보 보장)
      booking = bookingData;
      // customers 정보는 별도 조회 필요
      if (booking.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('name, phone')
          .eq('id', booking.customer_id)
          .single();
        booking.customers = customer;
      }
    } else {
      // 기존 방식: DB에서 조회
      const { data: bookingFromDb, error: bookingError } = await supabase
        .from('bookings')
        .select('*, customers(name, phone)')
        .eq('id', bookingId)
        .single();

      if (bookingError || !bookingFromDb) {
        return res.status(404).json({ success: false, message: '예약을 찾을 수 없습니다.' });
      }
      booking = bookingFromDb;
    }

    // 예약 설정 조회
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('enable_staff_notification, staff_phone_numbers')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!settings?.enable_staff_notification) {
      return res.status(200).json({
        success: true,
        message: '스탭진 알림이 비활성화되어 있습니다.',
        skipped: true,
      });
    }

    const staffPhones = settings.staff_phone_numbers || [];
    if (staffPhones.length === 0) {
      return res.status(200).json({
        success: true,
        message: '스탭진 전화번호가 설정되지 않았습니다.',
        skipped: true,
      });
    }

    // 고객 정보
    const customerName = (booking.customers as any)?.name || booking.name || '고객';
    const customerPhone = (booking.customers as any)?.phone || booking.phone || '';
    const serviceName = booking.service || '마쓰구 드라이버 시타서비스';
    const location = booking.location || '마쓰구 수원본점';

    // 메시지 템플릿
    let message = '';
    if (notificationType === 'received') {
      message = `[시타 예약 접수]
고객명: ${customerName}
전화번호: ${formatPhone(customerPhone)}
예약일시: ${formatDate(booking.date)} ${formatTime(booking.time)}
서비스: ${serviceName}
장소: ${location}`;
    } else {
      // confirmed
      message = `[시타 예약 확정]

고객명: ${customerName}

전화번호: ${formatPhone(customerPhone)}

예약일시: ${formatDate(booking.date)} ${formatTime(booking.time)}

서비스: ${serviceName}

장소: ${location}

확정 시간: ${getKoreaTime()}`;
    }

    // Solapi API 인증 헤더 생성
    const headers = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    // 메시지 타입 자동 결정
    const messageType = determineMessageType(message);

    // 모든 스탭진 번호 정규화 및 유효성 검사
    const normalizedPhones = [];
    const invalidPhones: Array<{ phone: string; success: false; error: string }> = [];
    for (const phone of staffPhones) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        invalidPhones.push({ phone, success: false, error: '유효하지 않은 전화번호' });
        continue;
      }
      normalizedPhones.push(normalizedPhone);
    }

    if (normalizedPhones.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 스탭진 전화번호가 없습니다.',
        results: invalidPhones
      });
    }

    // Solapi send-many API로 한 번에 발송
    let solapiGroupId: string | null = null;
    let successCount = 0;
    let failCount = 0;
    const results: Array<{ phone: string; success: boolean; error?: string }> = [];

    try {
      // 여러 수신자에게 한 번에 발송
      const messages = normalizedPhones.map(phone => ({
        to: phone,
        from: '0312150013',
        text: message,
        type: messageType,
      }));

      const smsResponse = await fetch('https://api.solapi.com/messages/v4/send-many', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          allowDuplicates: false
        }),
      });

      const smsResult = await smsResponse.json();

      if (smsResponse.ok && smsResult.groupId) {
        solapiGroupId = smsResult.groupId;
        
        // 결과 처리
        if (smsResult.results && Array.isArray(smsResult.results)) {
          smsResult.results.forEach((result: any, index: number) => {
            const phone = normalizedPhones[index];
            if (result.statusCode === '2000' || result.status === 'success') {
              results.push({ phone, success: true });
              successCount++;
            } else {
              const errorMsg = result.errorMessage || result.message || '발송 실패';
              results.push({ phone, success: false, error: errorMsg });
              failCount++;
            }
          });
        } else {
          // results가 없으면 모두 성공으로 간주
          normalizedPhones.forEach(phone => {
            results.push({ phone, success: true });
            successCount++;
          });
        }

        // channel_sms 테이블에 하나의 레코드로 저장 (모든 수신자 포함)
        try {
          await supabase
            .from('channel_sms')
            .insert({
              message_type: messageType,
              message_text: message,
              recipient_numbers: normalizedPhones, // 모든 번호 포함
              status: failCount === 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed'),
              sent_at: new Date().toISOString(),
              sent_count: normalizedPhones.length,
              success_count: successCount,
              fail_count: failCount,
              solapi_group_id: solapiGroupId,
              note: `스탭진 알림 ${notificationType}: 예약 ID ${bookingId}`,
            });
        } catch (saveErr: any) {
          console.error('스탭진 메시지 channel_sms 저장 오류:', saveErr);
        }
      } else {
        // Solapi API 실패
        const errorMsg = smsResult.errorMessage || smsResult.message || 'Solapi API 호출 실패';
        normalizedPhones.forEach(phone => {
          results.push({ phone, success: false, error: errorMsg });
          failCount++;
        });

        // 실패한 메시지도 저장
        try {
          await supabase
            .from('channel_sms')
            .insert({
              message_type: messageType,
              message_text: message,
              recipient_numbers: normalizedPhones,
              status: 'failed',
              sent_at: new Date().toISOString(),
              sent_count: normalizedPhones.length,
              success_count: 0,
              fail_count: failCount,
              note: `스탭진 알림 ${notificationType} 실패: 예약 ID ${bookingId}, 오류: ${errorMsg}`,
            });
        } catch (saveErr: any) {
          console.error('스탭진 실패 메시지 저장 오류:', saveErr);
        }
      }
    } catch (err: any) {
      // 예외 발생
      const errorMsg = err.message || '메시지 발송 중 오류 발생';
      normalizedPhones.forEach(phone => {
        results.push({ phone, success: false, error: errorMsg });
        failCount++;
      });

      // 예외 발생 시에도 저장
      try {
        await supabase
          .from('channel_sms')
          .insert({
            message_type: messageType,
            message_text: message,
            recipient_numbers: normalizedPhones,
            status: 'failed',
            sent_at: new Date().toISOString(),
            sent_count: normalizedPhones.length,
            success_count: 0,
            fail_count: failCount,
            note: `스탭진 알림 ${notificationType} 예외: 예약 ID ${bookingId}, 오류: ${errorMsg}`,
          });
      } catch (saveErr: any) {
        console.error('스탭진 예외 메시지 저장 오류:', saveErr);
      }
    }

    // 유효하지 않은 번호도 결과에 포함
    results.push(...invalidPhones);

    return res.status(200).json({
      success: successCount > 0,
      message: `스탭진 ${successCount}명 발송 성공, ${failCount}명 실패`,
      results: results,
      solapi_group_id: solapiGroupId,
      success_count: successCount,
      fail_count: failCount,
      total_count: normalizedPhones.length + invalidPhones.length
    });
  } catch (error: any) {
    console.error('스탭진 알림 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '알림 발송 중 오류가 발생했습니다.',
    });
  }
}

