/**
 * 블로그 초안을 blog_posts로 복사하는 API
 * customer_consultations의 blog_draft_content를 blog_posts로 복사
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generateBlogFileName } from '../../../lib/filename-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reviewId } = req.body;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        error: 'reviewId가 필요합니다.'
      });
    }

    console.log('📋 블로그 초안 복사 시작:', { reviewId });

    // 1. customer_consultations에서 초안 정보 조회
    const { data: consultation, error: fetchError } = await supabase
      .from('customer_consultations')
      .select('id, customer_id, blog_draft_content, blog_draft_title, blog_draft_summary, blog_draft_type, review_images, content, topic, consultation_type')
      .eq('id', reviewId)
      .single();

    if (fetchError || !consultation) {
      throw new Error('후기 정보를 찾을 수 없습니다.');
    }

    // blog_draft_content가 없으면 content 사용 (기존 MD 마이그레이션 글)
    const blogContent = consultation.blog_draft_content || consultation.content;
    
    if (!blogContent) {
      return res.status(400).json({
        success: false,
        error: '블로그 내용이 없습니다.'
      });
    }

    // 2. 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', consultation.customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error('고객 정보를 찾을 수 없습니다.');
    }

    // 3. 연결된 이미지 조회 (featured_image용)
    let featuredImage = null;
    if (consultation.review_images && consultation.review_images.length > 0) {
      const { data: imageData } = await supabase
        .from('image_assets')
        .select('cdn_url')
        .eq('id', consultation.review_images[0])
        .single();
      
      if (imageData) {
        featuredImage = imageData.cdn_url || imageData.image_url;
      }
    }

    // 4. slug 생성
    const slug = (consultation.blog_draft_title || consultation.topic || `${customer.name}님의 골프 여정`)
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 200) + '-' + Date.now();

    // 4.5. 본문에서 이미지 URL 추출 및 복사
    const imageUrlRegex = /!\[([^\]]*)\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']/g;
    const imageUrls = new Set<string>();
    let match;
    
    while ((match = imageUrlRegex.exec(blogContent)) !== null) {
      const url = match[2] || match[3];
      if (url && !url.startsWith('http://localhost') && !url.startsWith('data:')) {
        imageUrls.add(url);
      }
    }
    
    console.log(`📸 발견된 이미지 URL: ${imageUrls.size}개`);
    
    // 이미지 복사 및 URL 매핑
    const urlMapping = new Map<string, string>();
    if (imageUrls.size > 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const blogFolder = `originals/blog/${year}-${month}`;
      
      // 임시로 blogPostId를 사용할 수 없으므로, 먼저 블로그 포스트를 생성한 후 이미지를 복사하는 방식으로 변경
      // 여기서는 URL만 추출하고, 블로그 포스트 생성 후 이미지 복사 진행
    }

    // 5. blog_posts에 저장 (임시 - 이미지 복사 전)
    const blogTitle = consultation.blog_draft_title || consultation.topic || `${customer.name}님의 골프 여정`;
    const blogExcerpt = consultation.blog_draft_summary || blogContent.substring(0, 200);
    
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        title: blogTitle,
        slug: slug,
        excerpt: blogExcerpt,
        content: blogContent,
        status: 'draft',
        featured_image: featuredImage,
        tags: ['고객후기', customer.name, consultation.blog_draft_type === 'integrated' ? '스토리보드' : '후기'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (blogError) {
      throw new Error(`블로그 포스트 생성 실패: ${blogError.message}`);
    }

    console.log('✅ 블로그 포스트 생성 완료:', blogPost.id);

    // 5.5. 이미지 복사 및 URL 교체 (블로그 포스트 생성 후)
    if (imageUrls.size > 0) {
      console.log('📸 이미지 복사 시작...');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const blogFolder = `originals/blog/${year}-${month}/${blogPost.id}`;
      
      for (const imageUrl of imageUrls) {
        try {
          // 이미지 다운로드
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            console.warn(`⚠️ 이미지 다운로드 실패: ${imageUrl}`);
            continue;
          }
          
          const imageBuffer = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          // 표준 블로그 파일명 생성
          const urlPath = new URL(imageUrl).pathname;
          const originalFileName = urlPath.split('/').pop() || 'image.jpg';
          const optimizedFileName = await generateBlogFileName(
            blogPost.id,
            originalFileName,
            new Date()
          );
          
          const newPath = `${blogFolder}/${optimizedFileName}`;
          
          // Storage에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(newPath, imageBuffer, {
              contentType: contentType,
              upsert: false
            });
          
          if (!uploadError && uploadData) {
            // Public URL 생성
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(newPath);
            
            urlMapping.set(imageUrl, publicUrl);
            console.log(`✅ 이미지 복사 완료: ${optimizedFileName}`);
            
            // image_metadata 업데이트 (이미지가 metadata에 있는 경우)
            const { data: existingImage } = await supabase
              .from('image_assets')
              .select('id, blog_posts')
              .eq('cdn_url', imageUrl)
              .single();
            
            if (existingImage) {
              const currentBlogPosts = existingImage.blog_posts || [];
              if (!currentBlogPosts.includes(blogPost.id)) {
                await supabase
                  .from('image_assets')
                  .update({
                    // ⚠️ image_assets에는 blog_posts, folder_path가 없음
                    // usage_count 업데이트는 별도로 처리 필요
                  })
                  .eq('id', existingImage.id);
              }
            }
          } else {
            console.warn(`⚠️ 이미지 업로드 실패: ${newPath}`, uploadError);
          }
        } catch (error) {
          console.warn(`⚠️ 이미지 복사 오류: ${imageUrl}`, error);
        }
      }
      
      // 본문의 이미지 URL 교체
      if (urlMapping.size > 0) {
        let updatedContent = blogContent;
        
        // 마크다운 이미지: ![alt](url)
        urlMapping.forEach((newUrl, oldUrl) => {
          const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const markdownRegex = new RegExp(`!\\[([^\\]]+)\\]\\(${escapedOldUrl}\\)`, 'g');
          updatedContent = updatedContent.replace(markdownRegex, `![$1](${newUrl})`);
        });
        
        // HTML 이미지: <img src="url">
        urlMapping.forEach((newUrl, oldUrl) => {
          const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const htmlRegex = new RegExp(`<img([^>]+)src=["']${escapedOldUrl}["']([^>]*)>`, 'gi');
          updatedContent = updatedContent.replace(htmlRegex, `<img$1src="${newUrl}"$2>`);
        });
        
        // blog_posts 업데이트
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ content: updatedContent })
          .eq('id', blogPost.id);
        
        if (updateError) {
          console.warn('⚠️ 블로그 본문 이미지 URL 업데이트 실패:', updateError);
        } else {
          console.log(`✅ ${urlMapping.size}개 이미지 URL 교체 완료`);
        }
      }
    }

    // 6. 허브 콘텐츠 생성 및 연결
    let hubContentId = null;
    try {
      const { data: hubContent, error: hubError } = await supabase
        .from('cc_content_calendar')
        .insert({
          title: consultation.blog_draft_title || blogPost.title,
          summary: consultation.blog_draft_summary || blogPost.excerpt,
          content_type: 'blog',
          status: 'draft',
          target_channels: ['blog'],
          related_blog_id: blogPost.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!hubError && hubContent) {
        hubContentId = hubContent.id;
        console.log('✅ 허브 콘텐츠 생성 완료:', hubContentId);
      }
    } catch (hubErr) {
      console.warn('⚠️ 허브 콘텐츠 생성 실패 (계속 진행):', hubErr);
    }

    // 7. customer_consultations 업데이트 (generated_blog_id 연결)
    const { error: updateError } = await supabase
      .from('customer_consultations')
      .update({
        generated_blog_id: blogPost.id,
        generated_hub_id: hubContentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (updateError) {
      console.warn('⚠️ 후기 레코드 업데이트 실패 (계속 진행):', updateError);
    }

    console.log('✅ 블로그로 복사 완료!');

    return res.status(200).json({
      success: true,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug
      },
      hubContentId: hubContentId,
      message: '블로그 초안이 블로그 관리로 복사되었습니다.'
    });

  } catch (error: any) {
    console.error('❌ 블로그 복사 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '블로그 복사 실패'
    });
  }
}
