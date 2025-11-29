import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 서비스 타입별 예약 통계
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('service_type, phone, date, status, created_at')
      .not('service_type', 'is', null);

    if (bookingsError) throw bookingsError;

    // 통계 계산
    const statsByService: Record<string, {
      예약건수: number;
      고유고객수: number;
      최초예약일: string | null;
      최근예약일: string | null;
      완료건수: number;
      확정건수: number;
      대기건수: number;
    }> = {};

    bookings?.forEach(booking => {
      const serviceType = booking.service_type || '기타';
      
      if (!statsByService[serviceType]) {
        statsByService[serviceType] = {
          예약건수: 0,
          고유고객수: 0,
          최초예약일: null,
          최근예약일: null,
          완료건수: 0,
          확정건수: 0,
          대기건수: 0
        };
      }

      const stat = statsByService[serviceType];
      stat.예약건수++;
      
      if (booking.date) {
        if (!stat.최초예약일 || booking.date < stat.최초예약일) {
          stat.최초예약일 = booking.date;
        }
        if (!stat.최근예약일 || booking.date > stat.최근예약일) {
          stat.최근예약일 = booking.date;
        }
      }

      if (booking.status === 'completed') stat.완료건수++;
      else if (booking.status === 'confirmed') stat.확정건수++;
      else if (booking.status === 'pending') stat.대기건수++;
    });

    // 고유 고객수 계산
    const uniqueCustomersByService: Record<string, Set<string>> = {};
    bookings?.forEach(booking => {
      const serviceType = booking.service_type || '기타';
      if (!uniqueCustomersByService[serviceType]) {
        uniqueCustomersByService[serviceType] = new Set();
      }
      if (booking.phone) {
        uniqueCustomersByService[serviceType].add(booking.phone);
      }
    });

    Object.keys(statsByService).forEach(serviceType => {
      statsByService[serviceType].고유고객수 = uniqueCustomersByService[serviceType]?.size || 0;
    });

    // 카테고리별 통계 (마쓰구 드라이버 vs KGFA 1급)
    const categoryStats: Record<string, {
      예약건수: number;
      고유고객수: number;
      평균경과일수: number;
    }> = {};

    const now = new Date();
    bookings?.forEach(booking => {
      const serviceType = booking.service_type || '';
      let category = '기타';
      
      if (serviceType.includes('마쓰구 드라이버') || serviceType.includes('드라이버 시타')) {
        category = '마쓰구 드라이버 시타';
      } else if (serviceType.includes('KGFA') || serviceType.includes('1급')) {
        category = 'KGFA 1급 시타';
      }

      if (!categoryStats[category]) {
        categoryStats[category] = {
          예약건수: 0,
          고유고객수: 0,
          평균경과일수: 0
        };
      }

      categoryStats[category].예약건수++;
      
      if (booking.created_at) {
        const createdDate = new Date(booking.created_at);
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        categoryStats[category].평균경과일수 += daysDiff;
      }
    });

    // 평균 경과일수 계산
    Object.keys(categoryStats).forEach(category => {
      if (categoryStats[category].예약건수 > 0) {
        categoryStats[category].평균경과일수 = 
          Math.round((categoryStats[category].평균경과일수 / categoryStats[category].예약건수) * 10) / 10;
      }
    });

    // 고유 고객수 계산 (카테고리별)
    const uniqueCustomersByCategory: Record<string, Set<string>> = {};
    bookings?.forEach(booking => {
      const serviceType = booking.service_type || '';
      let category = '기타';
      
      if (serviceType.includes('마쓰구 드라이버') || serviceType.includes('드라이버 시타')) {
        category = '마쓰구 드라이버 시타';
      } else if (serviceType.includes('KGFA') || serviceType.includes('1급')) {
        category = 'KGFA 1급 시타';
      }

      if (!uniqueCustomersByCategory[category]) {
        uniqueCustomersByCategory[category] = new Set();
      }
      if (booking.phone) {
        uniqueCustomersByCategory[category].add(booking.phone);
      }
    });

    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].고유고객수 = uniqueCustomersByCategory[category]?.size || 0;
    });

    // 결과 정렬
    const serviceStatsArray = Object.entries(statsByService)
      .map(([service_type, stats]) => ({ service_type, ...stats }))
      .sort((a, b) => b.예약건수 - a.예약건수);

    const categoryStatsArray = Object.entries(categoryStats)
      .map(([서비스카테고리, stats]) => ({ 서비스카테고리, ...stats }))
      .sort((a, b) => b.예약건수 - a.예약건수);

    return res.status(200).json({
      serviceTypeStats: serviceStatsArray,
      categoryStats: categoryStatsArray,
      totalBookings: bookings?.length || 0
    });

  } catch (error) {
    console.error('Service stats API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


