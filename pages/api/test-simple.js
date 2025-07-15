// pages/api/test-simple.js
// 가장 간단한 테스트

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/content_ideas`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: `간단 테스트 ${new Date().toLocaleString('ko-KR')}`,
          content: '테스트 콘텐츠',
          platform: 'blog',
          status: 'idea',
          assignee: 'API',
          scheduled_date: '2025-07-15',
          tags: 'test'
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API 오류');
    }
    
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}