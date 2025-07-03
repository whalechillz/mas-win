import { sendSlackNotification } from '../../lib/slackNotify';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, email, message, call_times } = req.body;
    
    console.log('Contact received:', { name, phone, email, message, call_times });

    let dbSaved = false;
    let slackSent = false;
    let savedData = null;

    // 1. Supabase에 저장 시도
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name,
          phone,
          email: email || null,
          message: message || call_times || null
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
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
      const slackMessage = `📢 새로운 문의!
이름: ${name}
전화: ${phone}
${email ? `이메일: ${email}` : ''}
${message ? `메시지: ${message}` : ''}
${call_times ? `통화 가능 시간: ${call_times}` : ''}
DB 저장: ${dbSaved ? '✅ 성공' : '❌ 실패'}`;
      
      await sendSlackNotification(slackMessage);
      slackSent = true;
      console.log('Slack notification sent successfully');
    } catch (slackError) {
      console.error('Slack error:', slackError);
    }

    // 3. 결과 반환
    if (!dbSaved && !slackSent) {
      return res.status(500).json({
        success: false,
        message: '문의 처리 중 오류가 발생했습니다.',
        debug: {
          dbSaved: false,
          slackSent: false
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: dbSaved ? '문의가 접수되었습니다.' : '문의가 전달되었습니다. (DB 저장 실패)',
      data: savedData || { name, phone, email, message, call_times },
      status: {
        dbSaved,
        slackSent
      }
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
// Deploy time: Thu Jul  3 22:16:00 KST 2025