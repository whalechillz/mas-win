import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 설문 조사 종료 여부 확인 API
 * GET /api/survey/status
 * 
 * 환경 변수에서 종료 날짜 확인:
 * - SURVEY_END_DATE: 종료 날짜 (YYYY-MM-DD 형식)
 * - SURVEY_END_TIME: 종료 시간 (HH:mm:ss 형식, 선택사항, 기본값: 23:59:59)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const endDate = process.env.SURVEY_END_DATE;
    const endTime = process.env.SURVEY_END_TIME || '23:59:59';

    // 종료 날짜가 설정되지 않은 경우 활성 상태로 간주
    if (!endDate) {
      return res.status(200).json({
        success: true,
        isActive: true,
        message: '설문이 진행 중입니다.',
      });
    }

    // 종료 날짜/시간 파싱
    const endDateTime = new Date(`${endDate}T${endTime}+09:00`); // 한국 시간대 (UTC+9)
    const now = new Date();

    // 한국 시간대 기준 현재 시간 계산
    const koreaTimeOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const koreaNow = new Date(utcTime + koreaTimeOffset);

    const isActive = koreaNow < endDateTime;

    return res.status(200).json({
      success: true,
      isActive,
      endDate: endDate,
      endTime: endTime,
      message: isActive 
        ? '설문이 진행 중입니다.' 
        : '설문이 종료되었습니다. 다음 설문에 또 뵙겠습니다.',
    });
  } catch (error: any) {
    console.error('설문 상태 확인 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}
