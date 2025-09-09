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
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🚀 실제 마이그레이션 시작: ${url}`);

    // 1. 웹페이지 스크래핑
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 이미지 URL 추출 (최대 3개로 제한)
    const imageMatches = html.match(/<img[^>]+src="[^"]+"[^>]*>/gi) || [];
    const images = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean).slice(0, 3);

    // 4. 간단한 콘텐츠 추출
    const contentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = contentMatch ? contentMatch[1] : html;
    
    const textContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. 간단한 마크다운 생성
    let markdownContent = `# ${title}\n\n`;
    
    const paragraphs = textContent.split('.').filter(p => p.trim().length > 20);
    paragraphs.forEach((paragraph, index) => {
      if (index < 3) { // 최대 3개 단락
        markdownContent += `${paragraph.trim()}.\n\n`;
      }
    });

    // 이미지 추가
    images.forEach((img, index) => {
      if (index < 2) { // 최대 2개 이미지
        markdownContent += `![이미지 ${index + 1}](${img})\n\n`;
      }
    });

    // 6. 고유 slug 생성
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();

    // 7. Supabase에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: markdownContent,
        featured_image: images[0] || null,
        published_at: new Date().toISOString(),
        is_featured: false,
        author: '마쓰구골프',
        excerpt: textContent.substring(0, 200) + '...'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ 실제 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      message: '실제 마이그레이션 성공',
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image: post.featured_image,
        images: images,
        imageCount: images.length,
        status: 'real-migration-success'
      }
    });

  } catch (error) {
    console.error('실제 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
