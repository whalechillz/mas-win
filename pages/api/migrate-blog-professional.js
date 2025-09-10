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

    // 3. 완전한 텍스트 추출 (모든 내용 포함)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    
    // 모든 텍스트 노드 추출 (HTML 태그 제거)
    const fullTextContent = bodyContent
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

    // 5. 모든 이미지 URL 추출
    const imageMatches = html.match(/<img[^>]+src="[^"]+"[^>]*>/gi) || [];
    const allImages = imageMatches.map(img => {
      const srcMatch = img.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : null;
    }).filter(Boolean);

    // 6. 이미지 처리 (탑 이미지 제외하고 첫 번째 콘텐츠 이미지부터)
    const processedImages = [];
    const contentImages = allImages.slice(1, 7); // 첫 번째 이미지(탑 이미지) 제외하고 2-7번째 이미지 사용

    for (let i = 0; i < contentImages.length; i++) {
      const imageUrl = contentImages[i];
      
      try {
        console.log(`🖼️ 이미지 ${i + 1} 처리 시작`);
        
        if (!imageUrl || !imageUrl.startsWith("http")) {
          continue;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const imageResponse = await fetch(imageUrl, {
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
              originalUrl: imageUrl,
              processedUrl: imageUrl,
              alt: `이미지 ${i + 1}`,
              status: "upload-failed"
            });
            continue;
          }

          const publicUrl = supabase.storage
            .from("blog-images")
            .getPublicUrl(fileName).data.publicUrl;

          processedImages.push({
            originalUrl: imageUrl,
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

    // 7. GPT-4o-mini로 완전한 콘텐츠 정제
    const structuredContent = await generateCompleteContent(title, fullTextContent, extractedTags, processedImages);

    // 8. 고유 slug 생성
    const slug = await generateUniqueSlug(title);

    // 9. Supabase에 저장
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: title,
        slug: slug,
        content: structuredContent,
        featured_image: processedImages[0]?.processedUrl || null,
        published_at: new Date().toISOString(),
        is_featured: false,
        author: "마쓰구골프",
        excerpt: fullTextContent.substring(0, 300) + "...",
        tags: extractedTags.join(", ")
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
1. 원본 텍스트에서 제목, 본문, 태그를 정확히 구분
2. 제목은 한 번만 사용 (중복 제거)
3. 본문을 논리적인 단락으로 구성 (H2, H3 제목 포함)
4. 모든 내용을 포함 (하단 내용 누락 방지)
5. 태그를 마지막에 정리
6. 마크다운 형식으로 출력

출력 형식:
# 제목

## 소제목 (필요시)

본문 내용...

## 소제목 (필요시)

본문 내용...

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
