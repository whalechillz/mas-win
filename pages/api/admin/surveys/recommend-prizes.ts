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

// 주소 정규화 함수: 공백 제거 및 null 처리
function normalizeAddress(address: string | null | undefined): string | null {
  // null, undefined, 빈 문자열 체크
  if (!address) return null;
  
  // 모든 공백 제거 (앞뒤 공백, 줄바꿈, 탭 등)
  const trimmed = address.trim().replace(/\s+/g, ' ').trim();
  
  // 공백만 있는 경우 null 반환
  if (!trimmed || trimmed.length === 0) return null;
  
  // 이미 표준 플레이스홀더인 경우 그대로 사용
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed)) {
    return trimmed;
  }
  
  // "직접방문", "직접 방문" 등 다양한 표현을 표준화
  const lowerTrimmed = trimmed.toLowerCase();
  if ((lowerTrimmed.includes('직접') && lowerTrimmed.includes('방문')) ||
      lowerTrimmed === '직접방문' ||
      lowerTrimmed === '직접 방문') {
    return '[직접방문]';
  }
  
  return trimmed;
}

// 주소가 지오코딩 가능한지 확인 (플레이스홀더 및 공백 제외)
function isGeocodableAddress(address: string | null | undefined): boolean {
  const normalized = normalizeAddress(address);
  if (!normalized) return false;
  if (normalized.startsWith('[') || normalized === 'N/A') return false;
  return normalized.length > 0;
}

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

// 위치 정보 조회 및 계산: 캐시에서 먼저 조회하고, 없으면 API 호출하여 지오코딩 수행
async function getCachedOrCalculateDistance(
  address: string | null | undefined,
  customerId?: number,
  surveyId?: string,
  phone?: string,
): Promise<{ distance: number; lat: number; lng: number } | null> {
  // 주소 정규화 및 유효성 검사
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress || !isGeocodableAddress(normalizedAddress)) {
    return null;
  }

  // 캐시에서만 조회 (API 호출 없음)
  let cached = null;
  
  if (customerId) {
    const { data } = await supabase
      .from('customer_address_cache')
      .select('*')
      .eq('customer_id', customerId)
      .eq('address', normalizedAddress)
      .eq('geocoding_status', 'success')
      .maybeSingle();
    cached = data;
  }
  
  // customer_id로 못 찾았으면 survey_id로 시도
  if (!cached && surveyId) {
    const { data } = await supabase
      .from('customer_address_cache')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('address', normalizedAddress)
      .eq('geocoding_status', 'success')
      .maybeSingle();
    cached = data;
  }
  
  // phone으로도 시도 (최신 위치 정보 관리에서 업데이트한 경우)
  if (!cached && phone) {
    try {
      // phone 정규화 (숫자만 추출)
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      if (normalizedPhone.length >= 10) {
        // phone으로 customer 찾기 (LIKE 검색으로 유연하게)
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .ilike('phone', `%${normalizedPhone}%`)
          .limit(1)
          .maybeSingle();
        
        if (customer?.id) {
          const { data } = await supabase
            .from('customer_address_cache')
            .select('*')
            .eq('customer_id', customer.id)
            .eq('address', normalizedAddress)
            .eq('geocoding_status', 'success')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          cached = data;
        }
        
        // customer_id로 못 찾았으면 같은 전화번호의 다른 설문에서 찾기
        if (!cached) {
          const { data: surveys } = await supabase
            .from('surveys')
            .select('id')
            .ilike('phone', `%${normalizedPhone}%`);
          
          // 각 설문의 지오코딩 정보 확인
          for (const s of surveys || []) {
            const { data } = await supabase
              .from('customer_address_cache')
              .select('*')
              .eq('survey_id', s.id)
              .eq('geocoding_status', 'success')
              .maybeSingle();
            
            if (data) {
              cached = data;
              break;
            }
          }
        }
      }
    } catch (phoneError) {
      console.error('phone으로 customer 찾기 오류:', phoneError);
      // phone 검색 실패해도 계속 진행
    }
  }

  // 캐시에 있으면 반환
  if (cached && cached.distance_km !== null && cached.latitude !== null && cached.longitude !== null) {
    return {
      distance: cached.distance_km,
      lat: cached.latitude,
      lng: cached.longitude,
    };
  }

  // 캐시에 없으면 API 호출하여 지오코딩 수행
  if (!cached && normalizedAddress && isGeocodableAddress(normalizedAddress)) {
    try {
      console.log(`[지오코딩] API 호출: ${normalizedAddress.substring(0, 30)}...`);
      
      // 카카오맵 API를 사용한 주소 → 좌표 변환
  const coords = await getCoordinatesFromAddress(normalizedAddress);
  if (coords) {
        // 거리 계산
    const distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);

    // 캐시에 저장
        const cacheData: any = {
          address: normalizedAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          geocoding_status: 'success',
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        if (customerId) {
          cacheData.customer_id = customerId;
        }
        if (surveyId) {
          cacheData.survey_id = surveyId;
  }

        const { error: upsertError } = await supabase.from('customer_address_cache').upsert(cacheData, {
          onConflict: customerId ? 'customer_id,address' : 'survey_id,address',
        });
        
        if (upsertError) {
          console.error('[지오코딩] 캐시 저장 오류:', upsertError);
        } else {
          console.log(`[지오코딩] 성공 및 저장: ${normalizedAddress.substring(0, 30)}... (거리: ${distance.toFixed(2)}km)`);
        }
        
        return {
          distance: distance,
          lat: coords.lat,
          lng: coords.lng,
        };
      } else {
        // 지오코딩 실패 시 캐시에 실패 상태 저장
        const cacheData: any = {
        address: normalizedAddress,
        geocoding_status: 'failed',
        geocoding_error: '주소 변환 실패',
        updated_at: new Date().toISOString(),
        };
        
        if (customerId) {
          cacheData.customer_id = customerId;
        }
        if (surveyId) {
          cacheData.survey_id = surveyId;
        }
        
        await supabase.from('customer_address_cache').upsert(cacheData, {
          onConflict: customerId ? 'customer_id,address' : 'survey_id,address',
        });
        
        console.warn(`[지오코딩] 실패: ${normalizedAddress.substring(0, 30)}...`);
      }
    } catch (error) {
      console.error('[지오코딩] API 호출 오류:', error);
    }
  }

  return null;
}

