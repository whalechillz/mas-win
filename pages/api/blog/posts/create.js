// 블로그 포스트 생성 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category,
      tags,
      status = 'published',
      meta_title,
      meta_description,
      meta_keywords,
      view_count = 0,
      is_featured = false,
      is_scheduled = false,
      scheduled_at,
      author = '마쓰구골프',
      published_at
    } = req.body;

    // 필수 필드 검증
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
    }

    // 슬러그 자동 생성 (제공되지 않은 경우)
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
    }

    // 게시 날짜 설정
    const finalPublishedAt = published_at || new Date().toISOString();

    // 블로그 포스트 데이터 구성
    const blogPostData = {
      title,
      slug: finalSlug,
      excerpt: excerpt || content.substring(0, 200) + '...',
      content,
      featured_image: featured_image || '',
      category: category || '비거리 향상 드라이버',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      status,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || content.substring(0, 160),
      meta_keywords: meta_keywords || '',
      view_count,
      is_featured,
      is_scheduled,
      scheduled_at,
      author,
      published_at: finalPublishedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 블로그 포스트 생성 중:', {
      title: blogPostData.title,
      slug: blogPostData.slug,
      category: blogPostData.category,
      status: blogPostData.status
    });

    // Supabase에 저장
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select()
      .single();

    if (error) {
      console.error('❌ 블로그 포스트 생성 오류:', error);
      return res.status(500).json({ 
        error: '블로그 포스트 생성에 실패했습니다.',
        details: error.message 
      });
    }

    console.log('✅ 블로그 포스트 생성 완료:', data.id);

    res.status(201).json({
      success: true,
      data: data,
      message: '블로그 포스트가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('❌ 블로그 포스트 생성 중 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
