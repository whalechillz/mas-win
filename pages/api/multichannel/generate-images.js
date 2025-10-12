import { IMAGE_SPECS, IMAGE_GENERATION_OPTIONS, IMAGE_PROMPT_TEMPLATES, generateImagePrompt } from '../../../lib/image-specs';
import { AUDIENCE_TARGETS } from '../../../lib/audience-targets';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI 이미지 생성
async function generateImageWithOpenAI(prompt, size = '1024x1024', quality = 'standard') {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: 'natural'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('OpenAI 이미지 생성 오류:', error);
    throw error;
  }
}

// 이미지 다운로드 및 저장
async function downloadAndSaveImage(imageUrl, filename) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`multichannel/${filename}`, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // 공개 URL 생성
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(`multichannel/${filename}`);

    return {
      filename: filename,
      url: publicData.publicUrl,
      path: data.path,
      size: buffer.length
    };
  } catch (error) {
    console.error('이미지 저장 오류:', error);
    throw error;
  }
}

// 플랫폼별 이미지 생성
async function generatePlatformImages(blogPost, targetAudience, platforms) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const generatedImages = [];

  for (const platform of platforms) {
    const imageSpec = IMAGE_SPECS[platform];
    if (!imageSpec) {
      console.warn(`플랫폼 ${platform}에 대한 이미지 스펙이 없습니다.`);
      continue;
    }

    try {
      // 이미지 생성 프롬프트 생성
      const prompt = generateImagePrompt('product_showcase', {
        product_name: '마쓰구골프 드라이버',
        style_description: target.tone === '친근하고 감사의 마음' ? 'warm and professional' : 'professional and trustworthy',
        background_setting: 'modern golf course or studio setting'
      });

      // OpenAI 이미지 생성
      const size = `${imageSpec.width}x${imageSpec.height}`;
      const imageUrl = await generateImageWithOpenAI(prompt, size, 'standard');

      // 파일명 생성
      const timestamp = Date.now();
      const filename = `${platform}_${targetAudience}_${timestamp}.png`;

      // 이미지 다운로드 및 저장
      const savedImage = await downloadAndSaveImage(imageUrl, filename);

      generatedImages.push({
        platform: platform,
        target_audience: targetAudience,
        spec: imageSpec,
        ...savedImage,
        prompt: prompt,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error(`${platform} 이미지 생성 실패:`, error);
      // 실패해도 계속 진행
    }
  }

  return generatedImages;
}

// 네이버 블로그용 추가 이미지 생성
async function generateNaverBlogImages(blogPost, targetAudience, count = 3) {
  const target = AUDIENCE_TARGETS[targetAudience];
  const blogImageSpecs = [
    IMAGE_SPECS.naver_blog_1,
    IMAGE_SPECS.naver_blog_2,
    IMAGE_SPECS.naver_blog_3
  ].slice(0, count);

  const generatedImages = [];

  for (let i = 0; i < blogImageSpecs.length; i++) {
    const spec = blogImageSpecs[i];
    
    try {
      // 다양한 스타일의 프롬프트 생성
      const promptVariations = [
        generateImagePrompt('lifestyle', {
          target_audience: 'senior golfer',
          product_name: '마쓰구골프 드라이버',
          mood_description: 'confident and satisfied'
        }),
        generateImagePrompt('technical', {
          technical_concept: 'golf driver technology and distance improvement',
          color_scheme: 'professional blue and gold'
        }),
        generateImagePrompt('testimonial', {
          product_name: '마쓰구골프 드라이버',
          background_setting: 'golf course or driving range'
        })
      ];

      const prompt = promptVariations[i] || promptVariations[0];
      const size = `${spec.width}x${spec.height}`;
      const imageUrl = await generateImageWithOpenAI(prompt, size, 'standard');

      const timestamp = Date.now();
      const filename = `naver_blog_${i + 1}_${targetAudience}_${timestamp}.png`;

      const savedImage = await downloadAndSaveImage(imageUrl, filename);

      generatedImages.push({
        platform: `naver_blog_${i + 1}`,
        target_audience: targetAudience,
        spec: spec,
        ...savedImage,
        prompt: prompt,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error(`네이버 블로그 이미지 ${i + 1} 생성 실패:`, error);
    }
  }

  return generatedImages;
}

// 이미지 생성 상태 업데이트
async function updateImageGenerationStatus(contentId, status, images = []) {
  try {
    const { error } = await supabase
      .from('cc_content_calendar')
      .update({
        image_generation_status: status,
        generated_images: images,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('이미지 생성 상태 업데이트 오류:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contentId, 
      targetAudience, 
      platforms = [], 
      generateNaverBlogImages: generateBlogImages = false,
      blogImageCount = 3
    } = req.body;

    if (!contentId || !targetAudience) {
      return res.status(400).json({ 
        error: 'contentId와 targetAudience는 필수입니다.' 
      });
    }

    // 이미지 생성 상태를 'generating'으로 업데이트
    await updateImageGenerationStatus(contentId, 'generating');

    const allGeneratedImages = [];

    // 플랫폼별 이미지 생성
    if (platforms.length > 0) {
      const platformImages = await generatePlatformImages(
        { title: '마쓰구골프 드라이버' }, // 실제로는 DB에서 조회
        targetAudience, 
        platforms
      );
      allGeneratedImages.push(...platformImages);
    }

    // 네이버 블로그용 추가 이미지 생성
    if (generateBlogImages) {
      const blogImages = await generateNaverBlogImages(
        { title: '마쓰구골프 드라이버' }, // 실제로는 DB에서 조회
        targetAudience,
        blogImageCount
      );
      allGeneratedImages.push(...blogImages);
    }

    // 이미지 생성 상태를 'completed'로 업데이트
    await updateImageGenerationStatus(contentId, 'completed', allGeneratedImages);

    return res.json({
      success: true,
      contentId: contentId,
      targetAudience: targetAudience,
      generatedImages: allGeneratedImages,
      totalImages: allGeneratedImages.length,
      platforms: platforms,
      naverBlogImages: generateBlogImages,
      message: `총 ${allGeneratedImages.length}개의 이미지가 생성되었습니다.`
    });

  } catch (error) {
    console.error('이미지 생성 오류:', error);
    
    // 오류 발생 시 상태를 'failed'로 업데이트
    if (req.body.contentId) {
      try {
        await updateImageGenerationStatus(req.body.contentId, 'failed');
      } catch (updateError) {
        console.error('상태 업데이트 실패:', updateError);
      }
    }

    return res.status(500).json({ 
      error: '이미지 생성 실패',
      details: error.message 
    });
  }
}
