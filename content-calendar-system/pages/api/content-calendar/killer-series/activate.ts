// Killer Content Series Activation API
// /pages/api/content-calendar/killer-series/activate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { KILLER_CONTENT_SERIES, getContentTemplate } from '@/data/killer-content-series';
import AIContentGenerator from '@/lib/ai/content-generator';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';
import IntegrationConfig from '@/lib/config/integration';

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

  const { seriesId, autoGenerate } = req.body;

  if (!seriesId) {
    return res.status(400).json({ error: 'Series ID is required' });
  }

  try {
    // 시리즈 데이터 가져오기
    const seriesData = getSeriesData(seriesId);
    if (!seriesData) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const savedContents = [];
    const generator = autoGenerate ? new AIContentGenerator({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      falApiKey: process.env.FAL_AI_KEY!
    }) : null;

    // 각 에피소드별로 콘텐츠 생성
    for (const episode of seriesData.episodes) {
      try {
        let contentBody = '';
        let contentHtml = '';

        if (autoGenerate && generator) {
          // AI 자동 생성
          const prompt = buildEpisodePrompt(seriesData, episode);
          const generated = await generator.generateContent({
            contentType: 'blog',
            topic: episode.title,
            keywords: extractKeywords(seriesData, episode),
            tone: {
              primary: 'professional_friendly',
              emotions: ['trust', 'expertise', 'care']
            },
            length: 2000,
            additionalContext: prompt
          });

          // 톤앤매너 적용
          contentBody = MassgooToneAndManner.applyToneAndManner(
            generated.body,
            'blog',
            '시니어_타겟'
          );
          contentHtml = generated.html;
        } else {
          // 템플릿 기반 생성
          contentBody = generateFromTemplate(episode);
          contentHtml = convertToHtml(contentBody);
        }

        // 데이터베이스 저장
        const savedContent = await saveContent({
          seriesId,
          seriesName: seriesData.title,
          episode,
          contentBody,
          contentHtml,
          publishDate: calculatePublishDate(episode.number, seriesData.publishingSchedule)
        });

        savedContents.push(savedContent);

        // 리드 매그넷이 있는 경우 생성
        if (episode.leadMagnet) {
          await createLeadMagnet(savedContent.id, episode.leadMagnet);
        }

      } catch (error) {
        console.error(`Episode ${episode.number} generation failed:`, error);
      }
    }

    // 시리즈 활성화 로그
    await logSeriesActivation(seriesId, savedContents.length);

    return res.status(200).json({
      success: true,
      seriesId,
      seriesName: seriesData.title,
      contents: savedContents,
      message: `시리즈 "${seriesData.title}" 활성화 완료 (${savedContents.length}개 콘텐츠 생성)`
    });

  } catch (error: any) {
    console.error('Series activation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to activate series' 
    });
  }
}

/**
 * 시리즈 데이터 가져오기
 */
function getSeriesData(seriesId: string): any {
  const seriesMap: { [key: string]: any } = {
    'series-distance': KILLER_CONTENT_SERIES.distanceImprovement,
    'series-health': KILLER_CONTENT_SERIES.healthAndFitness,
    'series-insurance': KILLER_CONTENT_SERIES.lossAversion,
    'series-prestige': KILLER_CONTENT_SERIES.socialStatus
  };
  
  return seriesMap[seriesId];
}

/**
 * 에피소드 프롬프트 생성
 */
function buildEpisodePrompt(series: any, episode: any): string {
  const strategy = KILLER_CONTENT_SERIES.strategy;
  
  return `
시리즈: ${series.title}
에피소드: ${episode.number}. ${episode.title}

타겟 독자:
- ${strategy.targetAudience.age} ${strategy.targetAudience.gender}
- ${strategy.targetAudience.profile}
- 주요 고민: ${strategy.targetAudience.painPoints.join(', ')}

톤앤매너:
- 전문가의 친근한 조언
- 교육적 콘텐츠 ${strategy.ratio.educational}%
- 부드러운 판매 ${strategy.ratio.softSell}%

콘텐츠 구성:
${JSON.stringify(episode.content, null, 2)}

신뢰 구축 요소:
${strategy.trustBuilding.join('\n')}

CTA:
- Type: ${episode.cta?.type || 'soft'}
- Message: ${episode.cta?.message || ''}

작성 지침:
1. 시니어 골퍼의 실제 고민에 공감
2. 구체적이고 실용적인 조언 제공
3. 데이터와 전문가 의견 포함
4. 자연스러운 브랜드 언급
5. 강압적이지 않은 CTA

금지 표현: 노인, 늙은, 쇠퇴
필수 포함: 프리미엄, 전문성, 신뢰, MASGOLF
  `.trim();
}

/**
 * 키워드 추출
 */
