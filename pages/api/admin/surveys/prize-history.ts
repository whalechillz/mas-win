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
  // DELETE 메서드: 특정 날짜의 경품 추천 데이터 삭제
  if (req.method === 'DELETE') {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, message: '날짜(date) 파라미터가 필요합니다.' });
      }

      // 특정 날짜의 모든 경품 추천 데이터 삭제
      const { error, count } = await supabase
        .from('prize_recommendations')
        .delete()
        .eq('recommendation_date', date)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('경품 추천 데이터 삭제 오류:', error);
        return res.status(500).json({ success: false, message: '데이터 삭제에 실패했습니다.' });
      }

      return res.status(200).json({
        success: true,
        message: `${date} 날짜의 경품 추천 데이터 ${count || 0}건이 삭제되었습니다.`,
        deletedCount: count || 0,
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
    const { date, section, limit = 50, offset = 0, format } = req.query;

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
      console.error('경품 추천 이력 조회 오류:', error);
      return res.status(500).json({ success: false, message: '이력 조회에 실패했습니다.' });
    }

    // 날짜별 그룹화
    const groupedByDate: Record<string, any[]> = {};
    data?.forEach((item) => {
      const date = item.recommendation_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(item);
    });

    // 날짜별 통계 계산
    const dateStats = Object.keys(groupedByDate).map((date) => {
      const items = groupedByDate[date];
      const purchased = items.filter((i) => i.section === 'purchased').length;
      const nonPurchased = items.filter((i) => i.section === 'non_purchased').length;
      const all = items.filter((i) => i.section === 'all').length;

      return {
        date,
        total: items.length,
        purchased,
        nonPurchased,
        all,
        topScore: Math.max(...items.map((i) => i.total_score || 0)),
        avgScore: items.reduce((sum, i) => sum + (i.total_score || 0), 0) / items.length,
      };
    });

    // 고유한 날짜 목록
    const uniqueDates = Array.from(new Set(data?.map((item) => item.recommendation_date) || [])).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    return res.status(200).json({
      success: true,
      data: {
        recommendations: data || [],
        groupedByDate,
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

