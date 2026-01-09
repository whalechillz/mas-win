import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 매장 정보
const STORE_ADDRESS = '경기도 수원시 영통구 법조로149번길 200';

// HTML 리포트 생성 함수 (저장된 이력 데이터용)
function generateHTMLReportFromHistory(data: any[], recommendationDate: string): string {
  // HTML 이스케이프 헬퍼 함수
  const escapeHtml = (text: string) => {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 섹션별로 데이터 분리
  const purchasedCustomers = data.filter((item) => item.section === 'purchased');
  const nonPurchasedCustomers = data.filter((item) => item.section === 'non_purchased');
  const allCustomers = data.filter((item) => item.section === 'all');

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>경품 추천 고객 목록 (저장된 이력)</title>
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
    <h1>경품 추천 고객 목록 (저장된 이력)</h1>
    <div class="header-info">
      <div><strong>추천일시:</strong> ${escapeHtml(recommendationDate)}</div>
      <div><strong>다운로드일시:</strong> ${escapeHtml(now)}</div>
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
          <th>선정 이유</th>
        </tr>
      </thead>
      <tbody>`;

  if (purchasedCustomers.length === 0) {
    html += `<tr><td colspan="9" style="text-align: center; padding: 10mm;">데이터가 없습니다.</td></tr>`;
  } else {
    purchasedCustomers.forEach((customer: any) => {
      const reasons = [];
      if (customer.gift_count > 0) reasons.push(`선물 ${customer.gift_count}회`);
      if (customer.visit_count > 0) reasons.push(`시타방문 ${customer.visit_count}회`);
      if (customer.booking_count > 0) reasons.push(`예약 ${customer.booking_count}회`);
      if (customer.survey_quality_score > 0) reasons.push(`설문품질우수`);
      if (customer.is_over_2_years) reasons.push('2년이상');

      html += `<tr>
        <td>${customer.rank || '-'}</td>
        <td>${escapeHtml(customer.name || '-')}</td>
        <td>${escapeHtml(customer.phone || '-')}</td>
        <td>${customer.total_score || 0}</td>
        <td>${customer.gift_count || 0}</td>
        <td>${customer.visit_count || 0}</td>
        <td>${customer.booking_count || 0}</td>
        <td>${customer.survey_quality_score || 0}</td>
        <td>${escapeHtml(reasons.join(', ') || '-')}</td>
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
          <th>선정 이유</th>
        </tr>
      </thead>
      <tbody>`;

  if (nonPurchasedCustomers.length === 0) {
    html += `<tr><td colspan="8" style="text-align: center; padding: 10mm;">데이터가 없습니다.</td></tr>`;
  } else {
    nonPurchasedCustomers.forEach((customer: any) => {
      const reasons = [];
      if (customer.distance_km) reasons.push(`매장${customer.distance_km.toFixed(1)}km`);
      if (customer.survey_quality_score > 0) reasons.push(`설문품질우수`);
      if (customer.gift_count > 0) reasons.push(`선물${customer.gift_count}회`);

      const address = (customer.address || '-')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      html += `<tr>
        <td>${customer.rank || '-'}</td>
        <td>${escapeHtml(customer.name || '-')}</td>
        <td>${escapeHtml(customer.phone || '-')}</td>
        <td>${customer.total_score || 0}</td>
        <td>${customer.distance_km ? customer.distance_km.toFixed(2) : '-'}</td>
        <td>${escapeHtml(address)}</td>
        <td>${customer.survey_quality_score || 0}</td>
        <td>${escapeHtml(reasons.join(', ') || '-')}</td>
      </tr>`;
    });
  }

  html += `</tbody></table></div>`;

  // 전체 고객 점수 순위
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

  if (allCustomers.length === 0) {
    html += `<tr><td colspan="8" style="text-align: center; padding: 10mm;">데이터가 없습니다.</td></tr>`;
  } else {
    allCustomers.forEach((customer: any) => {
      const category = customer.category || (customer.is_purchased ? '구매' : '비구매');

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
        if (customer.gift_count > 0) {
          parts.push(`선물${customer.gift_count}회`);
        }
        detail = parts.length > 0 ? parts.join(', ') : '정보 없음';
      }

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
  }

  html += `</tbody></table></div>
</body>
</html>`;

  return html;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // PATCH 메서드: 경품 추천 이름 업데이트
  if (req.method === 'PATCH') {
    try {
      const { date, recommendation_datetime, recommendation_name } = req.body;

      if (!date) {
        return res.status(400).json({ success: false, message: '날짜(date) 파라미터가 필요합니다.' });
      }

      if (!recommendation_name || recommendation_name.trim() === '') {
        return res.status(400).json({ success: false, message: '이름(recommendation_name)이 필요합니다.' });
      }

      // 업데이트할 레코드 필터링
      let query = supabase
        .from('prize_recommendations')
        .update({ recommendation_name: recommendation_name.trim() })
        .eq('recommendation_date', date);

      // recommendation_datetime이 있으면 특정 시간의 추천만 업데이트
      if (recommendation_datetime) {
        query = query.eq('recommendation_datetime', recommendation_datetime);
      }

      const { error, count } = await query;

      if (error) {
        console.error('[이름 업데이트] 경품 추천 이름 업데이트 오류:', error);
        return res.status(500).json({ success: false, message: '이름 업데이트에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        message: `경품 추천 이름이 "${recommendation_name.trim()}"로 업데이트되었습니다.`,
        updatedCount: count || 0,
      });
    } catch (error: any) {
      console.error('경품 추천 이름 업데이트 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '이름 업데이트 중 오류가 발생했습니다.' });
    }
  }

  // DELETE 메서드: 특정 날짜의 경품 추천 데이터 삭제
  if (req.method === 'DELETE') {
    try {
      const { date, recommendation_datetime } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, message: '날짜(date) 파라미터가 필요합니다.' });
      }

      // 삭제 전 개수 확인
      let countQuery = supabase
        .from('prize_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('recommendation_date', date);
      
      if (recommendation_datetime) {
        countQuery = countQuery.eq('recommendation_datetime', decodeURIComponent(recommendation_datetime as string));
      }
      
      const { count: beforeCount } = await countQuery;
      
      console.log(`[삭제] 삭제 전 개수 확인: ${beforeCount || 0}건 (날짜: ${date}, 시간: ${recommendation_datetime || '전체'})`);

      // prize_selections도 함께 삭제 (먼저 삭제)
      let deleteSelectionsQuery = supabase
        .from('prize_selections')
        .delete()
        .eq('recommendation_date', date);
      
      if (recommendation_datetime) {
        deleteSelectionsQuery = deleteSelectionsQuery.eq('recommendation_datetime', decodeURIComponent(recommendation_datetime as string));
      }
      
      const { error: selectionsError } = await deleteSelectionsQuery;
      
      if (selectionsError) {
        console.error('[삭제] prize_selections 삭제 오류:', selectionsError);
        // prize_selections 삭제 실패해도 prize_recommendations 삭제는 계속 진행
      } else {
        console.log('[삭제] prize_selections 삭제 완료');
      }

      // prize_recommendations 삭제
      let deleteRecommendationsQuery = supabase
        .from('prize_recommendations')
        .delete()
        .eq('recommendation_date', date);
      
      if (recommendation_datetime) {
        deleteRecommendationsQuery = deleteRecommendationsQuery.eq('recommendation_datetime', decodeURIComponent(recommendation_datetime as string));
      }
      
      const { error } = await deleteRecommendationsQuery;

      console.log(`[삭제] 삭제 결과: error=${error ? JSON.stringify(error) : 'null'}, beforeCount=${beforeCount || 0}`);

      if (error) {
        console.error('[삭제] 경품 추천 데이터 삭제 오류:', error);
        return res.status(500).json({ success: false, message: '데이터 삭제에 실패했습니다.' });
      }

      const deletedCount = beforeCount || 0;
      
      console.log(`[삭제] 최종 삭제 건수: ${deletedCount}건`);

      const message = recommendation_datetime
        ? `${date} ${decodeURIComponent(recommendation_datetime as string)} 시간의 경품 추천 데이터 ${deletedCount}건이 삭제되었습니다.`
        : `${date} 날짜의 경품 추천 데이터 ${deletedCount}건이 삭제되었습니다.`;

      return res.status(200).json({
        success: true,
        message: message,
        deletedCount: deletedCount,
      });
    } catch (error: any) {
      console.error('경품 추천 데이터 삭제 오류:', error);
      return res.status(500).json({ success: false, message: error.message || '데이터 삭제 중 오류가 발생했습니다.' });
    }
  }

  // GET 메서드: 경품 추천 이력 조회
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { date, recommendation_datetime, section, limit = 50, offset = 0, format } = req.query;

    // 기본 쿼리
    let query = supabase
      .from('prize_recommendations')
      .select('*', { count: 'exact' })
      .order('recommendation_date', { ascending: false })
      .order('rank', { ascending: true });

    // 날짜 필터
    if (date) {
      query = query.eq('recommendation_date', date);
    }

    // 추천 시간 필터 (같은 날짜에 여러 추천이 있을 때 특정 시간의 추천만 조회)
    if (recommendation_datetime) {
      query = query.eq('recommendation_datetime', recommendation_datetime);
    }

    // 섹션 필터 (purchased, non_purchased, all)
    if (section) {
      query = query.eq('section', section);
    }

    // HTML 형식인 경우 페이지네이션 제한 없이 모든 데이터 조회
    if (format === 'html') {
      // HTML 리포트용: 모든 데이터 조회 (페이지네이션 없음)
      const { data, error } = await query;

      if (error) {
        console.error('경품 추천 이력 조회 오류:', error);
        return res.status(500).json({ success: false, message: '이력 조회에 실패했습니다.' });
      }

      if (!date) {
        return res.status(400).json({ success: false, message: 'HTML 리포트를 생성하려면 날짜(date) 파라미터가 필요합니다.' });
      }

      // HTML 리포트 생성
      const html = generateHTMLReportFromHistory(data || [], date as string);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // JSON 형식 (기존 로직)
    // 페이지네이션
    if (limit) {
      query = query.limit(Number(limit));
    }
    if (offset) {
      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[상세 API] 경품 추천 이력 조회 오류:', error);
      return res.status(500).json({ success: false, message: '이력 조회에 실패했습니다.' });
    }

    // 상세 조회인 경우 로그 출력 (date 파라미터가 있고 section=all인 경우)
    if (date && section === 'all') {
      console.log(`[상세 API] 조회 요청: 날짜=${date}, 시간=${recommendation_datetime || '전체'}, section=${section}, limit=${limit}, offset=${offset}`);
      console.log(`[상세 API] 조회 결과: ${data?.length || 0}건 (총 ${count || 0}건)`);
      
      if (data && data.length > 0) {
        const geocodingStats = {
          completed: data.filter((r: any) => r.latitude && r.longitude).length,
          incomplete: data.filter((r: any) => {
            const hasAddress = r.address && !['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
            return (!r.latitude || !r.longitude) && hasAddress;
          }).length,
          noAddress: data.filter((r: any) => {
            return !r.address || ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'].includes(r.address);
          }).length,
        };
        console.log(`[상세 API] 지오코딩 통계: 완료 ${geocodingStats.completed}건, 미완료 ${geocodingStats.incomplete}건, 주소 없음 ${geocodingStats.noAddress}건`);
      }
    }

    // 날짜+시간별 그룹화 (같은 날짜에 여러 번 생성된 경우 각각 별도 행으로 표시)
    const groupedByDateTime: Record<string, any[]> = {};
    data?.forEach((item) => {
      // 날짜와 시간을 조합한 키 생성 (같은 날짜에 여러 번 생성된 경우 구분)
      const dateTimeKey = `${item.recommendation_date}_${item.recommendation_datetime || 'no-time'}`;
      if (!groupedByDateTime[dateTimeKey]) {
        groupedByDateTime[dateTimeKey] = [];
      }
      groupedByDateTime[dateTimeKey].push(item);
    });

    // 날짜+시간별 통계 계산 (구매경과가 있는 경우만 구매로 계산)
    const dateStats = Object.keys(groupedByDateTime).map((dateTimeKey) => {
      const items = groupedByDateTime[dateTimeKey];
      
      // dateTimeKey에서 날짜 부분 추출 (예: "2026-01-08_2026-01-08T06:42:00Z" -> "2026-01-08")
      const date = dateTimeKey.split('_')[0];
      
      // 고유 고객만 필터링 (is_primary=true 또는 rank가 있는 것)
      const primaryItems = items.filter((i) => i.is_primary === true || i.rank != null);
      
      // 구매경과(days_since_last_purchase)가 있는 경우만 구매로 계산 (고유 고객 기준)
      const purchased = primaryItems.filter((i) => 
        i.is_purchased === true && i.days_since_last_purchase != null
      ).length;
      const nonPurchased = primaryItems.filter((i) => 
        !(i.is_purchased === true && i.days_since_last_purchase != null)
      ).length;
      
      // 총 설문 수 (모든 설문 포함)
      const totalSurveys = items.length;
      
      // 고유 고객 수
      const uniqueCustomers = primaryItems.length;
      
      // 중복 설문 수
      const duplicateSurveys = items.filter((i) => i.is_duplicate === true).length;

      // 첫 번째 항목의 recommendation_datetime과 recommendation_name 가져오기
      const firstItem = items[0];
      const recommendation_datetime = firstItem?.recommendation_datetime || null;
      const recommendation_name = firstItem?.recommendation_name || null;

      return {
        date, // 날짜 추가
        recommendation_datetime, // 추천 시간 추가
        recommendation_name, // 추천 이름 추가
        total: totalSurveys, // 전체 설문 수 (99개)
        purchased,
        nonPurchased,
        all: uniqueCustomers, // 고유 고객 수 (92명)
        duplicateCount: duplicateSurveys, // 중복 설문 수 (7개)
        topScore: Math.max(...primaryItems.map((i) => i.total_score || 0)),
        avgScore: primaryItems.reduce((sum, i) => sum + (i.total_score || 0), 0) / (primaryItems.length || 1),
      };
    });

    // 고유한 날짜 목록
    const uniqueDates = Array.from(new Set(data?.map((item) => item.recommendation_date) || [])).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    // customers 테이블에서 last_purchase_date 조회하여 경과 일수 계산
    const customerIds = Array.from(new Set((data || []).map((item: any) => item.customer_id).filter(Boolean)));
    let customersData: any[] = [];
    if (customerIds.length > 0) {
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, last_purchase_date')
        .in('id', customerIds);
      
      if (customersError) {
        console.error('[prize-history] customers 배치 조회 오류:', customersError);
      } else {
        customersData = customers || [];
      }
    }
    
    const customersMap = new Map(customersData.map((c: any) => [c.id, c]));
    
    // surveys 테이블에서 age 정보 조회
    const surveyIdsForAge = Array.from(new Set((data || []).map((item: any) => item.survey_id).filter(Boolean)));
    let surveysData: any[] = [];
    if (surveyIdsForAge.length > 0) {
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('id, age, age_group')
        .in('id', surveyIdsForAge);
      
      if (surveysError) {
        console.error('[prize-history] surveys 배치 조회 오류:', surveysError);
      } else {
        surveysData = surveys || [];
      }
    }
    
    const surveysMap = new Map(surveysData.map((s: any) => [s.id, s]));
    
    // customer_address_cache에서 최신 지오코딩 정보 조회
    const surveyIds = Array.from(new Set((data || []).map((item: any) => item.survey_id).filter(Boolean)));
    const customerIdsForCache = Array.from(new Set((data || []).map((item: any) => item.customer_id).filter(Boolean)));
    
    let geocodingCache: any[] = [];
    if (surveyIds.length > 0 || customerIdsForCache.length > 0) {
      let cacheQuery = supabase
        .from('customer_address_cache')
        .select('*')
        .eq('geocoding_status', 'success');
      
      if (surveyIds.length > 0 && customerIdsForCache.length > 0) {
        cacheQuery = cacheQuery.or(`survey_id.in.(${surveyIds.join(',')}),customer_id.in.(${customerIdsForCache.join(',')})`);
      } else if (surveyIds.length > 0) {
        cacheQuery = cacheQuery.in('survey_id', surveyIds);
      } else if (customerIdsForCache.length > 0) {
        cacheQuery = cacheQuery.in('customer_id', customerIdsForCache);
      }
      
      const { data: cacheData } = await cacheQuery;
      geocodingCache = cacheData || [];
    }
    
    // 캐시를 키로 매핑 (survey_id + address 또는 customer_id + address)
    const cacheMap = new Map<string, any>();
    geocodingCache.forEach(cache => {
      if (cache.survey_id) {
        const key = `s_${cache.survey_id}_${cache.address}`;
        // 같은 키가 있으면 더 최신 것으로 업데이트
        const existing = cacheMap.get(key);
        if (!existing || new Date(cache.updated_at) > new Date(existing.updated_at)) {
          cacheMap.set(key, cache);
        }
      }
      if (cache.customer_id) {
        const key = `c_${cache.customer_id}_${cache.address}`;
        const existing = cacheMap.get(key);
        if (!existing || new Date(cache.updated_at) > new Date(existing.updated_at)) {
          cacheMap.set(key, cache);
        }
      }
    });
    
    // recommendations 데이터에 days_since_last_purchase, age 정보 및 최신 지오코딩 정보 추가
    const enrichedRecommendations = (data || []).map((item: any) => {
      let daysSinceLastPurchase = null;
      if (item.customer_id) {
        const customer = customersMap.get(item.customer_id);
        if (customer?.last_purchase_date) {
          daysSinceLastPurchase = Math.floor(
            (Date.now() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24),
          );
        }
      }
      
      // surveys 테이블에서 age 정보 조회
      let age = null;
      let age_group = null;
      if (item.survey_id) {
        const survey = surveysMap.get(item.survey_id);
        if (survey) {
          age = survey.age;
          age_group = survey.age_group;
        }
      }
      
      // 최신 지오코딩 정보 조회 (캐시에서)
      let latestGeocoding = null;
      if (item.address) {
        const key1 = item.survey_id ? `s_${item.survey_id}_${item.address}` : null;
        const key2 = item.customer_id ? `c_${item.customer_id}_${item.address}` : null;
        latestGeocoding = (key1 && cacheMap.get(key1)) || (key2 && cacheMap.get(key2)) || null;
      }
      
      // 캐시에 최신 정보가 있으면 그것을 사용, 없으면 prize_recommendations의 정보 사용
      return {
        ...item,
        days_since_last_purchase: daysSinceLastPurchase,
        age: age,
        age_group: age_group,
        latitude: latestGeocoding?.latitude || item.latitude || null,
        longitude: latestGeocoding?.longitude || item.longitude || null,
        distance_km: latestGeocoding?.distance_km || item.distance_km || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        groupedByDate: groupedByDateTime, // 날짜+시간별 그룹화 데이터 (호환성을 위해 groupedByDate로 반환)
        dateStats,
        uniqueDates,
        total: count || 0,
      },
    });
  } catch (error: any) {
    console.error('경품 추천 이력 조회 오류:', error);
    return res.status(500).json({ success: false, message: error.message || '이력 조회 중 오류가 발생했습니다.' });
  }
}

