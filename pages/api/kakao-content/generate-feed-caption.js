/**
 * 피드 캡션 자동 생성 API
 * 이미지 카테고리와 계정 타입에 따라 일관된 톤의 피드 캡션 생성
 * 다양성 개선: 날짜 기반 변형, 주간 테마 반영, 최근 이력 중복 체크
 */

import OpenAI from 'openai';
import { createServerSupabase } from '../../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 카테고리별 기본 템플릿 (fallback)
const CAPTION_TEMPLATES = {
  account1: {
    '시니어 골퍼의 스윙': '시니어 골퍼도 비거리 20m 증가 가능',
    '피팅 상담의 모습': '맞춤 피팅으로 비거리를 늘려보세요',
    '매장의 모습': '당신만의 드라이버를 찾아보세요',
    '젊은 골퍼의 스윙': '비거리 향상의 시작',
    '제품 컷': '최적의 드라이버를 만나보세요',
    '감성 컷': '스윙과 마음의 연결',
  },
  account2: {
    '시니어 골퍼의 스윙': '나이에 상관없이 비거리 향상이 가능합니다',
    '피팅 상담의 모습': '당신만의 드라이버를 찾는 여정을 시작하세요',
    '매장의 모습': '혁신적인 기술로 비거리를 늘려보세요',
    '젊은 골퍼의 스윙': '완벽한 스윙을 위한 첫걸음',
    '제품 컷': '정밀한 기술이 만드는 비거리',
    '감성 컷': '데이터로 완성하는 스윙',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { imageCategory, accountType, weeklyTheme, date, existingCaption } = req.body;

    if (!imageCategory || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'imageCategory와 accountType은 필수입니다.'
      });
    }

    // 기존 캡션이 있고 비어있지 않으면 그대로 반환
    if (existingCaption && existingCaption.trim().length > 0) {
      return res.status(200).json({
        success: true,
        caption: existingCaption.trim()
      });
    }

    // 템플릿에서 기본 캡션 가져오기
    const templateKey = accountType === 'account1' ? 'account1' : 'account2';
    const defaultCaption = CAPTION_TEMPLATES[templateKey][imageCategory] || 
                          CAPTION_TEMPLATES[templateKey]['시니어 골퍼의 스윙'];

    // 최근 7일간 생성된 캡션 가져오기 (중복 체크용)
    let recentCaptions = [];
    if (date) {
      try {
        const supabase = createServerSupabase();
        const dateObj = new Date(date);
        const sevenDaysAgo = new Date(dateObj);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data: recentFeeds } = await supabase
          .from('kakao_feed_content')
          .select('caption, date')
          .eq('account', accountType)
          .gte('date', sevenDaysAgoStr)
          .lt('date', date)
          .not('caption', 'is', null)
          .order('date', { ascending: false })
          .limit(10);

        if (recentFeeds) {
          recentCaptions = recentFeeds
            .map(f => f.caption)
            .filter(c => c && c.trim().length > 0);
        }
      } catch (dbError) {
        console.warn('최근 캡션 조회 실패 (무시하고 진행):', dbError.message);
      }
    }

    // 날짜 기반 변형 힌트 생성
    const dateVariationHint = getDateVariationHint(date, imageCategory);

    // AI로 캡션 생성 (기존 패턴 유지하면서 약간의 변형)
    try {
      const systemPrompt = `당신은 카카오톡 피드 캡션 전문 작가입니다.

**브랜드 정보:**
- 골프 드라이버 맞춤 피팅 전문점
- 비거리 향상에 특화된 서비스
- 시니어 골퍼와 젊은 골퍼 모두를 위한 솔루션

**작성 원칙:**
1. 간결하고 명확한 메시지 (20자 이내 권장)
2. 브랜드명을 직접 언급하지 않음 (간접적 표현)
3. 고객의 이익과 가치에 집중
4. 긍정적이고 동기부여가 되는 톤
5. 기존 캡션 패턴과 유사한 스타일 유지

**계정별 톤:**
- Account1 (시니어): 따뜻하고 감성적인 표현, 경험과 신뢰 강조
- Account2 (테크): 혁신적이고 기술적인 표현, 데이터와 정밀함 강조`;

      const userPrompt = `다음 정보를 바탕으로 카카오톡 피드 캡션을 생성해주세요:

- 이미지 카테고리: ${imageCategory}
- 계정 타입: ${accountType === 'account1' ? '시니어 중심 (따뜻한 톤)' : '테크 중심 (혁신적 톤)'}
- 주간 테마: ${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}
- 날짜: ${date || '오늘'}
${dateVariationHint ? `- 날짜 변형 힌트: ${dateVariationHint}` : ''}

**기존 캡션 패턴 참고:**
${accountType === 'account1' 
  ? '- "시니어 골퍼도 비거리 20m 증가 가능"\n- "맞춤 피팅으로 비거리를 늘려보세요"\n- "비거리 향상의 시작"\n- "당신만의 드라이버를 찾아보세요"'
  : '- "완벽한 스윙을 위한 첫걸음"\n- "당신만의 드라이버를 찾는 여정을 시작하세요"\n- "나이에 상관없이 비거리 향상이 가능합니다"\n- "데이터로 스윙을 시각화하다"'
}

${recentCaptions.length > 0 ? `**최근 사용된 캡션 (다르게 작성해야 함):**\n${recentCaptions.slice(0, 5).map(c => `- "${c}"`).join('\n')}\n\n**중요:** 위 캡션들과 유사하거나 동일한 표현을 사용하지 마세요. 완전히 새로운 표현으로 작성해주세요.` : ''}

**요구사항:**
1. 위 패턴과 유사한 스타일로 작성하되, 최근 사용된 캡션과는 다르게
2. 브랜드명(MASSGOO, MASGOO 등)을 직접 언급하지 않음
3. 15-25자 내외의 간결한 메시지
4. 고객의 이익과 가치에 집중
5. 주간 테마 "${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}"를 자연스럽게 반영
6. 날짜에 맞는 적절한 표현 사용${dateVariationHint ? ` (${dateVariationHint})` : ''}
7. 기존 패턴과 자연스럽게 연결되되, 독창적인 표현 사용

캡션만 반환해주세요 (설명 없이).`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8, // 다양성 향상을 위해 0.7 → 0.8로 증가
        max_tokens: 100,
      });

      let generatedCaption = response.choices[0].message.content.trim();
      
      // 브랜드명 제거 (혹시 포함된 경우)
      let cleanedCaption = generatedCaption
        .replace(/MASSGOO|MASGOO|마쓰구/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // 최근 캡션과 중복 체크 (유사도 80% 이상이면 재생성)
      let isDuplicate = false;
      if (recentCaptions.length > 0 && cleanedCaption.length > 0) {
        isDuplicate = recentCaptions.some(recent => {
          const similarity = calculateSimilarity(cleanedCaption, recent);
          return similarity > 0.8;
        });
      }

      // 중복이면 한 번 더 재생성 시도
      if (isDuplicate) {
        console.log(`⚠️ 캡션 중복 감지, 재생성 시도: "${cleanedCaption}"`);
        try {
          const retryResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt + '\n\n**중요:** 이전 생성 결과와 완전히 다른 표현을 사용해주세요. 동일하거나 유사한 표현을 절대 사용하지 마세요.'
              }
            ],
            temperature: 0.9, // 재생성 시 더 높은 다양성
            max_tokens: 100,
          });
          
          generatedCaption = retryResponse.choices[0].message.content.trim();
          cleanedCaption = generatedCaption
            .replace(/MASSGOO|MASGOO|마쓰구/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        } catch (retryError) {
          console.warn('재생성 실패, 원본 사용:', retryError.message);
        }
      }

      // 빈 문자열이면 템플릿 사용
      const finalCaption = cleanedCaption.length > 0 ? cleanedCaption : defaultCaption;

      return res.status(200).json({
        success: true,
        caption: finalCaption
      });

    } catch (aiError) {
      console.error('AI 캡션 생성 실패, 템플릿 사용:', aiError.message);
      // AI 실패 시 템플릿 사용
      return res.status(200).json({
        success: true,
        caption: defaultCaption
      });
    }

  } catch (error) {
    console.error('피드 캡션 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '피드 캡션 생성 실패'
    });
  }
}

// 날짜 기반 변형 힌트 생성
function getDateVariationHint(date, imageCategory) {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0=일요일, 6=토요일
    const dayOfMonth = dateObj.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const hints = [];
    
    // 요일별 힌트
    if (isWeekend) {
      hints.push('주말 느낌의 여유롭고 편안한 표현');
    } else {
      hints.push('평일 느낌의 활기찬 표현');
    }
    
    // 날짜별 힌트 (월 초/중/말)
    if (dayOfMonth <= 10) {
      hints.push('월 초의 새로운 시작 느낌');
    } else if (dayOfMonth <= 20) {
      hints.push('월 중반의 안정적인 표현');
    } else {
      hints.push('월 말의 마무리 느낌');
    }
    
    return hints.join(', ');
  } catch (e) {
    return null;
  }
}

// 문자열 유사도 계산 (간단한 Levenshtein 기반)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // 완전히 동일한 단어가 포함되어 있으면 높은 유사도
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const wordSimilarity = (commonWords.length * 2) / (words1.length + words2.length);
  
  // 부분 문자열 포함 체크
  const containsSimilarity = s1.includes(s2) || s2.includes(s1) ? 0.7 : 0;
  
  return Math.max(wordSimilarity, containsSimilarity);
}

