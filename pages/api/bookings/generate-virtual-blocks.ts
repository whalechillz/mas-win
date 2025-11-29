import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 결정론적 셔플 함수 (주 시작일을 시드로 사용)
function deterministicShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let random = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 간단한 선형 합동 생성기 (LCG)
    random = (random * 1103515245 + 12345) & 0x7fffffff;
    const j = random % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { week_start_date, max_slots } = req.body;

    if (!week_start_date || !max_slots) {
      return res.status(400).json({ error: 'week_start_date and max_slots are required' });
    }

    // 주의 시작일과 종료일 계산 (일요일~토요일)
    const weekStart = new Date(week_start_date);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // 토요일
    weekEnd.setHours(23, 59, 59, 999);

    // 해당 주의 모든 운영시간 슬롯 조회
    const weeklySlots: { date: string; time: string }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const { data: dayOperatingHours } = await supabase
        .from('booking_hours')
        .select('start_time, end_time, is_available')
        .eq('day_of_week', checkDayOfWeek)
        .eq('is_available', true)
        .order('start_time', { ascending: true });

      if (dayOperatingHours) {
        dayOperatingHours.forEach(slot => {
          const [startHourStr, startMinStr] = slot.start_time.split(':');
          const startHour = parseInt(startHourStr, 10);
          const startMin = parseInt(startMinStr, 10);
          const timeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
          weeklySlots.push({ date: dateStr, time: timeStr });
        });
      }
    }

    // 해당 주의 실제 예약 수 확인
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    const { data: actualBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('date, time')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('예약 조회 오류:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    const actualBookingCount = actualBookings?.length || 0;

    // 기존 가상 예약 확인
    const { data: existingVirtualBlocks, error: blocksError } = await supabase
      .from('booking_blocks')
      .select('id, date, time')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .eq('is_virtual', true);

    if (blocksError) {
      console.error('가상 예약 조회 오류:', blocksError);
      return res.status(500).json({ error: 'Failed to fetch virtual blocks' });
    }

    const existingVirtualCount = existingVirtualBlocks?.length || 0;
    const totalUsed = actualBookingCount + existingVirtualCount;

    // 전체 슬롯 수와 사용 가능한 슬롯 수 계산
    const totalSlots = weeklySlots.length;
    const availableSlotsCount = totalSlots - totalUsed;
    
    // 최대 슬롯 수를 넘지 않도록 차단할 슬롯 수 계산
    // 예: 총 21개 슬롯, 실제 예약 0개, 가상 예약 1개, 최대 10개
    // -> 사용 가능: 20개, 허용 가능: 10개, 차단 필요: 10개
    const allowedSlots = Math.max(0, max_slots - totalUsed);
    const slotsToBlock = Math.max(0, availableSlotsCount - allowedSlots);

    if (slotsToBlock === 0) {
      return res.status(200).json({
        success: true,
        message: '차단할 슬롯이 없습니다. (이미 최대 슬롯 수 이하입니다)',
        created_count: 0,
        actual_bookings: actualBookingCount,
        existing_virtual: existingVirtualCount,
        total_used: totalUsed,
        max_slots: max_slots,
        total_slots: totalSlots,
        available_slots: availableSlotsCount
      });
    }

    // 초과분을 가상 예약으로 차단할 슬롯 선택
    // 실제 예약이 있는 슬롯 제외
    const bookedSlots = new Set(
      (actualBookings || []).map(b => `${b.date}_${b.time}`)
    );
    
    // 기존 가상 예약이 있는 슬롯 제외
    const existingVirtualSlots = new Set(
      (existingVirtualBlocks || []).map(b => `${b.date}_${b.time}`)
    );

    // 사용 가능한 슬롯만 필터링 (실제 예약과 기존 가상 예약 제외)
    const availableSlots = weeklySlots.filter(slot => {
      const slotKey = `${slot.date}_${slot.time}`;
      return !bookedSlots.has(slotKey) && !existingVirtualSlots.has(slotKey);
    });

    if (availableSlots.length < slotsToBlock) {
      return res.status(200).json({
        success: true,
        message: `${slotsToBlock}개를 차단하려고 했지만, 사용 가능한 슬롯이 ${availableSlots.length}개뿐입니다.`,
        created_count: availableSlots.length,
        actual_bookings: actualBookingCount,
        existing_virtual: existingVirtualCount,
        total_used: totalUsed,
        max_slots: max_slots,
        total_slots: totalSlots
      });
    }

    // 결정론적 셔플로 랜덤 선택 (주 시작일을 시드로 사용)
    const weekStartTimestamp = weekStart.getTime();
    const shuffledSlots = deterministicShuffle(availableSlots, weekStartTimestamp);
    const slotsToBlockList = shuffledSlots.slice(0, slotsToBlock);

    // 가상 예약 생성
    const virtualBlocks = slotsToBlockList.map(slot => ({
      date: slot.date,
      time: slot.time,
      duration: 60, // 기본 1시간
      reason: '주당 최대 슬롯 수 제한',
      location: 'Massgoo Studio',
      is_virtual: true
    }));

    const { data: insertedBlocks, error: insertError } = await supabase
      .from('booking_blocks')
      .insert(virtualBlocks)
      .select();

    if (insertError) {
      console.error('가상 예약 생성 오류:', insertError);
      return res.status(500).json({ error: 'Failed to create virtual blocks' });
    }

    return res.status(200).json({
      success: true,
      message: `${slotsToBlock}개의 슬롯을 가상 예약으로 차단했습니다.`,
      created_count: insertedBlocks?.length || 0,
      actual_bookings: actualBookingCount,
      existing_virtual: existingVirtualCount + (insertedBlocks?.length || 0),
      total_used: totalUsed + (insertedBlocks?.length || 0),
      max_slots: max_slots,
      total_slots: totalSlots
    });

  } catch (error) {
    console.error('가상 예약 생성 오류:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