// 최근 선물 횟수 조회 (이번 경품 추천 기간: 최근 3개월)
async function getRecentGiftCount(customerId: number, startDate?: string): Promise<number> {
  const threeMonthsAgo = startDate || new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { count } = await supabase
    .from('customer_gifts')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('delivery_status', 'sent')
    .gte('delivery_date', threeMonthsAgo);

  return count || 0;
}

// 경품 추천 결과를 DB에 저장
async function savePrizeRecommendation(
  result: any,
  recommendationDate: string,
  recommendationDateTime: string,
): Promise<boolean> {
  const recommendations: any[] = [];

  console.log(`[경품 추천 저장] 시작 - 날짜: ${recommendationDate}`);
  console.log(`[경품 추천 저장] 구매 고객: ${result.purchasedCustomers?.length || 0}명`);
  console.log(`[경품 추천 저장] 비구매 고객: ${result.nonPurchasedCustomers?.length || 0}명`);
  console.log(`[경품 추천 저장] 전체 고객: ${result.allCustomers?.length || 0}명`);

  // 전체 고객만 저장 (purchasedCustomers와 nonPurchasedCustomers는 allCustomers에 포함되어 있으므로 중복 저장 방지)
  if (!result.allCustomers || result.allCustomers.length === 0) {
    console.error('[경품 추천 저장] allCustomers가 비어있거나 없습니다.');
    console.error('[경품 추천 저장] result 객체:', {
      hasPurchasedCustomers: !!result.purchasedCustomers,
      purchasedCustomersLength: result.purchasedCustomers?.length || 0,
      hasNonPurchasedCustomers: !!result.nonPurchasedCustomers,
      nonPurchasedCustomersLength: result.nonPurchasedCustomers?.length || 0,
      hasAllCustomers: !!result.allCustomers,
      allCustomersLength: result.allCustomers?.length || 0,
    });
    return false;
  }

  // is_primary=true인 것만 순위 부여 (고유 고객 기준)
  const primaryCustomers = result.allCustomers.filter((c: any) => c.is_primary === true);
  primaryCustomers.forEach((customer: any, index: number) => {
    customer.rank = index + 1;
  });

  // 모든 설문 저장 (중복 포함)
  result.allCustomers.forEach((customer: any, index: number) => {
    recommendations.push({
      recommendation_date: recommendationDate,
      recommendation_datetime: recommendationDateTime,
      survey_id: customer.survey_id || null,
      customer_id: customer.customer_id || null,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || null,
      total_score: customer.total_score || 0,
      category: customer.is_purchased
        ? customer.is_over_2_years
          ? '구매(2년+)'
          : '구매'
        : '비구매',
      is_purchased: customer.is_purchased || false,
      is_over_2_years: customer.is_over_2_years || false,
      distance_km: customer.distance_km !== undefined && customer.distance_km !== null
        ? Number(customer.distance_km.toFixed(2))
        : null,
      latitude: customer.latitude !== undefined && customer.latitude !== null
        ? Number(customer.latitude.toFixed(6))
        : null,
      longitude: customer.longitude !== undefined && customer.longitude !== null
        ? Number(customer.longitude.toFixed(6))
        : null,
      geocoding_status: (customer.distance_km !== undefined && customer.distance_km !== null && customer.distance_km > 0)
        ? 'success'
        : 'failed',
      days_since_last_purchase: customer.days_since_last_purchase !== undefined && customer.days_since_last_purchase !== null
        ? customer.days_since_last_purchase
        : null,
      gift_count: customer.gift_count || 0,
      visit_count: customer.visit_count || 0, // 시타 방문
      booking_count: customer.booking_count || 0,
      survey_quality_score: customer.survey_quality_score || 0,
      recent_survey_date: customer.recent_survey_date || customer.created_at || null, // 최근 설문일 추가
      snapshot_last_purchase_date: customer.last_purchase_date || null,
      snapshot_first_purchase_date: customer.first_purchase_date || null,
      snapshot_first_inquiry_date: customer.first_inquiry_date || null,
      snapshot_last_contact_date: customer.last_contact_date || null,
      snapshot_created_at: recommendationDateTime,
      section: 'all',
      rank: customer.rank || null, // 고유 고객만 순위 부여
      is_duplicate: customer.is_duplicate || false, // 중복 여부
      is_primary: customer.is_primary || false, // 최신 설문 여부
      duplicate_count: customer.duplicate_count || 1, // 중복 횟수
    });
  });

  // DB에 저장 (같은 날짜에도 중복 생성 가능하도록 삭제하지 않음)
  console.log(`[경품 추천 저장] 총 저장할 건수: ${recommendations.length}건`);
  
  if (recommendations.length > 0) {
    try {
      // 같은 날짜 데이터 삭제하지 않음 (같은 날짜에 여러 번 생성 가능)
      console.log(`[경품 추천 저장] 새 데이터 저장 시작 - 날짜: ${recommendationDate}, 시간: ${recommendationDateTime}`);
      
      // 새 데이터 저장
      console.log(`[경품 추천 저장] 새 데이터 저장 시작 - ${recommendations.length}건`);
      const { error: insertError, data: insertedData } = await supabase
        .from('prize_recommendations')
        .insert(recommendations)
        .select();
      
      if (insertError) {
        console.error('[경품 추천 저장] 새 데이터 저장 오류:', insertError);
        console.error('[경품 추천 저장] 에러 코드:', insertError.code);
        console.error('[경품 추천 저장] 에러 메시지:', insertError.message);
        console.error('[경품 추천 저장] 에러 상세:', insertError.details);
        console.error('[경품 추천 저장] 에러 힌트:', insertError.hint);
        console.error('[경품 추천 저장] 저장 실패한 데이터 샘플 (첫 번째):', JSON.stringify(recommendations[0], null, 2));
        console.error('[경품 추천 저장] 저장 실패한 데이터 샘플 (두 번째):', JSON.stringify(recommendations[1] || null, null, 2));
        console.error('[경품 추천 저장] 저장할 데이터의 필드 목록:', Object.keys(recommendations[0] || {}));
        throw insertError;
      }
      
      console.log(`[경품 추천 저장] 완료: ${insertedData?.length || recommendations.length}건 저장됨`);
      console.log(`[경품 추천 저장] 저장된 날짜: ${recommendationDate}`);
      return true; // 저장 성공
    } catch (error) {
      console.error('[경품 추천 저장] 경품 추천 결과 저장 오류:', error);
      throw error; // 에러를 다시 throw하여 호출자가 처리할 수 있도록
    }
  } else {
    console.warn('[경품 추천 저장] 저장할 데이터가 없습니다.');
    return false; // 저장할 데이터 없음
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

  // 소수점 2자리로 반올림하여 비구매 고객과 형식 통일
  return Math.round((giftCount * 3 + visitCount * 2 + bookingCount * 2 + surveyQuality * 1 + activityScore) * 100) / 100;
}

// 비구매 고객 점수 계산 (거리 포함)
function calculateNonPurchasedCustomerScore(customer: any, distance: number | null): number {
  const surveyQuality = customer.survey_quality_score || 0;
  const daysSinceSurvey = customer.days_since_survey || 999;

  const activityScore =
    daysSinceSurvey <= 30 ? 10 : daysSinceSurvey <= 90 ? 5 : daysSinceSurvey <= 180 ? 2 : 0;

  // 거리 점수 (가까울수록 높은 점수, 최대 50점)
  const distanceScore = distance && distance > 0 ? Math.min((100 / distance) * 5, 50) : 0;

  // 소수점 2자리로 반올림
  return Math.round((distanceScore + surveyQuality * 2 + activityScore) * 100) / 100;
}

// HTML 형식으로 A4 최적화 리포트 생성
function generateHTMLReport(data: any): string {
  const { purchasedCustomers, nonPurchasedCustomers, allCustomers, summary } = data;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // HTML 이스케이프 헬퍼 함수
  const escapeHtml = (text: string) => {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>경품 추천 고객 목록</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15mm;
      padding-bottom: 10mm;
      border-bottom: 2px solid #333;
    }
    
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5mm;
    }
    
    .header-info {
      font-size: 8pt;
      color: #666;
      margin-top: 3mm;
    }
    
    .section {
      margin-bottom: 10mm;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 5mm;
      padding-bottom: 2mm;
      border-bottom: 1px solid #ccc;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 5mm;
      page-break-inside: auto;
    }
    
    thead {
      display: table-header-group;
    }
    
    tbody {
      display: table-row-group;
    }
    
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    th {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 3mm 2mm;
      text-align: center;
      font-weight: bold;
      font-size: 7pt;
    }
    
    td {
      border: 1px solid #ddd;
      padding: 2mm 1.5mm;
      text-align: center;
      word-wrap: break-word;
    }
    
    td:first-child,
    th:first-child {
      width: 5%;
    }
    
    td:nth-child(2),
    th:nth-child(2) {
      width: 8%;
    }
    
    td:nth-child(3),
    th:nth-child(3) {
      width: 10%;
    }
    
    td:nth-child(4),
    th:nth-child(4) {
      width: 6%;
    }
    
    /* 주소 컬럼은 더 넓게 */
    td:nth-child(6),
    th:nth-child(6) {
      width: 25%;
      text-align: left;
      font-size: 6.5pt;
    }
    
    /* 선정 이유 컬럼 */
    td:last-child,
    th:last-child {
      width: 20%;
      text-align: left;
      font-size: 6.5pt;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
      
      table {
        font-size: 7pt;
      }
      
      th, td {
        padding: 1.5mm 1mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>경품 추천 고객 목록</h1>
    <div class="header-info">
      <div><strong>생성일시:</strong> ${escapeHtml(now)}</div>
      <div><strong>매장 주소:</strong> ${escapeHtml(STORE_ADDRESS)}</div>
    </div>
  </div>`;

  // 구매 고객 섹션
  html += `
  <div class="section">
    <div class="section-title">구매 고객 중 바이럴/재구매 고객 (${purchasedCustomers.length}명)</div>
    <table>
      <thead>
        <tr>
          <th>순위</th>
          <th>이름</th>
          <th>전화번호</th>
          <th>점수</th>
          <th>선물</th>
          <th>시타방문</th>
          <th>예약</th>
          <th>설문품질</th>
          <th>최근활동일</th>
          <th>선정 이유</th>
        </tr>
      </thead>
      <tbody>`;

  if (purchasedCustomers.length === 0) {
    html += `<tr><td colspan="10" style="text-align: center; padding: 10mm;">데이터가 없습니다.</td></tr>`;
  } else {
    purchasedCustomers.forEach((customer: any, index: number) => {
      const reasons = [];
      if (customer.gift_count > 0) reasons.push(`선물 ${customer.gift_count}회`);
      if (customer.visit_count > 0) reasons.push(`시타방문 ${customer.visit_count}회`);
      if (customer.booking_count > 0) reasons.push(`예약 ${customer.booking_count}회`);
      if (customer.survey_quality_score > 0) reasons.push(`설문품질우수`);
      reasons.push('2년이상');

      html += `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(customer.name || '-')}</td>
        <td>${escapeHtml(customer.phone || '-')}</td>
        <td>${customer.total_score || 0}</td>
        <td>${customer.gift_count || 0}</td>
        <td>${customer.visit_count || 0}</td>
        <td>${customer.booking_count || 0}</td>
        <td>${customer.survey_quality_score || 0}</td>
        <td>${customer.days_since_last_activity ? Math.floor(customer.days_since_last_activity) + '일전' : '-'}</td>
        <td>${escapeHtml(reasons.join(', '))}</td>
      </tr>`;
    });
  }

  html += `</tbody></table></div>`;

  // 비구매 고객 섹션
  html += `
  <div class="section page-break">
    <div class="section-title">비구매 고객 중 거리 기반 고객 (${nonPurchasedCustomers.length}명)</div>
    <table>
      <thead>
        <tr>
          <th>순위</th>
          <th>이름</th>
          <th>전화번호</th>
          <th>점수</th>
          <th>거리(km)</th>
          <th>주소</th>
          <th>설문품질</th>
          <th>최근설문일</th>
          <th>선정 이유</th>
        </tr>
      </thead>
      <tbody>`;

  nonPurchasedCustomers.forEach((customer: any, index: number) => {
    const reasons = [];
    if (customer.distance_km) reasons.push(`매장${customer.distance_km.toFixed(1)}km`);
    if (customer.survey_quality_score > 0) reasons.push(`설문품질우수`);
    if (customer.days_since_survey <= 30) reasons.push('최근설문제출');
    if (customer.gift_count > 0) reasons.push(`선물${customer.gift_count}회`); // 선물 받은 고객 표시

    const address = (customer.address || '-')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    html += `<tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(customer.name || '-')}</td>
      <td>${escapeHtml(customer.phone || '-')}</td>
      <td>${customer.total_score || 0}</td>
      <td>${customer.distance_km ? customer.distance_km.toFixed(2) : '-'}</td>
      <td>${escapeHtml(address)}</td>
      <td>${customer.survey_quality_score || 0}</td>
      <td>${customer.days_since_survey ? Math.floor(customer.days_since_survey) + '일전' : '-'}</td>
      <td>${escapeHtml(reasons.join(', ') || '-')}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // 전체 고객 점수 순위 (전체)
  html += `
  <div class="section page-break">
    <div class="section-title">전체 고객 점수 순위 (${allCustomers.length}명)</div>
    <table>
      <thead>
        <tr>
          <th>순위</th>
          <th>이름</th>
          <th>전화번호</th>
          <th>구매여부</th>
          <th>점수</th>
          <th>거리(km)</th>
          <th>카테고리</th>
          <th>상세 정보</th>
        </tr>
      </thead>
      <tbody>`;

  allCustomers.forEach((customer: any) => {
    const category = customer.is_purchased
      ? customer.is_over_2_years
        ? '구매(2년+)'
        : '구매'
      : '비구매';

    let detail = '';
    if (customer.is_purchased) {
      detail = `선물${customer.gift_count || 0}회, 시타방문${customer.visit_count || 0}회`;
    } else {
      const parts = [];
      if (customer.distance_km !== null && customer.distance_km !== undefined) {
        parts.push(`거리${customer.distance_km.toFixed(1)}km`);
      }
      if (customer.address) {
        parts.push(`주소: ${customer.address.substring(0, 30)}${customer.address.length > 30 ? '...' : ''}`);
      } else if (customer.distance_km === null || customer.distance_km === undefined) {
        parts.push('주소없음');
      }
      // 선물 받은 고객 정보 추가
      if (customer.gift_count > 0) {
        parts.push(`선물${customer.gift_count}회`);
      }
      detail = parts.length > 0 ? parts.join(', ') : '정보 없음';
    }

    const address = customer.address
      ? (customer.address || '-')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '-';

    html += `<tr>
      <td>${customer.rank || '-'}</td>
      <td>${escapeHtml(customer.name || '-')}</td>
      <td>${escapeHtml(customer.phone || '-')}</td>
      <td>${customer.is_purchased ? '구매' : '비구매'}</td>
      <td>${customer.total_score || 0}</td>
      <td>${customer.distance_km !== null && customer.distance_km !== undefined ? customer.distance_km.toFixed(2) : '-'}</td>
      <td>${category}</td>
      <td>${escapeHtml(detail)}</td>
    </tr>`;
  });

  html += `</tbody></table></div>
</body>
</html>`;

  return html;
}

