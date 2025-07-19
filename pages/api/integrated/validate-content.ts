import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// SEO 점수 계산 함수
function calculateSEOScore(content: string, title: string, keywords: string[]): number {
  let score = 0;
  
  // 제목 길이 (50-60자 최적)
  if (title.length >= 30 && title.length <= 60) score += 20;
  else if (title.length >= 20 && title.length <= 70) score += 10;
  
  // 콘텐츠 길이 (300자 이상)
  if (content.length >= 1000) score += 20;
  else if (content.length >= 500) score += 15;
  else if (content.length >= 300) score += 10;
  
  // 키워드 포함 여부
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();
  let keywordScore = 0;
  
  keywords.forEach(keyword => {
    if (titleLower.includes(keyword.toLowerCase())) keywordScore += 10;
    if (contentLower.includes(keyword.toLowerCase())) keywordScore += 5;
  });
  
  score += Math.min(keywordScore, 30); // 최대 30점
  
  // 구조화 (헤딩, 리스트 등)
  if (content.includes('##') || content.includes('<h2>')) score += 10;
  if (content.includes('- ') || content.includes('<li>')) score += 10;
  if (content.includes('[') && content.includes(']')) score += 10; // 링크
  
  return Math.min(score, 100);
}

// 가독성 점수 계산 함수
function calculateReadabilityScore(content: string): number {
  let score = 70; // 기본 점수
  
  // 문장 길이 체크
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
  
  if (avgSentenceLength <= 20) score += 15;
  else if (avgSentenceLength <= 25) score += 10;
  else score -= 10;
  
  // 단락 구분
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3) score += 15;
  
  return Math.min(Math.max(score, 0), 100);
}

// 브랜드 일관성 점수 계산 함수
function calculateBrandConsistencyScore(content: string, channel: string): number {
  let score = 60; // 기본 점수
  
  // 브랜드명 포함
  if (content.includes('마스골프') || content.includes('MAS Golf')) score += 20;
  
  // 채널별 톤 체크
  const channelTones = {
    blog: ['안내', '소개', '혜택'],
    kakao: ['😊', '✨', '안녕하세요'],
    sms: ['[마스골프]', '신청:', '문의:'],
    email: ['고객님', '안녕하세요', '감사합니다'],
    instagram: ['#', '🏌️', '✅']
  };
  
  const expectedTones = channelTones[channel] || [];
  let toneScore = 0;
  
  expectedTones.forEach(tone => {
    if (content.includes(tone)) toneScore += 10;
  });
  
  score += Math.min(toneScore, 20);
  
  return Math.min(score, 100);
}

// 채널 최적화 점수 계산 함수
function calculateChannelOptimizationScore(content: string, channel: string): number {
  let score = 50; // 기본 점수
  
  switch (channel) {
    case 'blog':
      if (content.length >= 500) score += 30;
      if (content.includes('##') || content.includes('<h2>')) score += 20;
      break;
      
    case 'kakao':
      if (content.length <= 1000 && content.length >= 100) score += 30;
      if (content.includes('😊') || content.includes('✨')) score += 20;
      break;
      
    case 'sms':
      if (content.length <= 90) score += 40;
      else if (content.length <= 200) score += 20;
      if (content.includes('[마스골프]')) score += 10;
      break;
      
    case 'email':
      if (content.includes('<h') || content.includes('##')) score += 20;
      if (content.includes('http') || content.includes('www')) score += 15;
      if (content.length >= 200) score += 15;
      break;
      
    case 'instagram':
      if (content.includes('#')) score += 25;
      if (content.length <= 2200) score += 25;
      break;
  }
  
  return Math.min(score, 100);
}

// AI 검증 제안사항 생성
function generateSuggestions(
  seoScore: number,
  readabilityScore: number,
  brandScore: number,
  channelScore: number,
  content: string,
  channel: string
): string[] {
  const suggestions = [];
  
  if (seoScore < 70) {
    suggestions.push('SEO 개선: 키워드를 제목과 본문에 더 많이 포함시키세요.');
    if (content.length < 300) {
      suggestions.push('콘텐츠 길이를 300자 이상으로 늘려주세요.');
    }
  }
  
  if (readabilityScore < 70) {
    suggestions.push('가독성 개선: 문장을 더 짧고 명확하게 작성하세요.');
    suggestions.push('단락을 나누어 읽기 쉽게 구성하세요.');
  }
  
  if (brandScore < 70) {
    suggestions.push('브랜드 일관성: "마스골프" 브랜드명을 포함시키세요.');
  }
  
  if (channelScore < 70) {
    switch (channel) {
      case 'blog':
        suggestions.push('블로그 최적화: 소제목(H2, H3)을 추가하여 구조를 개선하세요.');
        break;
      case 'kakao':
        suggestions.push('카카오톡 최적화: 이모티콘을 활용하여 친근감을 높이세요.');
        break;
      case 'sms':
        suggestions.push('SMS 최적화: 90자 이내로 핵심 메시지만 전달하세요.');
        break;
      case 'email':
        suggestions.push('이메일 최적화: CTA 버튼이나 링크를 명확히 포함시키세요.');
        break;
      case 'instagram':
        suggestions.push('인스타그램 최적화: 관련 해시태그를 5-10개 추가하세요.');
        break;
    }
  }
  
  return suggestions;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, body } = req;

  try {
    switch (method) {
      case 'POST':
        const { content_id, keywords = [] } = body;

        if (!content_id) {
          return res.status(400).json({ error: 'content_id는 필수입니다.' });
        }

        // 콘텐츠 조회
        const { data: content, error: contentError } = await supabase
          .from('generated_contents')
          .select(`
            *,
            monthly_funnel_plans (
              monthly_themes (
                focus_keywords
              )
            )
          `)
          .eq('id', content_id)
          .single();

        if (contentError) throw contentError;

        // 키워드 결정 (전달받은 키워드 또는 테마 키워드 사용)
        const finalKeywords = keywords.length > 0 
          ? keywords 
          : content.monthly_funnel_plans?.monthly_themes?.focus_keywords || [];

        // 각 점수 계산
        const seoScore = calculateSEOScore(
          content.content,
          content.title || '',
          finalKeywords
        );
        
        const readabilityScore = calculateReadabilityScore(content.content);
        const brandConsistencyScore = calculateBrandConsistencyScore(
          content.content,
          content.channel
        );
        const channelOptimizationScore = calculateChannelOptimizationScore(
          content.content,
          content.channel
        );

        // 제안사항 생성
        const suggestions = generateSuggestions(
          seoScore,
          readabilityScore,
          brandConsistencyScore,
          channelOptimizationScore,
          content.content,
          content.channel
        );

        // 검증 점수 업데이트
        const validationScore = {
          seoScore,
          readability: readabilityScore,
          brandConsistency: brandConsistencyScore,
          channelOptimization: channelOptimizationScore,
          suggestions
        };

        const { data: updatedContent, error: updateError } = await supabase
          .from('generated_contents')
          .update({
            validation_score: validationScore
          })
          .eq('id', content_id)
          .select()
          .single();

        if (updateError) throw updateError;

        // 검증 로그 저장
        await supabase
          .from('content_generation_logs')
          .insert({
            funnel_plan_id: content.funnel_plan_id,
            request_type: 'validate',
            request_data: {
              content_id,
              keywords: finalKeywords
            },
            response_data: validationScore,
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        return res.status(200).json({ 
          data: {
            content_id,
            validation_score: validationScore,
            overall_score: Math.round(
              (seoScore + readabilityScore + brandConsistencyScore + channelOptimizationScore) / 4
            )
          }
        });

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Validate Content API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
