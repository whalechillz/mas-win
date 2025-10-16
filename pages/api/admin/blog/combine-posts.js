import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length < 2) {
      return res.status(400).json({ error: '최소 2개 이상의 포스트가 필요합니다.' });
    }

    // 합쳐진 포스트 데이터 생성
    const combinedTitle = `[합쳐진 글] ${posts[0].title}`;

    // 슬러그 생성 유틸
    const slugify = (text) => {
      if (!text) return `combined-${Date.now()}`;
      const base = text
        .toString()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9가-힣\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      return base.length > 0 ? base : `combined-${Date.now()}`;
    };

    const ensureUniqueSlug = async (baseSlug) => {
      let candidate = baseSlug;
      let suffix = 1;
      // 중복 확인 루프 (최대 50회 안전장치)
      // maybeSingle은 존재하지 않을 때 data가 null
      for (let i = 0; i < 50; i += 1) {
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', candidate)
          .maybeSingle();
        if (!existing) return candidate;
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      // 비상 fallback
      return `${baseSlug}-${Date.now()}`;
    };

    const baseSlug = slugify(`${posts[0].title || 'combined'}-combined`);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);
    
    // 각 포스트의 내용을 구조화하여 합치기
    const combinedContent = posts.map((post, index) => {
      const postTitle = post.title || `포스트 ${index + 1}`;
      const postContent = post.content || post.description || '';
      
      return `
        <div class="combined-post-section">
          <h2 class="post-title">${index + 1}. ${postTitle}</h2>
          <div class="post-content">
            ${postContent}
          </div>
          ${post.url ? `<p class="original-url"><small>원본: <a href="${post.url}" target="_blank">${post.url}</a></small></p>` : ''}
        </div>
      `;
    }).join('\n\n<hr class="post-separator">\n\n');

    // 모든 태그를 수집하고 중복 제거
    const allTags = [...new Set(posts.flatMap(post => post.tags || []))];
    
    // 모든 이미지 URL 수집
    const allImages = [...new Set(posts.flatMap(post => {
      const images = [];
      if (post.featured_image) images.push(post.featured_image);
      if (post.images && Array.isArray(post.images)) {
        images.push(...post.images);
      }
      return images;
    }))];

    // 메타 설명 생성
    const metaDescription = `여러 포스트를 합친 종합 글입니다. ${posts.length}개의 포스트가 포함되어 있으며, ${allTags.slice(0, 3).join(', ')} 등의 주제를 다룹니다.`;

    // 합쳐진 포스트 데이터
    const combinedPost = {
      title: combinedTitle,
      content: combinedContent,
      excerpt: metaDescription,
      slug: uniqueSlug,
      category: 'combined',
      tags: allTags,
      featured_image: posts[0].featured_image || allImages[0] || '',
      status: 'draft',
      meta_title: combinedTitle,
      meta_description: metaDescription,
      meta_keywords: allTags.slice(0, 10).join(', '),
      author: '마쓰구골프',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([combinedPost])
      .select()
      .single();

    if (error) {
      console.error('❌ 합쳐진 포스트 저장 오류:', error);
      return res.status(500).json({ 
        error: '포스트 저장 실패', 
        details: error.message 
      });
    }

    // 이미지 정보도 별도로 저장 (선택사항)
    if (allImages.length > 0) {
      const imageRecords = allImages.map((imageUrl, index) => ({
        post_id: data.id,
        image_url: imageUrl,
        alt_text: `합쳐진 글 이미지 ${index + 1}`,
        order_index: index,
        is_featured: index === 0
      }));

      await supabase
        .from('blog_images')
        .insert(imageRecords);
    }

    console.log(`✅ ${posts.length}개 포스트를 성공적으로 합쳐서 새 글 생성:`, data.id);

    return res.status(201).json({
      success: true,
      message: `${posts.length}개 포스트를 성공적으로 합쳤습니다.`,
      post: data,
      combined_count: posts.length,
      total_images: allImages.length
    });

  } catch (error) {
    console.error('❌ 포스트 합치기 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류', 
      details: error.message 
    });
  }
}
