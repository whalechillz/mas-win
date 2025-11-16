// pages/api/kakao-content/auto-generate-today.js
// 오늘 날짜의 카카오톡 콘텐츠 자동 생성 API
// 슬랙에서 "다시" 명령 시 호출
// Supabase에서 직접 데이터를 읽어옵니다

import { sendSlackNotification, formatKakaoContentSlackMessage } from '../../../lib/slack-notification';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 인증 확인 (선택사항)
  const authHeader = req.headers.authorization;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (apiSecret && authHeader !== `Bearer ${apiSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 오늘 날짜
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`🔄 ${todayStr} 카카오톡 콘텐츠 자동 생성 시작...`);
    
    // 1. 생성 시작 알림
    try {
      await sendSlackNotification({
        username: '카카오톡 콘텐츠 알림봇',
        icon_emoji: ':kakao:',
        text: `🔄 *${todayStr} 카카오톡 콘텐츠 자동 생성 시작*`,
        attachments: [{
          color: '#FFA500',
          text: '이미지 생성 중입니다. 완료되면 알려드리겠습니다.\n예상 소요 시간: 1-2분',
          footer: '자동 생성 시스템',
          ts: Math.floor(Date.now() / 1000)
        }]
      });
    } catch (slackError) {
      console.error('생성 시작 알림 전송 실패 (계속 진행):', slackError);
    }
    
    // 2. 자동 생성 API 호출 (기존 자동 생성 로직 활용)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const results = {
      account1: { success: false, error: null },
      account2: { success: false, error: null }
    };
    
    // Account 1 자동 생성
    try {
      console.log('🔄 Account 1 자동 생성 시작...');
      const account1Response = await fetch(`${baseUrl}/api/kakao-content/auto-create-account1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiSecret ? `Bearer ${apiSecret}` : ''
        },
        body: JSON.stringify({ date: todayStr })
      });
      
      if (account1Response.ok) {
        results.account1.success = true;
        console.log('✅ Account 1 자동 생성 완료');
      } else {
        const errorData = await account1Response.json().catch(() => ({}));
        results.account1.error = errorData.error || `HTTP ${account1Response.status}`;
        console.error('❌ Account 1 자동 생성 실패:', results.account1.error);
      }
    } catch (error) {
      results.account1.error = error.message;
      console.error('❌ Account 1 자동 생성 에러:', error);
    }
    
    // Account 2 자동 생성
    try {
      console.log('🔄 Account 2 자동 생성 시작...');
      const account2Response = await fetch(`${baseUrl}/api/kakao-content/auto-create-account2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiSecret ? `Bearer ${apiSecret}` : ''
        },
        body: JSON.stringify({ date: todayStr })
      });
      
      if (account2Response.ok) {
        results.account2.success = true;
        console.log('✅ Account 2 자동 생성 완료');
      } else {
        const errorData = await account2Response.json().catch(() => ({}));
        results.account2.error = errorData.error || `HTTP ${account2Response.status}`;
        console.error('❌ Account 2 자동 생성 실패:', results.account2.error);
      }
    } catch (error) {
      results.account2.error = error.message;
      console.error('❌ Account 2 자동 생성 에러:', error);
    }
    
    // 3. 생성 완료 후 최종 알림 (생성된 콘텐츠 정보 포함)
    try {
      // Supabase에서 캘린더 데이터 로드 (생성된 콘텐츠 반영)
      const calendarResponse = await fetch(`${baseUrl}/api/kakao-content/calendar-load?month=${monthStr}`);
      
      if (calendarResponse.ok) {
        const { calendarData } = await calendarResponse.json();
        if (calendarData) {
          const account1Data = calendarData.profileContent?.account1?.dailySchedule?.find(d => d.date === todayStr);
          const account2Data = calendarData.profileContent?.account2?.dailySchedule?.find(d => d.date === todayStr);
          const feedData = calendarData.kakaoFeed?.dailySchedule?.find(d => d.date === todayStr);
        
          // 슬랙 메시지 생성 (생성된 콘텐츠 정보 포함)
          const slackMessage = await formatKakaoContentSlackMessage({
            date: todayStr,
            account1Data,
            account2Data,
            feedData,
            calendarData,
            includeNotCreated: true
          });
          
          // 완료 메시지 추가
          slackMessage.text = `✅ *${todayStr} 카카오톡 콘텐츠 생성 완료!*\n━━━━━━━━━━━━━━━━━━━\n\n` + slackMessage.text;
          
          // 생성 결과 요약 추가
          const summaryFields = [];
          if (results.account1.success) {
            summaryFields.push({
              title: '대표폰',
              value: '✅ 생성 완료',
              short: true
            });
          } else {
            summaryFields.push({
              title: '대표폰',
              value: `❌ 생성 실패: ${results.account1.error || '알 수 없는 오류'}`,
              short: true
            });
          }
          
          if (results.account2.success) {
            summaryFields.push({
              title: '업무폰',
              value: '✅ 생성 완료',
              short: true
            });
          } else {
            summaryFields.push({
              title: '업무폰',
              value: `❌ 생성 실패: ${results.account2.error || '알 수 없는 오류'}`,
              short: true
            });
          }
          
          slackMessage.attachments.unshift({
            color: (results.account1.success && results.account2.success) ? '#36a64f' : '#FFA500',
            title: '생성 결과 요약',
            fields: summaryFields,
            footer: '자동 생성 완료',
            ts: Math.floor(Date.now() / 1000)
          });
          
          await sendSlackNotification(slackMessage);
          console.log('✅ 생성 완료 알림 전송 완료');
        }
      }
    } catch (slackError) {
      console.error('생성 완료 알림 전송 실패:', slackError);
      // 알림 실패해도 API는 성공으로 응답
    }
    
    res.status(200).json({
      success: true,
      date: todayStr,
      results
    });
    
  } catch (error) {
    console.error('❌ 자동 생성 에러:', error);
    
    // 에러 알림
    try {
      await sendSlackNotification({
        username: '카카오톡 콘텐츠 알림봇',
        icon_emoji: ':kakao:',
        text: `❌ *카카오톡 콘텐츠 자동 생성 실패*`,
        attachments: [{
          color: '#FF0000',
          text: `에러: ${error.message}`,
          footer: '자동 생성 시스템',
          ts: Math.floor(Date.now() / 1000)
        }]
      });
    } catch (slackError) {
      console.error('에러 알림 전송 실패:', slackError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

