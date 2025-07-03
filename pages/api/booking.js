import { sendSlackNotification } from '../../lib/slackNotify';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club } = req.body;
    
    console.log('Booking request received:', { name, phone, date, time, club });

    // 필수 필드 확인
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      });
    }

    let dbSaved = false;
    let slackSent = false;
    let savedData = null;

    // 1. Supabase에 저장 시도
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name,
          phone,
          date,
          time,
          club: club || null,
          status: 'pending'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        // RLS 에러인 경우 더 자세한 정보 제공
        if (error.code === '42501') {
          console.error('RLS Policy Error - 테이블에 INSERT 권한이 없습니다.');
        }
      } else {
        dbSaved = true;
        savedData = data[0];
        console.log('Supabase save successful:', data);
      }
    } catch (dbError) {
      console.error('Supabase exception:', dbError);
    }

    // 2. Slack 알림 전송 시도
    try {
      const slackMessage = `🎯 새로운 시타 예약!
이름: ${name}
전화: ${phone}
날짜: ${date}
시간: ${time}
클럽: ${club || '미선택'}
DB 저장: ${dbSaved ? '✅ 성공' : '❌ 실패'}
${dbSaved && savedData ? `예약 ID: ${savedData.id}` : ''}`;
      
      await sendSlackNotification(slackMessage);
      slackSent = true;
      console.log('Slack notification sent successfully');
    } catch (slackError) {
      console.error('Slack error:', slackError);
    }

    // 3. 결과 반환
    if (!dbSaved && !slackSent) {
      // 둘 다 실패한 경우
      return res.status(500).json({
        success: false,
        message: '예약 처리 중 오류가 발생했습니다.',
        debug: {
          dbSaved: false,
          slackSent: false,
          hasSupabaseConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          hasSlackConfig: !!process.env.SLACK_WEBHOOK_URL
        }
      });
    }

    // 최소한 하나는 성공한 경우
    return res.status(200).json({ 
      success: true, 
      message: dbSaved ? '예약이 완료되었습니다.' : '예약이 접수되었습니다. (DB 저장 실패)',
      data: savedData || { name, phone, date, time, club },
      status: {
        dbSaved,
        slackSent
      }
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
// Deploy time: Thu Jul  3 22:16:00 KST 2025