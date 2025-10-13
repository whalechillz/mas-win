/**
 * 간단한 네이버 블로그 마이그레이션 API
 * Sharp나 OpenAI 없이 기본적인 스크래핑만 수행
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 2.1. 날짜 추출 (다양한 형식 지원) - professional 버전에서 가져옴
    let publishedDate = new Date();
    
    // 메타 태그에서 날짜 추출
    const metaDateMatch = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*name="date"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*name="pubdate"[^>]*content="([^"]+)"/i);
    
    if (metaDateMatch) {
      publishedDate = new Date(metaDateMatch[1]);
    } else {
      // HTML에서 날짜 패턴 추출
      const datePatterns = [
        /(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]/g,
        /(\d{4})\-(\d{1,2})\-(\d{1,2})/g,
        /(\d{1,2})[월\-\/](\d{1,2})[일\-\/](\d{4})/g
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = html.match(pattern);
        if (dateMatch) {
          const dateStr = dateMatch[0];
          const parsedDate = new Date(dateStr.replace(/[년월일]/g, '-').replace(/\-$/, ''));
          if (!isNaN(parsedDate.getTime())) {
            publishedDate = parsedDate;
            break;
          }
        }
      }
    }
    
    console.log(`📅 추출된 날짜: ${publishedDate.toISOString()}`);

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

    // 4. 강력한 본문 콘텐츠 추출 (다단계 패턴 매칭)
    let content = '';
    
    // 패턴 1: 네이버 블로그 신형 구조 (se-main-container)
    const seMainMatch = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/s);
    if (seMainMatch) {
      content = seMainMatch[1];
      console.log('✅ se-main-container 패턴으로 콘텐츠 추출');
    } else {
      // 패턴 2: 네이버 블로그 구형 구조 (postViewArea)
      const postViewMatch = html.match(/<div[^>]*id="postViewArea"[^>]*>(.*?)<\/div>/s);
      if (postViewMatch) {
        content = postViewMatch[1];
        console.log('✅ postViewArea 패턴으로 콘텐츠 추출');
      } else {
        // 패턴 3: se-text-paragraph 개별 추출
        const textParagraphs = html.match(/<div[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>(.*?)<\/div>/gs);
        if (textParagraphs && textParagraphs.length > 0) {
          content = textParagraphs.join('\n');
          console.log('✅ se-text-paragraph 패턴으로 콘텐츠 추출:', textParagraphs.length, '개');
        } else {
          // 패턴 4: post-content 영역
          const generalMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s);
          if (generalMatch) {
            content = generalMatch[1];
            console.log('✅ post-content 패턴으로 콘텐츠 추출');
          } else {
            // 패턴 5: 네이버 블로그 특화 패턴들
            const patterns = [
              /<div[^>]*class="[^"]*se-component[^"]*"[^>]*>(.*?)<\/div>/gs,
              /<div[^>]*class="[^"]*se-text[^"]*"[^>]*>(.*?)<\/div>/gs,
              /<div[^>]*class="[^"]*se-module[^"]*"[^>]*>(.*?)<\/div>/gs,
              /<div[^>]*class="[^"]*se-section[^"]*"[^>]*>(.*?)<\/div>/gs
            ];
            
            for (let i = 0; i < patterns.length; i++) {
              const matches = html.match(patterns[i]);
              if (matches && matches.length > 0) {
                content = matches.join('\n');
                console.log(`✅ 네이버 특화 패턴 ${i+1}으로 콘텐츠 추출:`, matches.length, '개');
                break;
              }
            }
            
            // 패턴 6: 최후의 수단 - body 태그 내 모든 텍스트
            if (!content) {
              const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
              if (bodyMatch) {
                content = bodyMatch[1];
                console.log('⚠️ body 태그 전체로 콘텐츠 추출 (노이즈 포함 가능)');
              }
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
    // 패턴 4: 네이버 블로그 특화 이미지 URL 패턴들
    const naverImagePatterns = [
      /https:\/\/postfiles\.pstatic\.net\/[^"'\s]+/gi,
      /https:\/\/blogfiles\.pstatic\.net\/[^"'\s]+/gi,
      /https:\/\/storep-phinf\.pstatic\.net\/[^"'\s]+/gi,
      /https:\/\/ssl\.pstatic\.net\/[^"'\s]+/gi
    ];
    
    const naverImages = [];
    naverImagePatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        naverImages.push(...matches);
      }
    });
    
    const allImages = [...srcImages, ...dataSrcImages, ...bgImages, ...naverImages];
    let uniqueImages = [...new Set(allImages)];
    
    console.log('🔍 이미지 추출 결과:');
    console.log('  - src 속성:', srcImages.length);
    console.log('  - data-* 속성:', dataSrcImages.length);
    console.log('  - 배경 이미지:', bgImages.length);
    console.log('  - 네이버 패턴:', naverImages.length);
    console.log('  - 총 고유 이미지:', uniqueImages.length);

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
        
        // 포스트파일: ?type=.. 파라미터 최적화 (원본/고해상도)
        if (out.includes('postfiles.pstatic.net')) {
          const [base, query] = out.split('?');
          const params = new URLSearchParams(query || '');
          // blur 제거하고 고해상도로 설정
          const type = (params.get('type') || '').replace(/_blur$/i, '');
          // 가장 큰 사이즈로 시도 (w2000, w1024, w800 순서)
          if (!type || type === 'w80' || type === 'w150') {
            params.set('type', 'w2000');
          }
          out = base + '?' + params.toString();
        }
        
        // blogfiles.pstatic.net 썸네일 경로 보정 (m_, t_, s_ 접두 제거)
        out = out.replace(/\/(m_|t_|s_|thumb_)/g, '/');
        
        // storep-phinf.pstatic.net 고해상도 변환
        if (out.includes('storep-phinf.pstatic.net')) {
          // 썸네일 파라미터 제거하고 원본으로
          out = out.replace(/[?&]type=w\d+/, '').replace(/[?&]type=h\d+/, '');
        }
        
        // 모바일 리사이즈 파라미터 제거
        out = out.replace(/(&|\?)w=\d+(&|$)/, '$1').replace(/(&|\?)h=\d+(&|$)/, '$1');
        
        // 불필요한 파라미터 정리
        out = out.replace(/[?&]$/, '');
        
        return out;
      } catch { return u; }
    }

    // Wix 이미지 URL을 고화질로 변환하는 함수 (professional 버전에서 가져옴)
    function convertWixToHighQuality(wixUrl) {
      if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
        return wixUrl;
      }

      try {
        // 현재 URL 예시:
        // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
        
        // 고화질 변환:
        // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_2000,h_2000,al_c,q_95/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
        
        const baseUrl = wixUrl.split('/v1/')[0];
        const fileName = wixUrl.split('/').pop();
        
        return `${baseUrl}/v1/fill/w_2000,h_2000,al_c,q_95/${fileName}`;
      } catch (error) {
        console.error('Wix URL 변환 실패:', error);
        return wixUrl;
      }
    }

    // 이미지 필터링 - 로고/네비게이션 이미지 제외 (professional 버전에서 가져옴)
    function isContentImage(imageUrl, imgTag) {
      if (!imageUrl) return false;
      
      // 로고 관련 키워드 제외
      const logoKeywords = ['logo', 'nav', 'menu', 'header', 'top', 'brand', 'icon'];
      const urlLower = imageUrl.toLowerCase();
      const tagLower = (imgTag || '').toLowerCase();
      
      for (const keyword of logoKeywords) {
        if (urlLower.includes(keyword) || tagLower.includes(keyword)) {
          return false;
        }
      }
      
      // 너무 작은 이미지 제외 (로고나 아이콘일 가능성)
      const sizeMatch = imgTag?.match(/width="(\d+)"|height="(\d+)"/i);
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1]) || 0;
        const height = parseInt(sizeMatch[2]) || 0;
        if (width < 100 || height < 100) {
          return false;
        }
      }
      
      return true;
    }

    // 콘텐츠 이미지만 필터링 (professional 버전 로직)
    const contentImages = uniqueImages.filter((url, index) => {
      const imgTag = imageMatches[index];
      return isContentImage(url, imgTag);
    });

    // Wix 이미지를 고화질로 변환하고 네이버 이미지 정규화
    images = contentImages.map(url => {
      if (url.includes('static.wixstatic.com')) {
        return convertWixToHighQuality(url);
      } else {
        return normalizeNaverImage(url);
      }
    });

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

    // 7. 본문에 이미지 삽입 (professional 버전 로직)
    let contentWithImages = content;
    const successfulImages = processedImages.filter(img => img.status === 'success');
    
    console.log(`🖼️ 성공적으로 처리된 이미지 수: ${successfulImages.length}`);
    
    if (successfulImages.length > 0) {
      // 첫 번째 이미지는 대표 이미지로 사용되므로 본문에는 두 번째부터 삽입
      const contentImages = successfulImages.slice(1);
      
      console.log(`🖼️ 본문에 삽입할 이미지 수: ${contentImages.length}`);
      
      // 본문에 이미지 삽입 (단락 사이사이에 배치)
      const paragraphs = contentWithImages.split('\n\n');
      let imageIndex = 0;
      
      const contentWithImagesArray = [];
      
      for (let i = 0; i < paragraphs.length; i++) {
        contentWithImagesArray.push(paragraphs[i]);
        
        // 단락 사이에 이미지 삽입 (2-3단락마다)
        if (imageIndex < contentImages.length && (i + 1) % 2 === 0) {
          const image = contentImages[imageIndex];
          contentWithImagesArray.push(`\n\n![${image.alt}](${image.processedUrl})\n\n`);
          console.log(`🖼️ 본문에 이미지 삽입: ${imageIndex + 1}/${contentImages.length} - ${image.alt}`);
          imageIndex++;
        }
      }
      
      // 마지막에 남은 이미지들 추가
      while (imageIndex < contentImages.length) {
        const image = contentImages[imageIndex];
        contentWithImagesArray.push(`\n\n![${image.alt}](${image.processedUrl})\n\n`);
        console.log(`🖼️ 마지막에 이미지 추가: ${imageIndex + 1}/${contentImages.length} - ${image.alt}`);
        imageIndex++;
      }
      
      contentWithImages = contentWithImagesArray.join('');
      console.log(`🖼️ 최종 본문에 삽입된 이미지 수: ${imageIndex}`);
    }

    // 8. AI로 완전한 콘텐츠 정제 (기존 professional 버전 로직)
    console.log('🤖 AI 콘텐츠 정제 시작...');
    const structuredContent = await generateCompleteContent(title, contentWithImages, extractedTags, processedImages);
    
    // 7.1. 중복 제목 제거 (추가 안전장치)
    const cleanedContent = removeDuplicateTitles(structuredContent, title);
    console.log(`📝 중복 제목 제거 완료`);

    // 8. 고유 slug 생성
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    // 9. 데이터베이스에 저장
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: title,
        slug: slug,
        content: cleanedContent || '콘텐츠를 추출할 수 없습니다.',
        excerpt: metaDescription || title,
        featured_image: featuredProcessed,
        category: 'migrated',
        tags: tags,
        status: 'draft',
        meta_title: title,
        meta_description: metaDescription,
        meta_keywords: tags.join(', '),
        author: '마쓰구골프',
        published_at: publishedDate.toISOString()
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

// 중복 제목 제거 함수 (기존 professional 버전에서 가져옴)
function removeDuplicateTitles(content, originalTitle) {
  try {
    // 원본 제목에서 핵심 키워드 추출 (공백으로 분리)
    const originalKeywords = originalTitle.split(/[\s,]+/).filter(word => word.length > 2);
    
    // 마크다운 제목 패턴 찾기 (# ## ###)
    const titlePattern = /^(#{1,3})\s+(.+)$/gm;
    const lines = content.split('\n');
    const cleanedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const titleMatch = line.match(titlePattern);
      
      if (titleMatch) {
        const titleText = titleMatch[2];
        
        // 원본 제목과 유사도 검사
        const titleKeywords = titleText.split(/[\s,]+/).filter(word => word.length > 2);
        const commonKeywords = originalKeywords.filter(keyword => 
          titleKeywords.some(titleKeyword => 
            titleKeyword.includes(keyword) || keyword.includes(titleKeyword)
          )
        );
        
        // 유사도가 50% 이상이면 제거 (중복 제목으로 판단)
        const similarity = commonKeywords.length / Math.max(originalKeywords.length, titleKeywords.length);
        
        if (similarity > 0.5) {
          console.log(`🗑️ 중복 제목 제거: "${titleText}" (유사도: ${(similarity * 100).toFixed(1)}%)`);
          continue; // 이 라인은 건너뛰기
        }
      }
      
      cleanedLines.push(line);
    }
    
    return cleanedLines.join('\n');
  } catch (error) {
    console.error('중복 제목 제거 오류:', error);
    return content; // 오류 시 원본 반환
  }
}

// GPT-4o-mini로 완전한 콘텐츠 정제 (기존 professional 버전에서 가져옴)
async function generateCompleteContent(title, fullText, tags, images) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 블로그 콘텐츠 편집자입니다. 
          
다음 작업을 수행해주세요:
1. 원본 텍스트에서 실제 블로그 콘텐츠만 추출 (메뉴, 네비게이션 제외)
2. **절대 중복 제목을 만들지 마세요** - 원본 제목과 유사한 제목은 모두 제거
3. 본문을 논리적인 단락으로 구성 (H2, H3 제목 포함)
4. 모든 실제 콘텐츠를 포함 (하단 내용 누락 방지)
5. 메뉴나 네비게이션 텍스트는 완전히 제거
6. 마크다운 형식으로 출력
7. **중요: 이미지 마크다운(![alt](url))은 절대 제거하지 말고 그대로 유지하세요**

**제목 처리 규칙:**
- 원본 제목과 유사한 모든 제목은 제거
- "MBC 표준FM의 싱글벙글쇼 MC 강석" 같은 반복 제목 금지
- 소제목은 원본 제목과 완전히 다른 내용만 사용

중요: 다음 텍스트들은 제거하세요:
- "시리즈", "제품 모아보기", "시타신청", "이벤트", "더 보기"
- "시크리트포스", "시크리트웨폰" 등의 제품명 나열
- "top of page" 같은 네비게이션 텍스트
- 메뉴 관련 모든 텍스트
- 원본 제목과 유사한 모든 제목

**이미지 처리 규칙:**
- 이미지 마크다운(![alt](url))은 그대로 유지
- 이미지 위치는 적절히 조정 가능
- 이미지 alt 텍스트는 의미있게 유지

출력 형식:
# 제목 (원본 제목만 사용)

## 소제목 (원본 제목과 완전히 다른 내용)

본문 내용...

![이미지 설명](이미지URL)

본문 내용...

## 소제목 (원본 제목과 완전히 다른 내용)

본문 내용...

![이미지 설명](이미지URL)

### 태그
태그1, 태그2, 태그3`
        },
        {
          role: "user",
          content: `원본 제목: ${title}

원본 텍스트:
${fullText}

원본 태그:
${tags.join(", ")}

위 내용을 전문적인 블로그 포스트로 정제해주세요.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    let structuredContent = response.choices[0].message.content;

    // 이미지 URL을 실제 처리된 URL로 교체
    images.forEach((image, index) => {
      const imageMarkdown = `![${image.alt}](${image.processedUrl})`;
      structuredContent = structuredContent.replace(
        new RegExp(`!\[이미지 ${index + 1}\]\([^)]+\)`, "g"),
        imageMarkdown
      );
    });

    return structuredContent;

  } catch (error) {
    console.error("콘텐츠 정제 오류:", error);
    // 기본 구조로 폴백
    let fallbackContent = `# ${title}

`;
    images.forEach((image, index) => {
      fallbackContent += `![${image.alt}](${image.processedUrl})

`;
    });
    fallbackContent += `
### 태그
${tags.join(", ")}`;
    return fallbackContent;
  }
}
