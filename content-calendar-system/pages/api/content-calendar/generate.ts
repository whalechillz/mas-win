// Content Generation API
// /pages/api/content-calendar/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { AIGenerationRequest, ApiResponse } from '@/types';
import AIContentGenerator from '@/lib/ai/content-generator';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { topic, contentType, keywords, tone, length, additionalContext } = req.body;

  if (!topic || !contentType) {
    return res.status(400).json({
      success: false,
      error: 'Topic and content type are required'
    });
  }

  try {
    // AI 생성기 인스턴스
    const generator = new AIContentGenerator({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      falApiKey: process.env.FAL_AI_KEY!
    });

    // 콘텐츠 생성 요청
    const request: AIGenerationRequest = {
      contentType,
      topic,
      keywords,
      tone,
      length: length || 1500,
      additionalContext
    };

    // AI 콘텐츠 생성
    const generatedContent = await generator.generateContent(request);

    // 브랜드 톤앤매너 적용
    const improvedContent = MassgooToneAndManner.applyToneAndManner(
      generatedContent.body,
      contentType,
      '시니어_타겟'
    );

    // 품질 평가
    const qualityScore = MassgooToneAndManner.evaluateToneScore(improvedContent);

    return res.status(200).json({
      success: true,
      data: {
        title: generatedContent.title,
        subtitle: generatedContent.excerpt,
        content: improvedContent,
        html: generatedContent.html,
        keywords: generatedContent.keywords,
        hashtags: generatedContent.hashtags,
        qualityScore: qualityScore.score,
        metadata: {
          ...generatedContent.metadata,
          qualityIssues: qualityScore.issues,
          suggestions: qualityScore.suggestions
        }
      }
    });

  } catch (error: any) {
    console.error('Content generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
