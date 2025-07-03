import { supabase } from '../../lib/supabaseClient';
import { sendSlackNotification } from '../../lib/slackNotify';

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
    const { name, phone, call_times } = req.body;
    
    console.log('Contact received:', { name, phone, call_times });

    // 데이터 삽입 시도
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        name,
        phone,
        call_times,
        contacted: false
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(200).json({ 
        success: false, 
        message: 'DB 저장 실패',
        error: error.message
      });
    }

    console.log('Contact saved successfully:', data);

    // 슬랙 알림 전송 (실패해도 계속 진행)
    const slackMessage = `📢 새로운 문의!\n이름: ${name}\n전화: ${phone}\n통화 가능 시간: ${call_times}`;
    await sendSlackNotification(slackMessage);

    return res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다.',
      data: data[0]
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      error: 'Failed to process contact',
      message: error.message
    });
  }
}