// pages/api/generate-kakao-content.js
// 카카오톡 콘텐츠 AI 자동 생성 API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    date, 
    theme, 
    topic, 
    aiSettings = { 
      useAI: true, 
      model: 'claude-sonnet',
      style: 'friendly' 
    } 
  } = req.body;

  try {
    let content = '';
    
    if (aiSettings.useAI) {
      // AI API 호출 (예시)
      const prompt = `
        카카오톡 마케팅 메시지를 작성해주세요.
        
        날짜: ${date}
        테마: ${theme}
        주제: ${topic}
        톤앤매너: 친근하고 캐주얼한 어투
        길이: 200자 이내
        
        포함 요소:
        - 인사말
        - 핵심 메시지
        - 혜택/프로모션
        - CTA (Call to Action)
        - 이모티콘 활용
      `;

      // 실제 AI API 호출 부분 (환경에 따라 구현)
      if (aiSettings.model === 'claude-sonnet') {
        // Claude API 호출
        content = await generateWithClaude(prompt);
      } else if (aiSettings.model === 'gpt-3.5-turbo') {
        // OpenAI API 호출
        content = await generateWithOpenAI(prompt);
      } else {
        // 템플릿 기반 생성
        content = generateTemplate(theme, topic);
      }
    } else {
      // AI 미사용시 템플릿
      content = generateTemplate(theme, topic);
    }

    // Supabase에 저장
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const response = await fetch(`${supabaseUrl}/rest/v1/content_ideas`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        title: `[카카오톡] ${topic}`,
        content: content,
        platform: 'kakao',
        status: 'idea',
        assignee: req.body.assignee || 'CRM팀',
        scheduled_date: date,
        tags: '카카오톡,AI생성',
        ai_generated: true,
        ai_model: aiSettings.model
      })
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data: data,
      aiGenerated: aiSettings.useAI
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// 템플릿 기반 생성
function generateTemplate(theme, topic) {
  const templates = [
    `🎉 ${theme} 이벤트! 🎉\n\n${topic}로 여러분을 찾아갑니다!\n\n✨ 특별 혜택:\n• 신규 가입시 10% 할인\n• 구매 고객 사은품 증정\n\n지금 바로 확인하세요! 👉 [링크]`,
    
    `안녕하세요! 마스골프입니다 🏌️‍♂️\n\n${theme}를 맞아 준비한 ${topic}!\n\n🎁 이번 달 특별 프로모션\n• 전 상품 최대 30% 할인\n• 무료 배송 이벤트\n\n놓치지 마세요! 💝`,
    
    `⛳ 골프 시즌이 돌아왔습니다!\n\n${theme} 특별 기획전\n"${topic}"\n\n🏆 한정 수량 특가\n🚚 당일 배송 가능\n💳 무이자 할부 혜택\n\n[바로가기] 클릭! 📱`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Claude API 호출 (실제 구현 필요)
async function generateWithClaude(prompt) {
  // 실제 Claude API 연동 코드
  // const response = await fetch('https://api.anthropic.com/v1/complete', {
  //   method: 'POST',
  //   headers: {
  //     'X-API-Key': process.env.CLAUDE_API_KEY,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ prompt, max_tokens: 200 })
  // });
  
  // 임시 응답
  return `🌟 특별한 7월을 준비했습니다!\n\n무더운 여름, 시원한 할인으로 찾아뵙겠습니다 🏖️\n\n✅ 여름 필수템 최대 40% SALE\n✅ 3만원 이상 구매시 에코백 증정\n✅ 신규 회원 웰컴 쿠폰 5천원\n\n더 많은 혜택 확인하기 👉 [링크]\n\n#마스골프 #여름세일 #골프웨어`;
}

// OpenAI API 호출 (실제 구현 필요)
async function generateWithOpenAI(prompt) {
  // 실제 OpenAI API 연동 코드
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-3.5-turbo',
  //     messages: [{ role: 'user', content: prompt }],
  //     max_tokens: 200
  //   })
  // });
  
  // 임시 응답
  return `🏌️ 골프 매니아 여러분!\n\n이번 달 특별 이벤트 소식입니다 📢\n\n🎯 BEST 아이템 할인전\n• 드라이버: 30% OFF\n• 골프웨어: 최대 50% OFF\n• 골프백: 사은품 증정\n\n🎁 구매 금액별 추가 혜택도 준비했어요!\n\n자세히 보기 > [링크]`;
}