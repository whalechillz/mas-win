import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = '7d' } = req.query;

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // 블로그 포스트 통계
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('블로그 포스트 조회 오류:', postsError);
      return res.status(500).json({ error: '블로그 데이터 조회 실패' });
    }

    // 카테고리별 통계
    const categoryStats = posts?.reduce((acc: any, post: any) => {
      const category = post.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, views: 0, posts: [] };
      }
      acc[category].count++;
      acc[category].views += post.views || 0;
      acc[category].posts.push({
        title: post.title,
        views: post.views || 0,
        published_at: post.published_at,
      });
      return acc;
    }, {}) || {};

    // 인기 포스트 (조회수 기준)
    const popularPosts = posts
      ?.sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map((post: any) => ({
        title: post.title,
        views: post.views || 0,
        published_at: post.published_at,
        category: post.category,
        slug: post.slug,
      })) || [];

    // 일별 발행 통계
    const dailyStats = posts?.reduce((acc: any, post: any) => {
      const date = new Date(post.published_at || post.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { posts: 0, views: 0 };
      }
      acc[date].posts++;
      acc[date].views += post.views || 0;
      return acc;
    }, {}) || {};

    const dailyStatsArray = Object.entries(dailyStats)
      .map(([date, stats]: [string, any]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 전체 통계
    const totalStats = {
      totalPosts: posts?.length || 0,
      totalViews: posts?.reduce((sum: number, post: any) => sum + (post.views || 0), 0) || 0,
      averageViews: posts?.length > 0 
        ? Math.round(posts.reduce((sum: number, post: any) => sum + (post.views || 0), 0) / posts.length)
        : 0,
      publishedPosts: posts?.filter((post: any) => post.published_at).length || 0,
      draftPosts: posts?.filter((post: any) => !post.published_at).length || 0,
    };

    // 최근 성과 (이전 기간과 비교)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const { data: previousPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousStats = {
      totalPosts: previousPosts?.length || 0,
      totalViews: previousPosts?.reduce((sum: number, post: any) => sum + (post.views || 0), 0) || 0,
    };

    const growthStats = {
      postsGrowth: previousStats.totalPosts > 0 
        ? ((totalStats.totalPosts - previousStats.totalPosts) / previousStats.totalPosts * 100)
        : 0,
      viewsGrowth: previousStats.totalViews > 0 
        ? ((totalStats.totalViews - previousStats.totalViews) / previousStats.totalViews * 100)
        : 0,
    };

    res.status(200).json({
      success: true,
      period,
      stats: totalStats,
      growth: growthStats,
      categories: categoryStats,
      popularPosts,
      dailyStats: dailyStatsArray,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('블로그 분석 API 오류:', error);
    res.status(500).json({ error: '블로그 분석 데이터 조회 실패' });
  }
}
