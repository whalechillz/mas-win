import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { ids } = req.body;

    console.log('[bulk-delete] 삭제 요청 시작:', {
      idsCount: ids?.length || 0,
      ids: ids,
      timestamp: new Date().toISOString(),
    });

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('[bulk-delete] 유효하지 않은 요청:', { ids });
      return res.status(400).json({ success: false, message: '삭제할 설문 ID가 필요합니다.' });
    }

    // 1. 관련된 prize_selections 먼저 삭제 (외래 키 제약 조건 해결)
    console.log('[bulk-delete] 1단계: prize_selections 삭제 시작');
    const { data: selectionsData, error: selectionsError, count: selectionsCount } = await supabase
      .from('prize_selections')
      .delete()
      .in('survey_id', ids)
      .select();

    if (selectionsError) {
      console.error('[bulk-delete] ❌ prize_selections 삭제 오류:', {
        error: selectionsError,
        message: selectionsError.message,
        code: selectionsError.code,
        details: selectionsError.details,
        hint: selectionsError.hint,
      });
      // prize_selections 삭제 실패해도 계속 진행 (없을 수도 있음)
    } else {
      console.log(`[bulk-delete] ✅ prize_selections 삭제 완료:`, {
        deletedCount: selectionsData?.length || 0,
        surveyCount: ids.length,
      });
    }

    // 2. 관련된 prize_recommendations 삭제 (외래 키 제약 조건 해결)
    console.log('[bulk-delete] 2단계: prize_recommendations 삭제 시작');
    const { data: recommendationsData, error: recommendationsError } = await supabase
      .from('prize_recommendations')
      .delete()
      .in('survey_id', ids)
      .select();

    if (recommendationsError) {
      console.error('[bulk-delete] ❌ prize_recommendations 삭제 오류:', {
        error: recommendationsError,
        message: recommendationsError.message,
        code: recommendationsError.code,
        details: recommendationsError.details,
        hint: recommendationsError.hint,
      });
      // prize_recommendations 삭제 실패해도 계속 진행 (없을 수도 있음)
    } else {
      console.log(`[bulk-delete] ✅ prize_recommendations 삭제 완료:`, {
        deletedCount: recommendationsData?.length || 0,
        surveyCount: ids.length,
      });
    }

    // 3. 관련된 customer_gifts의 survey_id를 NULL로 설정 (외래 키 제약 조건 해결)
    // 선물 지급 기록은 유지하되 설문 연결만 해제
    console.log('[bulk-delete] 3단계: customer_gifts survey_id NULL 처리 시작');
    
    // 먼저 관련된 customer_gifts 레코드 확인
    const { data: giftsBeforeUpdate, error: giftsCheckError } = await supabase
      .from('customer_gifts')
      .select('id, survey_id')
      .in('survey_id', ids);
    
    if (giftsCheckError) {
      console.error('[bulk-delete] ⚠️ customer_gifts 조회 오류:', {
        error: giftsCheckError,
        message: giftsCheckError.message,
      });
    } else {
      console.log(`[bulk-delete] customer_gifts 조회 결과:`, {
        foundCount: giftsBeforeUpdate?.length || 0,
        surveyIds: ids,
      });
    }
    
    const { data: giftsUpdateData, error: giftsError } = await supabase
      .from('customer_gifts')
      .update({ survey_id: null })
      .in('survey_id', ids)
      .select();

    if (giftsError) {
      console.error('[bulk-delete] ❌ customer_gifts 업데이트 오류:', {
        error: giftsError,
        message: giftsError.message,
        code: giftsError.code,
        details: giftsError.details,
        hint: giftsError.hint,
      });
      // customer_gifts 업데이트 실패해도 계속 진행 (없을 수도 있음)
    } else {
      console.log(`[bulk-delete] ✅ customer_gifts survey_id NULL 처리 완료:`, {
        updatedCount: giftsUpdateData?.length || 0,
        surveyCount: ids.length,
      });
    }

    // 3-1. 관련된 customer_address_cache의 survey_id를 NULL로 설정 (외래 키 제약 조건 해결)
    // 위치 정보 캐시는 유지하되 설문 연결만 해제
    console.log('[bulk-delete] 3-1단계: customer_address_cache survey_id NULL 처리 시작');
    
    // 먼저 관련된 customer_address_cache 레코드 확인
    const { data: cacheBeforeUpdate, error: cacheCheckError } = await supabase
      .from('customer_address_cache')
      .select('id, survey_id, customer_id, address')
      .in('survey_id', ids);
    
    if (cacheCheckError) {
      console.error('[bulk-delete] ⚠️ customer_address_cache 조회 오류:', {
        error: cacheCheckError,
        message: cacheCheckError.message,
      });
    } else {
      console.log(`[bulk-delete] customer_address_cache 조회 결과:`, {
        foundCount: cacheBeforeUpdate?.length || 0,
        surveyIds: ids,
        cacheRecords: cacheBeforeUpdate?.map(c => ({ id: c.id, survey_id: c.survey_id, customer_id: c.customer_id })),
      });
    }
    
    const { data: cacheUpdateData, error: cacheError } = await supabase
      .from('customer_address_cache')
      .update({ survey_id: null })
      .in('survey_id', ids)
      .select();

    if (cacheError) {
      console.error('[bulk-delete] ❌ customer_address_cache 업데이트 오류:', {
        error: cacheError,
        message: cacheError.message,
        code: cacheError.code,
        details: cacheError.details,
        hint: cacheError.hint,
      });
      // customer_address_cache 업데이트 실패 시 삭제 시도
      console.log('[bulk-delete] customer_address_cache 삭제 시도...');
      const { error: cacheDeleteError } = await supabase
        .from('customer_address_cache')
        .delete()
        .in('survey_id', ids);
      
      if (cacheDeleteError) {
        console.error('[bulk-delete] ❌ customer_address_cache 삭제도 실패:', {
          error: cacheDeleteError,
          message: cacheDeleteError.message,
        });
        // 삭제 실패해도 계속 진행 (없을 수도 있음)
      } else {
        console.log(`[bulk-delete] ✅ customer_address_cache 삭제 완료: ${ids.length}개 설문`);
      }
    } else {
      console.log(`[bulk-delete] ✅ customer_address_cache survey_id NULL 처리 완료:`, {
        updatedCount: cacheUpdateData?.length || 0,
        surveyCount: ids.length,
      });
    }

    // 4. 설문 삭제
    console.log('[bulk-delete] 4단계: surveys 삭제 시작');
    
    // 삭제 전 설문 존재 여부 확인
    const { data: surveysBeforeDelete, error: checkError } = await supabase
      .from('surveys')
      .select('id, name, phone')
      .in('id', ids);
    
    if (checkError) {
      console.error('[bulk-delete] ⚠️ 설문 조회 오류:', {
        error: checkError,
        message: checkError.message,
      });
    } else {
      console.log(`[bulk-delete] 삭제 대상 설문 조회 결과:`, {
        foundCount: surveysBeforeDelete?.length || 0,
        requestedCount: ids.length,
        surveys: surveysBeforeDelete?.map(s => ({ id: s.id, name: s.name, phone: s.phone })),
      });
    }
    
    const { data: deletedSurveys, error } = await supabase
      .from('surveys')
      .delete()
      .in('id', ids)
      .select();

    if (error) {
      console.error('[bulk-delete] ❌ 설문 삭제 오류:', {
        error: error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        requestedIds: ids,
        foundSurveys: surveysBeforeDelete,
      });
      return res.status(500).json({
        success: false,
        message: '일괄 삭제 중 오류가 발생했습니다.',
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
    }

    console.log(`[bulk-delete] ✅ 설문 삭제 완료:`, {
      deletedCount: deletedSurveys?.length || 0,
      requestedCount: ids.length,
      deletedSurveys: deletedSurveys?.map(s => ({ id: s.id, name: s.name })),
    });

    return res.status(200).json({
      success: true,
      message: `${ids.length}개의 설문이 삭제되었습니다.`,
    });
  } catch (error: any) {
    console.error('[bulk-delete] ❌ 서버 오류 (catch 블록):', {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error?.message || 'Unknown error',
      errorStack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}


