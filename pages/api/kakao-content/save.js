/**
 * 카카오톡 콘텐츠 저장 API
 * 프로필 및 피드 콘텐츠를 DB에 저장
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { date, account, type, data } = req.body;

    if (!date || !account || !type || !data) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다' 
      });
    }

    // 테이블명 결정
    const tableName = type === 'profile' 
      ? 'kakao_profile_content' 
      : 'kakao_feed_content';

    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from(tableName)
      .select('id')
      .eq('date', date)
      .eq('account', account)
      .single();

    let result;
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 생성
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          date,
          account,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json({
      success: true,
      message: '저장 완료',
      data: result
    });

  } catch (error) {
    console.error('카카오톡 콘텐츠 저장 오류:', error);
    return res.status(500).json({
      success: false,
      message: '저장 실패',
      error: error.message
    });
  }
}


