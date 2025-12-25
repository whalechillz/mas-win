// Individual blog post API endpoint
import { createServerSupabase } from '../../../lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    const supabase = createServerSupabase();
    
    // 관리자 권한 확인 (NextAuth 세션 우선, fallback으로 헤더 체크)
    let isAdmin = false;
    
    try {
      // NextAuth 세션 확인 (서버 사이드)
      const session = await getServerSession(req, res, authOptions);
      if (session?.user) {
        isAdmin = true;
        console.log('✅ NextAuth 세션으로 관리자 인증됨:', session.user.name || session.user.id);
      }
    } catch (sessionError) {
      console.log('⚠️ NextAuth 세션 확인 실패, fallback 체크 진행:', sessionError.message);
    }
    
    // Fallback: 헤더 기반 체크 (기존 방식 유지)
    if (!isAdmin) {
      isAdmin = req.headers.referer?.includes('/admin/') || 
                req.headers.cookie?.includes('admin-auth=true') || 
                req.headers['x-admin-auth'] === 'true' ||
                req.query.admin === 'true';
      
      if (isAdmin) {
        console.log('✅ 헤더 기반으로 관리자 인증됨');
      }
    }
    
    console.log('🔍 게시물 조회 요청:', { 
      slug, 
      isAdmin,
      referer: req.headers.referer,
      hasCookie: !!req.headers.cookie
    });
    
    // Get the specific post (ID 또는 slug로 조회)
    let postQuery = supabase
      .from('blog_posts')
      .select('*');
    
    // 숫자인 경우 ID로 조회, 그렇지 않으면 slug로 조회
    if (/^\d+$/.test(slug)) {
      postQuery = postQuery.eq('id', parseInt(slug));
    } else {
      postQuery = postQuery.eq('slug', slug);
    }
    
    // 관리자가 아닌 경우 발행된 게시물만 조회
    if (!isAdmin) {
      postQuery = postQuery.eq('status', 'published');
    }
    
    const { data: post, error } = await postQuery.single();

    if (error || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get related posts (same category, excluding current post)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, published_at, category')
      .eq('category', post.category)
      .neq('id', post.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    // Get previous and next posts by published_at order
    // published_at이 없으면 created_at 사용
    // 모든 포스트를 가져와서 JavaScript에서 정렬하는 방식으로 변경
    let allPostsQuery = supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, created_at')
      .neq('id', post.id);

    // 관리자가 아닌 경우 발행된 게시물만 조회
    if (!isAdmin) {
      allPostsQuery = allPostsQuery.eq('status', 'published');
    }

    // 모든 포스트 가져오기 (충분한 수를 가져와서 필터링)
    const { data: allPosts } = await allPostsQuery.limit(500);

    // JavaScript에서 정렬: published_at 우선, 없으면 created_at 사용
    // 내림차순 (최신순)
    const sortedPosts = (allPosts || []).sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at);
      const dateB = new Date(b.published_at || b.created_at);
      return dateB - dateA; // 내림차순 (최신순)
    });

    // 현재 포스트의 정렬 기준 날짜
    const currentDate = new Date(post.published_at || post.created_at);
    
    // 이전 포스트: 정렬된 배열에서 현재보다 이전 날짜의 포스트 중 첫 번째
    // (배열이 최신순이므로, 현재보다 이전 날짜는 뒤쪽에 있음)
    const prevPost = sortedPosts.find(p => {
      const postDate = new Date(p.published_at || p.created_at);
      return postDate < currentDate;
    }) || null;
    
    // 다음 포스트: 정렬된 배열을 뒤집어서 현재보다 이후 날짜의 포스트 중 첫 번째
    // (배열이 최신순이므로, 현재보다 이후 날짜는 앞쪽에 있음)
    const reversedPosts = [...sortedPosts].reverse();
    const nextPost = reversedPosts.find(p => {
      const postDate = new Date(p.published_at || p.created_at);
      return postDate > currentDate;
    }) || null;

    // Transform data for frontend
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary || post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      published_at: post.published_at,
      category: post.category,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords,
      status: post.status,
      customer_persona: post.customer_persona,
      brand_weight: post.brand_weight,
      pain_point: post.pain_point,
      conversion_goal: post.conversion_goal,
      storytelling_framework: post.storytelling_framework,
      target_audience: post.target_audience,
      seo_meta: post.seo_meta,
      published_channels: post.published_channels,
      content_type: post.content_type
    };

    // 관리자 요청인 경우 단일 포스트만 반환 (편집용)
    if (isAdmin && /^\d+$/.test(slug)) {
      return res.status(200).json(transformedPost);
    }

    const transformedRelatedPosts = (relatedPosts || []).map(relatedPost => ({
      id: relatedPost.id,
      title: relatedPost.title,
      slug: relatedPost.slug,
      excerpt: relatedPost.excerpt,
      featured_image: relatedPost.featured_image,
      publishedAt: relatedPost.published_at,
      category: relatedPost.category
    }));
    
    res.status(200).json({
      post: transformedPost,
      relatedPosts: transformedRelatedPosts,
      prevPost: prevPost ? {
        id: prevPost.id,
        title: prevPost.title,
        slug: prevPost.slug
      } : null,
      nextPost: nextPost ? {
        id: nextPost.id,
        title: nextPost.title,
        slug: nextPost.slug
      } : null
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to load blog post' });
  }
}
