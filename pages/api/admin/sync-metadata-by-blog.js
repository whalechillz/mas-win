// 블로그 글별 메타데이터 동기화 API
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL 정규화 함수
const normalizeUrl = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
};

// 파일명에서 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  const keywords = [];
  const parts = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .split(/[-_]/)
    .filter(part => part.length > 2);
  
  keywords.push(...parts);
  return keywords;
};

// OpenAI Vision API로 이미지 분석
const analyzeImageWithOpenAI = async (imageUrl) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 이미지를 분석하여 다음 정보를 한국어로 제공해주세요:\n1. ALT 텍스트 (25-60자, SEO 최적화)\n2. 제목 (25-60자)\n3. 설명 (100-200자)\n4. 키워드 (5-10개, 쉼표로 구분)\n\nJSON 형식으로 반환: {"alt_text": "...", "title": "...", "description": "...", "keywords": ["...", "..."]}'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const metadata = JSON.parse(jsonMatch[0]);
      return {
        alt_text: metadata.alt_text || '',
        title: metadata.title || '',
        description: metadata.description || '',
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords : (metadata.keywords ? metadata.keywords.split(',') : [])
      };
    }

    return null;
  } catch (error) {
    console.error('❌ OpenAI Vision API 오류:', error);
    return null;
  }
};

// 블로그 글의 이미지 메타데이터 동기화
const syncMetadataForBlogPost = async (blogPostId) => {
  try {
    // 블로그 글 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, featured_image')
      .eq('id', blogPostId)
      .single();
    
    if (postError || !post) {
      throw new Error(`블로그 글을 찾을 수 없습니다: ${blogPostId}`);
    }
    
    const images = [];
    
    // 1. featured_image 확인
    if (post.featured_image) {
      images.push({
        url: post.featured_image,
        type: 'featured'
      });
    }
    
    // 2. content에서 이미지 URL 추출
    if (post.content) {
      // HTML 이미지 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const matches = post.content.matchAll(imgRegex);
      
      for (const match of matches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({
            url: imageUrl,
            type: 'content'
          });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      const markdownMatches = post.content.matchAll(markdownImgRegex);
      
      for (const match of markdownMatches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({
            url: imageUrl,
            type: 'content'
          });
        }
      }
    }
    
    console.log(`📊 블로그 글 "${post.title}" 이미지: ${images.length}개`);
    
    // 각 이미지에 대해 메타데이터 동기화
    const results = [];
    let processed = 0;
    let skipped = 0;
    let errors = [];
    
    for (const img of images) {
      try {
        // 기존 메타데이터 확인
        const normalizedUrl = normalizeUrl(img.url);
        const { data: existingMetadata } = await supabase
          .from('image_metadata')
          .select('image_url')
          .eq('image_url', img.url)
          .single();
        
        if (existingMetadata) {
          console.log(`⏭️ 이미지 메타데이터 이미 존재: ${img.url}`);
          skipped++;
          results.push({
            url: img.url,
            status: 'skipped',
            reason: 'already_exists'
          });
          continue;
        }
        
        // URL에서 파일명 추출
        const urlParts = img.url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const filenameKeywords = extractKeywordsFromFilename(fileName);
        
        // OpenAI Vision API로 이미지 분석
        let metadata = await analyzeImageWithOpenAI(img.url);
        
        if (!metadata) {
          // AI 분석 실패 시 파일명 기반 기본 메타데이터 생성
          metadata = {
            alt_text: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 3).join(' ')} 이미지 - 마스골프` 
              : `${fileName.replace(/\.[^/.]+$/, '')} 이미지`,
            title: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 5).join(', ')} 관련 이미지입니다.` 
              : '골프 관련 이미지',
            keywords: filenameKeywords
          };
        }
        
        // 키워드 통합
        const allKeywords = [...new Set([
          ...(metadata.keywords || []),
          ...filenameKeywords
        ])].slice(0, 10);
        
        // 메타데이터 저장
        const metadataPayload = {
          image_url: img.url,
          alt_text: metadata.alt_text || '',
          title: metadata.title || '',
          description: metadata.description || '',
          tags: allKeywords,
          upload_source: 'blog_sync',
          status: 'active',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        const { error: upsertError } = await supabase
          .from('image_metadata')
          .upsert(metadataPayload, { onConflict: 'image_url' });
        
        if (upsertError) {
          console.error(`❌ 메타데이터 저장 실패 (${img.url}):`, upsertError);
          errors.push({ url: img.url, error: upsertError.message });
          results.push({
            url: img.url,
            status: 'error',
            error: upsertError.message
          });
        } else {
          processed++;
          console.log(`✅ 메타데이터 생성 완료 (${processed}): ${img.url}`);
          results.push({
            url: img.url,
            status: 'success',
            metadata: metadataPayload
          });
        }
        
        // API 호출 제한 방지
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ 이미지 처리 오류 (${img.url}):`, error);
        errors.push({ url: img.url, error: error.message });
        results.push({
          url: img.url,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return {
      blogPost: {
        id: post.id,
        title: post.title,
        slug: post.slug
      },
      results,
      summary: {
        total: images.length,
        processed,
        skipped,
        errors: errors.length
      }
    };
    
  } catch (error) {
    console.error('❌ 블로그 글별 메타데이터 동기화 오류:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  console.log('🔄 블로그 글별 메타데이터 동기화 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { blogPostId, blogPostIds } = req.body;
      
      if (blogPostIds && Array.isArray(blogPostIds) && blogPostIds.length > 0) {
        // 여러 블로그 글 동기화
        console.log(`📊 여러 블로그 글 메타데이터 동기화 시작: ${blogPostIds.length}개`);
        
        const results = [];
        let totalProcessed = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        
        for (const id of blogPostIds) {
          try {
            const result = await syncMetadataForBlogPost(id);
            results.push(result);
            totalProcessed += result.summary.processed;
            totalSkipped += result.summary.skipped;
            totalErrors += result.summary.errors;
          } catch (error) {
            console.error(`❌ 블로그 글 ${id} 동기화 실패:`, error);
            totalErrors++;
            results.push({
              blogPost: { id },
              error: error.message
            });
          }
          
          // 블로그 글 간 간격
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return res.status(200).json({
          success: true,
          results,
          summary: {
            totalBlogPosts: blogPostIds.length,
            totalProcessed,
            totalSkipped,
            totalErrors
          }
        });
        
      } else if (blogPostId) {
        // 단일 블로그 글 동기화
        console.log(`📊 블로그 글 메타데이터 동기화 시작: ${blogPostId}`);
        
        const result = await syncMetadataForBlogPost(blogPostId);
        
        return res.status(200).json({
          success: true,
          ...result
        });
        
      } else {
        return res.status(400).json({
          error: 'blogPostId 또는 blogPostIds가 필요합니다.'
        });
      }
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 블로그 글별 메타데이터 동기화 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

