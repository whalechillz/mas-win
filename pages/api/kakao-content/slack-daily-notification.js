// pages/api/kakao-content/slack-daily-notification.js
// 매일 아침 9시 30분에 카카오톡 콘텐츠를 슬랙으로 전송하는 API
import fs from 'fs';
import path from 'path';
import { sendSlackNotification, formatKakaoContentSlackMessage } from '../../../lib/slack-notification';

export default async function handler(req, res) {
  // Vercel Cron Job에서 호출하는 경우 Authorization 헤더 확인
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  // CRON_SECRET이 설정되어 있으면 검증
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 오늘 날짜
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`📅 오늘 날짜: ${todayStr}, 월: ${monthStr}`);
    
    // 캘린더 JSON 파일 읽기
    const calendarPath = path.join(process.cwd(), 'docs', 'content-calendar', `${monthStr}.json`);
    
    if (!fs.existsSync(calendarPath)) {
      console.error(`❌ 캘린더 파일이 없습니다: ${calendarPath}`);
      return res.status(404).json({ 
        error: 'Calendar file not found',
        path: calendarPath 
      });
    }
    
    const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
    
    // 오늘 날짜의 콘텐츠 찾기
    const account1Data = calendarData.profileContent?.account1?.dailySchedule?.find(d => d.date === todayStr);
    const account2Data = calendarData.profileContent?.account2?.dailySchedule?.find(d => d.date === todayStr);
    const feedData = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === todayStr);
    
    // 슬랙 메시지 생성 (유틸리티 함수 사용, created: false도 포함)
    const slackMessage = formatKakaoContentSlackMessage({
      date: todayStr,
      account1Data,
      account2Data,
      feedData,
      calendarData,
      includeNotCreated: true // created: false인 항목도 포함
    });
    
    console.log('📤 슬랙 메시지 전송 시작...');
    console.log('메시지 내용:', JSON.stringify(slackMessage, null, 2));
    
    // 슬랙으로 전송
    await sendSlackNotification(slackMessage);
    
    console.log('✅ 슬랙 알림 전송 완료');
    
    res.status(200).json({ 
      success: true, 
      date: todayStr,
      accounts: {
        account1: !!account1Data?.created,
        account2: !!account2Data?.created
      },
      sent: true 
    });
    
  } catch (error) {
    console.error('❌ 슬랙 알림 에러:', error);
    res.status(500).json({ 
      error: 'Failed to send Slack notification', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

