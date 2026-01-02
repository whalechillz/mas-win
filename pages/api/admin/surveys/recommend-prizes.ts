import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 매장 정보
const STORE_ADDRESS = '경기도 수원시 영통구 법조로149번길 200';
const STORE_LAT = 37.2808;
const STORE_LNG = 127.0498;

// 카카오맵 API 키
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

// 하버사인 공식을 사용한 거리 계산 (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 카카오맵 API를 사용한 주소 → 좌표 변환
async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!KAKAO_MAP_API_KEY) {
    console.warn('카카오맵 API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.error('카카오맵 API 오류:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      return {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      };
    }

    return null;
  } catch (error: any) {
    console.error('주소 좌표 변환 오류:', error);
    return null;
  }
}

// 구매 고객 점수 계산
function calculatePurchasedCustomerScore(customer: any): number {
  const giftCount = customer.gift_count || 0;
  const visitCount = customer.visit_count || 0;
  const bookingCount = customer.booking_count || 0;
  const surveyQuality = customer.survey_quality_score || 0;
  const daysSinceActivity = customer.days_since_last_activity || 999;

  const activityScore =
    daysSinceActivity <= 30 ? 10 : daysSinceActivity <= 90 ? 5 : daysSinceActivity <= 180 ? 2 : 0;

  return giftCount * 3 + visitCount * 2 + bookingCount * 2 + surveyQuality * 1 + activityScore;
}

// 비구매 고객 점수 계산 (거리 포함)
function calculateNonPurchasedCustomerScore(customer: any, distance: number | null): number {
  const surveyQuality = customer.survey_quality_score || 0;
  const daysSinceSurvey = customer.days_since_survey || 999;

  const activityScore =
    daysSinceSurvey <= 30 ? 10 : daysSinceSurvey <= 90 ? 5 : daysSinceSurvey <= 180 ? 2 : 0;

  // 거리 점수 (가까울수록 높은 점수, 최대 50점)
  const distanceScore = distance && distance > 0 ? Math.min((100 / distance) * 5, 50) : 0;

  return distanceScore + surveyQuality * 2 + activityScore;
}

