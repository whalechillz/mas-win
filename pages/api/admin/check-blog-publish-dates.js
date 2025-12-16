// 블로그 게시물 발행일 확인 및 수정 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      // 발행일 문제가 있는 게시물 조회
      console.log('🔍 발행일 문제 확인 중...');

      // 1. status='published'이지만 published_at이 null인 게시물
      const { data: publishedWithoutDate, error: error1 } = await supabase
        .from('blog_posts')
        .select('id, title, status, published_at, created_at, updated_at')
        .eq('status', 'published')
        .is('published_at', null);

      if (error1) {
        console.error('❌ 쿼리 에러:', error1);
        return res.status(500).json({ error: '조회 실패', details: error1.message });
      }

      // 2. published_at이 잘못된 형식인 게시물 (Invalid Date 가능성)
      const { data: allPublished, error: error2 } = await supabase
        .from('blog_posts')
        .select('id, title, status, published_at, created_at, updated_at')
        .eq('status', 'published')
        .not('published_at', 'is', null);

      if (error2) {
        console.error('❌ 쿼리 에러:', error2);
        return res.status(500).json({ error: '조회 실패', details: error2.message });
      }

      // published_at이 유효하지 않은 날짜인지 확인
      const invalidDatePosts = (allPublished || []).filter(post => {
        if (!post.published_at) return false;
        const date = new Date(post.published_at);
        return isNaN(date.getTime());
      });

      const result = {
        publishedWithoutDate: publishedWithoutDate || [],
        invalidDatePosts: invalidDatePosts,
        summary: {
          totalPublishedWithoutDate: (publishedWithoutDate || []).length,
          totalInvalidDate: invalidDatePosts.length,
          totalIssues: (publishedWithoutDate || []).length + invalidDatePosts.length
        }
      };

      console.log('✅ 발행일 문제 확인 완료:', result.summary);

      return res.status(200).json(result);

    } else if (req.method === 'POST') {
      // 발행일 자동 수정 (created_at을 published_at으로 설정)
      const { fixAll = false, postIds = [] } = req.body;

      console.log('🔧 발행일 수정 중...', { fixAll, postIds });

      let postsToFix = [];

      if (fixAll) {
        // status='published'이지만 published_at이 null인 모든 게시물
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, created_at')
          .eq('status', 'published')
          .is('published_at', null);

        if (error) {
          return res.status(500).json({ error: '조회 실패', details: error.message });
        }

        postsToFix = data || [];
      } else if (postIds.length > 0) {
        // 지정된 게시물만 수정
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, created_at')
          .eq('status', 'published')
          .in('id', postIds);

        if (error) {
          return res.status(500).json({ error: '조회 실패', details: error.message });
        }

        postsToFix = (data || []).filter(post => !post.published_at);
      } else {
        return res.status(400).json({ error: 'fixAll 또는 postIds를 제공해야 합니다.' });
      }

      if (postsToFix.length === 0) {
        return res.status(200).json({ 
          message: '수정할 게시물이 없습니다.',
          fixed: 0
        });
      }

      // 각 게시물의 created_at을 published_at으로 설정
      const updatePromises = postsToFix.map(post => {
        return supabase
          .from('blog_posts')
          .update({ 
            published_at: post.created_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      const successCount = results.length - errors.length;

      if (errors.length > 0) {
        console.error('⚠️ 일부 게시물 수정 실패:', errors);
      }

      console.log(`✅ ${successCount}개 게시물 발행일 수정 완료`);

      return res.status(200).json({
        message: `${successCount}개 게시물의 발행일을 수정했습니다.`,
        fixed: successCount,
        failed: errors.length,
        posts: postsToFix.map(p => ({ id: p.id, title: p.title }))
      });
    }

  } catch (error) {
    console.error('❌ API 에러:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}



