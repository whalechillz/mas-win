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

// 골프 이미지인지 일반 이미지인지 판단
const isGolfImage = (imageUrl, fileName, folderPath = '') => {
  const urlLower = (imageUrl || '').toLowerCase();
  const nameLower = (fileName || '').toLowerCase();
  const folderLower = (folderPath || '').toLowerCase();
  
  return urlLower.includes('golf') || 
         urlLower.includes('골프') ||
         urlLower.includes('driver') ||
         urlLower.includes('club') ||
         urlLower.includes('swing') ||
         nameLower.includes('golf') ||
         nameLower.includes('골프') ||
         nameLower.includes('driver') ||
         nameLower.includes('club') ||
         nameLower.includes('swing') ||
         folderLower.includes('golf') ||
         folderLower.includes('골프');
};

// 골프 이미지 메타데이터 생성 (골프 특화)
const analyzeGolfImage = async (imageUrl, title = '', excerpt = '') => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/analyze-image-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl,
        title: title || '골프 이미지',
        excerpt: excerpt || '골프 관련 이미지'
      })
    });

    if (!response.ok) {
      throw new Error(`골프 이미지 분석 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // 키워드 처리 (문자열 또는 배열)
    let keywords = [];
    if (data.keywords) {
      if (typeof data.keywords === 'string') {
        keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
      } else if (Array.isArray(data.keywords)) {
        keywords = data.keywords;
      }
    }
    
    return {
      alt_text: data.alt_text || data.alt || '',
      title: data.title || '',
      description: data.description || '',
      keywords: keywords,
      age_estimation: data.age_estimation || '없음'
    };
  } catch (error) {
    console.error('❌ 골프 이미지 분석 오류:', error);
    return null;
  }
};

// 일반 이미지 메타데이터 생성 (범용)
const analyzeGeneralImage = async (imageUrl, title = '', excerpt = '') => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/analyze-image-general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl,
        title: title || '이미지',
        excerpt: excerpt || '일반 이미지'
      })
    });

    if (!response.ok) {
      throw new Error(`일반 이미지 분석 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // 키워드 처리 (문자열 또는 배열)
    let keywords = [];
    if (data.keywords) {
      if (typeof data.keywords === 'string') {
        keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
      } else if (Array.isArray(data.keywords)) {
        keywords = data.keywords;
      }
    }
    
      return {
      alt_text: data.alt_text || data.alt || '',
      title: data.title || '',
      description: data.description || '',
      keywords: keywords
    };
  } catch (error) {
    console.error('❌ 일반 이미지 분석 오류:', error);
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
    
    // ✅ 기존 메타데이터가 있는 이미지 먼저 확인하여 스킵 (시간 절약)
    const { forceReanalyze = false } = req.body;
    console.log(`📊 총 ${images.length}개 이미지 중 기존 메타데이터 확인 중...`);
    if (forceReanalyze) {
      console.log('⚠️ 강제 재생성 모드: 모든 이미지를 재생성합니다.');
    }
    const imagesToProcess = [];
    const imagesToSkip = [];
    
    for (const img of images) {
      try {
        // 강제 재생성 모드면 무조건 처리
        if (forceReanalyze) {
          imagesToProcess.push(img);
          continue;
        }
        
        // 기존 메타데이터 확인
        const normalizedUrl = normalizeUrl(img.url);
        const { data: existingMetadata } = await supabase
          .from('image_metadata')
          .select('image_url, alt_text, title')
          .eq('image_url', img.url)
          .single();
        
        // 메타데이터가 있고 ALT와 Title이 모두 있으면 스킵
        if (existingMetadata && existingMetadata.alt_text && existingMetadata.title) {
          console.log(`⏭️ 이미지 메타데이터 이미 존재 (ALT, Title 모두 있음): ${img.url}`);
          imagesToSkip.push(img);
          continue;
        }
        // 메타데이터는 있지만 ALT나 Title이 없으면 재생성 필요
        if (existingMetadata && (!existingMetadata.alt_text || !existingMetadata.title)) {
          console.log(`🔄 메타데이터 재생성 필요 (ALT 또는 Title 누락): ${img.url}`);
        }
        // 메타데이터가 없거나 불완전하면 처리 대상에 추가
        imagesToProcess.push(img);
      } catch (error) {
        // 오류 발생 시 처리 대상에 추가
        imagesToProcess.push(img);
      }
    }
    
    console.log(`✅ 처리 대상: ${imagesToProcess.length}개, 스킵: ${imagesToSkip.length}개`);
    
    // ✅ 처리 결과 배열 초기화
    const results = [];
    let processed = 0;
    let skipped = imagesToSkip.length;
    let errors = [];
    
    // 스킵된 이미지 결과 추가
    for (const img of imagesToSkip) {
      results.push({
        url: img.url,
        status: 'skipped',
        reason: 'already_exists'
      });
    }
    
    // ✅ 처리 대상 이미지만 처리
    let golfCount = 0;
    let generalCount = 0;
    
    for (const img of imagesToProcess) {
      try {
        
        // URL에서 파일명 추출
        const urlParts = img.url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const filenameKeywords = extractKeywordsFromFilename(fileName);
        
        // 폴더 경로 추출 (URL에서)
        const folderPath = urlParts.slice(0, -1).join('/');
        
        // 골프 이미지인지 일반 이미지인지 판단
        const isGolf = isGolfImage(img.url, fileName, folderPath);
        
        // 골프 이미지면 골프 특화 분석, 일반 이미지면 범용 분석
        let metadata = null;
        if (isGolf) {
          golfCount++;
          console.log(`⛳ 골프 이미지 감지: ${fileName}`);
          metadata = await analyzeGolfImage(img.url, post.title, post.content?.substring(0, 200) || '');
        } else {
          generalCount++;
          console.log(`🌐 일반 이미지 감지: ${fileName}`);
          metadata = await analyzeGeneralImage(img.url, post.title, post.content?.substring(0, 200) || '');
        }
        
        if (!metadata) {
          // AI 분석 실패 시 파일명 기반 기본 메타데이터 생성
          metadata = {
            alt_text: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 3).join(' ')} 이미지 - 마스골프` 
              : `${fileName.replace(/\.[^/.]+$/, '')} 이미지`,
            title: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 5).join(', ')} 관련 이미지입니다.` 
              : (isGolf ? '골프 관련 이미지' : '일반 이미지'),
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
        
        // API 호출 제한 방지 (OpenAI Vision API는 비용이 비싸지만, 성공을 목표로 적절한 간격)
        // 14개 이미지 성공을 위해 안정적인 간격 유지
        await new Promise(resolve => setTimeout(resolve, 400));
        
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
        errors: errors.length,
        golfCount,
        generalCount
      }
    };
    
  } catch (error) {
    console.error('❌ 블로그 글별 메타데이터 동기화 오류:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  console.log('🔄 블로그 글별 메타데이터 동기화 API 요청:', req.method, req.url);
  
  // ✅ 타임아웃 설정: 14개 이미지 성공을 목표로 충분한 시간 제공
  // Vercel Hobby 플랜은 10초, Pro 플랜은 60초 제한
  // vercel.json에서 30초로 설정했지만, 안전하게 28초로 설정 (성공 최대 목표)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간 초과 (28초 제한)')), 28000);
  });
  
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
        
        // ✅ 타임아웃과 함께 실행
        const result = await Promise.race([
          syncMetadataForBlogPost(blogPostId),
          timeoutPromise
        ]);
        
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
    
    // ✅ 타임아웃 오류 구분
    if (error.message && (error.message.includes('시간 초과') || error.message.includes('timeout') || error.message.includes('초과'))) {
      return res.status(504).json({
        error: '요청 시간 초과',
        details: '메타데이터 동기화가 너무 오래 걸려 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
        suggestion: '이미지 수가 많은 경우 여러 번 실행하거나, 특정 이미지만 동기화하세요.'
      });
    }
    
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}

