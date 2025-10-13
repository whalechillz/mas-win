/**
 * 간단한 네이버 블로그 마이그레이션 API
 * Sharp나 OpenAI 없이 기본적인 스크래핑만 수행
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL이 필요합니다.' });
    }

    console.log('🚀 간단한 네이버 블로그 마이그레이션 시작:', url);

    // 1. 웹페이지 스크래핑
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let html = await response.text();
    
    // 1-1. iframe(mainFrame) 내부 실제 본문으로 이동 시도
    try {
      const iframeMatch = html.match(/<iframe[^>]*id=["']mainFrame["'][^>]*src=["']([^"']+)["']/i);
      if (iframeMatch && iframeMatch[1]) {
        let iframeSrc = iframeMatch[1];
        if (iframeSrc.startsWith('/')) {
          iframeSrc = `https://blog.naver.com${iframeSrc}`;
        } else if (iframeSrc.startsWith('./')) {
          iframeSrc = `https://blog.naver.com/${iframeSrc.replace('./', '')}`;
        }
        const iframeRes = await fetch(iframeSrc, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url } });
        if (iframeRes.ok) {
          html = await iframeRes.text();
        }
      }
    } catch {}

    // 1-2. 모바일 뷰(m.blog.naver.com) 재시도
    try {
      if (!/m\.blog\.naver\.com/.test(url)) {
        const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        let mobileUrl = ogUrlMatch ? ogUrlMatch[1] : '';
        if (!mobileUrl || !/m\.blog\.naver\.com/.test(mobileUrl)) {
          const pathMatch = url.match(/blog\.naver\.com\/(.+)/);
          if (pathMatch) mobileUrl = `https://m.blog.naver.com/${pathMatch[1]}`;
        }
        if (mobileUrl) {
          const mRes = await fetch(mobileUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Referer': url } });
          if (mRes.ok) {
            const mHtml = await mRes.text();
            if (mHtml && mHtml.length > html.length * 0.5) html = mHtml;
          }
        }
      }
    } catch {}

    // 2. 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '제목 없음';

    // 3. 메타 설명 추출
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    // 3.1. 태그 추출 (네이버 전용 + 일반 메타)
    const tags = (() => {
      const results = new Set();
      // meta keywords
      const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
      if (metaKeywordsMatch) {
        metaKeywordsMatch[1].split(/,|\s+/).forEach(k => {
          const t = k.replace(/^#/, '').trim();
          if (t) results.add(t);
        });
      }
      // se_tag, tag-search 링크 등
      const tagAnchorMatches = html.match(/<a[^>]*(class=["'][^"']*tag[^"']*["']|href=["'][^"']*SearchTag[^"']*["'])[^>]*>(.*?)<\/a>/gi) || [];
      tagAnchorMatches.forEach(a => {
        const textMatch = a.match(/>(.*?)<\/a>/i);
        const raw = textMatch ? textMatch[1] : '';
        const clean = raw.replace(/<[^>]+>/g, '').replace(/^#/, '').trim();
        if (clean) results.add(clean);
      });
      // se_tag span
      const spanTagMatches = html.match(/<span[^>]*class=["'][^"']*se_tag[^"']*["'][^>]*>(.*?)<\/span>/gi) || [];
      spanTagMatches.forEach(s => {
        const clean = s.replace(/<[^>]+>/g, '').replace(/^#/, '').trim();
        if (clean) results.add(clean);
      });
      // 본문 내 해시태그
      const hashMatches = html.match(/#([가-힣A-Za-z0-9_]{2,30})/g) || [];
      hashMatches.forEach(h => results.add(h.replace('#','')));
      return Array.from(results).slice(0, 20);
    })();

    // 4. 강력한 본문 콘텐츠 추출
    let content = '';
    
    // 패턴 1: 네이버 블로그 신형 구조 (se-main-container)
    const seMainMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/s);
    if (seMainMatch) {
      content = seMainMatch[1];
    } else {
      // 패턴 2: 네이버 블로그 구형 구조 (postViewArea)
      const postViewMatch = html.match(/<div[^>]*id="postViewArea"[^>]*>(.*?)<\/div>/s);
      if (postViewMatch) {
        content = postViewMatch[1];
      } else {
        // 패턴 3: 전체 콘텐츠 영역 (se-text-paragraph)
        const textParagraphs = html.match(/<div[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>(.*?)<\/div>/gs);
        if (textParagraphs) {
          content = textParagraphs.join('\n');
        } else {
          // 패턴 4: 일반적인 콘텐츠 영역
          const generalMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s);
          if (generalMatch) {
            content = generalMatch[1];
          } else {
            // 패턴 5: body 태그 내 모든 텍스트
            const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
            if (bodyMatch) {
              content = bodyMatch[1];
            }
          }
        }
      }
    }
    
    // HTML 태그 정리
    if (content) {
      content = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // 스크립트 제거
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // 스타일 제거
        .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '') // noscript 제거
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '') // 네비게이션 제거
        .replace(/<header[^>]*>.*?<\/header>/gis, '') // 헤더 제거
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '') // 푸터 제거
        .replace(/<aside[^>]*>.*?<\/aside>/gis, '') // 사이드바 제거
        .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/gis, '') // 광고 제거
        .replace(/<div[^>]*class="[^"]*banner[^"]*"[^>]*>.*?<\/div>/gis, '') // 배너 제거
        .replace(/<div[^>]*class="[^"]*widget[^"]*"[^>]*>.*?<\/div>/gis, '') // 위젯 제거
        .trim();
      
      // 텍스트 추출 및 정리
      content = content
        .replace(/<br\s*\/?>/gi, '\n') // br 태그를 줄바꿈으로
        .replace(/<\/p>/gi, '\n\n') // p 태그 끝을 줄바꿈으로
        .replace(/<\/div>/gi, '\n') // div 태그 끝을 줄바꿈으로
        .replace(/<[^>]*>/g, '') // 모든 HTML 태그 제거
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 연속된 줄바꿈 정리
        .replace(/&nbsp;/g, ' ') // &nbsp;를 공백으로
        .replace(/&amp;/g, '&') // &amp;를 &로
        .replace(/&lt;/g, '<') // &lt;를 <로
        .replace(/&gt;/g, '>') // &gt;를 >로
        .replace(/&quot;/g, '"') // &quot;를 "로
        .trim();
    }

    // 5. 이미지 URL 추출 + 네이버 특화 정규화/필터링
    let images = [];
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
    const srcImages = imageMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);
    const dataSrcMatches = html.match(/<img[^>]*(data-src|data-original|data-lazy)=["']([^"']+)["'][^>]*>/gi) || [];
    const dataSrcImages = dataSrcMatches.map(img => {
      const srcMatch = img.match(/(data-src|data-original|data-lazy)=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[2] : null;
    }).filter(Boolean);
    const bgImageMatches = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi) || [];
    const bgImages = bgImageMatches.map(bg => {
      const urlMatch = bg.match(/url\(["']?([^"')]+)["']?\)/i);
      return urlMatch ? urlMatch[1] : null;
    }).filter(Boolean);
    const allImages = [...srcImages, ...dataSrcImages, ...bgImages];
    let uniqueImages = [...new Set(allImages)];

    function isNoise(u) {
      if (!u) return true;
      const url = u.toLowerCase();
      const noise = ['profile', 'favicon', 'sprite', 'icon', 'ico_', 'btn', 'button', 'comment', 'reply', 'like', 'share', 'logo', 'nav', 'menu', 'header', 'footer', 'top', 'toolbar', 'emoji', 'sticker', 'badge', 'banner', 'widget'];
      if (noise.some(k => url.includes(k))) return true;
      if (url.includes('blogimgs.naver.net') || url.includes('blogpfthumb-phinf.pstatic.net')) return true;
      return false;
    }

    function normalizeNaverImage(u) {
      if (!u) return u;
      try {
        let out = u;
        if (out.startsWith('//')) out = 'https:' + out;
        if (out.includes('postfiles.pstatic.net')) {
          const [base, query] = out.split('?');
          const params = new URLSearchParams(query || '');
          const type = (params.get('type') || '').replace(/_blur$/i, '');
          params.set('type', type || 'w2000');
          out = base + '?' + params.toString();
        }
        out = out.replace(/\/(m_|t_|s_)/g, '/');
        out = out.replace(/(&|\?)w=\d+(&|$)/, '$1').replace(/(&|\?)h=\d+(&|$)/, '$1');
        return out;
      } catch { return u; }
    }

    images = uniqueImages.filter(u => !isNoise(u)).map(normalizeNaverImage);

    // 디버깅 정보 출력
    console.log('🔍 스크래핑 결과:');
    console.log('- 제목:', title);
    console.log('- 콘텐츠 길이:', content ? content.length : 0);
    console.log('- 이미지 개수:', images.length);
    console.log('- 이미지 URL들:', images.slice(0, 3)); // 처음 3개만 출력

    // 6. 이미지 다운로드 → Sharp 최적화 → Supabase Storage 업로드
    const processedImages = [];
    function getOriginalFileName(u) {
      try {
        let x = u.startsWith('//') ? 'https:' + u : u;
        const p = new URL(x).pathname;
        return decodeURIComponent(p.split('/').pop() || 'image');
      } catch { return 'image'; }
    }
    const toProcess = images.slice(0, 15);
    for (let i = 0; i < toProcess.length; i++) {
      let imageUrl = toProcess[i];
      try {
        if (!imageUrl.startsWith('http')) continue;
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' }, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!imgRes.ok) continue;
        const arr = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arr);
        if (buffer.length < 1000) continue;
        const optimized = await sharp(buffer)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer();
        const base = getOriginalFileName(imageUrl).replace(/\.[a-zA-Z0-9]+$/, '');
        const fileName = `naver-${base}-${Date.now()}-${i + 1}.webp`;
        const { error: upErr } = await supabase.storage.from('blog-images').upload(fileName, optimized, { contentType: 'image/webp', cacheControl: '3600' });
        if (upErr) {
          console.error('업로드 실패:', upErr);
          processedImages.push({ originalUrl: imageUrl, processedUrl: imageUrl, alt: `이미지 ${i + 1}`, originalFileName: getOriginalFileName(imageUrl), status: 'upload-failed' });
          continue;
        }
        const publicUrl = supabase.storage.from('blog-images').getPublicUrl(fileName).data.publicUrl;
        processedImages.push({ originalUrl: imageUrl, processedUrl: publicUrl, alt: `이미지 ${i + 1}`, fileName, originalFileName: getOriginalFileName(imageUrl), status: 'success' });
      } catch (e) {
        console.error('이미지 처리 실패:', e.message);
        processedImages.push({ originalUrl: imageUrl, processedUrl: imageUrl, alt: `이미지 ${i + 1}`, originalFileName: getOriginalFileName(imageUrl), status: 'error' });
      }
    }

    const featuredProcessed = processedImages.find(i => i.status === 'success')?.processedUrl || images[0] || null;

    // 7. 고유 slug 생성
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    // 7. 데이터베이스에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: content || '콘텐츠를 추출할 수 없습니다.',
        excerpt: metaDescription || title,
        featured_image: featuredProcessed,
        category: 'migrated',
        tags: tags,
        status: 'draft',
        meta_title: title,
        meta_description: metaDescription,
        meta_keywords: tags.join(', '),
        author: '마쓰구골프',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ 간단한 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      message: '네이버 블로그 마이그레이션 성공',
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image: post.featured_image,
        images: processedImages.length > 0 ? processedImages : images.map(u => ({ originalUrl: u, processedUrl: u })),
        imageCount: processedImages.length > 0 ? processedImages.filter(i => i.status === 'success').length : images.length,
        tags: tags,
        status: 'migration-success'
      }
    });

  } catch (error) {
    console.error('간단한 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
