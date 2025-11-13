// pages/api/kakao-content/slack-send-account.js
// 계정별 카카오톡 콘텐츠를 슬랙으로 전송하는 API
import fs from 'fs';
import path from 'path';
import { sendSlackNotification, formatKakaoContentSlackMessage } from '../../../lib/slack-notification';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { account, date } = req.body;

    if (!account || !date) {
      return res.status(400).json({ 
        error: 'account and date are required',
        details: '계정(account1 또는 account2)과 날짜(YYYY-MM-DD)를 제공해주세요.'
      });
    }

    if (account !== 'account1' && account !== 'account2') {
      return res.status(400).json({ 
        error: 'Invalid account',
        details: 'account는 account1 또는 account2여야 합니다.'
      });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: '날짜는 YYYY-MM-DD 형식이어야 합니다.'
      });
    }

    // 월 문자열 추출
    const monthStr = date.substring(0, 7); // YYYY-MM
    
    console.log(`📅 요청된 날짜: ${date}, 월: ${monthStr}, 계정: ${account}`);
    
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
    
    // 해당 날짜의 콘텐츠 찾기
    const accountData = calendarData.profileContent?.[account]?.dailySchedule?.find(d => d.date === date);
    const feedData = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === date);
    
    if (!accountData) {
      return res.status(404).json({ 
        error: 'Account data not found',
        details: `${date} 날짜의 ${account} 데이터를 찾을 수 없습니다.`
      });
    }

    if (!feedData) {
      return res.status(404).json({ 
        error: 'Feed data not found',
        details: `${date} 날짜의 피드 데이터를 찾을 수 없습니다.`
      });
    }

    // 계정별 피드 데이터 준비
    const accountFeedData = {
      account1: account === 'account1' ? feedData.account1 : null,
      account2: account === 'account2' ? feedData.account2 : null
    };

    // 슬랙 메시지 생성 (해당 계정만 포함)
    const slackMessage = formatKakaoContentSlackMessage({
      date: date,
      account1Data: account === 'account1' ? accountData : null,
      account2Data: account === 'account2' ? accountData : null,
      feedData: accountFeedData,
      calendarData,
      includeNotCreated: false // created: true인 항목만 전송
    });
    
    console.log('📤 슬랙 메시지 전송 시작...');
    console.log('메시지 내용:', JSON.stringify(slackMessage, null, 2));
    
    // 슬랙으로 전송
    await sendSlackNotification(slackMessage);
    
    console.log('✅ 슬랙 알림 전송 완료');
    
    res.status(200).json({ 
      success: true, 
      date: date,
      account: account,
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

