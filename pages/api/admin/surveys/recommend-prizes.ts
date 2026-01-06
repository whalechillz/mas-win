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

// 위치 정보 캐싱: 캐시에서 먼저 확인하고, 없으면 API 호출 후 저장
async function getCachedOrCalculateDistance(
  address: string,
  customerId?: number,
  surveyId?: string,
  phone?: string,
): Promise<{ distance: number; lat: number; lng: number; cached: boolean } | null> {
  // 플레이스홀더 주소는 거리 계산 불가
  if (address && (address.startsWith('[') || address === 'N/A')) {
    return null;
  }

  // 캐시에서 먼저 확인 (customer_id 우선, 없으면 survey_id 또는 phone으로)
  let cached = null;
  
  if (customerId) {
    const { data } = await supabase
      .from('customer_address_cache')
      .select('*')
      .eq('customer_id', customerId)
      .eq('address', address)
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
      .eq('address', address)
      .eq('geocoding_status', 'success')
      .maybeSingle();
    cached = data;
  }
  
  // phone으로도 시도 (최신 위치 정보 관리에서 업데이트한 경우)
  if (!cached && phone) {
    // phone으로 customer 찾기
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    if (customer?.id) {
      const { data } = await supabase
        .from('customer_address_cache')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('address', address)
        .eq('geocoding_status', 'success')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cached = data;
    }
  }

  if (cached && cached.distance_km !== null && cached.latitude !== null && cached.longitude !== null) {
    return {
      distance: cached.distance_km,
      lat: cached.latitude,
      lng: cached.longitude,
      cached: true,
    };
  }

  // 캐시에 없으면 API 호출
  const coords = await getCoordinatesFromAddress(address);
  if (coords) {
    const distance = calculateDistance(STORE_LAT, STORE_LNG, coords.lat, coords.lng);

    // 캐시에 저장
    if (customerId) {
      await supabase.from('customer_address_cache').upsert(
        {
          customer_id: customerId,
          survey_id: surveyId || null,
          address: address,
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          geocoding_status: 'success',
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id,address' },
      );
    }

    return { distance, lat: coords.lat, lng: coords.lng, cached: false };
  }

  // 실패한 경우 캐시에 실패 상태 저장
  if (customerId) {
    await supabase.from('customer_address_cache').upsert(
      {
        customer_id: customerId,
        survey_id: surveyId || null,
        address: address,
        geocoding_status: 'failed',
        geocoding_error: '주소 변환 실패',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id,address' },
    );
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
): Promise<void> {
  const recommendations: any[] = [];

  // 구매 고객 저장
  result.purchasedCustomers.forEach((customer: any, index: number) => {
    recommendations.push({
      recommendation_date: recommendationDate,
      survey_id: customer.survey_id || null,
      customer_id: customer.customer_id || null,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || null,
      total_score: customer.total_score || 0,
      category: '구매(2년+)',
      is_purchased: true,
      is_over_2_years: true,
      gift_count: customer.gift_count || 0,
      visit_count: customer.visit_count || 0, // 시타 방문
      booking_count: customer.booking_count || 0,
      survey_quality_score: customer.survey_quality_score || 0,
      section: 'purchased',
      rank: index + 1,
    });
  });

  // 비구매 고객 저장
  result.nonPurchasedCustomers.forEach((customer: any, index: number) => {
    recommendations.push({
      recommendation_date: recommendationDate,
      survey_id: customer.survey_id || null,
      customer_id: customer.customer_id || null,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || null,
      total_score: customer.total_score || 0,
      category: '비구매',
      is_purchased: false,
      distance_km: customer.distance_km || null,
      latitude: customer.latitude || null,
      longitude: customer.longitude || null,
      geocoding_status: customer.distance_km ? 'success' : 'failed',
      gift_count: customer.gift_count || 0,
      survey_quality_score: customer.survey_quality_score || 0,
      section: 'non_purchased',
      rank: index + 1,
    });
  });

  // 전체 고객 저장
  result.allCustomers.forEach((customer: any, index: number) => {
    recommendations.push({
      recommendation_date: recommendationDate,
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
      distance_km: customer.distance_km || null,
      gift_count: customer.gift_count || 0,
      visit_count: customer.visit_count || 0, // 시타 방문
      booking_count: customer.booking_count || 0,
      survey_quality_score: customer.survey_quality_score || 0,
      section: 'all',
      rank: index + 1,
    });
  });

  // DB에 저장 (같은 날짜의 기존 데이터 삭제 후 저장)
  if (recommendations.length > 0) {
    try {
      // 같은 날짜의 기존 데이터 삭제 (중복 방지)
      await supabase.from('prize_recommendations').delete().eq('recommendation_date', recommendationDate);
      
      // 새 데이터 저장
      await supabase.from('prize_recommendations').insert(recommendations);
    } catch (error) {
      console.error('경품 추천 결과 저장 오류:', error);
      // 저장 실패해도 계속 진행
    }
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

  allCustomers.forEach((customer: any, index: number) => {
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
      <td>${index + 1}</td>
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

            return {
              survey_id: survey.id,
              customer_id: customer.id || null,
              name: survey.name,
              phone: survey.phone,
              address: survey.address,
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

            // 최근 선물 횟수 확인 (이번 경품 추천 기간: 최근 3개월)
            let giftCount = 0;
            if (customer.id) {
              giftCount = await getRecentGiftCount(customer.id);
            }

            // 주소 → 좌표 변환 (캐싱 사용)
            let distance: number | null = null;
            let latitude: number | null = null;
            let longitude: number | null = null;
            if (survey.address) {
              const cachedResult = await getCachedOrCalculateDistance(
                survey.address,
                customer.id,
                survey.id,
                survey.phone,
              );
              if (cachedResult) {
                distance = cachedResult.distance;
                latitude = cachedResult.lat;
                longitude = cachedResult.lng;
              }
            }

            // 선물 받은 고객은 점수에 가중치 추가 (선물 1회당 +5점)
            const baseScore = calculateNonPurchasedCustomerScore(
              {
                survey_quality_score: surveyQuality,
                days_since_survey: daysSinceSurvey,
              },
              distance,
            );
            const score = baseScore + (giftCount * 5); // 선물 받은 고객 가중치

            return {
              survey_id: survey.id,
              customer_id: customer.id || null,
              name: survey.name,
              phone: survey.phone,
              address: survey.address,
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
        } else if (!isPurchased && survey.address) {
          // 비구매 고객 점수 (거리 계산, 캐싱 사용)
          const cachedResult = await getCachedOrCalculateDistance(
            survey.address,
            customer?.id,
            survey.id,
            survey.phone,
          );
          if (cachedResult) {
            distance_km = cachedResult.distance;
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
          score = baseScore + gift_count * 5;
        } else if (!isPurchased && !survey.address) {
          // 주소가 없는 비구매 고객 (거리 점수 없음)
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
          score = baseScore + gift_count * 5;
        }

        allCustomersData.push({
          survey_id: survey.id,
          customer_id: customer?.id || null,
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
          visit_count: visit_count, // 시타 방문 횟수 저장
          booking_count: booking_count, // 예약 횟수 저장
          survey_quality_score:
            (survey.important_factors?.length || 0) + (survey.additional_feedback ? 1 : 0),
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

    // 경품 추천 결과를 DB에 저장 (비동기로 실행, 에러는 무시)
    const recommendationDate = new Date().toISOString().split('T')[0];
    savePrizeRecommendation(result, recommendationDate).catch((error) => {
      console.error('경품 추천 결과 저장 실패:', error);
    });

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

