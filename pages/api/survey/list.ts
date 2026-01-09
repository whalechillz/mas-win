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
    const {
      page = '1',
      pageSize = '50',
      q = '', // 검색어 (이름, 전화번호)
      selected_model = '', // 모델 필터
      age_group = '', // 연령대 필터
      winner = '', // 당첨자 필터: 'winner' | 'non_winner' | ''
      purchased = '', // 구매자 필터: 'purchased' | 'non_purchased' | ''
      recommendation_name = '', // 추천명 필터: 'date_datetime' 형식
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));

    // 정렬 컬럼 검증
    const allowedSortColumns = ['created_at', 'name', 'phone', 'selected_model', 'age_group'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    // 설문 목록 조회 (당첨 여부 및 거리 정보 포함)
    // 필터링이 필요한 경우 전체 데이터를 먼저 가져온 후 필터링
    // 1. 먼저 기본 설문 데이터 조회 (필터링 전에는 pagination 적용하지 않음)
    let query = supabase
      .from('surveys')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending });

    // 검색 필터
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
      
      if (cleanSearchTerm.length > 0) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%`);
      } else {
        query = query.ilike('name', `%${searchTerm}%`);
      }
    }

    // 모델 필터
    if (selected_model) {
      query = query.eq('selected_model', selected_model);
    }

    // 연령대 필터
    if (age_group) {
      query = query.eq('age_group', age_group);
    }

    const { data: surveys, error, count } = await query;

    if (error) {
      console.error('설문 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '설문 목록을 불러오는데 실패했습니다.',
        error: error.message,
      });
    }

    if (!surveys || surveys.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: pageNum,
          pageSize: sizeNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / sizeNum),
        },
      });
    }

    // 2. 당첨 여부 확인 (prize_selections 테이블)
    const surveyIds = surveys.map(s => s.id);
    
    // 추천명 필터가 있으면 해당 추천의 당첨자만 조회
    let prizeSelectionsQuery = supabase
      .from('prize_selections')
      .select('survey_id')
      .in('survey_id', surveyIds)
      .eq('selection_status', 'selected');

    // 추천명 필터가 있으면 recommendation_datetime 필터 적용
    if (recommendation_name && recommendation_name !== 'all') {
      const parts = recommendation_name.split('_');
      const filterDate = parts[0];
      const filterDateTime = parts.slice(1).join('_'); // datetime에 _가 포함될 수 있으므로
      
      prizeSelectionsQuery = prizeSelectionsQuery.eq('recommendation_date', filterDate);
      if (filterDateTime && filterDateTime.trim() !== '') {
        prizeSelectionsQuery = prizeSelectionsQuery.eq('recommendation_datetime', filterDateTime);
      }
    }

    const { data: prizeSelections } = await prizeSelectionsQuery;

    const winnerSurveyIds = new Set<string>();
    if (prizeSelections) {
      prizeSelections.forEach((ps: any) => {
        if (ps.survey_id) {
          winnerSurveyIds.add(ps.survey_id);
        }
      });
    }

    // 3. 거리 및 구매여부 정보 확인 (prize_recommendations 테이블)
    // 추천명 필터가 있으면 해당 추천 데이터만, 없으면 최신 추천 데이터를 기준으로 조회
    let prizeRecommendationsQuery = supabase
      .from('prize_recommendations')
      .select('survey_id, distance_km, is_purchased, days_since_last_purchase')
      .in('survey_id', surveyIds);

    // 추천명 필터가 있으면 해당 추천 데이터만 조회
    if (recommendation_name && recommendation_name !== 'all') {
      const parts = recommendation_name.split('_');
      const filterDate = parts[0];
      const filterDateTime = parts.slice(1).join('_');
      
      prizeRecommendationsQuery = prizeRecommendationsQuery.eq('recommendation_date', filterDate);
      if (filterDateTime && filterDateTime.trim() !== '') {
        prizeRecommendationsQuery = prizeRecommendationsQuery.eq('recommendation_datetime', filterDateTime);
      }
    } else {
      // 추천명 필터가 없으면 최신 데이터만 사용
      prizeRecommendationsQuery = prizeRecommendationsQuery
        .order('recommendation_date', { ascending: false })
        .order('recommendation_datetime', { ascending: false });
    }

    const { data: prizeRecommendations } = await prizeRecommendationsQuery;

    // 각 survey_id별로 최신 데이터만 사용 (추천명 필터가 없을 때만)
    const recommendationMap = new Map<string, any>();
    if (prizeRecommendations) {
      if (recommendation_name && recommendation_name !== 'all') {
        // 추천명 필터가 있으면 해당 추천의 데이터만 사용
        prizeRecommendations.forEach((pr: any) => {
          if (pr.survey_id) {
            recommendationMap.set(pr.survey_id, {
              distance_km: pr.distance_km,
              is_purchased: pr.is_purchased,
              days_since_last_purchase: pr.days_since_last_purchase,
            });
          }
        });
      } else {
        // 추천명 필터가 없으면 최신 데이터만 사용
        prizeRecommendations.forEach((pr: any) => {
          if (pr.survey_id && !recommendationMap.has(pr.survey_id)) {
            recommendationMap.set(pr.survey_id, {
              distance_km: pr.distance_km,
              is_purchased: pr.is_purchased,
              days_since_last_purchase: pr.days_since_last_purchase,
            });
          }
        });
      }
    }

    // 4. 설문 데이터에 당첨 여부 및 거리 정보 추가
    let enrichedSurveys = surveys.map((survey: any) => {
      const isWinner = winnerSurveyIds.has(survey.id);
      const recommendation = recommendationMap.get(survey.id);
      
      return {
        ...survey,
        is_winner: isWinner,
        distance_km: recommendation?.distance_km || null,
        is_purchased: recommendation?.is_purchased || false,
        days_since_last_purchase: recommendation?.days_since_last_purchase || null,
      };
    });

    // 5. 당첨자 필터 적용
    if (winner === 'winner') {
      enrichedSurveys = enrichedSurveys.filter(s => s.is_winner === true);
    } else if (winner === 'non_winner') {
      enrichedSurveys = enrichedSurveys.filter(s => s.is_winner !== true);
    }

    // 6. 구매자 필터 적용
    if (purchased === 'purchased') {
      enrichedSurveys = enrichedSurveys.filter(s => 
        s.is_purchased === true && s.days_since_last_purchase != null
      );
    } else if (purchased === 'non_purchased') {
      enrichedSurveys = enrichedSurveys.filter(s => 
        !(s.is_purchased === true && s.days_since_last_purchase != null)
      );
    }

    // 7. 추천명 필터 적용 (해당 추천에 포함된 설문만 표시)
    if (recommendation_name && recommendation_name !== 'all') {
      // recommendation_name 형식: "date_datetime" (예: "2026-01-08_2026-01-08T06:47:00+09:00")
      const parts = recommendation_name.split('_');
      const filterDate = parts[0];
      const filterDateTime = parts.slice(1).join('_'); // datetime에 _가 포함될 수 있으므로
      
      // 해당 추천에 포함된 survey_id 목록 조회
      let recommendationQuery = supabase
        .from('prize_recommendations')
        .select('survey_id')
        .eq('recommendation_date', filterDate);
      
      if (filterDateTime && filterDateTime.trim() !== '') {
        recommendationQuery = recommendationQuery.eq('recommendation_datetime', filterDateTime);
      }
      
      const { data: recommendationData } = await recommendationQuery;
      const recommendationSurveyIds = new Set(
        (recommendationData || []).map((r: any) => r.survey_id).filter(Boolean)
      );
      
      // 해당 추천에 포함된 설문만 필터링
      enrichedSurveys = enrichedSurveys.filter(s => recommendationSurveyIds.has(s.id));
    }

    // 8. 필터링된 결과의 총 개수
    const filteredCount = enrichedSurveys.length;

    // 8. 필터링 후 pagination 적용 (필터링 전에 이미 pagination이 적용되었으므로 재적용)
    // 주의: 필터링이 적용되면 원래 pagination이 의미가 없어지므로, 필터링된 결과를 다시 pagination
    const fromFiltered = (pageNum - 1) * sizeNum;
    const toFiltered = fromFiltered + sizeNum;
    const paginatedData = enrichedSurveys.slice(fromFiltered, toFiltered);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total: filteredCount,
        totalPages: Math.ceil(filteredCount / sizeNum),
      },
    });
  } catch (error: any) {
    console.error('설문 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}


