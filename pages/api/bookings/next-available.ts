import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 다음 예약 가능한 날짜 찾기 API
 * GET /api/bookings/next-available?duration=60
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { duration = 60, from_date } = req.query;
    const bookingDuration = parseInt(duration as string, 10);

    // 예약 설정 조회
    const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .single();

    const bookingSettings = settings || {
      disable_same_day_booking: false,
      disable_weekend_booking: false,
      min_advance_hours: 24,
      max_advance_days: 14
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 최대 예약 가능 기간까지 검색
    const maxAdvanceDays = bookingSettings.max_advance_days || 14;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

    // 다음 예약 가능한 날짜 찾기
    // from_date가 있으면 해당 날짜부터 검색, 없으면 오늘부터 검색
    let checkDate: Date;
    
    if (from_date) {
      // 특정 날짜 이후부터 검색
      checkDate = new Date(from_date as string);
      checkDate.setHours(0, 0, 0, 0);
    } else {
      // 오늘부터 검색
      checkDate = new Date(today);
      
      // 당일 예약 불가면 내일부터 시작
      if (bookingSettings.disable_same_day_booking) {
        checkDate.setDate(checkDate.getDate() + 1);
      } else {
        // 최소 사전 예약 시간 고려
        const minDateWithHours = new Date();
        minDateWithHours.setHours(minDateWithHours.getHours() + bookingSettings.min_advance_hours);
        const minDateOnly = new Date(minDateWithHours);
        minDateOnly.setHours(0, 0, 0, 0);
        
        if (minDateOnly > checkDate) {
          checkDate = new Date(minDateOnly);
        }
      }
    }

    // 최대 90일까지 검색
    while (checkDate <= maxDate) {
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // 주말 예약 제한 체크
      if (bookingSettings.disable_weekend_booking) {
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          checkDate.setDate(checkDate.getDate() + 1);
          continue;
        }
      }

      // 예약 가능 기간 제한 체크
      const daysDifference = (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDifference > maxAdvanceDays) {
        break; // 최대 기간을 넘으면 검색 중단
      }

      // 해당 날짜의 예약 가능한 시간 직접 계산
      const availableTimes = await checkDateAvailability(dateStr, bookingDuration, bookingSettings);
      
      // 예약 가능한 시간이 있으면 해당 날짜 반환
      if (availableTimes && availableTimes.length > 0) {
        return res.status(200).json({
          date: dateStr,
          available_times: availableTimes,
          formatted_date: formatKoreanDateFromString(dateStr)
        });
      }

      // 다음 날로 이동
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // 예약 가능한 날짜를 찾지 못함
    return res.status(404).json({
      error: '예약 가능한 날짜를 찾을 수 없습니다.',
      message: '전화로 문의해주세요: 031-215-0013'
    });
  } catch (error) {
    console.error('Next Available Date API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function checkDateAvailability(
  dateStr: string,
  bookingDuration: number,
  bookingSettings: any
): Promise<string[]> {
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateOnly = new Date(selectedDate);
  selectedDateOnly.setHours(0, 0, 0, 0);

  // 당일 예약 제한 체크
  if (bookingSettings.disable_same_day_booking) {
    if (selectedDateOnly.getTime() === today.getTime()) {
      return [];
    }
  }

  // 최소 사전 예약 시간 체크
  const hoursDifference = (selectedDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60);
  if (hoursDifference < bookingSettings.min_advance_hours) {
    return [];
  }

  // 주말 예약 제한 체크
  if (bookingSettings.disable_weekend_booking) {
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }
  }

  // 해당 날짜의 예약된 시간 조회
  const { data: bookings } = await supabase
    .from('bookings')
    .select('time, duration')
    .eq('date', dateStr)
    .in('status', ['pending', 'confirmed']);

  // 해당 날짜의 예약 불가 시간대 조회 (is_virtual=false인 것만)
  const { data: blocks } = await supabase
    .from('booking_blocks')
    .select('time, duration, is_virtual')
    .eq('date', dateStr)
    .eq('is_virtual', false);

  // 예약된 시간대 계산
  const bookedSlots: { start: string; end: string }[] = [];
  if (bookings) {
    bookings.forEach(booking => {
      const startTime = booking.time;
      const duration = booking.duration || 60;
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date(`2000-01-01T${hours}:${minutes}:00`);
      const end = new Date(start.getTime() + duration * 60000);
      bookedSlots.push({
        start: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        end: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      });
    });
  }

  // 예약 불가 시간대 계산 (is_virtual=false인 것만)
  const blockedSlots: { start: string; end: string }[] = [];
  if (blocks) {
    blocks.forEach(block => {
      // 시간 형식 정규화
      let normalizedTime = block.time;
      if (!normalizedTime.includes(':')) {
        normalizedTime = `${normalizedTime.padStart(2, '0')}:00`;
      } else if (normalizedTime.split(':').length === 3) {
        const [hours, minutes] = normalizedTime.split(':');
        normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      const blockDuration = block.duration || 60;
      const [hours, minutes] = normalizedTime.split(':').map(Number);
      
      // 시간 유효성 검증
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return;
      }
      
      const start = new Date(`2000-01-01T${hours}:${minutes}:00`);
      const end = new Date(start.getTime() + blockDuration * 60000);
      blockedSlots.push({
        start: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        end: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      });
    });
  }

  // 운영시간 조회 (요일별, 여러 타임슬롯 지원)
  const dayOfWeek = selectedDate.getDay();
  const { data: operatingHours } = await supabase
    .from('booking_hours')
    .select('start_time, end_time, is_available')
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true });

  // 가능한 시간대 생성
  const availableTimes: string[] = [];

  if (operatingHours && operatingHours.length > 0) {
    // 여러 타임슬롯 지원: 각 타임슬롯의 시작 시간만 예약 가능 시간으로 표시
    for (const timeSlot of operatingHours) {
      const [startHourStr, startMinStr] = timeSlot.start_time.split(':');
      const [endHourStr, endMinStr] = timeSlot.end_time.split(':');
      const startHour = parseInt(startHourStr, 10);
      const startMin = parseInt(startMinStr, 10);
      const endHour = parseInt(endHourStr, 10);
      const endMin = parseInt(endMinStr, 10);

      // 타임슬롯 시작 시간
      const timeSlotStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      
      // 예약 시간이 타임슬롯에 맞는지 확인
      const slotStartMin = startHour * 60 + startMin;
      const slotEndMin = endHour * 60 + endMin;
      const bookingEndMin = slotStartMin + bookingDuration;
      
      // 예약 시간이 타임슬롯을 넘지 않는지 확인
      if (bookingEndMin > slotEndMin) {
        continue;
      }

      // 예약된 시간과 겹치는지 확인
      const isBooked = bookedSlots.some(booked => {
        const [bookedStartHours, bookedStartMinutes] = booked.start.split(':').map(Number);
        const [bookedEndHours, bookedEndMinutes] = booked.end.split(':').map(Number);
        
        const slotStartMinTotal = startHour * 60 + startMin;
        const slotEndMinTotal = slotStartMinTotal + bookingDuration;
        const bookedStartMin = bookedStartHours * 60 + bookedStartMinutes;
        const bookedEndMin = bookedEndHours * 60 + bookedEndMinutes;

        return (slotStartMinTotal < bookedEndMin && slotEndMinTotal > bookedStartMin);
      });

      // 예약 불가 시간대와 겹치는지 확인
      const isBlocked = blockedSlots.some(blocked => {
        const [blockedStartHours, blockedStartMinutes] = blocked.start.split(':').map(Number);
        const [blockedEndHours, blockedEndMinutes] = blocked.end.split(':').map(Number);
        
        const slotStartMinTotal = startHour * 60 + startMin;
        const slotEndMinTotal = slotStartMinTotal + bookingDuration;
        const blockedStartMin = blockedStartHours * 60 + blockedStartMinutes;
        const blockedEndMin = blockedEndHours * 60 + blockedEndMinutes;

        return (slotStartMinTotal < blockedEndMin && slotEndMinTotal > blockedStartMin);
      });

      const isAvailable = !isBooked && !isBlocked;

      if (isAvailable) {
        availableTimes.push(timeSlotStart);
      }
    }
  } else {
    // 운영시간이 없으면 기본값 사용 (09:00 ~ 18:00)
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
      
      // 시간대 종료 시간 계산
      const slotEndHour = slotHours + Math.floor(bookingDuration / 60);
      const slotEndMinute = slotMinutes + (bookingDuration % 60);
      
      // 종료 시간이 운영 종료 시간을 넘지 않는지 확인
      if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMinute > 0)) {
        continue;
      }

      // 예약된 시간과 겹치는지 확인
      const isBooked = bookedSlots.some(booked => {
        const [bookedStartHours, bookedStartMinutes] = booked.start.split(':').map(Number);
        const [bookedEndHours, bookedEndMinutes] = booked.end.split(':').map(Number);
        
        const slotStartMin = slotHours * 60 + slotMinutes;
        const slotEndMin = slotEndHour * 60 + slotEndMinute;
        const bookedStartMin = bookedStartHours * 60 + bookedStartMinutes;
        const bookedEndMin = bookedEndHours * 60 + bookedEndMinutes;

        return (slotStartMin < bookedEndMin && slotEndMin > bookedStartMin);
      });

      // 예약 불가 시간대와 겹치는지 확인
      const isBlocked = blockedSlots.some(blocked => {
        const [blockedStartHours, blockedStartMinutes] = blocked.start.split(':').map(Number);
        const [blockedEndHours, blockedEndMinutes] = blocked.end.split(':').map(Number);
        
        const slotStartMin = slotHours * 60 + slotMinutes;
        const slotEndMin = slotEndHour * 60 + slotEndMinute;
        const blockedStartMin = blockedStartHours * 60 + blockedStartMinutes;
        const blockedEndMin = blockedEndHours * 60 + blockedEndMinutes;

        return (slotStartMin < blockedEndMin && slotEndMin > blockedStartMin);
      });

      const isAvailable = !isBooked && !isBlocked;

      if (isAvailable) {
        availableTimes.push(timeSlot);
      }
    }
  }

  return availableTimes;
}

function formatKoreanDateFromString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

