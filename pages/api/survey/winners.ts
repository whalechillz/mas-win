import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 관리자 전화번호 목록 (당첨자 명단에서 제외)
 */
const ADMIN_PHONES = ['01066699000']; // 김탁수 관리자

/**
 * 당첨자 명단 조회 API
 * GET /api/survey/winners
 * 
 * Query Parameters:
 * - type: 'all' | 'winner' | 'gift' (기본값: 'all')
 * - campaign_source: 설문 캠페인 소스 (기본값: 'muziik-survey-2025')
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      type = 'all', // 'all' | 'winner' | 'gift'
      campaign_source = 'muziik-survey-2025',
    } = req.query as Record<string, string>;

    // 1. 설문 목록 조회 (campaign_source 필터 적용)
    let query = supabase
      .from('surveys')
      .select('*')
      .eq('campaign_source', campaign_source)
      .not('phone', 'in', `(${ADMIN_PHONES.map(p => `'${p}'`).join(',')})`); // 관리자 제외

    const { data: surveys, error: surveysError } = await query;

    if (surveysError) {
      console.error('설문 목록 조회 오류:', surveysError);
      return res.status(500).json({
        success: false,
        message: '설문 목록을 불러오는데 실패했습니다.',
        error: surveysError.message,
      });
    }

    if (!surveys || surveys.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          winners: [],
          total: 0,
        },
      });
    }

    // 2. 당첨 여부 확인 (prize_selections 테이블)
    const surveyIds = surveys.map(s => s.id);
    
    const { data: prizeSelections } = await supabase
      .from('prize_selections')
      .select('survey_id')
      .in('survey_id', surveyIds)
      .eq('selection_status', 'selected');

    const winnerSurveyIds = new Set<string>();
    if (prizeSelections) {
      prizeSelections.forEach((ps: any) => {
        if (ps.survey_id) {
          winnerSurveyIds.add(ps.survey_id);
        }
      });
    }

    // 3. 당첨자 및 선물 수령자 필터링
    let filteredWinners = surveys.map((survey: any) => {
      const isWinner = winnerSurveyIds.has(survey.id);
      const giftDelivered = survey.gift_delivered || false;
      const eventWinner = survey.event_winner || false;

      return {
        id: survey.id,
        name: survey.name,
        phone: survey.phone,
        selected_model: survey.selected_model,
        important_factors: survey.important_factors || [],
        is_winner: isWinner,
        event_winner: eventWinner,
        gift_delivered: giftDelivered,
        created_at: survey.created_at,
      };
    });

    // type 필터 적용
    if (type === 'winner') {
      filteredWinners = filteredWinners.filter(w => w.is_winner || w.event_winner);
    } else if (type === 'gift') {
      filteredWinners = filteredWinners.filter(w => w.gift_delivered);
    }

    // 제출일 기준 내림차순 정렬
    filteredWinners.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      data: {
        winners: filteredWinners,
        total: filteredWinners.length,
      },
    });
  } catch (error: any) {
    console.error('당첨자 명단 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}
