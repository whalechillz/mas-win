import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('📊 블로그 분석 API 요청:', req.method, req.url);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ error: '서버 설정 오류' });
  }

  try {
    const { period = '7d', blog_slug } = req.query;
    
    // 기간 계산
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    console.log(`📅 분석 기간: ${startDate.toISOString()} ~ ${now.toISOString()}`);

    // 1. 총 조회수
    let totalViewsQuery = supabase
      .from('blog_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (blog_slug) {
      totalViewsQuery = totalViewsQuery.eq('blog_slug', blog_slug);
    }

    const { count: totalViews, error: viewsError } = await totalViewsQuery;

    if (viewsError) {
      console.error('❌ 총 조회수 조회 에러:', viewsError);
      return res.status(500).json({ error: '총 조회수 조회에 실패했습니다.' });
    }

    // 2. 트래픽 소스별
    let trafficQuery = supabase
      .from('blog_analytics')
      .select('traffic_source')
      .gte('created_at', startDate.toISOString());

    if (blog_slug) {
      trafficQuery = trafficQuery.eq('blog_slug', blog_slug);
    }

    const { data: trafficData, error: trafficError } = await trafficQuery;

    if (trafficError) {
      console.error('❌ 트래픽 소스 조회 에러:', trafficError);
      return res.status(500).json({ error: '트래픽 소스 조회에 실패했습니다.' });
    }

    // 3. 검색어별
    let searchQuery = supabase
      .from('blog_analytics')
      .select('search_keyword')
      .not('search_keyword', 'is', null)
      .neq('search_keyword', 'none')
      .gte('created_at', startDate.toISOString());

    if (blog_slug) {
      searchQuery = searchQuery.eq('blog_slug', blog_slug);
    }

    const { data: searchData, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('❌ 검색어 조회 에러:', searchError);
      return res.status(500).json({ error: '검색어 조회에 실패했습니다.' });
    }

    // 4. UTM 캠페인별
    let utmQuery = supabase
      .from('blog_analytics')
      .select('utm_campaign')
      .not('utm_campaign', 'is', null)
      .neq('utm_campaign', 'none')
      .gte('created_at', startDate.toISOString());

    if (blog_slug) {
      utmQuery = utmQuery.eq('blog_slug', blog_slug);
    }

    const { data: utmData, error: utmError } = await utmQuery;

    if (utmError) {
      console.error('❌ UTM 캠페인 조회 에러:', utmError);
      return res.status(500).json({ error: 'UTM 캠페인 조회에 실패했습니다.' });
    }

    // 5. 블로그별 조회수
    let blogQuery = supabase
      .from('blog_analytics')
      .select('blog_title, blog_slug, blog_category')
      .gte('created_at', startDate.toISOString());

    if (blog_slug) {
      blogQuery = blogQuery.eq('blog_slug', blog_slug);
    }

    const { data: blogData, error: blogError } = await blogQuery;

    if (blogError) {
      console.error('❌ 블로그별 조회수 조회 에러:', blogError);
      return res.status(500).json({ error: '블로그별 조회수 조회에 실패했습니다.' });
    }

    // 데이터 집계
    const trafficSourceCounts = {};
    trafficData?.forEach(item => {
      const source = item.traffic_source || 'unknown';
      trafficSourceCounts[source] = (trafficSourceCounts[source] || 0) + 1;
    });

    const searchKeywordCounts = {};
    searchData?.forEach(item => {
      const keyword = item.search_keyword || 'unknown';
      searchKeywordCounts[keyword] = (searchKeywordCounts[keyword] || 0) + 1;
    });

    const utmCampaignCounts = {};
    utmData?.forEach(item => {
      const campaign = item.utm_campaign || 'unknown';
      utmCampaignCounts[campaign] = (utmCampaignCounts[campaign] || 0) + 1;
    });

    const blogViewCounts = {};
    blogData?.forEach(item => {
      const slug = item.blog_slug || 'unknown';
      blogViewCounts[slug] = (blogViewCounts[slug] || 0) + 1;
    });

    // 결과 정리
    const result = {
      totalViews: totalViews || 0,
      trafficSources: Object.entries(trafficSourceCounts).map(([source, count]) => ({
        source,
        count
      })).sort((a, b) => b.count - a.count),
      searchKeywords: Object.entries(searchKeywordCounts).map(([keyword, count]) => ({
        keyword,
        count
      })).sort((a, b) => b.count - a.count),
      utmCampaigns: Object.entries(utmCampaignCounts).map(([campaign, count]) => ({
        campaign,
        count
      })).sort((a, b) => b.count - a.count),
      blogViews: Object.entries(blogViewCounts).map(([slug, count]) => {
        const blog = blogData?.find(b => b.blog_slug === slug);
        return {
          title: blog?.blog_title || slug,
          slug,
          category: blog?.blog_category || 'unknown',
          count
        };
      }).sort((a, b) => b.count - a.count),
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };

    console.log('✅ 블로그 분석 데이터 반환:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ 블로그 분석 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}