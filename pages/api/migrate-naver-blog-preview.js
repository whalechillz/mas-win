import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import sharp from "sharp";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // 디버깅 로그 추가
  console.log('🔍 API 요청 받음:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS 요청 처리');
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log('❌ 잘못된 메소드:', req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log('✅ POST 요청 확인됨');

  try {
    console.log('📝 요청 body 파싱 시작');
    const { url } = req.body;
    console.log('📝 추출된 URL:', url);

    if (!url) {
      console.log('❌ URL이 없음');
      return res.status(400).json({ 
        success: false, 
        error: "URL이 필요합니다" 
      });
    }

    console.log('🔍 네이버 블로그 미리보기 시작:', url);

    // 1. URL 유효성 검사
    if (!url.includes('blog.naver.com')) {
      return res.status(400).json({ 
        success: false, 
        error: "네이버 블로그 URL이 아닙니다" 
      });
    }

    // 2. 웹 스크래핑 (1차: 데스크톱 뷰)
    console.log('🌐 웹 스크래핑 시작:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('📡 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      console.log('❌ 웹 스크래핑 실패:', response.status);
      return res.status(400).json({ 
        success: false, 
        error: `블로그 접근 실패: ${response.status}` 
      });
    }

    console.log('📄 HTML 다운로드 시작');
    let html = await response.text();
    console.log('📄 1차 HTML 길이:', html.length);

    // 2-1. iframe(mainFrame) 내부 실제 본문 페이지로 이동
    try {
      const iframeMatch = html.match(/<iframe[^>]*id=["']mainFrame["'][^>]*src=["']([^"']+)["']/i);
      if (iframeMatch && iframeMatch[1]) {
        let iframeSrc = iframeMatch[1];
        if (iframeSrc.startsWith('/')) {
          iframeSrc = `https://blog.naver.com${iframeSrc}`;
        } else if (iframeSrc.startsWith('./')) {
          iframeSrc = `https://blog.naver.com/${iframeSrc.replace('./', '')}`;
        }
        console.log('🔗 mainFrame URL 감지:', iframeSrc);
        const iframeRes = await fetch(iframeSrc, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': url
          }
        });
        if (iframeRes.ok) {
          html = await iframeRes.text();
          console.log('📄 2차 iframe HTML 길이:', html.length);
        }
      }
    } catch (e) {
      console.log('iframe 추적 스킵:', e.message);
    }

    // 2-2. 모바일 뷰(m.blog.naver.com)로 재시도
    try {
      // 이미 모바일 뷰가 아니라면 meta og:url에서 모바일 본문 링크 추적
      if (!/m\.blog\.naver\.com/.test(url)) {
        const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        let mobileUrl = ogUrlMatch ? ogUrlMatch[1] : '';
        if (!mobileUrl || !/m\.blog\.naver\.com/.test(mobileUrl)) {
          // 일반 글 주소를 모바일로 변환 시도
          const pathMatch = url.match(/blog\.naver\.com\/(.+)/);
          if (pathMatch) {
            mobileUrl = `https://m.blog.naver.com/${pathMatch[1]}`;
          }
        }
        if (mobileUrl) {
          console.log('📱 모바일 뷰 재시도 URL:', mobileUrl);
          const mRes = await fetch(mobileUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
              'Referer': url
            }
          });
          if (mRes.ok) {
            const mHtml = await mRes.text();
            // 모바일 문서가 본문을 더 잘 포함하면 교체
            if (mHtml && mHtml.length > html.length * 0.5) {
              html = mHtml;
              console.log('📄 3차 모바일 HTML 사용:', html.length);
            }
          }
        }
      }
    } catch (e) {
      console.log('모바일 뷰 재시도 스킵:', e.message);
    }

    // 3. 강력한 제목 추출
    let title = '';
    
    // 패턴 1: 네이버 블로그 신형 구조 (se-title-text)
    const seTitleMatch = html.match(/<div[^>]*class="[^"]*se-title-text[^"]*"[^>]*>(.*?)<\/div>/s);
    if (seTitleMatch) {
      title = seTitleMatch[1].replace(/<[^>]*>/g, '').trim();
    } else {
      // 패턴 2: 네이버 블로그 구형 구조 (post-title)
      const postTitleMatch = html.match(/<h3[^>]*class="[^"]*post-title[^"]*"[^>]*>(.*?)<\/h3>/s);
      if (postTitleMatch) {
        title = postTitleMatch[1].replace(/<[^>]*>/g, '').trim();
      } else {
        // 패턴 3: 일반적인 제목 태그
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
        if (h1Match) {
          title = h1Match[1].replace(/<[^>]*>/g, '').trim();
        } else {
          // 패턴 4: title 태그
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/s);
          if (titleMatch) {
            title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          }
        }
      }
    }

    // 제목이 없으면 기본값
    if (!title) {
      title = '제목을 추출할 수 없습니다';
    }

    console.log('📝 추출된 제목:', title);

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

    // 콘텐츠가 없으면 기본값
    if (!content || content.length < 10) {
      content = '콘텐츠를 추출할 수 없습니다.';
    }

    console.log('📄 추출된 콘텐츠 길이:', content.length);

    // 5. 강력한 이미지 URL 추출 (다중 패턴)
    let images = [];
    
    // 패턴 1: 모든 img 태그 (src 속성)
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
    images = imageMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);
    
    // 패턴 2: 네이버 블로그 특화 이미지 (data-src, data-original, data-lazy)
    const dataSrcMatches = html.match(/<img[^>]*(data-src|data-original|data-lazy)=["']([^"']+)["'][^>]*>/gi) || [];
    const dataSrcImages = dataSrcMatches.map(img => {
      const srcMatch = img.match(/(data-src|data-original|data-lazy)=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[2] : null;
    }).filter(Boolean);
    
    // 패턴 3: 배경 이미지
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
    
    // 모든 이미지 합치기 (중복 제거)
    const allImages = [...images, ...dataSrcImages, ...bgImages, ...naverImages];
    let uniqueImages = [...new Set(allImages)];
    
    console.log('🔍 이미지 추출 결과:');
    console.log('  - src 속성:', images.length);
    console.log('  - data-* 속성:', dataSrcImages.length);
    console.log('  - 배경 이미지:', bgImages.length);
    console.log('  - 네이버 패턴:', naverImages.length);
    console.log('  - 총 고유 이미지:', uniqueImages.length);

    // 네이버 특화: 콘텐츠 이미지 선별 및 원본 변환
    function isNoise(url) {
      if (!url) return true;
      const u = url.toLowerCase();
      // 프로필/아이콘/스프라이트/버튼 등 노이즈 제거
      const noiseKeywords = [
        'profile', 'favicon', 'sprite', 'icon', 'ico_', 'btn', 'button', 'comment', 'reply',
        'like', 'share', 'logo', 'nav', 'menu', 'header', 'footer', 'top', 'thumb', 'thumbnail',
        'toolbar', 'emoji', 'sticker', 'badge', 'banner', 'widget', 'spstatic.net/static/'
      ];
      if (noiseKeywords.some(k => u.includes(k))) return true;
      // 도메인 기반 노이즈: 블로그 기본 리소스
      if (u.includes('blogimgs.naver.net') || u.includes('blogpfthumb-phinf.pstatic.net')) return true;
      return false;
    }

    function convertNaverToOriginal(url) {
      if (!url) return url;
      try {
        let out = url;
        // //로 시작하면 https 추가
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
      } catch {
        return url;
      }
    }

    // 필터링 및 변환 적용
    images = uniqueImages
      .filter(u => !isNoise(u))
      .map(convertNaverToOriginal);

    console.log('🖼️ 추출된 이미지 개수:', images.length);
    console.log('🖼️ 이미지 URL들:', images.slice(0, 3)); // 처음 3개만 로그

    // 6. 이미지 처리 (미리보기용 - 실제 이미지 다운로드 및 처리)
    const processedImages = [];
    const imagesToProcess = images.slice(0, 10); // 미리보기용으로 최대 10개만 처리
    
    console.log(`🖼️ 미리보기용 이미지 처리 시작: ${imagesToProcess.length}개`);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const imageUrl = imagesToProcess[i];
      
      try {
        console.log(`🖼️ 이미지 ${i + 1} 처리 시작: ${imageUrl}`);
        
        if (!imageUrl || (!imageUrl.startsWith("http") && !imageUrl.startsWith("//"))) {
          continue;
        }

        // 상대 URL을 절대 URL로 변환
        let absoluteImageUrl = imageUrl;
        if (imageUrl.startsWith("//")) {
          absoluteImageUrl = "https:" + imageUrl;
        } else if (imageUrl.startsWith("/")) {
          const urlObj = new URL(url);
          absoluteImageUrl = urlObj.origin + imageUrl;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const imageResponse = await fetch(absoluteImageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/*"
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          if (buffer.length < 1000) {
            continue;
          }

          const optimizedBuffer = await sharp(buffer)
            .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer();

          const fileName = `preview-${Date.now()}-${i + 1}.webp`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("blog-images")
            .upload(fileName, optimizedBuffer, {
              contentType: "image/webp",
              cacheControl: "3600"
            });

          if (uploadError) {
            console.error(`❌ 이미지 ${i + 1} 업로드 실패:`, uploadError);
            processedImages.push({
              originalUrl: absoluteImageUrl,
              processedUrl: absoluteImageUrl,
              alt: `이미지 ${i + 1}`,
              status: "upload-failed"
            });
            continue;
          }

          const publicUrl = supabase.storage
            .from("blog-images")
            .getPublicUrl(fileName).data.publicUrl;

          processedImages.push({
            originalUrl: absoluteImageUrl,
            processedUrl: publicUrl,
            alt: `이미지 ${i + 1}`,
            fileName: fileName,
            status: "success"
          });

          console.log(`✅ 이미지 ${i + 1} 처리 완료: ${fileName}`);
        }
        
      } catch (error) {
        console.error(`❌ 이미지 ${i + 1} 처리 실패:`, error.message);
        processedImages.push({
          originalUrl: imageUrl,
          processedUrl: imageUrl,
          alt: `이미지 ${i + 1}`,
          status: "error"
        });
      }
    }

    console.log(`🖼️ 미리보기 이미지 처리 완료: ${processedImages.length}개`);

    // 7. AI로 콘텐츠 정제 (미리보기용)
    console.log('🤖 AI 콘텐츠 정제 시작...');
    let aiProcessedContent = content;
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

**제목 처리 규칙:**
- 원본 제목과 유사한 모든 제목은 제거
- 소제목은 원본 제목과 완전히 다른 내용만 사용

중요: 다음 텍스트들은 제거하세요:
- "시리즈", "제품 모아보기", "시타신청", "이벤트", "더 보기"
- "top of page" 같은 네비게이션 텍스트
- 메뉴 관련 모든 텍스트
- 원본 제목과 유사한 모든 제목

출력 형식:
# 제목 (원본 제목만 사용)

## 소제목 (원본 제목과 완전히 다른 내용)

본문 내용...

## 소제목 (원본 제목과 완전히 다른 내용)

본문 내용...

### 태그
태그1, 태그2, 태그3`
          },
          {
            role: "user",
            content: `원본 제목: ${title}

원본 텍스트:
${content}

원본 태그:
${extractedTags.join(", ")}

위 내용을 전문적인 블로그 포스트로 정제해주세요.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      aiProcessedContent = response.choices[0].message.content;
      console.log('✅ AI 콘텐츠 정제 완료');
    } catch (error) {
      console.error('AI 콘텐츠 정제 오류:', error);
      // AI 실패 시 원본 콘텐츠 사용
    }

    // 7. 슬러그 생성 (저장하지 않으므로 임시)
    const timestamp = Date.now();
    const slug = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${timestamp}`;

    // 8. 미리보기 데이터 반환 (저장하지 않음)
    const successfulImages = processedImages.filter(img => img.status === 'success');
    const previewData = {
      title: title,
      slug: slug,
      content: aiProcessedContent,
      excerpt: aiProcessedContent.length > 200 ? aiProcessedContent.substring(0, 200) + '...' : aiProcessedContent,
      featured_image: successfulImages.length > 0 ? successfulImages[0].processedUrl : null,
      images: successfulImages.map(img => img.processedUrl), // 처리된 이미지 URL들
      processedImages: processedImages, // 전체 처리 정보
      imageCount: successfulImages.length,
      tags: ['네이버 블로그', '마이그레이션'],
      category: 'migrated',
      status: 'preview', // 미리보기 상태
      url: url // 원본 URL 저장
    };

    console.log('✅ 미리보기 데이터 생성 완료');
    console.log('📊 미리보기 요약:');
    console.log('  - 제목:', previewData.title);
    console.log('  - 콘텐츠 길이:', previewData.content.length);
    console.log('  - 이미지 개수:', previewData.imageCount);
    console.log('  - 상태:', previewData.status);

    return res.status(200).json({
      success: true,
      message: "미리보기 데이터 추출 완료",
      data: previewData
    });

  } catch (error) {
    console.error('❌ 미리보기 API 오류:', error);
    console.error('❌ 에러 스택:', error.stack);
    console.error('❌ 에러 타입:', typeof error);
    console.error('❌ 에러 메시지:', error.message);
    
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