// MD 파일 생성 함수
function generateMarkdownReport(data: any): string {
  const { purchasedCustomers, nonPurchasedCustomers, allCustomers, summary } = data;
  const now = new Date().toLocaleString('ko-KR');

  let markdown = `# 경품 추천 고객 목록\n\n`;
  markdown += `**생성일시:** ${now}\n`;
  markdown += `**매장 주소:** ${STORE_ADDRESS}\n\n`;
  markdown += `---\n\n`;

  // 구매 고객 섹션
  markdown += `## 구매 고객 중 바이럴/재구매 고객 (${purchasedCustomers.length}명)\n\n`;
  markdown += `| 순위 | 이름 | 전화번호 | 점수 | 선물 횟수 | 방문 횟수 | 예약 횟수 | 설문 품질 | 최근 활동일 | 선정 이유 |\n`;
  markdown += `|------|------|----------|------|-----------|-----------|-----------|-----------|-------------|-----------|\n`;

  purchasedCustomers.forEach((customer: any, index: number) => {
    const reasons = [];
    if (customer.gift_count > 0) reasons.push(`선물 ${customer.gift_count}회`);
    if (customer.visit_count > 0) reasons.push(`방문 ${customer.visit_count}회`);
    if (customer.booking_count > 0) reasons.push(`예약 ${customer.booking_count}회`);
    if (customer.survey_quality_score > 0) reasons.push(`설문 품질 우수`);
    reasons.push('2년 이상 고객');

    // 파이프 문자 제거 (마크다운 테이블 형식 유지)
    const name = (customer.name || '-').replace(/\|/g, '｜').trim();
    const phone = (customer.phone || '-').replace(/\|/g, '｜').trim();
    const reasonsText = (reasons.join(', ') || '-').replace(/\|/g, '｜').trim();

    markdown += `| ${index + 1} | ${name} | ${phone} | ${customer.total_score || 0} | ${customer.gift_count || 0} | ${customer.visit_count || 0} | ${customer.booking_count || 0} | ${customer.survey_quality_score || 0} | ${customer.days_since_last_activity ? Math.floor(customer.days_since_last_activity) + '일 전' : '-'} | ${reasonsText} |\n`;
  });

  markdown += `\n---\n\n`;

  // 비구매 고객 섹션
  markdown += `## 비구매 고객 중 거리 기반 고객 (${nonPurchasedCustomers.length}명)\n\n`;
  markdown += `| 순위 | 이름 | 전화번호 | 점수 | 거리(km) | 주소 | 설문 품질 | 최근 설문일 | 선정 이유 |\n`;
  markdown += `|------|------|----------|------|----------|------|-----------|-------------|-----------|\n`;

  nonPurchasedCustomers.forEach((customer: any, index: number) => {
    const reasons = [];
    if (customer.distance_km) reasons.push(`매장에서 ${customer.distance_km.toFixed(1)}km`);
    if (customer.survey_quality_score > 0) reasons.push(`설문 품질 우수`);
    if (customer.days_since_survey <= 30) reasons.push('최근 설문 제출');

    // 주소에서 줄바꿈 및 파이프 문자 제거 (마크다운 테이블 형식 유지)
    const address = (customer.address || '-')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\|/g, '｜')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 이름과 전화번호에서도 파이프 문자 제거
    const name = (customer.name || '-').replace(/\|/g, '｜').trim();
    const phone = (customer.phone || '-').replace(/\|/g, '｜').trim();
    const reasonsText = (reasons.join(', ') || '-').replace(/\|/g, '｜').trim();

    markdown += `| ${index + 1} | ${name} | ${phone} | ${customer.total_score || 0} | ${customer.distance_km ? customer.distance_km.toFixed(2) : '-'} | ${address} | ${customer.survey_quality_score || 0} | ${customer.days_since_survey ? Math.floor(customer.days_since_survey) + '일 전' : '-'} | ${reasonsText} |\n`;
  });

  markdown += `\n---\n\n`;

  // 전체 고객 점수 순위
  markdown += `## 전체 고객 점수 순위 (${allCustomers.length}명)\n\n`;
  markdown += `| 순위 | 이름 | 전화번호 | 구매여부 | 점수 | 카테고리 | 상세 정보 |\n`;
  markdown += `|------|------|----------|----------|------|----------|-----------|\n`;

  allCustomers.slice(0, 50).forEach((customer: any, index: number) => {
    const category = customer.is_purchased
      ? customer.is_over_2_years
        ? '구매(2년+)'
        : '구매'
      : '비구매';
    
    // 상세 정보 수정: 거리 또는 선물/방문 정보 표시
    let detail = '';
    if (customer.is_purchased) {
      detail = `선물 ${customer.gift_count || 0}회, 방문 ${customer.visit_count || 0}회`;
    } else {
      if (customer.distance_km !== null && customer.distance_km !== undefined) {
        detail = `거리 ${customer.distance_km.toFixed(1)}km`;
      } else if (customer.address) {
        detail = '주소 있음 (거리 계산 실패)';
      } else {
        detail = '주소 없음';
      }
    }

    // 이름과 전화번호에서 특수문자 제거 (마크다운 테이블 형식 유지)
    const name = (customer.name || '-').replace(/\|/g, '｜').trim();
    const phone = (customer.phone || '-').replace(/\|/g, '｜').trim();
    const detailSafe = detail.replace(/\|/g, '｜').trim();

    markdown += `| ${index + 1} | ${name} | ${phone} | ${customer.is_purchased ? '구매' : '비구매'} | ${customer.total_score || 0} | ${category} | ${detailSafe} |\n`;
  });

  return markdown;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const format = req.query.format as string | undefined; // 'json' | 'md' | undefined

  try {
    // 1. 구매 고객 중 바이럴/재구매 고객 조회 (2년 이상)
    const { data: purchasedCustomers, error: purchasedError } = await supabase.rpc(
      'get_purchased_customers_for_prize',
    );

    // RPC 함수가 없으면 직접 쿼리
    let purchasedCustomersData: any[] = [];
    if (purchasedError || !purchasedCustomers) {
      const { data: pcData } = await supabase
        .from('surveys')
        .select(
          `
          id,
          name,
          phone,
          address,
          selected_model,
          important_factors,
          additional_feedback,
          created_at,
          customers!inner (
            id,
            first_inquiry_date,
            last_contact_date,
            visit_count
          )
        `,
        )
        .gte('created_at', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      // 선물, 예약 횟수 등 추가 정보 조회 및 점수 계산 (중복 제거)
      const purchasedProcessedPhones = new Set<string>(); // 중복 제거용
      if (pcData) {
        purchasedCustomersData = await Promise.all(
          pcData
            .filter((survey: any) => {
              // 전화번호로 중복 제거
              if (purchasedProcessedPhones.has(survey.phone)) {
                return false;
              }
              purchasedProcessedPhones.add(survey.phone);
              return true;
            })
            .map(async (survey: any) => {
              const customer = survey.customers;
              if (!customer) return null;

            // 선물 횟수
            const { count: giftCount } = await supabase
              .from('customer_gifts')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customer.id)
              .eq('delivery_status', 'sent');

            // 예약 횟수
            const { count: bookingCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .or(`customer_id.eq.${customer.id},phone.eq.${survey.phone}`);

            const surveyQuality =
              (survey.important_factors?.length || 0) +
              (survey.additional_feedback ? 1 : 0);

            const daysSinceActivity = customer.last_contact_date
              ? Math.floor(
                  (Date.now() - new Date(customer.last_contact_date).getTime()) / (1000 * 60 * 60 * 24),
                )
              : 999;

            const score = calculatePurchasedCustomerScore({
              gift_count: giftCount || 0,
              visit_count: customer.visit_count || 0,
              booking_count: bookingCount || 0,
              survey_quality_score: surveyQuality,
              days_since_last_activity: daysSinceActivity,
            });

            return {
              survey_id: survey.id,
              name: survey.name,
              phone: survey.phone,
              address: survey.address,
              selected_model: survey.selected_model,
              important_factors: survey.important_factors,
              gift_count: giftCount || 0,
              visit_count: customer.visit_count || 0,
              booking_count: bookingCount || 0,
              survey_quality_score: surveyQuality,
              days_since_last_activity: daysSinceActivity,
              total_score: score,
              first_inquiry_date: customer.first_inquiry_date,
              last_contact_date: customer.last_contact_date,
            };
          }),
        );
        purchasedCustomersData = purchasedCustomersData.filter((c) => c !== null);
      }
    } else {
      purchasedCustomersData = purchasedCustomers || [];
    }

    // 점수 순으로 정렬하고 상위 10명 선택
    purchasedCustomersData.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    const topPurchasedCustomers = purchasedCustomersData.slice(0, 10);

    // 2. 비구매 고객 중 거리 기반 고객 조회
    const { data: nonPurchasedCustomers, error: nonPurchasedError } = await supabase
      .from('surveys')
      .select(
        `
        id,
        name,
        phone,
        address,
        selected_model,
        important_factors,
        additional_feedback,
        created_at,
        customers (
          id,
          first_inquiry_date,
          visit_count
        )
      `,
      )
      .not('address', 'is', null)
      .neq('address', '')
      .limit(100);

    if (nonPurchasedError) {
      console.error('비구매 고객 조회 오류:', nonPurchasedError);
    }

    // 비구매 고객 필터링 및 거리 계산 (중복 제거)
    let nonPurchasedCustomersData: any[] = [];
    const nonPurchasedProcessedPhones = new Set<string>(); // 중복 제거용
    if (nonPurchasedCustomers) {
      nonPurchasedCustomersData = await Promise.all(
        nonPurchasedCustomers
          .filter((survey: any) => {
            // 전화번호로 중복 제거
            if (nonPurchasedProcessedPhones.has(survey.phone)) {
              return false;
            }
            nonPurchasedProcessedPhones.add(survey.phone);

            const customer = survey.customers;
            // 예약 기록이 없고 방문 횟수가 0인 경우만
            return !customer || customer.visit_count === 0 || customer.visit_count === null;
          })
          .map(async (survey: any) => {
            const customer = survey.customers || {};
            const surveyQuality =
              (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0);
            const daysSinceSurvey = Math.floor(
              (Date.now() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24),
            );

            // 주소 → 좌표 변환
            let distance: number | null = null;
            if (survey.address) {
              const coords = await getCoordinatesFromAddress(survey.address);
              if (coords) {
                distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);
              }
            }

            const score = calculateNonPurchasedCustomerScore(
              {
                survey_quality_score: surveyQuality,
                days_since_survey: daysSinceSurvey,
              },
              distance,
            );

            return {
              survey_id: survey.id,
              name: survey.name,
              phone: survey.phone,
              address: survey.address,
              selected_model: survey.selected_model,
              important_factors: survey.important_factors,
              survey_quality_score: surveyQuality,
              days_since_survey: daysSinceSurvey,
              distance_km: distance,
              total_score: score,
              first_inquiry_date: customer.first_inquiry_date,
            };
          }),
      );

      // 거리 계산이 완료된 후 점수 순으로 정렬하고 상위 10명 선택
      nonPurchasedCustomersData.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }

    const topNonPurchasedCustomers = nonPurchasedCustomersData.slice(0, 10);

    // 3. 전체 고객 점수 계산 (중복 제거 및 주소 포함)
    const { data: allSurveys } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const allCustomersData: any[] = [];
    const processedPhones = new Set<string>(); // 중복 제거용

    if (allSurveys) {
      for (const survey of allSurveys) {
        // 전화번호로 중복 제거 (같은 전화번호는 가장 최근 설문만 사용)
        if (processedPhones.has(survey.phone)) {
          continue;
        }
        processedPhones.add(survey.phone);

        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', survey.phone)
          .maybeSingle();

        // 예약 기록 확인
        let hasBooking = false;
        if (customer) {
          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .or(`customer_id.eq.${customer.id},phone.eq.${survey.phone}`);
          hasBooking = (bookingCount || 0) > 0;
        }

        const isPurchased =
          customer &&
          ((customer.visit_count && customer.visit_count > 0) || hasBooking);

        const isOver2Years =
          (customer?.first_inquiry_date &&
            new Date(customer.first_inquiry_date) <=
              new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) ||
          (survey.created_at &&
            new Date(survey.created_at) <= new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000));

        let score = 0;
        let distance_km: number | null = null;
        let gift_count = 0;
        let visit_count = 0;
        let booking_count = 0;

        if (isPurchased && isOver2Years) {
          // 구매 고객 점수
          const { count: giftCount } = await supabase
            .from('customer_gifts')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('delivery_status', 'sent');

          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .or(`customer_id.eq.${customer.id},phone.eq.${survey.phone}`);

          gift_count = giftCount || 0;
          visit_count = customer.visit_count || 0;
          booking_count = bookingCount || 0;

          score = calculatePurchasedCustomerScore({
            gift_count,
            visit_count,
            booking_count,
            survey_quality_score:
              (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
            days_since_last_activity: customer.last_contact_date
              ? Math.floor(
                  (Date.now() - new Date(customer.last_contact_date).getTime()) / (1000 * 60 * 60 * 24),
                )
              : 999,
          });
        } else if (!isPurchased && survey.address) {
          // 비구매 고객 점수 (거리 계산)
          const coords = await getCoordinatesFromAddress(survey.address);
          distance_km = coords
            ? calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng)
            : null;

          score = calculateNonPurchasedCustomerScore(
            {
              survey_quality_score:
                (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
              days_since_survey: Math.floor(
                (Date.now() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24),
              ),
            },
            distance_km,
          );
        } else if (!isPurchased && !survey.address) {
          // 주소가 없는 비구매 고객 (거리 점수 없음)
          score = calculateNonPurchasedCustomerScore(
            {
              survey_quality_score:
                (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
              days_since_survey: Math.floor(
                (Date.now() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24),
              ),
            },
            null,
          );
        }

        allCustomersData.push({
          survey_id: survey.id,
          name: survey.name,
          phone: survey.phone,
          address: survey.address || null, // 주소 저장
          selected_model: survey.selected_model,
          important_factors: survey.important_factors,
          is_purchased: isPurchased,
          is_over_2_years: isOver2Years,
          total_score: score,
          distance_km: distance_km, // 거리 저장
          gift_count: gift_count, // 선물 횟수 저장
          visit_count: visit_count, // 방문 횟수 저장
          booking_count: booking_count, // 예약 횟수 저장
        });
      }
    }

    // 전체 고객 점수 순으로 정렬
    allCustomersData.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

    const result = {
      purchasedCustomers: topPurchasedCustomers,
      nonPurchasedCustomers: topNonPurchasedCustomers,
      allCustomers: allCustomersData,
      summary: {
        totalPurchased: topPurchasedCustomers.length,
        totalNonPurchased: topNonPurchasedCustomers.length,
        totalAll: allCustomersData.length,
      },
    };

    // MD 파일 형식으로 응답
    if (format === 'md') {
      const markdown = generateMarkdownReport(result);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="prize-recommendation-${new Date().toISOString().split('T')[0]}.md"`,
      );
      return res.status(200).send(markdown);
    }

    // JSON 형식으로 응답 (기본)
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[admin/surveys/recommend-prizes] 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '경품 추천 조회 중 오류가 발생했습니다.',
    });
  }
}

