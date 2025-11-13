/**
 * 카카오 콘텐츠 전용 이미지 프롬프트 생성 API
 * 블로그 프롬프트와 분리하여 카카오 전용 요구사항 반영
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      prompt,           // 기본 프롬프트
      accountType,      // 'account1' | 'account2'
      type,             // 'background' | 'profile' | 'feed'
      brandStrategy,
      weeklyTheme,
      date
    } = req.body;

    if (!prompt || !accountType || !type) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다 (prompt, accountType, type)' 
      });
    }

    // 계정별 한국 골퍼 명시 (배경 이미지일 때는 배경 중심, 사람은 최소화)
    const koreanGolferSpec = type === 'background'
      ? accountType === 'account1'
        ? 'Warm golden tone landscape. ABSOLUTELY MINIMIZE people in the scene. If people must appear, maximum 1-2 very small, distant silhouettes in the far background, barely visible. The golf course, store, or landscape is the ONLY main subject. Prefer scenes with NO people at all.'
        : 'Cool blue-gray tone modern setting. ABSOLUTELY MINIMIZE people in the scene. If people must appear, maximum 1-2 very small, distant silhouettes in the far background, barely visible. The store interior, fitting room, or modern space is the ONLY main subject. Prefer scenes with NO people at all.'
      : accountType === 'account1'
        ? 'Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair), warm golden tone, emotional atmosphere'
        : 'Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features), cool blue-gray tone, innovative atmosphere';

    // 타입별 설명
    const typeDescription = type === 'background' 
      ? 'Background image for KakaoTalk profile (wide landscape format, suitable for profile background). The BACKGROUND SCENE is the main subject (golf course, store, landscape), NOT the person. STRICTLY MINIMIZE people: maximum 1-2 very small, distant silhouettes in the far background, barely visible, or preferably NO people at all. The landscape, architecture, or setting itself must be the ONLY focus.'
      : type === 'profile' 
      ? 'Profile image for KakaoTalk (square format, portrait of golfer, suitable for profile picture). The golfer is the main subject.'
      : 'Feed image for KakaoTalk (square format, engaging golf scene for daily feed)';

    // MASSGOO 브랜드 포함 여부 결정
    const includeBrand = 
      // 배경 이미지: 매장 관련
      (type === 'background' && (prompt.includes('매장') || prompt.includes('store') || prompt.includes('MASSGOO'))) ||
      // 프로필 이미지: 모자 관련
      (type === 'profile' && (prompt.includes('모자') || prompt.includes('cap') || prompt.includes('hat'))) ||
      // 피드 이미지: 매장, 피팅, 모자 관련
      (type === 'feed' && (
        prompt.includes('매장') || 
        prompt.includes('store') || 
        prompt.includes('피팅') || 
        prompt.includes('fitting') ||
        prompt.includes('MASSGOO') ||
        prompt.includes('모자') ||
        prompt.includes('cap') ||
        prompt.includes('hat')
      ));
    
    const brandGuideline = includeBrand
      ? `**IMPORTANT - BRAND VISIBILITY:**
- For store/fitting room images: Include "MASSGOO" store sign, logo, or branding visible on the storefront, interior walls, displays, or fitting room areas
- For images with caps/hats: Include "MASSGOO" logo/embroidery on the cap or hat naturally
- For feed images: If the scene includes a store, fitting room, or golfer wearing a cap, include MASSGOO branding appropriately
- Brand name should be naturally integrated into the scene, not as an overlay
- Store signs should be realistic and part of the architecture
- Cap logos should be embroidered or printed on the fabric naturally
- Branding should be visible but not overwhelming the main subject
- Use "MASSGOO" (not "MASGOO") as the official brand name`
      : `**Style Guidelines:**
- No text overlays, no watermarks, no promotional text
- Clean composition without unnecessary textual content`;

    const systemPrompt = `You are an expert image prompt generator for KakaoTalk content.
Create a detailed, vivid English prompt for AI image generation.

**CRITICAL REQUIREMENTS (MUST FOLLOW):**
1. ${koreanGolferSpec}
2. ${type === 'background' ? 'The BACKGROUND/SCENE is the main subject. STRICTLY MINIMIZE people: maximum 1-2 very small, distant silhouettes in the far background (barely visible), or preferably NO people at all. Focus exclusively on the landscape, golf course, store, or setting itself. Do NOT include multiple people or groups of people.' : 'ABSOLUTELY NO Western/Caucasian people - ONLY Korean/Asian people'}
3. ${typeDescription}
4. Weekly theme: ${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}
5. Brand strategy: ${JSON.stringify(brandStrategy || {})}
6. Date context: ${date || 'today'}

${brandGuideline}

**General Style Guidelines:**
- Ultra-realistic, photorealistic, 8K resolution
- Professional commercial photography style
- Natural Korean golf course or setting
- Authentic Korean atmosphere
- Professional lighting and composition

**Image Format:**
- ${type === 'background' ? 'Wide landscape format (16:9 or similar)' : 'Square format (1:1)'}
- High quality, suitable for KakaoTalk

Generate a compelling visual prompt that includes ALL critical requirements above.`;

    // 프롬프트가 이미 상세한 영어 프롬프트인지 확인 (100자 이상이고 영어로 작성된 경우)
    const isDetailedEnglishPrompt = prompt.length > 100 && /^[a-zA-Z\s,.:;!?'"-]+$/.test(prompt.trim().substring(0, 50));
    
    // brandInstruction 생성 (includeBrand 재사용)
    const brandInstruction = includeBrand
      ? `\n6. **CRITICAL**: ${
          type === 'background' || type === 'feed'
            ? 'If the prompt mentions a store, fitting room, or retail space, include "MASSGOO" store sign, logo, or branding naturally visible on the storefront, interior walls, displays, or fitting room areas. The brand name should be part of the architecture, not an overlay. Use "MASSGOO" (not "MASGOO") as the official brand name.'
            : type === 'profile' || type === 'feed'
            ? 'If the prompt mentions a cap, hat, or golfer wearing headwear, include "MASSGOO" logo or embroidery on the cap/hat naturally. For feed images with stores or fitting rooms, also include MASSGOO branding in the background. Use "MASSGOO" (not "MASGOO") as the official brand name.'
            : 'Include "MASSGOO" branding naturally integrated into the scene where appropriate. Use "MASSGOO" (not "MASGOO") as the official brand name.'
        }`
      : '';
    
    let userPrompt;
    if (isDetailedEnglishPrompt) {
      // 이미 상세한 프롬프트면 약간만 보강
      userPrompt = `Existing detailed prompt: "${prompt}"

Enhance this prompt slightly to ensure:
1. All critical requirements are met (Korean golfer, account type, style)
2. NO Western/Caucasian people appear
3. Matches the weekly theme: ${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}
4. Optimized for ${type} image type${brandInstruction}

Return ONLY the enhanced prompt in English, keeping the original concept and style.`;
    } else {
      // 기본 프롬프트면 전체적으로 생성
      userPrompt = `Base prompt: "${prompt}"

Create an enhanced image generation prompt that:
1. Includes the base prompt concept
2. Adds all critical requirements (Korean golfer, account type, style)
3. Ensures NO Western/Caucasian people appear
4. Matches the weekly theme and brand strategy
5. Is optimized for ${type} image type${brandInstruction}

Return ONLY the enhanced prompt in English, ready for AI image generation.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const generatedPrompt = response.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      prompt: generatedPrompt,
      metadata: {
        accountType,
        type,
        weeklyTheme: weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결',
        date: date || new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('카카오 프롬프트 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프롬프트 생성 실패',
      error: error.message
    });
  }
}

