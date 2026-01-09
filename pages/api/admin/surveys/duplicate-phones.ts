import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 전체 설문에서 전화번호별 카운트 조회
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('phone')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (error) {
      console.error('전화번호 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '전화번호 조회에 실패했습니다.',
        error: error.message,
      });
    }

    // 전화번호별 카운트 계산
    const phoneCountMap = new Map<string, number>();
    const totalSurveys = surveys?.length || 0;
    const uniquePhones = new Set<string>();

    if (surveys) {
      surveys.forEach((survey) => {
        const phone = survey.phone?.trim();
        if (phone && phone.length > 0) {
          uniquePhones.add(phone);
          const count = phoneCountMap.get(phone) || 0;
          phoneCountMap.set(phone, count + 1);
        }
      });
    }

    // 중복 전화번호만 필터링
    const duplicatePhones: Record<string, number> = {};
    phoneCountMap.forEach((count, phone) => {
      if (count > 1) {
        duplicatePhones[phone] = count;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        phoneCountMap: Object.fromEntries(phoneCountMap), // 모든 전화번호별 카운트
        duplicatePhones, // 중복 전화번호만
        totalSurveys, // 전체 설문 수
        uniquePhones: uniquePhones.size, // 고유 전화번호 수
        duplicateCount: Object.keys(duplicatePhones).length, // 중복 전화번호 개수
      },
    });
  } catch (error: any) {
    console.error('전화번호 중복 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

