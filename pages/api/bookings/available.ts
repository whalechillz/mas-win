import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 예약 가능한 시간 조회 API
 * GET /api/bookings/available?date=2025-11-23&duration=60
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date 파라미터가 필요합니다.' });
    }

    const bookingDate = date as string;
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
      max_advance_days: 14,
      max_weekly_slots: 10,
      auto_block_excess_slots: true,
      show_call_message: true,
      call_message_text: '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.'
    };

    // 날짜 검증
    const selectedDate = new Date(bookingDate);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);

    // 오늘 날짜인지 확인
    const isToday = selectedDateOnly.getTime() === today.getTime();

    // 당일 예약 제한 체크
    if (bookingSettings.disable_same_day_booking) {
      if (isToday) {
        return res.status(200).json({
          date: bookingDate,
          duration: bookingDuration,
          available_times: [],
          restriction: 'same_day_disabled',
          message: '당일 예약은 불가합니다. 내일 이후 날짜를 선택해주세요.'
        });
      }
    }

    // 최소 사전 예약 시간 체크 (수정: 현재 시간 고려)
    if (isToday) {
      // 오늘 날짜: 현재 시간 + min_advance_hours 이후의 슬롯만 가능
      // 이 체크는 각 슬롯 시간을 확인할 때 처리 (아래에서)
    } else {
      // 내일 이후 날짜: 날짜 차이만 확인
      const daysDifference = (selectedDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDifference < 0) {
        return res.status(200).json({
          date: bookingDate,
          duration: bookingDuration,
          available_times: [],
          restriction: 'past_date',
          message: '과거 날짜는 선택할 수 없습니다.'
        });
      }
    }

    // 주말 예약 제한 체크
    if (bookingSettings.disable_weekend_booking) {
      const dayOfWeek = selectedDate.getDay(); // 0=일요일, 6=토요일
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.status(200).json({
          date: bookingDate,
          duration: bookingDuration,
          available_times: [],
          restriction: 'weekend_disabled',
          message: bookingSettings.show_call_message 
            ? '원하시는 시간에 예약이 어려우신가요?'
            : '주말 예약은 불가합니다. 평일을 선택해주세요.'
        });
      }
    }

    // 예약 가능 기간 제한 체크
    const maxAdvanceDays = bookingSettings.max_advance_days || 14;
    const daysDifference = (selectedDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDifference > maxAdvanceDays) {
      return res.status(200).json({
        date: bookingDate,
        duration: bookingDuration,
        available_times: [],
        restriction: 'max_advance_days',
        message: bookingSettings.show_call_message
          ? '원하시는 시간에 예약이 어려우신가요?'
          : `예약은 ${maxAdvanceDays}일 이내만 가능합니다.`
      });
    }

    // 해당 날짜의 예약된 시간 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('time, duration')
      .eq('date', bookingDate)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) throw bookingsError;

    // 해당 날짜의 예약 불가 시간대 및 가상 예약 조회
    const { data: blocks, error: blocksError } = await supabase
      .from('booking_blocks')
      .select('time, duration, is_virtual')
      .eq('date', bookingDate)
      .order('time', { ascending: true });

    if (blocksError) {
      console.error('차단 시간 조회 오류:', blocksError);
      throw blocksError;
    }

    // 디버깅: 조회된 차단 시간 확인
    console.log('조회된 차단 시간 (전체):', blocks);
    if (blocks) {
      const blockedOnly = blocks.filter(b => !b.is_virtual);
      const virtualOnly = blocks.filter(b => b.is_virtual);
      console.log('차단 시간 (is_virtual=false):', blockedOnly);
      console.log('가상 예약 (is_virtual=true):', virtualOnly);
    }

    // 예약된 시간대 계산 (실제 예약만)
    const bookedSlots: { start: string; end: string }[] = [];
    const bookedTimes: string[] = []; // 실제 예약 시간 목록 (프론트엔드 표시용)
    if (bookings) {
      bookings.forEach(booking => {
        const startTime = booking.time;
        const bookingDuration = booking.duration || 60;
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = new Date(`2000-01-01T${hours}:${minutes}:00`);
        const end = new Date(start.getTime() + bookingDuration * 60000);
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        bookedSlots.push({
          start: timeStr,
          end: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
        });
        bookedTimes.push(timeStr);
      });
    }

    // 예약 불가 시간대 계산 (is_virtual=false인 것만)
    const blockedSlots: { start: string; end: string }[] = [];
    // 가상 예약 계산 (is_virtual=true인 것만, 프론트엔드 표시용)
    const virtualSlots: { start: string; end: string }[] = [];
    
    if (blocks) {
      blocks.forEach(block => {
        // 시간 형식 정규화 (11:00 형식으로 통일)
        let normalizedTime = block.time;
        if (!normalizedTime.includes(':')) {
          // "11" 형식이면 "11:00"으로 변환
          normalizedTime = `${normalizedTime.padStart(2, '0')}:00`;
        } else if (normalizedTime.split(':').length === 3) {
          // "11:00:00" 형식이면 "11:00"으로 변환
          const [hours, minutes] = normalizedTime.split(':');
          normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        
        const blockDuration = block.duration || 60;
        const [hours, minutes] = normalizedTime.split(':').map(Number);
        
        // 시간 유효성 검증
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          console.error('잘못된 시간 형식:', block.time, '→ 정규화:', normalizedTime);
          return;
        }
        
        // 차단 시간 종료 시간 계산 (분 단위로 계산)
        const startMinTotal = hours * 60 + minutes;
        const endMinTotal = startMinTotal + blockDuration;
        const endHour = Math.floor(endMinTotal / 60);
        const endMin = endMinTotal % 60;
        
        const slot = {
          start: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          end: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
        };
        
        if (block.is_virtual) {
          virtualSlots.push(slot);
        } else {
          blockedSlots.push(slot);
        }
      });
    }

    // 디버깅: 차단 시간 최종 확인
    console.log('차단 시간 최종 결과:', {
      date: bookingDate,
      blockedSlotsCount: blockedSlots.length,
      blockedSlots,
      virtualSlotsCount: virtualSlots.length,
      virtualSlots
    });

    // 운영시간 조회 (요일별, 여러 타임슬롯 지원)
    const dayOfWeekForHours = selectedDate.getDay();
    const { data: operatingHours, error: operatingHoursError } = await supabase
      .from('booking_hours')
      .select('start_time, end_time, is_available')
      .eq('day_of_week', dayOfWeekForHours)
      .eq('is_available', true)
      .order('start_time', { ascending: true });

    if (operatingHoursError) {
      console.error('운영시간 조회 오류:', operatingHoursError);
      // 운영시간 조회 오류 시 기본값 사용
    }

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
        
        // 최소 사전 예약 시간 체크 (오늘 날짜인 경우만)
        if (isToday) {
          const slotDateTime = new Date(`${bookingDate}T${timeSlotStart}:00`);
          const minAvailableDateTime = new Date(now.getTime() + bookingSettings.min_advance_hours * 60 * 60 * 1000);
          if (slotDateTime < minAvailableDateTime) {
            continue; // 최소 사전 예약 시간이 지나지 않았으면 스킵
          }
        }
        
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

        // 예약 불가 시간대와 겹치는지 확인 (가상 예약 제외)
        // 차단 시간은 시작 시간이 정확히 일치하거나 겹치면 차단
        const isBlocked = blockedSlots.some(blocked => {
          const [blockedStartHours, blockedStartMinutes] = blocked.start.split(':').map(Number);
          const [blockedEndHours, blockedEndMinutes] = blocked.end.split(':').map(Number);
          
          const slotStartMinTotal = startHour * 60 + startMin;
          const slotEndMinTotal = slotStartMinTotal + bookingDuration;
          const blockedStartMin = blockedStartHours * 60 + blockedStartMinutes;
          const blockedEndMin = blockedEndHours * 60 + blockedEndMinutes;

          // 겹치는지 확인: 슬롯 시작 < 차단 종료 && 슬롯 종료 > 차단 시작
          // 또는 슬롯 시작 시간이 차단 시간 범위 내에 있으면 차단
          const isOverlapping = (
            (slotStartMinTotal >= blockedStartMin && slotStartMinTotal < blockedEndMin) || // 슬롯 시작이 차단 범위 내
            (slotStartMinTotal < blockedEndMin && slotEndMinTotal > blockedStartMin) // 슬롯이 차단과 겹침
          );
          
          // 디버깅: 11:00과 15:00 차단 체크
          if ((timeSlotStart === '11:00' || timeSlotStart === '15:00') && bookingDate === '2025-11-24') {
            console.log(`${timeSlotStart} 차단 체크:`, {
              timeSlotStart,
              slotStartMinTotal,
              slotEndMinTotal,
              blockedStart: blocked.start,
              blockedEnd: blocked.end,
              blockedStartMin,
              blockedEndMin,
              isOverlapping,
              '슬롯 시작 >= 차단 시작 && 슬롯 시작 < 차단 종료': slotStartMinTotal >= blockedStartMin && slotStartMinTotal < blockedEndMin,
              '슬롯 시작 < 차단 종료 && 슬롯 종료 > 차단 시작': slotStartMinTotal < blockedEndMin && slotEndMinTotal > blockedStartMin
            });
          }

          return isOverlapping;
        });

        // 가상 예약과 겹치는지 확인 (표시용)
        const isVirtual = virtualSlots.some(virtual => {
          const [virtualStartHours, virtualStartMinutes] = virtual.start.split(':').map(Number);
          const [virtualEndHours, virtualEndMinutes] = virtual.end.split(':').map(Number);
          
          const slotStartMinTotal = startHour * 60 + startMin;
          const slotEndMinTotal = slotStartMinTotal + bookingDuration;
          const virtualStartMin = virtualStartHours * 60 + virtualStartMinutes;
          const virtualEndMin = virtualEndHours * 60 + virtualEndMinutes;

          return (slotStartMinTotal < virtualEndMin && slotEndMinTotal > virtualStartMin);
        });

        const isAvailable = !isBooked && !isBlocked;

        // 디버깅: 11:00과 15:00 슬롯 체크
        if ((timeSlotStart === '11:00' || timeSlotStart === '15:00') && bookingDate === '2025-11-24') {
          console.log(`${timeSlotStart} 최종 체크:`, {
            timeSlotStart,
            isBooked,
            isBlocked,
            isAvailable,
            blockedSlotsCount: blockedSlots.length,
            blockedSlots
          });
        }

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
        
        // 최소 사전 예약 시간 체크 (오늘 날짜인 경우만)
        if (isToday) {
          const slotDateTime = new Date(`${bookingDate}T${timeSlot}:00`);
          const minAvailableDateTime = new Date(now.getTime() + bookingSettings.min_advance_hours * 60 * 60 * 1000);
          if (slotDateTime < minAvailableDateTime) {
            continue; // 최소 사전 예약 시간이 지나지 않았으면 스킵
          }
        }
        
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

    // 가상 예약은 DB에 저장된 것만 사용 (동적 처리 제거)
    const finalAvailableTimes = availableTimes;
    const finalVirtualTimes = virtualSlots.map(v => v.start);

    // 시간 정렬 함수 (HH:MM 형식)
    const sortTimes = (times: string[]) => {
      return times.sort((a, b) => {
        const [aHour, aMin] = a.split(':').map(Number);
        const [bHour, bMin] = b.split(':').map(Number);
        if (aHour !== bHour) return aHour - bHour;
        return aMin - bMin;
      });
    };

    // 중복 제거 및 정렬
    const uniqueAvailableTimes = sortTimes(Array.from(new Set(finalAvailableTimes)));
    const uniqueVirtualTimes = sortTimes(Array.from(new Set(finalVirtualTimes.filter(v => !uniqueAvailableTimes.includes(v)))));
    const uniqueBookedTimes = sortTimes(Array.from(new Set(bookedTimes.filter(b => !uniqueAvailableTimes.includes(b)))));
    
    // 차단된 시간 목록 생성 (운영시간 내 차단된 시간만)
    const blockedTimes: string[] = [];
    if (operatingHours && operatingHours.length > 0) {
      for (const timeSlot of operatingHours) {
        const [startHourStr, startMinStr] = timeSlot.start_time.split(':');
        const startHour = parseInt(startHourStr, 10);
        const startMin = parseInt(startMinStr, 10);
        const timeSlotStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        
        // 차단된 시간인지 확인 (이미 available_times에 포함되지 않은 경우만)
        if (!uniqueAvailableTimes.includes(timeSlotStart)) {
          const isBlocked = blockedSlots.some(blocked => {
            const [blockedStartHours, blockedStartMinutes] = blocked.start.split(':').map(Number);
            const [blockedEndHours, blockedEndMinutes] = blocked.end.split(':').map(Number);
            const slotStartMinTotal = startHour * 60 + startMin;
            const blockedStartMin = blockedStartHours * 60 + blockedStartMinutes;
            const blockedEndMin = blockedEndHours * 60 + blockedEndMinutes;
            return slotStartMinTotal >= blockedStartMin && slotStartMinTotal < blockedEndMin;
          });
          
          if (isBlocked) {
            blockedTimes.push(timeSlotStart);
          }
        }
      }
    }
    const uniqueBlockedTimes = sortTimes(Array.from(new Set(blockedTimes)));

    // 디버깅: 최종 응답 전 확인
    console.log('최종 응답 데이터:', {
      date: bookingDate,
      available_times: uniqueAvailableTimes,
      blockedSlotsCount: blockedSlots.length,
      blockedSlots,
      virtualSlotsCount: virtualSlots.length,
      blocksFromDB: blocks?.length || 0
    });

    return res.status(200).json({
      date: bookingDate,
      duration: bookingDuration,
      available_times: uniqueAvailableTimes,
      virtual_times: uniqueVirtualTimes, // 가상 예약 시간대
      booked_times: uniqueBookedTimes, // 실제 예약 시간대
      blocked_times: uniqueBlockedTimes, // 차단된 시간대
      total_bookings: bookings?.length || 0, // 실제 예약 수
      total_virtual: uniqueVirtualTimes.length, // 가상 예약 수
      show_call_message: bookingSettings.show_call_message,
      call_message_text: bookingSettings.call_message_text,
      // 디버깅용: 차단 시간 정보 추가
      _debug: {
        blocks_from_db: blocks?.length || 0,
        blocked_slots_count: blockedSlots.length,
        blocked_slots: blockedSlots,
        virtual_slots_count: virtualSlots.length
      }
    });
  } catch (error: any) {
    console.error('Available times API Error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error?.message || '예약 가능한 시간을 불러올 수 없습니다.'
    });
  }
}

