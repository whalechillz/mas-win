/**
 * 완전한 블로그 마이그레이션 API
 * 제목 중복, 태그 누락, 하단 내용 누락 문제 해결
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("🚀 완전한 마이그레이션 시작:", url);

    // 1. 완전한 웹페이지 스크래핑
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. 제목 추출 (중복 방지)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "제목 없음";

    // 2.1. 날짜 추출 (다양한 형식 지원)
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

    // 3. 블로그 콘텐츠만 추출 (메뉴 제거)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    
    // 메뉴, 네비게이션, 헤더, 푸터 제거
    const cleanContent = bodyContent
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/<div[^>]*class="[^"]*nav[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*class="[^"]*menu[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*class="[^"]*header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*class="[^"]*top[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<ul[^>]*class="[^"]*nav[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, "")
      .replace(/<ul[^>]*class="[^"]*menu[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, "");
    
    // 모든 텍스트 노드 추출 (HTML 태그 제거)
    const fullTextContent = cleanContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 4. 태그 추출 (완전한 태그 추출)
    const tagMatches = html.match(/태그[^>]*>([^<]+)</gi) || [];
    const extractedTags = tagMatches.map(tag => {
      const content = tag.replace(/태그[^>]*>/, "").replace(/</, "").trim();
      return content.split(/\s+/).filter(t => t.length > 0);
    }).flat();

    // 5. 모든 이미지 URL 추출 (개선된 스크래핑)
    const imageMatches = html.match(/<img[^>]+src="[^"]+"[^>]*>/gi) || [];
    const allImages = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    // CSS 배경 이미지도 추출
    const backgroundImageMatches = html.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/gi) || [];
    const backgroundImages = backgroundImageMatches.map(bg => {
      const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
      return urlMatch ? urlMatch[1] : null;
    }).filter(Boolean);

    // 모든 이미지 URL 통합 및 중복 제거
    const allImageUrls = [...new Set([...allImages, ...backgroundImages])];
    
    console.log(`🖼️ 발견된 이미지 수: ${allImageUrls.length}`);
    console.log(`🖼️ 중복 제거 전: img=${allImages.length}, background=${backgroundImages.length}`);
    console.log(`🖼️ 중복 제거 후: ${allImageUrls.length}`);

    // Wix 이미지 URL을 고화질로 변환하는 함수
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

    // 이미지 필터링 - 로고/네비게이션 이미지 제외
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

    // 콘텐츠 이미지만 필터링
    const contentImages = allImageUrls.filter((url, index) => {
      const imgTag = imageMatches[index];
      return isContentImage(url, imgTag);
    });

    // Wix 이미지를 고화질로 변환
    const highQualityImages = contentImages.map(convertWixToHighQuality);
    
    console.log(`🖼️ 필터링된 콘텐츠 이미지 수: ${highQualityImages.length}`);
    console.log(`🖼️ 처리할 이미지 URL들:`, highQualityImages.slice(0, 5)); // 처음 5개만 로그

    // 6. 이미지 처리 (고화질 콘텐츠 이미지 가져오기)
    const processedImages = [];
    const imagesToProcess = highQualityImages.slice(0, 15); // 고화질 콘텐츠 이미지 (최대 15개)
    
    console.log(`🖼️ 실제 처리할 이미지 수: ${imagesToProcess.length}`);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const imageUrl = imagesToProcess[i];
      
      try {
        console.log(`🖼️ 이미지 ${i + 1} 처리 시작`);
        
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

          const fileName = `complete-migration-${Date.now()}-${i + 1}.webp`;
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
          originalUrl: absoluteImageUrl,
          processedUrl: absoluteImageUrl,
          alt: `이미지 ${i + 1}`,
          status: "error"
        });
      }
    }

    // 7. 본문에 이미지 삽입
    let contentWithImages = fullTextContent;
    
    // 성공적으로 처리된 이미지들을 본문에 삽입
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
    
    console.log(`🖼️ 본문에 삽입된 이미지 수: ${successfulImages.length - 1}`);

    // 8. GPT-4o-mini로 완전한 콘텐츠 정제
    const structuredContent = await generateCompleteContent(title, contentWithImages, extractedTags, processedImages);

    // 9. 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 10. Supabase에 저장 (tags 필드 제거)
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: title,
        slug: slug,
        content: structuredContent,
        featured_image: processedImages[0]?.processedUrl || null,
        published_at: publishedDate.toISOString(),
        status: 'published',
        excerpt: fullTextContent.substring(0, 300) + "..."
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`데이터베이스 저장 실패: ${insertError.message}`);
    }

    console.log(`✅ 완전한 마이그레이션 완료: ${post.id}`);

    return res.status(200).json({
      success: true,
      message: "완전한 마이그레이션 성공",
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image: post.featured_image,
        images: processedImages,
        tags: extractedTags,
        imageCount: processedImages.length,
        tagCount: extractedTags.length,
        status: "complete-migration-success"
      }
    });

  } catch (error) {
    console.error("완전한 마이그레이션 오류:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// GPT-4o-mini로 완전한 콘텐츠 정제
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
2. 제목은 한 번만 사용 (중복 제거)
3. 본문을 논리적인 단락으로 구성 (H2, H3 제목 포함)
4. 모든 실제 콘텐츠를 포함 (하단 내용 누락 방지)
5. 메뉴나 네비게이션 텍스트는 완전히 제거
6. 마크다운 형식으로 출력
7. **중요: 이미지 마크다운(![alt](url))은 절대 제거하지 말고 그대로 유지하세요**

중요: 다음 텍스트들은 제거하세요:
- "시리즈", "제품 모아보기", "시타신청", "이벤트", "더 보기"
- "시크리트포스", "시크리트웨폰" 등의 제품명 나열
- "top of page" 같은 네비게이션 텍스트
- 메뉴 관련 모든 텍스트

**이미지 처리 규칙:**
- 이미지 마크다운(![alt](url))은 그대로 유지
- 이미지 위치는 적절히 조정 가능
- 이미지 alt 텍스트는 의미있게 유지

출력 형식:
# 제목

## 소제목 (필요시)

본문 내용...

![이미지 설명](이미지URL)

본문 내용...

## 소제목 (필요시)

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

async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
  
  let slug = baseSlug;
  
  while (true) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .single();
    
    if (!existing) {
      break;
    }
    
    slug = `${baseSlug}-${Date.now()}`;
    break;
  }
  
  return slug;
}
