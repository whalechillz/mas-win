import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== 삭제 권한 테스트 API 호출됨 ===');
    
    // 1. RLS 정책 확인
    console.log('RLS 정책 확인 중...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'bookings' })
      .catch(() => ({ data: null, error: 'RPC not available' }));
    
    console.log('RLS 정책 결과:', { policies, policiesError });

    // 2. bookings 테이블에서 첫 번째 레코드 가져오기
    console.log('테스트용 예약 데이터 조회 중...');
    const { data: testBooking, error: selectError } = await supabase
      .from('bookings')
      .select('id, name, phone')
      .limit(1)
      .single();

    console.log('테스트 예약 데이터:', { testBooking, selectError });

    if (!testBooking) {
      return res.status(200).json({
        success: false,
        message: '테스트할 예약 데이터가 없습니다.',
        data: {
          policies: policies,
          policiesError: policiesError?.message,
          selectError: selectError?.message
        }
      });
    }

    // 3. 삭제 시도
    console.log('삭제 테스트 시작...');
    const { data: deleteResult, error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', testBooking.id)
      .select();

    console.log('삭제 테스트 결과:', { deleteResult, deleteError });

    // 4. 삭제된 데이터 다시 삽입 (테스트용)
    if (!deleteError) {
      console.log('삭제된 데이터 복구 중...');
      const { data: restoreResult, error: restoreError } = await supabase
        .from('bookings')
        .insert({
          name: testBooking.name,
          phone: testBooking.phone,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          club: '테스트용'
        })
        .select()
        .single();

      console.log('데이터 복구 결과:', { restoreResult, restoreError });
    }

    return res.status(200).json({
      success: true,
      message: '삭제 권한 테스트 완료',
      data: {
        policies: policies,
        policiesError: policiesError?.message,
        testBooking: testBooking,
        selectError: selectError?.message,
        deleteResult: deleteResult,
        deleteError: deleteError?.message,
        deleteErrorCode: deleteError?.code,
        deleteErrorDetails: deleteError?.details
      }
    });

  } catch (error) {
    console.error('삭제 권한 테스트 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '테스트 중 오류 발생',
      error: error.message,
      stack: error.stack
    });
  }
} 