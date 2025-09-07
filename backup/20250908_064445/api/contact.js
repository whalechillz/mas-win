import { createClient } from '@supabase/supabase-js';
import { SLACK_API_URL } from '../../lib/api-config';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Contact API is working',
      method: 'Please use POST method to submit contact'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, call_times, notes } = req.body;
    
    console.log('Contact request:', { name, phone, call_times, notes });

    // 필수 필드 확인
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '이름과 연락처는 필수입니다.' 
      });
    }

    // 1. 고객 프로필 확인/생성
    let customerProfileId = null;
    
    // 기존 고객 프로필 찾기
    const { data: existingProfile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingProfile) {
      customerProfileId = existingProfile.id;
      
      // 고객 정보 업데이트
      await supabase
        .from('customer_profiles')
        .update({
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerProfileId);
    } else {
      // 새 고객 프로필 생성
      const { data: newProfile, error: profileError } = await supabase
        .from('customer_profiles')
        .insert({
          name: name,
          phone: phone
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('고객 프로필 생성 오류:', profileError);
        throw profileError;
      }
      
      customerProfileId = newProfile.id;
    }

    // 2. 문의하기 데이터 저장
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        customer_profile_id: customerProfileId,
        name: name,
        phone: phone,
        call_times: call_times || '시간무관',
        inquiry_type: 'general',
        notes: notes || '',
        status: 'new'
      })
      .select()
      .single();

    if (contactError) {
      console.error('문의하기 저장 오류:', contactError);
      throw contactError;
    }

    // 3. 슬랙 알림 전송
    try {
      const slackResponse = await fetch(SLACK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact',
          data: {
            name,
            phone,
            call_times: call_times || '시간무관',
            notes: notes || '',
            contact_id: contact.id
          }
        })
      });

      if (!slackResponse.ok) {
        console.error('슬랙 알림 전송 실패');
      }
    } catch (slackError) {
      console.error('슬랙 알림 에러:', slackError);
      // 슬랙 알림 실패해도 문의는 계속 처리
    }

    // 성공 응답 반환
    return res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다. 선택하신 시간에 연락드리겠습니다.',
      data: {
        contact_id: contact.id,
        customer_profile_id: customerProfileId,
        name,
        phone,
        call_times: call_times || '시간무관'
      }
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ 
      success: false,
      message: '문의 처리 중 오류가 발생했습니다. 전화로 문의해주세요.',
      error: error.message
    });
  }
}