function extractKeywords(series: any, episode: any): string[] {
  const keywords = [];
  
  // 시리즈 키워드
  if (series.id === 'series-distance') {
    keywords.push('비거리', '드라이버', '시니어 골프');
  } else if (series.id === 'series-health') {
    keywords.push('골프 건강', '체력 관리', '부상 예방');
  } else if (series.id === 'series-insurance') {
    keywords.push('골프 보험', '장비 보호', '손실 예방');
  } else if (series.id === 'series-prestige') {
    keywords.push('골프 에티켓', '리더십', '품격');
  }
  
  // 에피소드별 키워드
  if (episode.keywords) {
    keywords.push(...episode.keywords);
  }
  
  // 기본 키워드
  keywords.push('MASGOLF', '마스구', '시니어', '50대', '60대');
  
  return [...new Set(keywords)].slice(0, 10);
}

/**
 * 템플릿 기반 콘텐츠 생성
 */
function generateFromTemplate(episode: any): string {
  let content = `# ${episode.title}\n\n`;
  
  if (episode.subtitle) {
    content += `## ${episode.subtitle}\n\n`;
  }
  
  if (episode.content.intro) {
    content += `${episode.content.intro}\n\n`;
  }
  
  if (episode.content.mainPoints) {
    content += '## 핵심 포인트\n\n';
    episode.content.mainPoints.forEach((point: string) => {
      content += `- ${point}\n`;
    });
    content += '\n';
  }
  
  if (episode.content.tips) {
    content += '## 실전 팁\n\n';
    episode.content.tips.forEach((tip: string) => {
      content += `- ${tip}\n`;
    });
    content += '\n';
  }
  
  if (episode.content.conclusion) {
    content += `## 마무리\n\n${episode.content.conclusion}\n\n`;
  }
  
  if (episode.cta) {
    content += `\n---\n\n*${episode.cta.message}*\n`;
  }
  
  return content;
}

/**
 * HTML 변환
 */
function convertToHtml(markdown: string): string {
  // 간단한 마크다운 to HTML 변환
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/g, '<p>')
    .replace(/$/g, '</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h([123])><\/p>/g, '</h$1>');
}

/**
 * 콘텐츠 저장
 */
async function saveContent(data: any): Promise<any> {
  const { data: saved, error } = await supabase
    .from(IntegrationConfig.calendarTables.main)
    .insert({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      content_date: data.publishDate,
      content_type: 'blog',
      title: data.episode.title,
      subtitle: data.episode.subtitle,
      content_body: data.contentBody,
      content_html: data.contentHtml,
      theme: data.seriesName,
      keywords: extractKeywords({ id: data.seriesId }, data.episode),
      status: 'draft',
      priority: getEpisodePriority(data.episode.number),
      source: 'killer_series',
      tone_and_manner: {
        type: 'professional_friendly',
        ratio: '80:20',
        trust_elements: KILLER_CONTENT_SERIES.strategy.trustBuilding
      },
      seo_meta: {
        title: data.episode.title,
        description: data.episode.subtitle || data.contentBody.substring(0, 160),
        keywords: extractKeywords({ id: data.seriesId }, data.episode).join(', ')
      },
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return saved;
}

/**
 * 발행일 계산
 */
function calculatePublishDate(episodeNumber: number, schedule: string): Date {
  const baseDate = new Date();
  let daysToAdd = 0;
  
  switch (schedule) {
    case 'weekly':
      daysToAdd = (episodeNumber - 1) * 7;
      break;
    case 'biweekly':
      daysToAdd = (episodeNumber - 1) * 14;
      break;
    case 'monthly':
      daysToAdd = (episodeNumber - 1) * 30;
      break;
    case 'bimonthly':
      daysToAdd = (episodeNumber - 1) * 60;
      break;
  }
  
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  return baseDate;
}

/**
 * 에피소드 우선순위
 */
function getEpisodePriority(episodeNumber: number): number {
  if (episodeNumber === 1) return 1; // 첫 에피소드 최우선
  if (episodeNumber === 5) return 2; // 마지막 에피소드 높은 우선순위
  return 3; // 나머지는 보통
}

/**
 * 리드 매그넷 생성
 */
async function createLeadMagnet(contentId: string, leadMagnet: any): Promise<void> {
  try {
    // PDF 생성 로직 (실제 구현에서는 PDF 생성 라이브러리 사용)
    const pdfUrl = await generatePDF(leadMagnet);
    
    // 리드 매그넷 레코드 저장
    await supabase
      .from('cc_lead_magnets')
      .insert({
        content_id: contentId,
        title: leadMagnet.title,
        description: leadMagnet.description,
        format: leadMagnet.format,
        value: leadMagnet.value,
        pages: leadMagnet.pages,
        download_url: pdfUrl,
        requires_email: leadMagnet.requiresEmail,
        requires_phone: leadMagnet.requiresPhone,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Lead magnet creation failed:', error);
  }
}

/**
 * PDF 생성 (임시 구현)
 */
async function generatePDF(leadMagnet: any): Promise<string> {
  // 실제 구현에서는 puppeteer나 jsPDF 등을 사용
  // 여기서는 임시 URL 반환
  return `/downloads/${leadMagnet.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
}

/**
 * 시리즈 활성화 로그
 */
async function logSeriesActivation(seriesId: string, contentCount: number): Promise<void> {
  // 로그 저장 (실제 구현에서는 별도 테이블)
  console.log(`Series activated: ${seriesId}, Contents created: ${contentCount}`);
}
