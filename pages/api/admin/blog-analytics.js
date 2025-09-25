import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('📊 블로그 분석 API 요청:', req.method, req.url);

  try {
    if (req.method === 'GET') {
      const { period = '7d', blog_slug } = req.query;
      
      // 기간 설정
      let dateFilter = '';
      switch (period) {
        case '1d':
          dateFilter = "created_at >= NOW() - INTERVAL '1 day'";
          break;
        case '7d':
          dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
          break;
        case '90d':
          dateFilter = "created_at >= NOW() - INTERVAL '90 days'";
          break;
        default:
          dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
      }

      // 기본 통계
      let statsQuery = supabase
        .from('blog_analytics')
        .select('*', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (blog_slug) {
        statsQuery = statsQuery.eq('blog_slug', blog_slug);
      }

      const { data: stats, error: statsError } = await statsQuery;

      if (statsError) {
        console.error('❌ 통계 조회 에러:', statsError);
        return res.status(500).json({ error: '통계 조회에 실패했습니다.' });
      }

      // 트래픽 소스별 분석
      let { data: trafficSources, error: trafficError } = await supabase
        .from('blog_analytics')
        .select('traffic_source')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (blog_slug) {
        trafficSources = trafficSources?.filter(item => item.blog_slug === blog_slug);
      }

      // 검색어 분석
      let { data: searchKeywords, error: searchError } = await supabase
        .from('blog_analytics')
        .select('search_keyword')
        .not('search_keyword', 'is', null)
        .neq('search_keyword', 'none')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (blog_slug) {
        searchKeywords = searchKeywords?.filter(item => item.blog_slug === blog_slug);
      }

      // UTM 캠페인 분석
      let { data: utmCampaigns, error: utmError } = await supabase
        .from('blog_analytics')
        .select('utm_campaign, utm_source, utm_medium')
        .not('utm_campaign', 'is', null)
        .neq('utm_campaign', 'none')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (blog_slug) {
        utmCampaigns = utmCampaigns?.filter(item => item.blog_slug === blog_slug);
      }

      // 블로그별 조회수
      const { data: blogViews, error: blogViewsError } = await supabase
        .from('blog_analytics')
        .select('blog_title, blog_slug, blog_category')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // 데이터 분석
      const trafficSourceCounts = {};
      trafficSources?.forEach(item => {
        const source = item.traffic_source || 'unknown';
        trafficSourceCounts[source] = (trafficSourceCounts[source] || 0) + 1;
      });

      const searchKeywordCounts = {};
      searchKeywords?.forEach(item => {
        const keyword = item.search_keyword || 'unknown';
        searchKeywordCounts[keyword] = (searchKeywordCounts[keyword] || 0) + 1;
      });

      const utmCampaignCounts = {};
      utmCampaigns?.forEach(item => {
        const campaign = item.utm_campaign || 'unknown';
        utmCampaignCounts[campaign] = (utmCampaignCounts[campaign] || 0) + 1;
      });

      const blogViewCounts = {};
      blogViews?.forEach(item => {
        const slug = item.blog_slug || 'unknown';
        blogViewCounts[slug] = (blogViewCounts[slug] || 0) + 1;
      });

      // 결과 정리
      const analytics = {
        period,
        totalViews: stats?.length || 0,
        trafficSources: Object.entries(trafficSourceCounts)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count),
        searchKeywords: Object.entries(searchKeywordCounts)
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20), // 상위 20개만
        utmCampaigns: Object.entries(utmCampaignCounts)
          .map(([campaign, count]) => ({ campaign, count }))
          .sort((a, b) => b.count - a.count),
        blogViews: Object.entries(blogViewCounts)
          .map(([slug, count]) => ({ 
            slug, 
            count,
            title: blogViews?.find(b => b.blog_slug === slug)?.blog_title || 'Unknown',
            category: blogViews?.find(b => b.blog_slug === slug)?.blog_category || 'Unknown'
          }))
          .sort((a, b) => b.count - a.count)
      };

      console.log('✅ 블로그 분석 조회 성공:', analytics.totalViews, '조회수');
      return res.status(200).json(analytics);

    } else {
      return res.status(405).json({ error: '지원하지 않는 HTTP 메서드입니다.' });
    }

  } catch (error) {
    console.error('❌ 블로그 분석 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
