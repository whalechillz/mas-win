import { supabase } from '../../lib/supabaseClient';
import { sendSlackNotification } from '../../lib/slackNotify';

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

    // 데이터 삽입 시도
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        name,
        phone,
        date,
        time,
        club: club || '',
        status: 'pending'
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      
      // 테이블이 없는 경우
      if (error.code === '42P01') {
        return res.status(500).json({ 
          success: false, 
          message: 'bookings 테이블이 존재하지 않습니다. 데이터베이스를 확인해주세요.',
          error: error.message
        });
      }
      
      // RLS 정책 문제
      if (error.code === '42501') {
        return res.status(500).json({ 
          success: false, 
          message: 'RLS 정책으로 인해 접근이 거부되었습니다.',
          error: error.message,
          hint: 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY; 실행 필요'
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'DB 저장 실패',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    console.log('Booking saved successfully:', data);

    // 슬랙 알림 전송 (실패해도 계속 진행)
    const slackMessage = `🎯 새로운 시타 예약!\n이름: ${name}\n전화: ${phone}\n날짜: ${date}\n시간: ${time}\n클럽: ${club || '미선택'}`;
    await sendSlackNotification(slackMessage);

    return res.status(200).json({ 
      success: true, 
      message: '예약이 완료되었습니다.',
      data: data && data[0] ? data[0] : null
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