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
    // 1. 모든 설문 조회
    const { data: allSurveys, error: surveysError } = await supabase
      .from('surveys')
      .select('id, name, phone, address, created_at')
      .order('created_at', { ascending: false });

    if (surveysError) {
      console.error('설문 조회 오류:', surveysError);
      return res.status(500).json({ success: false, message: '설문 조회에 실패했습니다.' });
    }

    // 2. 최신 경품 추천 이력 조회 (section: 'all')
    const { data: prizeRecommendations, error: prizeError } = await supabase
      .from('prize_recommendations')
      .select('customer_id, phone, name, recommendation_date, recommendation_datetime')
      .eq('section', 'all')
      .order('recommendation_datetime', { ascending: false })
      .limit(10000);

    if (prizeError) {
      console.error('경품 추천 이력 조회 오류:', prizeError);
      return res.status(500).json({ success: false, message: '경품 추천 이력 조회에 실패했습니다.' });
    }

    // 3. 최신 경품 추천의 날짜 확인
    const latestDate = prizeRecommendations?.[0]?.recommendation_date;
    if (!latestDate) {
      return res.status(200).json({
        success: true,
        message: '경품 추천 이력이 없습니다.',
        data: {
          totalSurveys: allSurveys?.length || 0,
          totalInPrize: 0,
          missingCount: allSurveys?.length || 0,
          missingCustomers: allSurveys?.map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone || '전화번호 없음',
            address: s.address,
            created_at: s.created_at,
            reason: !s.phone || s.phone.trim() === '' ? '전화번호 없음' : '경품 추천 이력 없음'
          })) || []
        }
      });
    }

    // 4. 최신 경품 추천에 포함된 전화번호 목록
    const latestRecommendations = prizeRecommendations?.filter((r: any) => r.recommendation_date === latestDate) || [];
    const includedPhones = new Set(latestRecommendations.map((r: any) => r.phone).filter(Boolean));
    const includedCustomerIds = new Set(latestRecommendations.map((r: any) => r.customer_id).filter(Boolean));

    // 5. 모든 설문의 전화번호 목록
    const allSurveyPhones = new Set(allSurveys?.map((s: any) => s.phone).filter(Boolean) || []);

    // 6. 누락된 고객 찾기
    const missingCustomers: any[] = [];
    
    if (allSurveys) {
      for (const survey of allSurveys) {
        // 전화번호가 없는 경우
        if (!survey.phone || survey.phone.trim() === '') {
          missingCustomers.push({
            id: survey.id,
            name: survey.name,
            phone: survey.phone || '전화번호 없음',
            address: survey.address,
            created_at: survey.created_at,
            reason: '전화번호 없음'
          });
          continue;
        }

        // 전화번호가 있지만 경품 추천에 포함되지 않은 경우
        if (!includedPhones.has(survey.phone)) {
          // customer_id로도 확인
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', survey.phone)
            .maybeSingle();

          if (customer && includedCustomerIds.has(customer.id)) {
            // customer_id로는 포함되어 있음 (전화번호 불일치)
            continue;
          }

          missingCustomers.push({
            id: survey.id,
            name: survey.name,
            phone: survey.phone,
            address: survey.address,
            created_at: survey.created_at,
            reason: '경품 추천에 포함되지 않음'
          });
        }
      }
    }

    // 7. 중복 전화번호 확인 (같은 전화번호로 여러 설문이 있는 경우)
    const phoneCounts = new Map<string, number>();
    allSurveys?.forEach((s: any) => {
      if (s.phone && s.phone.trim() !== '') {
        phoneCounts.set(s.phone, (phoneCounts.get(s.phone) || 0) + 1);
      }
    });

    const duplicatePhones = Array.from(phoneCounts.entries())
      .filter(([phone, count]) => count > 1)
      .map(([phone]) => phone);

    // 중복 전화번호로 인해 제외된 설문 찾기
    const excludedByDuplicate: any[] = [];
    if (duplicatePhones.length > 0) {
      for (const phone of duplicatePhones) {
        const surveysWithPhone = allSurveys?.filter((s: any) => s.phone === phone) || [];
        // 가장 최근 설문만 포함, 나머지는 제외
        surveysWithPhone.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestSurvey = surveysWithPhone[0];
        const excludedSurveys = surveysWithPhone.slice(1);
        
        excludedByDuplicate.push(...excludedSurveys.map((s: any) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          created_at: s.created_at,
          reason: `중복 전화번호 (${phone}) - 최근 설문만 포함됨`,
          latestSurveyId: latestSurvey.id,
          latestSurveyName: latestSurvey.name
        })));
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        latestRecommendationDate: latestDate,
        totalSurveys: allSurveys?.length || 0,
        totalInPrize: includedPhones.size,
        missingCount: missingCustomers.length,
        duplicateExcludedCount: excludedByDuplicate.length,
        missingCustomers: missingCustomers,
        excludedByDuplicate: excludedByDuplicate,
        summary: {
          totalSurveys: allSurveys?.length || 0,
          totalUniquePhones: allSurveyPhones.size,
          includedInPrize: includedPhones.size,
          missingByNoPhone: missingCustomers.filter(c => c.reason === '전화번호 없음').length,
          missingByNotIncluded: missingCustomers.filter(c => c.reason === '경품 추천에 포함되지 않음').length,
          excludedByDuplicate: excludedByDuplicate.length
        }
      }
    });
  } catch (error: any) {
    console.error('누락된 고객 확인 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || '누락된 고객 확인 중 오류가 발생했습니다.' 
    });
  }
}

