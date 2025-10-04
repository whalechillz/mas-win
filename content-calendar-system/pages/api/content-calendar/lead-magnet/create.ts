// Lead Magnet Creation API
// /pages/api/content-calendar/lead-magnet/create.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { seriesId, leadMagnet } = req.body;

  if (!seriesId || !leadMagnet) {
    return res.status(400).json({ 
      error: 'Series ID and lead magnet data are required' 
    });
  }

  try {
    // PDF 생성 (실제 구현에서는 puppeteer나 jsPDF 사용)
    const pdfContent = await generatePDFContent(leadMagnet);
    const downloadUrl = await uploadToStorage(pdfContent, leadMagnet.title);
    
    // 랜딩 페이지 생성
    const landingPageUrl = await createLandingPage(leadMagnet, downloadUrl);
    
    // DB에 리드 매그넷 정보 저장
    const { data, error } = await supabase
      .from('cc_lead_magnets')
      .insert({
        series_id: seriesId,
        title: leadMagnet.title,
        description: leadMagnet.description || '',
        value: leadMagnet.value,
        pages: leadMagnet.pages,
        format: leadMagnet.format || 'pdf',
        download_url: downloadUrl,
        landing_page_url: landingPageUrl,
        requires_email: leadMagnet.requiresEmail !== false,
        requires_phone: leadMagnet.requiresPhone || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      leadMagnetId: data.id,
      downloadUrl,
      landingPageUrl,
      message: `리드 매그넷 "${leadMagnet.title}" 생성 완료`
    });

  } catch (error: any) {
    console.error('Lead magnet creation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create lead magnet' 
    });
  }
}

/**
 * PDF 콘텐츠 생성
 */
async function generatePDFContent(leadMagnet: any): Promise<string> {
  // 실제 구현에서는 puppeteer를 사용한 PDF 생성
  // 여기서는 HTML 템플릿 생성
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${leadMagnet.title}</title>
      <style>
        body {
          font-family: 'Noto Sans KR', sans-serif;
          line-height: 1.8;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        h1 {
          color: #1e3a8a;
          font-size: 32px;
          margin-bottom: 20px;
        }
        h2 {
          color: #1e3a8a;
          font-size: 24px;
          margin-top: 30px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #f59e0b 100%);
          color: white;
          padding: 40px;
          margin: -40px -40px 40px -40px;
        }
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
        }
        .cta {
          background: #f59e0b;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          margin: 20px 0;
        }
        .tip-box {
          background: #f3f4f6;
          border-left: 4px solid #1e3a8a;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${leadMagnet.title}</h1>
        <p>${leadMagnet.value} 상당의 프리미엄 가이드</p>
      </div>
      
      <h2>들어가며</h2>
      <p>시니어 골퍼 여러분, MASGOLF가 준비한 특별한 가이드를 만나보세요.</p>
      
      ${generateContentSections(leadMagnet)}
      
      <div class="footer">
        <p>© 2024 MASGOLF. All rights reserved.</p>
        <p>더 많은 정보를 원하시면 언제든 문의해주세요.</p>
        <a href="tel:1588-0000" class="cta">전화 상담 예약</a>
      </div>
    </body>
    </html>
  `;
  
  return htmlContent;
}

/**
 * 콘텐츠 섹션 생성
 */
function generateContentSections(leadMagnet: any): string {
  // 시리즈별 콘텐츠 생성
  if (leadMagnet.title.includes('비거리')) {
    return `
      <h2>1. 시니어 골퍼의 비거리 현실</h2>
      <p>50대 평균 드라이버 비거리: 215야드<br>60대 평균 드라이버 비거리: 205야드</p>
      
      <div class="tip-box">
        <strong>💡 핵심 팁:</strong> 나이가 들어도 올바른 방법으로 20야드는 늘릴 수 있습니다.
      </div>
      
      <h2>2. 비거리 향상 5단계 전략</h2>
      <ol>
        <li>올바른 어드레스 자세</li>
        <li>체중 이동 최적화</li>
        <li>클럽 피팅의 중요성</li>
        <li>연습 루틴 개선</li>
        <li>멘탈 관리</li>
      </ol>
      
      <h2>3. 실전 적용 가이드</h2>
      <p>구체적인 연습 방법과 드릴을 상세히 설명...</p>
    `;
  } else if (leadMagnet.title.includes('보험')) {
    return `
      <h2>1. 골프 드라이버 보험의 필요성</h2>
      <p>고가의 드라이버를 보호하는 스마트한 방법</p>
      
      <h2>2. 시중 보험 상품 비교</h2>
      <table>
        <tr><th>보험사</th><th>보장 범위</th><th>월 보험료</th></tr>
        <tr><td>A사</td><td>파손, 분실</td><td>5,000원</td></tr>
        <tr><td>B사</td><td>파손만</td><td>3,000원</td></tr>
      </table>
      
      <h2>3. 가입 시 주의사항</h2>
      <ul>
        <li>약관 꼼꼼히 확인하기</li>
        <li>면책 조항 체크</li>
        <li>보상 한도 확인</li>
      </ul>
    `;
  }
  
  return '<p>상세 콘텐츠가 여기에 들어갑니다...</p>';
}

/**
 * 스토리지 업로드
 */
async function uploadToStorage(content: string, filename: string): Promise<string> {
  // 실제 구현에서는 Supabase Storage 사용
  // 임시로 로컬 경로 반환
  const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `/downloads/${sanitizedFilename}.pdf`;
}

/**
 * 랜딩 페이지 생성
 */
async function createLandingPage(leadMagnet: any, downloadUrl: string): Promise<string> {
  // 실제 구현에서는 동적 페이지 생성
  // 임시로 URL 반환
  const pageSlug = leadMagnet.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `/lead-magnets/${pageSlug}`;
}
