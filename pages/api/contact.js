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
    const { name, phone, call_times } = req.body;
    
    console.log('Contact received:', { name, phone, call_times });

    // 먼저 테이블이 존재하는지 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return res.status(200).json({ 
        success: false, 
        message: '테이블 접근 오류',
        error: tableError.message,
        hint: tableError.hint || 'RLS 정책을 확인하세요'
      });
    }

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
      console.error('Insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // RLS 에러인지 확인
      if (error.code === '42501') {
        return res.status(200).json({ 
          success: false, 
          message: 'RLS 정책으로 인한 저장 실패',
          error: 'Row Level Security 정책이 INSERT를 차단하고 있습니다.',
          solution: 'Supabase 대시보드에서 contacts 테이블의 RLS 정책을 확인하세요.'
        });
      }

      return res.status(200).json({ 
        success: false, 
        message: '문의 저장 실패',
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    console.log('Contact saved successfully:', data);

    return res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다.',
      data: data[0]
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      error: 'Failed to process contact',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}