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
    console.log('테스트 API 호출됨');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);

    // 1. customer_profiles 테이블 존재 확인
    console.log('customer_profiles 테이블 확인 중...');
    const { data: profiles, error: profilesError } = await supabase
      .from('customer_profiles')
      .select('count')
      .limit(1);

    console.log('customer_profiles 결과:', { profiles, profilesError });

    // 2. bookings 테이블 존재 확인
    console.log('bookings 테이블 확인 중...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1);

    console.log('bookings 결과:', { bookings, bookingsError });

    // 3. 간단한 테스트 데이터 삽입
    console.log('테스트 데이터 삽입 시도...');
    const { data: testProfile, error: testProfileError } = await supabase
      .from('customer_profiles')
      .insert({
        phone: '010-0000-0000',
        name: '테스트 사용자'
      })
      .select()
      .single();

    console.log('테스트 프로필 생성 결과:', { testProfile, testProfileError });

    return res.status(200).json({
      success: true,
      message: '테스트 완료',
      data: {
        profilesTable: !profilesError,
        bookingsTable: !bookingsError,
        testProfileCreated: !testProfileError,
        errors: {
          profilesError: profilesError?.message,
          bookingsError: bookingsError?.message,
          testProfileError: testProfileError?.message
        }
      }
    });

  } catch (error) {
    console.error('테스트 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '테스트 중 오류 발생',
      error: error.message
    });
  }
} 