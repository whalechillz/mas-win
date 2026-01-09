import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: 경품 선정 목록 조회
// POST: 경품 선정 (자동/비율/수동)
// PUT: 선정 상태 업데이트 (confirmed, delivered, canceled)
// PATCH: 선정 추가
// DELETE: 선정 취소

// 선정 사유 생성 함수
function generateSelectionReason(rec: any, factors: any): string {
  const reasons: string[] = [];
  
  // 구매 경과 기간
  if (factors.includePurchasePeriod && rec.days_since_last_purchase !== null) {
    const years = Math.floor(rec.days_since_last_purchase / 365);
    if (years < 1) {
      reasons.push('구매(1년 이내)');
    } else if (years < 2) {
      reasons.push('구매(1-2년)');
    } else {
      reasons.push('구매(2년+)');
    }
  } else if (rec.is_purchased === true && rec.days_since_last_purchase != null) {
    reasons.push('구매');
  } else {
    reasons.push('비구매');
  }
  
  // 거리
  if (factors.includeDistance && rec.distance_km) {
    reasons.push(`거리 ${Number(rec.distance_km).toFixed(1)}km`);
  }
  
  // 시타 방문수
  if (factors.includeVisitCount && rec.visit_count > 0) {
    reasons.push(`시타방문 ${rec.visit_count}회`);
  }
  
  // 답변 품질
  if (factors.includeQualityScore && rec.survey_quality_score > 0) {
    reasons.push(`답변품질 ${Number(rec.survey_quality_score).toFixed(1)}점`);
  }
  
  // 나이대 (나이 정보가 있는 경우)
  if (factors.includeAgeGroup && rec.age) {
    const age = parseInt(rec.age);
    if (age >= 20 && age < 30) reasons.push('20대');
    else if (age >= 30 && age < 40) reasons.push('30대');
    else if (age >= 40 && age < 50) reasons.push('40대');
    else if (age >= 50 && age < 60) reasons.push('50대');
    else if (age >= 60 && age < 70) reasons.push('60대');
    else if (age >= 70 && age < 80) reasons.push('70대');
    else if (age >= 80) reasons.push('80대+');
  }
  
  return reasons.join(', ') || '경품 추천';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: 선정 목록 조회
  if (req.method === 'GET') {
    try {
      const { recommendation_date, recommendation_datetime, status } = req.query;

      let query = supabase
        .from('prize_selections')
        .select('*')
        .order('selection_rank', { ascending: true });

      if (recommendation_date) {
        query = query.eq('recommendation_date', recommendation_date);
      }

      // recommendation_datetime이 있으면 해당 시간의 추천만 조회
      if (recommendation_datetime) {
        query = query.eq('recommendation_datetime', decodeURIComponent(recommendation_datetime as string));
      }

      if (status) {
        query = query.eq('selection_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('경품 선정 조회 오류:', error);
        return res.status(500).json({ success: false, message: '선정 조회에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
      });
    } catch (error: any) {
      console.error('경품 선정 조회 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '선정 조회 중 오류가 발생했습니다.' });
    }
  }

  // POST: 경품 선정 (자동/비율/수동)
  if (req.method === 'POST') {
    try {
      const {
        recommendation_date,
        recommendation_datetime,
        selection_mode = 'ratio',
        total_count = 20,
        purchased_ratio = 50,
        non_purchased_ratio = 50,
        purchased_count = 10,
        non_purchased_count = 10,
        filters = {},
        reason_factors = {},
        customer_ids = [],
      } = req.body;

      // 통합된 필터 구조 처리
      const purchasePeriodRange = filters.purchasePeriodRange || { min: 0, max: 600 };
      const purchasePeriodAll = filters.purchasePeriodAll !== false; // 기본값 true
      const distanceRange = filters.distanceRange || { min: 0, max: 500 };
      const distanceAll = filters.distanceAll !== false; // 기본값 true
      const ageRange = filters.ageRange || { min: 0, max: 80 };
      const visitCountNoVisit = filters.visitCountNoVisit || false;
      const visitCountAll = filters.visitCountAll !== false; // 기본값 true
      const visitCountRange = filters.visitCountRange || { min: 1, max: 10 };
      const qualityScoreAll = filters.qualityScoreAll !== false; // 기본값 true
      const qualityScoreRange = filters.qualityScoreRange || { min: 0, max: 10 };

      // 구매 경과 기간 슬라이드 값을 일수로 변환
      const purchasePeriodToDays = (value: number): number => {
        if (value <= 10) return 0; // 0개월
        if (value <= 30) return 30; // 1개월
        if (value <= 60) return 90; // 3개월
        if (value <= 120) return 180; // 6개월
        if (value <= 240) return 365; // 1년
        if (value <= 360) return 730; // 2년
        if (value <= 480) return 1095; // 3년
        if (value <= 600) return 1460; // 4년
        return 1825; // 5년+
      };

      if (!recommendation_date) {
        return res.status(400).json({ success: false, message: 'recommendation_date가 필요합니다.' });
      }

      let recommendations: any[] = [];

      if (selection_mode === 'manual') {
        // 수동 선정: customer_ids로 선택
        if (!customer_ids || customer_ids.length === 0) {
          return res.status(400).json({ success: false, message: '수동 선정 시 customer_ids가 필요합니다.' });
        }

        let query = supabase
          .from('prize_recommendations')
          .select('*')
          .eq('recommendation_date', recommendation_date)
          .eq('is_primary', true)
          .in('survey_id', customer_ids)
          .order('rank', { ascending: true });

        // recommendation_datetime이 있으면 해당 시간의 추천만 조회
        if (recommendation_datetime) {
          query = query.eq('recommendation_datetime', recommendation_datetime);
        }

        const { data, error } = await query;

        if (error) {
          console.error('경품 추천 조회 오류:', error);
          return res.status(500).json({ success: false, message: '경품 추천 조회에 실패했습니다.' });
        }

        recommendations = data || [];
      } else if (selection_mode === 'ratio') {
        // 비율 기반 선정: 총 인원과 비율로 계산
        const calculatedPurchasedCount = Math.round((total_count * purchased_ratio) / 100);
        const calculatedNonPurchasedCount = total_count - calculatedPurchasedCount;

        let purchasedQuery = supabase
          .from('prize_recommendations')
          .select('*')
          .eq('recommendation_date', recommendation_date)
          .eq('is_primary', true)
          .eq('is_purchased', true)
          .not('days_since_last_purchase', 'is', null)
          .not('rank', 'is', null)
          .order('rank', { ascending: true });

        let nonPurchasedQuery = supabase
          .from('prize_recommendations')
          .select('*')
          .eq('recommendation_date', recommendation_date)
          .eq('is_primary', true)
          .or('is_purchased.is.null,is_purchased.eq.false,days_since_last_purchase.is.null')
          .not('rank', 'is', null)
          .order('rank', { ascending: true });

        // recommendation_datetime이 있으면 해당 시간의 추천만 조회
        if (recommendation_datetime) {
          purchasedQuery = purchasedQuery.eq('recommendation_datetime', recommendation_datetime);
          nonPurchasedQuery = nonPurchasedQuery.eq('recommendation_datetime', recommendation_datetime);
        }

        // 구매 경과 기간 필터 (슬라이드 범위)
        if (!purchasePeriodAll) {
          const minDays = purchasePeriodToDays(purchasePeriodRange.min);
          const maxDays = purchasePeriodToDays(purchasePeriodRange.max);
          purchasedQuery = purchasedQuery
            .gte('days_since_last_purchase', minDays)
            .lte('days_since_last_purchase', maxDays);
        }

        // 거리 필터
        if (!distanceAll) {
          purchasedQuery = purchasedQuery
            .gte('distance_km', distanceRange.min || 0)
            .lte('distance_km', distanceRange.max || 500);
          nonPurchasedQuery = nonPurchasedQuery
            .gte('distance_km', distanceRange.min || 0)
            .lte('distance_km', distanceRange.max || 500);
        }

        // 나이대 필터 (age 필드가 있는 경우)
        // 주의: prize_recommendations 테이블에 age 필드가 없을 수 있으므로
        // 실제 구현 시 customers 테이블과 JOIN 필요

        // 시타 방문수 필터
        if (!visitCountAll) {
          // 방문전체가 체크되지 않은 경우
          if (visitCountNoVisit) {
            // 무방문 체크: visit_count === 0이고 booking_count === 0인 경우
            // Supabase에서는 AND 조건을 직접 사용할 수 없으므로, visit_count === 0 조건만 적용하고
            // booking_count === 0 조건은 결과를 받은 후 클라이언트 측에서 추가 필터링
            purchasedQuery = purchasedQuery
              .or('visit_count.eq.0,visit_count.is.null');
            nonPurchasedQuery = nonPurchasedQuery
              .or('visit_count.eq.0,visit_count.is.null');
            // booking_count === 0 조건은 결과를 받은 후 필터링 (아래에서 처리)
          } else {
            // 무방문 미체크: 범위 내만 (visit_count > 0 또는 booking_count > 0이어야 함)
            // visit_count가 범위 내이거나 booking_count > 0인 경우
            purchasedQuery = purchasedQuery.or(`visit_count.gte.${visitCountRange.min},visit_count.lte.${visitCountRange.max},booking_count.gt.0`);
            nonPurchasedQuery = nonPurchasedQuery.or(`visit_count.gte.${visitCountRange.min},visit_count.lte.${visitCountRange.max},booking_count.gt.0`);
          }
        } else {
          // 방문전체가 체크된 경우
          if (visitCountNoVisit) {
            // 방문전체 + 무방문 체크 = 모든 방문수 포함 (필터 없음)
          } else {
            // 방문전체 + 무방문 미체크 = 방문한 고객만 (visit_count > 0 또는 booking_count > 0)
            purchasedQuery = purchasedQuery.or('visit_count.gt.0,booking_count.gt.0');
            nonPurchasedQuery = nonPurchasedQuery.or('visit_count.gt.0,booking_count.gt.0');
          }
        }

        // 답변 품질 필터
        if (!qualityScoreAll) {
          purchasedQuery = purchasedQuery
            .gte('survey_quality_score', qualityScoreRange.min)
            .lte('survey_quality_score', qualityScoreRange.max);
          nonPurchasedQuery = nonPurchasedQuery
            .gte('survey_quality_score', qualityScoreRange.min)
            .lte('survey_quality_score', qualityScoreRange.max);
        }

        const { data: purchasedData, error: purchasedError } = await purchasedQuery.limit(calculatedPurchasedCount);
        const { data: nonPurchasedData, error: nonPurchasedError } = await nonPurchasedQuery.limit(calculatedNonPurchasedCount);

        if (purchasedError || nonPurchasedError) {
          console.error('경품 추천 조회 오류:', purchasedError || nonPurchasedError);
          return res.status(500).json({ success: false, message: '경품 추천 조회에 실패했습니다.' });
        }

        let allRecommendations = [...(purchasedData || []), ...(nonPurchasedData || [])];
        
        // 무방문 필터가 적용된 경우, booking_count <= 0 조건도 클라이언트 측에서 추가 필터링
        if (!visitCountAll && visitCountNoVisit) {
          allRecommendations = allRecommendations.filter((rec: any) => {
            const bookingCount = rec.booking_count || 0;
            return bookingCount === 0;
          });
        }
        
        recommendations = allRecommendations;
      } else {
        // 자동 선정 (기존 방식)
        let query = supabase
          .from('prize_recommendations')
          .select('*')
          .eq('recommendation_date', recommendation_date)
          .eq('is_primary', true)
          .not('rank', 'is', null)
          .order('rank', { ascending: true });

        // recommendation_datetime이 있으면 해당 시간의 추천만 조회
        if (recommendation_datetime) {
          query = query.eq('recommendation_datetime', recommendation_datetime);
        }

        // 필터 적용
        if (filters.purchaseStatus === 'purchased') {
          query = query.eq('is_purchased', true).not('days_since_last_purchase', 'is', null);
        } else if (filters.purchaseStatus === 'non_purchased') {
          query = query.or('is_purchased.is.null,is_purchased.eq.false,days_since_last_purchase.is.null');
        }

        // 구매 경과 기간 필터 (슬라이드 범위)
        if (!purchasePeriodAll) {
          const minDays = purchasePeriodToDays(purchasePeriodRange.min);
          const maxDays = purchasePeriodToDays(purchasePeriodRange.max);
          query = query
            .gte('days_since_last_purchase', minDays)
            .lte('days_since_last_purchase', maxDays);
        }

        // 거리 필터
        if (!distanceAll) {
          query = query
            .gte('distance_km', distanceRange.min || 0)
            .lte('distance_km', distanceRange.max || 500);
        }

        // 나이대 필터 (age 필드가 있는 경우)
        // 주의: prize_recommendations 테이블에 age 필드가 없을 수 있으므로
        // 실제 구현 시 customers 테이블과 JOIN 필요

        // 시타 방문수 필터
        if (!visitCountAll) {
          // 방문전체가 체크되지 않은 경우
          if (visitCountNoVisit) {
            // 무방문 체크: visit_count === 0이고 booking_count === 0인 경우만
            query = query
              .or('visit_count.eq.0,visit_count.is.null')
              .or('booking_count.eq.0,booking_count.is.null');
          } else {
            // 무방문 미체크: 범위 내만 (visit_count > 0 또는 booking_count > 0이어야 함)
            // visit_count가 범위 내이거나 booking_count > 0인 경우
            query = query.or(`visit_count.gte.${visitCountRange.min},visit_count.lte.${visitCountRange.max},booking_count.gt.0`);
          }
        } else {
          // 방문전체가 체크된 경우
          if (visitCountNoVisit) {
            // 방문전체 + 무방문 체크 = 모든 방문수 포함 (필터 없음)
          } else {
            // 방문전체 + 무방문 미체크 = 방문한 고객만 (visit_count > 0 또는 booking_count > 0)
            query = query.or('visit_count.gt.0,booking_count.gt.0');
          }
        }

        // 답변 품질 필터
        if (!qualityScoreAll) {
          query = query
            .gte('survey_quality_score', qualityScoreRange.min)
            .lte('survey_quality_score', qualityScoreRange.max);
        }

        const { data, error } = await query.limit(Number(count));

        if (error) {
          console.error('경품 추천 조회 오류:', error);
          return res.status(500).json({ success: false, message: '경품 추천 조회에 실패했습니다.' });
        }

        recommendations = data || [];
      }

      if (recommendations.length === 0) {
        return res.status(404).json({ success: false, message: '선정할 경품 추천 데이터가 없습니다.' });
      }

      // 기존 선정 데이터 삭제 (같은 날짜 + 같은 시간)
      if (recommendation_datetime) {
        await supabase
          .from('prize_selections')
          .delete()
          .eq('recommendation_date', recommendation_date)
          .eq('recommendation_datetime', recommendation_datetime);
      } else {
        // recommendation_datetime이 없으면 날짜만으로 삭제 (하위 호환성)
        await supabase
          .from('prize_selections')
          .delete()
          .eq('recommendation_date', recommendation_date);
      }

      // 선정 데이터 생성
      const selections = recommendations.map((rec, index) => ({
        recommendation_date: recommendation_date,
        recommendation_datetime: recommendation_datetime || null,
        customer_id: rec.customer_id,
        survey_id: rec.survey_id,
        phone: rec.phone,
        name: rec.name,
        total_score: rec.total_score,
        selection_rank: index + 1,
        selection_reason: generateSelectionReason(rec, reason_factors),
        selection_status: 'selected',
        selected_at: new Date().toISOString(),
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('prize_selections')
        .insert(selections)
        .select();

      if (insertError) {
        console.error('경품 선정 저장 오류:', insertError);
        return res.status(500).json({ success: false, message: '경품 선정 저장에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        data: insertedData,
        message: `${insertedData?.length || 0}명이 선정되었습니다.`,
      });
    } catch (error: any) {
      console.error('경품 선정 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '경품 선정 중 오류가 발생했습니다.' });
    }
  }

  // PUT: 선정 상태 업데이트
  if (req.method === 'PUT') {
    try {
      const { id, status, reason } = req.body;

      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'id와 status가 필요합니다.' });
      }

      const updateData: any = {
        selection_status: status,
      };

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (reason) {
        updateData.selection_reason = reason;
      }

      const { data, error } = await supabase
        .from('prize_selections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('선정 상태 업데이트 오류:', error);
        return res.status(500).json({ success: false, message: '상태 업데이트에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('선정 상태 업데이트 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '상태 업데이트 중 오류가 발생했습니다.' });
    }
  }

  // PATCH: 선정 추가 (기존 선정 유지하고 추가)
  if (req.method === 'PATCH') {
    try {
      const { recommendation_date, recommendation_datetime, customer_ids, reason_factors = {} } = req.body;

      if (!recommendation_date || !customer_ids || customer_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'recommendation_date와 customer_ids가 필요합니다.' });
      }

      // 기존 선정 목록 조회 (최대 순위 확인)
      let existingQuery = supabase
        .from('prize_selections')
        .select('selection_rank')
        .eq('recommendation_date', recommendation_date);
      
      // recommendation_datetime이 있으면 해당 시간의 추천만 조회
      if (recommendation_datetime) {
        existingQuery = existingQuery.eq('recommendation_datetime', recommendation_datetime);
      }
      
      const { data: existing } = await existingQuery
        .order('selection_rank', { ascending: false })
        .limit(1);

      const nextRank = existing && existing.length > 0 ? existing[0].selection_rank + 1 : 1;

      // 추가할 고객 정보 조회
      let query = supabase
        .from('prize_recommendations')
        .select('*')
        .eq('recommendation_date', recommendation_date)
        .in('survey_id', customer_ids);

      // recommendation_datetime이 있으면 해당 시간의 추천만 조회
      if (recommendation_datetime) {
        query = query.eq('recommendation_datetime', recommendation_datetime);
      }

      const { data: customers, error: fetchError } = await query;

      if (fetchError) {
        console.error('경품 추천 조회 오류:', fetchError);
        return res.status(500).json({ success: false, message: '경품 추천 조회에 실패했습니다.' });
      }

      if (!customers || customers.length === 0) {
        return res.status(404).json({ success: false, message: '추가할 경품 추천 데이터가 없습니다.' });
      }

      // 선정 데이터 생성
      const newSelections = customers.map((rec, index) => ({
        recommendation_date,
        recommendation_datetime: recommendation_datetime || null,
        customer_id: rec.customer_id,
        survey_id: rec.survey_id,
        phone: rec.phone,
        name: rec.name,
        total_score: rec.total_score,
        selection_rank: nextRank + index,
        selection_reason: generateSelectionReason(rec, reason_factors),
        selection_status: 'selected',
        selected_at: new Date().toISOString(),
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('prize_selections')
        .insert(newSelections)
        .select();

      if (insertError) {
        console.error('선정 추가 오류:', insertError);
        return res.status(500).json({ success: false, message: '선정 추가에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        data: insertedData,
        message: `${insertedData?.length || 0}명이 추가되었습니다.`,
      });
    } catch (error: any) {
      console.error('선정 추가 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '선정 추가 중 오류가 발생했습니다.' });
    }
  }

  // DELETE: 선정 취소
  if (req.method === 'DELETE') {
    try {
      const { id, recommendation_date, recommendation_datetime } = req.query;

      if (id) {
        // 특정 선정 취소
        const { error } = await supabase
          .from('prize_selections')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('선정 취소 오류:', error);
          return res.status(500).json({ success: false, message: '선정 취소에 실패했습니다.' });
        }

        return res.status(200).json({ success: true, message: '선정이 취소되었습니다.' });
      } else if (recommendation_date) {
        // 해당 날짜(+ 시간)의 모든 선정 취소
        let deleteQuery = supabase
          .from('prize_selections')
          .delete()
          .eq('recommendation_date', recommendation_date);
        
        // recommendation_datetime이 있으면 해당 시간의 추천만 삭제
        if (recommendation_datetime) {
          deleteQuery = deleteQuery.eq('recommendation_datetime', decodeURIComponent(recommendation_datetime as string));
        }
        
        const { error } = await deleteQuery;

        if (error) {
          console.error('선정 취소 오류:', error);
          return res.status(500).json({ success: false, message: '선정 취소에 실패했습니다.' });
        }

        return res.status(200).json({ success: true, message: '모든 선정이 취소되었습니다.' });
      } else {
        return res.status(400).json({ success: false, message: 'id 또는 recommendation_date가 필요합니다.' });
      }
    } catch (error: any) {
      console.error('선정 취소 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '선정 취소 중 오류가 발생했습니다.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

