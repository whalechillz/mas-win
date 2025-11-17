/**
 * 카카오 콘텐츠 Base Prompt 자동 생성 API
 * 요일별 템플릿을 기반으로 basePrompt를 자동 생성합니다.
 */

const { generateBasePrompt } = require('../../../lib/kakao-base-prompt-templates');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      date,           // YYYY-MM-DD 형식의 날짜
      accountType,    // 'account1' | 'account2'
      type,           // 'background' | 'profile' | 'feed'
      weeklyTheme     // 주차별 테마 (선택적)
    } = req.body;

    // 필수 파라미터 검증
    if (!date || !accountType || !type) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다 (date, accountType, type)' 
      });
    }

    // accountType 검증
    if (accountType !== 'account1' && accountType !== 'account2') {
      return res.status(400).json({ 
        success: false, 
        message: 'accountType은 account1 또는 account2여야 합니다' 
      });
    }

    // type 검증
    if (!['background', 'profile', 'feed'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'type은 background, profile, feed 중 하나여야 합니다' 
      });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD 형식 필요)' 
      });
    }

    // Base Prompt 생성
    const basePrompt = generateBasePrompt(date, accountType, type, weeklyTheme);

    // 요일 정보 계산 (디버깅용)
    const dateObj = new Date(date);
    const dayOfWeekIndex = dateObj.getDay();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayOfWeek = dayNames[dayOfWeekIndex];
    const dayOfMonth = dateObj.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    const templateIndex = (weekNumber - 1) % 3;

    console.log(`✅ Base Prompt 생성 성공:`, {
      date,
      accountType,
      type,
      dayOfWeek,
      weekNumber,
      templateIndex: templateIndex + 1,
      basePrompt
    });

    return res.status(200).json({
      success: true,
      basePrompt,
      metadata: {
        date,
        accountType,
        type,
        dayOfWeek,
        weekNumber,
        templateIndex: templateIndex + 1,
        weeklyTheme: weeklyTheme || null
      }
    });

  } catch (error) {
    console.error('❌ Base Prompt 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'Base Prompt 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
