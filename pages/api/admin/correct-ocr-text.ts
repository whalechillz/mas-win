/**
 * OCR 텍스트 교정 API (OpenAI GPT-4)
 * OCR로 추출된 텍스트의 오타를 수정하고 문맥에 맞게 교정
 */

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ocrText, documentType, originalFilename } = req.body;

    if (!ocrText || typeof ocrText !== 'string') {
      return res.status(400).json({ 
        error: 'OCR 텍스트가 필요합니다.',
        details: 'ocrText 파라미터가 필요합니다.'
      });
    }

    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [OCR 교정] OpenAI API 키가 설정되지 않았습니다');
      return res.status(500).json({ 
        error: 'OpenAI API 키가 설정되지 않았습니다.',
        details: 'OPENAI_API_KEY 환경 변수를 확인하세요.'
      });
    }

    console.log('🤖 [OCR 교정] GPT-4 교정 시작:', {
      textLength: ocrText.length,
      documentType: documentType || '일반',
      originalFilename: originalFilename || 'N/A',
      timestamp: new Date().toISOString()
    });

    // 문서 타입에 따른 프롬프트 커스터마이징
    const documentTypePrompt = documentType === 'order_spec' || documentType === '주문사양서'
      ? '이 텍스트는 골프 클럽 주문 사양서입니다. 제품명, 사양, 수량, 가격 등의 정보를 정확하게 보존해주세요.'
      : documentType === 'survey' || documentType === '설문조사'
      ? '이 텍스트는 고객 설문조사입니다. 고객의 응답 내용을 정확하게 보존해주세요.'
      : '이 텍스트는 일반 문서입니다. 원본의 의미와 구조를 최대한 보존해주세요.';

    const systemPrompt = `당신은 한국어 문서 교정 전문가입니다. 
OCR로 추출된 텍스트의 오타를 수정하고, 문맥에 맞게 교정하되 원본의 의미와 구조는 최대한 보존합니다.
특히 다음 사항을 주의하세요:
- 숫자, 날짜, 이름, 전문 용어는 정확하게 보존
- 원본의 단락 구조와 줄바꿈 유지
- 문맥상 명확한 오타만 수정
- 불확실한 부분은 원본 그대로 유지
- 표나 목록 구조가 있다면 보존`;

    const userPrompt = `${documentTypePrompt}

다음은 OCR로 추출된 텍스트입니다. 오타를 수정하고 문맥에 맞게 교정해주세요.

OCR 텍스트:
${ocrText}

교정된 텍스트:`;

    console.log('📤 [OCR 교정] GPT-4 API 요청:', {
      model: 'gpt-4',
      inputTokens: Math.ceil(userPrompt.length / 4), // 대략적인 토큰 수
      temperature: 0.3
    });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // 일관성 있는 결과를 위해 낮은 temperature
        max_tokens: Math.min(4000, Math.ceil(ocrText.length * 1.5)) // 원본보다 약간 더 긴 텍스트 허용
      });

      console.log('📥 [OCR 교정] GPT-4 API 응답 수신:', {
        status: 'success',
        usage: completion.usage,
        responseLength: completion.choices[0]?.message?.content?.length || 0
      });
    } catch (openaiError: any) {
      console.error('❌ [OCR 교정] OpenAI API 오류:', {
        error: openaiError.message,
        status: openaiError.status,
        code: openaiError.code,
        type: openaiError.type
      });

      if (openaiError.status === 401) {
        return res.status(401).json({
          error: 'OpenAI API 인증 실패',
          details: 'OPENAI_API_KEY가 잘못되었거나 만료되었습니다.',
          suggestion: 'OpenAI 대시보드에서 API 키를 확인하세요.'
        });
      }

      if (openaiError.status === 429) {
        return res.status(429).json({
          error: 'OpenAI API 요청 한도 초과',
          details: 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도하세요.',
          suggestion: 'OpenAI 대시보드에서 사용량을 확인하세요.'
        });
      }

      return res.status(500).json({
        error: 'OpenAI API 호출 실패',
        details: openaiError.message
      });
    }

    const correctedText = completion.choices[0]?.message?.content || '';
    
    if (!correctedText) {
      console.error('❌ [OCR 교정] 교정된 텍스트가 비어있습니다');
      return res.status(500).json({
        error: '교정된 텍스트를 받지 못했습니다.',
        details: 'OpenAI API 응답이 비어있습니다.'
      });
    }

    // 사용량 정보
    const usage = completion.usage || {};
    const estimatedCost = {
      input: (usage.prompt_tokens || 0) * 0.03 / 1000, // $0.03 per 1K tokens
      output: (usage.completion_tokens || 0) * 0.06 / 1000, // $0.06 per 1K tokens
      total: 0
    };
    estimatedCost.total = estimatedCost.input + estimatedCost.output;

    console.log('✅ [OCR 교정] 교정 완료:', {
      originalLength: ocrText.length,
      correctedLength: correctedText.length,
      tokensUsed: usage.total_tokens || 0,
      estimatedCost: `$${estimatedCost.total.toFixed(4)}`
    });

    return res.status(200).json({
      success: true,
      correctedText,
      originalText: ocrText,
      changes: {
        originalLength: ocrText.length,
        correctedLength: correctedText.length,
        lengthDifference: correctedText.length - ocrText.length
      },
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        estimatedCost: estimatedCost.total
      },
      confidence: 0.95 // GPT-4 교정 신뢰도
    });

  } catch (error: any) {
    console.error('❌ [OCR 교정] 예외 발생:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'OCR 텍스트 교정 실패',
      details: error.message
    });
  }
}
