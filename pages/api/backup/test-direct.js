// pages/api/test-direct.js
// Fetch 없이 직접 테스트

export default async function handler(req, res) {
  try {
    // axios 사용 버전
    const axios = require('axios');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    // 직접 REST API 호출
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/content_ideas`,
      {
        title: `Axios 테스트 ${new Date().toISOString()}`,
        content: 'Fetch 없이 직접 테스트',
        platform: 'blog',
        status: 'idea',
        assignee: 'API',
        scheduled_date: '2025-07-15',
        tags: 'test'
      },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      data: response.data,
      message: 'Axios로 성공!'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
}