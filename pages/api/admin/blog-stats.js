import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 전체 게시물 통계
    const { data: allPosts, error: allPostsError } = await supabase
      .from('blog_posts')
      .select('id, status, view_count, category, published_at, title');

    if (allPostsError) {
      console.error('게시물 조회 오류:', allPostsError);
      return res.status(500).json({ error: '게시물 조회 실패' });
    }

    // 기본 통계
    const totalPosts = allPosts.length;
    const publishedPosts = allPosts.filter(post => post.status === 'published').length;
    const draftPosts = allPosts.filter(post => post.status === 'draft').length;
    const totalViews = allPosts.reduce((sum, post) => sum + (post.view_count || 0), 0);
    const avgViewsPerPost = totalPosts > 0 ? totalViews / totalPosts : 0;

    // 카테고리별 통계
    const categoryCount = {};
    allPosts.forEach(post => {
      if (post.category) {
        categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 최근 인기 게시물 (조회수 기준)
    const recentPosts = allPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10)
      .map(post => ({
        title: post.title,
        views: post.view_count || 0,
        published_at: post.published_at
      }));

    const stats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      avgViewsPerPost,
      topCategories,
      recentPosts
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('블로그 통계 조회 오류:', error);
    res.status(500).json({ error: '블로그 통계 조회 실패' });
  }
}