// MD 파일 생성 함수
function generateMarkdownReport(data: any): string {
  const { purchasedCustomers, nonPurchasedCustomers, allCustomers, summary } = data;
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  let markdown = `# 경품 추천 고객 목록\n\n`;
  markdown += `**생성일시:** ${now}\n`;
  markdown += `**매장 주소:** ${STORE_ADDRESS}\n\n`;
  markdown += `---\n\n`;

  // 구매 고객 섹션
  markdown += `## 구매 고객 중 바이럴/재구매 고객 (${purchasedCustomers.length}명)\n\n`;
  markdown += `| 순위 | 이름 | 전화번호 | 점수 | 선물 횟수 | 시타방문 횟수 | 예약 횟수 | 설문 품질 | 최근 활동일 | 선정 이유 |\n`;
  markdown += `|------|------|----------|------|-----------|-----------|-----------|-----------|-------------|-----------|\n`;

  purchasedCustomers.forEach((customer: any, index: number) => {
    const reasons = [];
    if (customer.gift_count > 0) reasons.push(`선물 ${customer.gift_count}회`);
    if (customer.visit_count > 0) reasons.push(`시타방문 ${customer.visit_count}회`);
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
  markdown += `| 순위 | 이름 | 전화번호 | 구매여부 | 점수 | 거리(km) | 카테고리 | 상세 정보 |\n`;
  markdown += `|------|------|----------|----------|------|----------|----------|-----------|\n`;

  allCustomers.forEach((customer: any, index: number) => {
    const category = customer.is_purchased
      ? customer.is_over_2_years
        ? '구매(2년+)'
        : '구매'
      : '비구매';
    
    // 상세 정보 수정: 거리 또는 선물/시타방문 정보 표시
    let detail = '';
    if (customer.is_purchased) {
      detail = `선물 ${customer.gift_count || 0}회, 시타방문 ${customer.visit_count || 0}회`;
    } else {
      const parts = [];
      if (customer.distance_km !== null && customer.distance_km !== undefined) {
        parts.push(`거리 ${customer.distance_km.toFixed(1)}km`);
      }
      if (customer.address) {
        parts.push(`주소: ${customer.address.substring(0, 30)}${customer.address.length > 30 ? '...' : ''}`);
      } else if (customer.distance_km === null || customer.distance_km === undefined) {
        parts.push('주소 없음');
      }
      // 선물 받은 고객 정보 추가
      if (customer.gift_count > 0) {
        parts.push(`선물 ${customer.gift_count}회`);
      }
      detail = parts.length > 0 ? parts.join(', ') : '정보 없음';
    }

    // 이름과 전화번호에서 특수문자 제거 (마크다운 테이블 형식 유지)
    const name = (customer.name || '-').replace(/\|/g, '｜').trim();
    const phone = (customer.phone || '-').replace(/\|/g, '｜').trim();
    const detailSafe = detail.replace(/\|/g, '｜').trim();
    const distanceDisplay =
      customer.distance_km !== null && customer.distance_km !== undefined
        ? customer.distance_km.toFixed(2)
        : '-';

    markdown += `| ${index + 1} | ${name} | ${phone} | ${customer.is_purchased ? '구매' : '비구매'} | ${customer.total_score || 0} | ${distanceDisplay} | ${category} | ${detailSafe} |\n`;
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
            last_purchase_date,
            first_purchase_date,
            visit_count
          )
        `,
        )
        .eq('is_active', true) // 활성 설문만
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

            // 최근 선물 횟수 (이번 경품 추천 기간: 최근 3개월)
            const giftCount = await getRecentGiftCount(customer.id);

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

            // 구매 고객도 거리 정보 가져오기
            // 주소 결정: 설문 주소 → 고객 주소 (fallback)
            let addressToUse = survey.address;
            if (!addressToUse || !isGeocodableAddress(addressToUse)) {
              if (customer?.address && isGeocodableAddress(customer.address)) {
                addressToUse = customer.address;
              } else {
                addressToUse = null;
              }
            }
            const normalizedAddress = normalizeAddress(addressToUse);
            let distance_km = null;
            let latitude = null;
            let longitude = null;
            if (normalizedAddress && isGeocodableAddress(normalizedAddress)) {
              const cachedResult = await getCachedOrCalculateDistance(
                normalizedAddress,
                customer.id,
                String(survey.id),
                survey.phone,
              );
              if (cachedResult) {
                distance_km = cachedResult.distance;
                latitude = cachedResult.lat;
                longitude = cachedResult.lng;
              }
            }

            // 구매 후 경과 일수 계산
            const daysSinceLastPurchase = customer.last_purchase_date
              ? Math.floor(
                  (Date.now() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24),
                )
              : null;

            return {
              survey_id: survey.id,
              customer_id: customer.id || null,
              name: survey.name,
              phone: survey.phone,
              address: normalizedAddress,
              selected_model: survey.selected_model,
              important_factors: survey.important_factors,
              gift_count: giftCount,
              visit_count: customer.visit_count || 0,
              booking_count: bookingCount || 0,
              survey_quality_score: surveyQuality,
              days_since_last_activity: daysSinceActivity,
              total_score: score,
              first_inquiry_date: customer.first_inquiry_date,
              last_contact_date: customer.last_contact_date,
              last_purchase_date: customer.last_purchase_date, // 원본 날짜 추가
              first_purchase_date: customer.first_purchase_date, // 원본 날짜 추가
              distance_km: distance_km,
              latitude: latitude,
              longitude: longitude,
              days_since_last_purchase: daysSinceLastPurchase,
              recent_survey_date: survey.created_at, // 최근 설문일 추가
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
      .eq('is_active', true) // 활성 설문만
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

            // 주소 결정: 설문 주소 → 고객 주소 (fallback)
            let addressToUse = survey.address;
            if (!addressToUse || !isGeocodableAddress(addressToUse)) {
              if (customer?.address && isGeocodableAddress(customer.address)) {
                addressToUse = customer.address;
              } else {
                // 둘 다 없거나 플레이스홀더면 null 반환
                return null;
              }
            }

            // 주소 정규화
            const normalizedAddress = normalizeAddress(addressToUse);
            
            // 정규화된 주소가 유효하지 않으면 null 반환
            if (!normalizedAddress || !isGeocodableAddress(normalizedAddress)) {
              return null;
            }

            // 최근 선물 횟수 확인 (이번 경품 추천 기간: 최근 3개월)
            let giftCount = 0;
            if (customer.id) {
              giftCount = await getRecentGiftCount(customer.id);
            }

            // 주소 → 좌표 변환 (캐싱 사용)
            let distance: number | null = null;
            let latitude: number | null = null;
            let longitude: number | null = null;
            const cachedResult = await getCachedOrCalculateDistance(
              normalizedAddress,
              customer.id,
              String(survey.id),
              survey.phone,
            );
            if (cachedResult) {
              distance = cachedResult.distance;
              latitude = cachedResult.lat;
              longitude = cachedResult.lng;
            }

            // 선물 받은 고객은 점수에 가중치 추가 (선물 1회당 +5점)
            const baseScore = calculateNonPurchasedCustomerScore(
              {
                survey_quality_score: surveyQuality,
                days_since_survey: daysSinceSurvey,
              },
              distance,
            );
            // 선물 받은 고객 가중치 추가, 소수점 2자리로 반올림하여 형식 통일
            const score = Math.round((baseScore + (giftCount * 5)) * 100) / 100;

            return {
              survey_id: survey.id,
              customer_id: customer.id || null,
              name: survey.name,
              phone: survey.phone,
              address: normalizedAddress,
              selected_model: survey.selected_model,
              important_factors: survey.important_factors,
              survey_quality_score: surveyQuality,
              days_since_survey: daysSinceSurvey,
              distance_km: distance,
              latitude: latitude,
              longitude: longitude,
              gift_count: giftCount, // 선물 횟수 추가
              total_score: score,
              first_inquiry_date: customer.first_inquiry_date,
              recent_survey_date: survey.created_at, // 최근 설문일 추가
            };
          }),
      );

      // null 제거 및 거리 계산이 완료된 후 점수 순으로 정렬하고 상위 10명 선택
      nonPurchasedCustomersData = nonPurchasedCustomersData.filter((c) => c !== null);
      nonPurchasedCustomersData.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }

    const topNonPurchasedCustomers = nonPurchasedCustomersData.slice(0, 10);

    // 3. 전체 고객 점수 계산 (중복 제거 및 주소 포함)
    // 활성 설문만 조회 (is_active = true)
    const { data: allSurveys } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true) // 활성 설문만
      .order('created_at', { ascending: false });
      // 제한 제거 - 모든 설문 조회

    const allCustomersData: any[] = [];
    const processedPhones = new Map<string, { count: number; latestSurveyId: string }>(); // 중복 추적용
    const skippedSurveys: any[] = []; // 건너뛴 설문 추적

    if (allSurveys) {
      // 먼저 전화번호별로 그룹화하여 중복 정보 수집
      const phoneGroups = new Map<string, any[]>();
      allSurveys.forEach((survey: any) => {
        if (survey.phone && survey.phone.trim() !== '') {
          const normalizedPhone = survey.phone.replace(/[^0-9]/g, '');
          if (!phoneGroups.has(normalizedPhone)) {
            phoneGroups.set(normalizedPhone, []);
          }
          phoneGroups.get(normalizedPhone)!.push(survey);
        }
      });

      // 전화번호별로 최신 설문 찾기
      phoneGroups.forEach((surveys, phone) => {
        surveys.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        processedPhones.set(phone, {
          count: surveys.length,
          latestSurveyId: surveys[0].id,
        });
      });

      let processedCount = 0;
      let geocodingCount = 0;
      let geocodingSuccessCount = 0;
      let geocodingFailedCount = 0;
      let noAddressCount = 0; // 주소가 없거나 플레이스홀더인 항목 수
      
      for (const survey of allSurveys) {
        processedCount++;
        // 전화번호가 없거나 빈 문자열인 경우 건너뛰기
        if (!survey.phone || survey.phone.trim() === '') {
          skippedSurveys.push({ reason: 'no_phone', survey });
          continue;
        }
        
        const normalizedPhone = survey.phone.replace(/[^0-9]/g, '');
        const phoneInfo = processedPhones.get(normalizedPhone);
        const isPrimary = phoneInfo?.latestSurveyId === survey.id;
        const duplicateCount = phoneInfo?.count || 1;

        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', survey.phone)
          .maybeSingle();

        // 주소 결정: 설문 주소 → 고객 주소 (fallback)
        let addressToUse = survey.address;
        
        // 설문 주소가 플레이스홀더이거나 지오코딩 불가능하면 고객 주소 확인
        if (!addressToUse || !isGeocodableAddress(addressToUse)) {
          if (customer?.address && isGeocodableAddress(customer.address)) {
            addressToUse = customer.address;
          } else {
            // 둘 다 없거나 플레이스홀더면 null
            addressToUse = null;
          }
        }
        
        // 주소 정규화
        const normalizedAddress = normalizeAddress(addressToUse);

        // 예약 기록 확인
        let hasBooking = false;
        if (customer) {
          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .or(`customer_id.eq.${customer.id},phone.eq.${survey.phone}`);
          hasBooking = (bookingCount || 0) > 0;
        }

        const isPurchased = !!(
          customer &&
          (
            (customer.last_purchase_date) ||  // 마지막 구매일이 있으면 구매
            (customer.first_purchase_date) || // 최초 구매일이 있으면 구매
            ((customer.visit_count && customer.visit_count > 0) || hasBooking) // 기존 로직도 유지
          )
        );

        const isOver2Years = !!(
          (customer?.first_inquiry_date &&
            new Date(customer.first_inquiry_date) <=
              new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) ||
          (survey.created_at &&
            new Date(survey.created_at) <= new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000))
        );

        let score = 0;
        let distance_km: number | null = null;
        let latitude: number | null = null;
        let longitude: number | null = null;
        let gift_count = 0;
        let visit_count = 0;
        let booking_count = 0;

        if (isPurchased) {
          // 구매 고객 점수 (2년 이상 여부와 관계없이 모든 구매 고객 점수 계산)
          gift_count = customer.id ? await getRecentGiftCount(customer.id) : 0;

          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .or(`customer_id.eq.${customer.id},phone.eq.${survey.phone}`);

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
          
          // 구매 고객도 거리 정보 가져오기
          if (normalizedAddress && isGeocodableAddress(normalizedAddress)) {
            geocodingCount++;
            console.log(`[경품 추천 생성] 지오코딩 시도 ${geocodingCount}/${allSurveys.length}: ${survey.name} (${survey.phone}) - ${normalizedAddress.substring(0, 30)}...`);
            const cachedResult = await getCachedOrCalculateDistance(
              normalizedAddress,
              customer.id,
              String(survey.id),
              survey.phone,
            );
            if (cachedResult) {
              geocodingSuccessCount++;
              console.log(`[경품 추천 생성] 지오코딩 성공 ${geocodingSuccessCount}: ${survey.name} - 거리: ${cachedResult.distance.toFixed(2)}km`);
              distance_km = cachedResult.distance;
              latitude = cachedResult.lat;
              longitude = cachedResult.lng;
            } else {
              geocodingFailedCount++;
              console.warn(`[경품 추천 생성] 지오코딩 실패 ${geocodingFailedCount}: ${survey.name} - 주소: ${normalizedAddress.substring(0, 30)}...`);
            }
          } else {
            // 주소가 없거나 플레이스홀더인 경우
            noAddressCount++;
            console.log(`[경품 추천 생성] 주소 없음 ${noAddressCount}: ${survey.name} (${survey.phone}) - 설문주소: ${survey.address || '없음'}, 고객주소: ${customer?.address || '없음'}`);
          }
        } else if (!isPurchased && normalizedAddress && isGeocodableAddress(normalizedAddress)) {
          // 비구매 고객 점수 (거리 계산, 캐싱 사용)
          geocodingCount++;
          console.log(`[경품 추천 생성] 지오코딩 시도 ${geocodingCount}/${allSurveys.length}: ${survey.name} (${survey.phone}) - ${normalizedAddress.substring(0, 30)}...`);
          const cachedResult = await getCachedOrCalculateDistance(
            normalizedAddress,
            customer?.id,
            String(survey.id),
            survey.phone,
          );
          if (cachedResult) {
            geocodingSuccessCount++;
            console.log(`[경품 추천 생성] 지오코딩 성공 ${geocodingSuccessCount}: ${survey.name} - 거리: ${cachedResult.distance.toFixed(2)}km`);
            distance_km = cachedResult.distance;
            latitude = cachedResult.lat;
            longitude = cachedResult.lng;
          } else {
            geocodingFailedCount++;
            console.warn(`[경품 추천 생성] 지오코딩 실패 ${geocodingFailedCount}: ${survey.name} - 주소: ${normalizedAddress.substring(0, 30)}...`);
          }

          // 최근 선물 받은 횟수 확인 (선물 받은 고객도 포함)
          if (customer && customer.id) {
            gift_count = await getRecentGiftCount(customer.id);
          }

          const baseScore = calculateNonPurchasedCustomerScore(
            {
              survey_quality_score:
                (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
              days_since_survey: Math.floor(
                (Date.now() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24),
              ),
            },
            distance_km,
          );
          // 선물 받은 고객은 점수에 가중치 추가 (선물 1회당 +5점)
          // 소수점 2자리로 반올림하여 형식 통일
          score = Math.round((baseScore + gift_count * 5) * 100) / 100;
        } else if (!isPurchased && (!normalizedAddress || !isGeocodableAddress(normalizedAddress))) {
          // 주소가 없거나 플레이스홀더인 비구매 고객 (거리 점수 없음)
          noAddressCount++;
          console.log(`[경품 추천 생성] 주소 없음 ${noAddressCount}: ${survey.name} (${survey.phone}) - 설문주소: ${survey.address || '없음'}, 고객주소: ${customer?.address || '없음'}`);
          
          // 최근 선물 받은 횟수 확인 (선물 받은 고객도 포함)
          if (customer && customer.id) {
            gift_count = await getRecentGiftCount(customer.id);
          }

          const baseScore = calculateNonPurchasedCustomerScore(
            {
              survey_quality_score:
                (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
              days_since_survey: Math.floor(
                (Date.now() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24),
              ),
            },
            null,
          );
          // 선물 받은 고객은 점수에 가중치 추가 (선물 1회당 +5점)
          // 소수점 2자리로 반올림하여 형식 통일
          score = Math.round((baseScore + gift_count * 5) * 100) / 100;
        }

        // 최종 구매 후 경과 일수 계산 (구매 고객만)
        const daysSinceLastPurchase = isPurchased && customer?.last_purchase_date
          ? Math.floor(
              (Date.now() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24),
            )
          : null;

        allCustomersData.push({
          survey_id: survey.id,
          customer_id: customer?.id || null,
          name: survey.name,
          phone: survey.phone,
          address: normalizedAddress || null, // 정규화된 주소 저장 (fallback 적용된 주소)
          selected_model: survey.selected_model,
          important_factors: survey.important_factors,
          is_purchased: isPurchased,
          is_over_2_years: isOver2Years,
          total_score: score,
          distance_km: distance_km, // 거리 저장 (구매/비구매 모두)
          latitude: latitude || null, // 위도 저장
          longitude: longitude || null, // 경도 저장
          gift_count: gift_count, // 선물 횟수 저장
          visit_count: visit_count, // 시타 방문 횟수 저장
          booking_count: booking_count, // 예약 횟수 저장
          survey_quality_score:
            (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
          days_since_last_purchase: daysSinceLastPurchase, // 구매 고객만 값 있음
          recent_survey_date: survey.created_at, // 최근 설문일 추가
          last_purchase_date: customer?.last_purchase_date || null, // 원본 날짜 추가
          first_purchase_date: customer?.first_purchase_date || null, // 원본 날짜 추가
          first_inquiry_date: customer?.first_inquiry_date || null, // 원본 날짜 추가
          last_contact_date: customer?.last_contact_date || null, // 원본 날짜 추가
          is_duplicate: !isPrimary, // 중복 여부
          is_primary: isPrimary, // 최신 설문 여부
          duplicate_count: duplicateCount, // 중복 횟수
        });
      }
      
      console.log(`[경품 추천 생성] 전체 처리 완료: 총 ${processedCount}개 설문 처리`);
      console.log(`[경품 추천 생성] 지오코딩 통계: 시도 ${geocodingCount}개, 성공 ${geocodingSuccessCount}개, 실패 ${geocodingFailedCount}개, 주소 없음 ${noAddressCount}개`);
      console.log(`[경품 추천 생성] 지오코딩 완료율: ${geocodingCount > 0 ? ((geocodingSuccessCount / geocodingCount) * 100).toFixed(1) : 0}% (${geocodingSuccessCount}/${geocodingCount})`);
    }

    // 전체 고객 점수 순으로 정렬 (점수 → 거리 → 이름)
    allCustomersData.sort((a, b) => {
      // 1차: 점수 (내림차순)
      const scoreDiff = (b.total_score || 0) - (a.total_score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      
      // 2차: 거리 (가까운 순, null은 뒤로)
      if (a.distance_km !== null && b.distance_km !== null) {
        return a.distance_km - b.distance_km;
      }
      if (a.distance_km === null && b.distance_km !== null) return 1;
      if (a.distance_km !== null && b.distance_km === null) return -1;
      
      // 3차: 이름 (가나다 순)
      const nameA = (a.name || '').trim();
      const nameB = (b.name || '').trim();
      return nameA.localeCompare(nameB, 'ko');
    });

    // 순위 필드 추가
    allCustomersData.forEach((customer, index) => {
      customer.rank = index + 1;
    });

    // 로깅
    console.log(`[경품 추천] 전체 설문 수: ${allSurveys?.length || 0}`);
    console.log(`[경품 추천] 중복 제거 후 고객 수: ${allCustomersData.length}`);
    console.log(`[경품 추천] 거리 정보 있는 고객: ${allCustomersData.filter(c => c.distance_km !== null).length}`);
    console.log(`[경품 추천] 주소 없는 고객: ${allCustomersData.filter(c => !c.address || !isGeocodableAddress(c.address)).length}`);
    
    // 누락된 고객 확인
    console.log(`[경품 추천] 건너뛴 설문 수: ${skippedSurveys.length}`);
    const noPhoneSurveys = skippedSurveys.filter(s => s.reason === 'no_phone');
    const duplicatePhoneSurveys = skippedSurveys.filter(s => s.reason === 'duplicate_phone');
    console.log(`[경품 추천] 전화번호 없는 설문: ${noPhoneSurveys.length}개`);
    console.log(`[경품 추천] 중복 전화번호 설문: ${duplicatePhoneSurveys.length}개`);
    
    if (noPhoneSurveys.length > 0) {
      console.log(`[경품 추천] 전화번호 없는 설문 목록:`, noPhoneSurveys.map(s => ({
        id: s.survey.id,
        name: s.survey.name,
        phone: s.survey.phone,
        address: s.survey.address,
        created_at: s.survey.created_at
      })));
    }
    
    if (duplicatePhoneSurveys.length > 0) {
      console.log(`[경품 추천] 중복 전화번호 설문 목록 (최근 설문 제외):`, duplicatePhoneSurveys.map(s => ({
        id: s.survey.id,
        name: s.survey.name,
        phone: s.survey.phone,
        address: s.survey.address,
        created_at: s.survey.created_at
      })));
    }
    
    // 누락된 고객 정보 수집 (result 생성 전에)
    const allSurveyPhones = new Set(allSurveys?.map((s: any) => s.phone).filter(Boolean) || []);
    const includedPhones = new Set(allCustomersData.map((c: any) => c.phone).filter(Boolean));
    const missingPhones = Array.from(allSurveyPhones).filter((phone: string) => !includedPhones.has(phone));
    const missingSurveys = allSurveys?.filter((s: any) => missingPhones.includes(s.phone)) || [];
    const missingCustomers = missingSurveys.map((s: any) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      created_at: s.created_at,
      reason: skippedSurveys.find(sk => sk.survey.id === s.id)?.reason || 'unknown'
    }));
    
    // 전화번호가 없는 설문 확인
    const surveysWithoutPhone = allSurveys?.filter((s: any) => !s.phone || s.phone.trim() === '') || [];
    if (surveysWithoutPhone.length > 0) {
      console.log(`[경품 추천] 전화번호가 없는 설문 수: ${surveysWithoutPhone.length}`);
      console.log(`[경품 추천] 전화번호가 없는 설문 정보:`, surveysWithoutPhone.map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        address: s.address,
        created_at: s.created_at
      })));
    }

    // 고유 고객 수 계산 (is_primary=true인 것만)
    const uniqueCustomers = allCustomersData.filter(c => c.is_primary === true);
    const duplicateSurveys = allCustomersData.filter(c => c.is_duplicate === true);

    const result = {
      purchasedCustomers: topPurchasedCustomers,
      nonPurchasedCustomers: topNonPurchasedCustomers,
      allCustomers: allCustomersData, // 모든 설문 포함 (99개)
      summary: {
        totalPurchased: topPurchasedCustomers.length,
        totalNonPurchased: topNonPurchasedCustomers.length,
        totalAll: allCustomersData.length, // 전체 설문 수 (99개)
        uniqueCustomers: uniqueCustomers.length, // 고유 고객 수 (92명)
        duplicateSurveys: duplicateSurveys.length, // 중복 설문 수 (7개)
      },
      missingCustomers: missingCustomers, // 누락된 고객 정보
      debug: {
        totalSurveys: allSurveys?.length || 0,
        totalUniquePhones: allSurveyPhones.size,
        includedPhones: includedPhones.size,
        missingCount: missingPhones.length,
        skippedCount: skippedSurveys.length,
        noPhoneCount: skippedSurveys.filter(s => s.reason === 'no_phone').length,
        duplicateCount: duplicateSurveys.length, // 중복 설문 수
      },
    };

    // 경품 추천 결과를 DB에 저장
    // 한국 시간대 기준으로 날짜/시간 생성
    const now = new Date();
    // 한국 시간대 (UTC+9)로 변환하여 날짜/시간 문자열 생성
    const koreaTimeOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // UTC 시간
    const koreaTime = new Date(utcTime + koreaTimeOffset);
    
    // 한국 시간 기준으로 날짜 생성 (YYYY-MM-DD)
    const year = koreaTime.getFullYear();
    const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getDate()).padStart(2, '0');
    const recommendationDate = `${year}-${month}-${day}`;
    
    // 한국 시간 기준으로 날짜시간 생성 (ISO 형식이지만 한국 시간대 정보 포함)
    // toISOString()은 UTC를 반환하므로, 한국 시간을 UTC로 변환한 값을 저장
    // 프론트엔드에서 timeZone: 'Asia/Seoul'로 변환하면 올바른 시간이 표시됨
    const recommendationDateTime = koreaTime.toISOString();
    let saveSuccess = false;
    let saveError: any = null;
    try {
      saveSuccess = await savePrizeRecommendation(result, recommendationDate, recommendationDateTime);
      if (saveSuccess) {
        console.log('[경품 추천] 저장 완료 - 날짜:', recommendationDate);
        
        // 저장 확인 (약간의 지연 후 DB에서 확인)
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const { count, error: checkError } = await supabase
            .from('prize_recommendations')
            .select('*', { count: 'exact', head: true })
            .eq('recommendation_date', recommendationDate);
          
          if (checkError) {
            console.error('[경품 추천] 저장 확인 중 오류:', checkError);
          } else if (count === 0) {
            console.warn(`[경품 추천] 저장 확인 실패 - 날짜: ${recommendationDate}, 저장된 건수: ${count}`);
            saveSuccess = false;
            saveError = { message: '데이터가 저장되었지만 확인할 수 없습니다.' };
          } else {
            console.log(`[경품 추천] 저장 확인 성공 - 날짜: ${recommendationDate}, 저장된 건수: ${count}`);
          }
        } catch (checkError: any) {
          console.error('[경품 추천] 저장 확인 중 오류:', checkError);
          // 확인 실패해도 계속 진행
        }
      } else {
        console.warn('[경품 추천] 저장할 데이터가 없음 - 날짜:', recommendationDate);
        saveError = { message: '저장할 데이터가 없습니다.' };
      }
    } catch (error: any) {
      console.error('[경품 추천] 저장 실패:', error);
      console.error('[경품 추천] 저장 실패 상세:', error?.message || error);
      console.error('[경품 추천] 저장 실패 스택:', error?.stack);
      saveSuccess = false;
      saveError = {
        message: error?.message || '알 수 없는 오류가 발생했습니다.',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      };
      // 저장 실패해도 응답은 반환 (이미 생성은 완료되었으므로)
      // 하지만 사용자에게 알려야 함
    }

    // HTML 형식으로 응답 (A4 최적화)
    if (format === 'html') {
      const html = generateHTMLReport(result);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="prize-recommendation-${new Date().toISOString().split('T')[0]}.html"`,
      );
      return res.status(200).send(html);
    }

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
      recommendationDate: recommendationDate,
      saveSuccess: saveSuccess, // 저장 성공 여부
      saveError: saveError, // 저장 에러 정보 (있는 경우)
      data: result,
    });
  } catch (error: any) {
    console.error('[admin/surveys/recommend-prizes] 오류:', error);
    console.error('[admin/surveys/recommend-prizes] 오류 스택:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || '경품 추천 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

