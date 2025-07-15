// pages/api/generate-multichannel-content-v2.js
// 개선된 버전 - 더 나은 에러 처리

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경 변수 체크
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || 
                      process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url) {
      throw new Error('SUPABASE_URL이 설정되지 않았습니다');
    }
    
    // Service Key가 없으면 Anon Key 사용 (임시)
    const key = serviceKey || anonKey;
    
    if (!key) {
      throw new Error('Supabase 키가 설정되지 않았습니다');
    }
    
    const supabase = createClient(url, key);
    
    const { year, month, selectedChannels = {} } = req.body;
    
    // 테스트용 단순 INSERT
    const testData = {
      title: `API 테스트 ${new Date().toISOString()}`,
      content: '테스트 콘텐츠',
      platform: 'blog',
      status: 'idea',
      assignee: 'API',
      scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
      tags: 'test,api'
    };
    
    const { data, error } = await supabase
      .from('content_ideas')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('Supabase 에러:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
        keyType: serviceKey ? 'service' : 'anon'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '테스트 성공!',
      data: data,
      keyType: serviceKey ? 'service' : 'anon',
      hasServiceKey: !!serviceKey
    });
    
  } catch (error) {
    console.error('API 에러:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}