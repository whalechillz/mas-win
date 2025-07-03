import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Testing Supabase connection...');
    
    // 1. 테이블 존재 여부 확인
    const { data: bookingsCheck, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(0);

    if (bookingsError) {
      console.error('Bookings table error:', bookingsError);
      
      if (bookingsError.code === '42P01') {
        return res.status(200).json({ 
          success: false,
          message: 'bookings 테이블이 존재하지 않습니다',
          error: bookingsError.message,
          solution: 'Supabase SQL Editor에서 create-tables-no-rls.sql 실행 필요'
        });
      }
      
      if (bookingsError.code === '42501') {
        return res.status(200).json({ 
          success: false,
          message: 'RLS 정책으로 인해 접근 거부',
          error: bookingsError.message,
          solution: 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY; 실행 필요'
        });
      }
      
      return res.status(200).json({ 
        success: false,
        message: 'bookings 테이블 접근 실패',
        error: bookingsError.message,
        code: bookingsError.code,
        details: bookingsError.details
      });
    }

    // 2. 데이터 조회 테스트
    const { data: bookings, error: selectError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (selectError) {
      console.error('Select error:', selectError);
      return res.status(200).json({ 
        success: false,
        message: 'SELECT 실패',
        error: selectError.message,
        code: selectError.code
      });
    }

    // 3. INSERT 테스트
    const testData = {
      name: '테스트-' + new Date().getTime(),
      phone: '010-0000-0000',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      club: '테스트클럽',
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('bookings')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(200).json({ 
        success: false,
        message: 'INSERT 실패 (SELECT는 성공)',
        error: insertError.message,
        code: insertError.code,
        existingData: bookings
      });
    }

    // 4. 모든 테스트 성공
    return res.status(200).json({ 
      success: true,
      message: '✅ DB 연결 및 모든 작업 성공!',
      tests: {
        tableAccess: '✅ 테이블 접근 가능',
        selectOperation: '✅ SELECT 성공',
        insertOperation: '✅ INSERT 성공'
      },
      insertedData: insertData,
      existingBookings: bookings,
      totalCount: bookings.length
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}