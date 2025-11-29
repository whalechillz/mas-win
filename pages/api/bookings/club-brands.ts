// 골프 클럽 브랜드 자동완성 API
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 주요 골프 브랜드 목록 (기본 데이터)
const DEFAULT_BRANDS = [
  '타이틀리스트', 'Titleist',
  '캘러웨이', 'Callaway',
  '테일러메이드', 'TaylorMade',
  '핑', 'Ping',
  '코브라', 'Cobra',
  '미즈노', 'Mizuno',
  'Srixon',
  '브리지스톤', 'Bridgestone',
  '윌슨', 'Wilson',
  '클리브랜드', 'Cleveland',
  '오딧세이', 'Odyssey',
  'MASSGOO', '마쓰구',
  '마루망', 'Marumang',
  'PXG',
  '홍콩골프', 'Hong Kong Golf',
  '기타'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.query;
    
    // 기존 예약 데이터에서 브랜드 추출
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('club_brand')
      .not('club_brand', 'is', null)
      .neq('club_brand', '');

    if (error) {
      console.error('Error fetching brands:', error);
    }

    // 기존 데이터에서 고유한 브랜드 추출
    const existingBrands = bookings
      ? [...new Set(bookings.map(b => b.club_brand).filter(Boolean))]
      : [];

    // 기본 브랜드와 기존 데이터 브랜드 합치기
    const allBrands = [...new Set([...DEFAULT_BRANDS, ...existingBrands])];

    // 쿼리가 있으면 필터링
    let filteredBrands = allBrands;
    if (query && typeof query === 'string') {
      const queryLower = query.toLowerCase();
      filteredBrands = allBrands.filter(brand =>
        brand.toLowerCase().includes(queryLower)
      );
    }

    // 최대 20개 반환
    return res.status(200).json({
      brands: filteredBrands.slice(0, 20),
      total: filteredBrands.length
    });
  } catch (error) {
    console.error('Error in club-brands API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      brands: DEFAULT_BRANDS.slice(0, 20)
    });
  }
}

