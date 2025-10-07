import { logFALAIUsage } from '../../lib/ai-usage-logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompts, blogPostId } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ message: 'Valid prompts array is required' });
    }

    console.log(`📝 수정된 프롬프트로 이미지 생성 시작: ${prompts.length}개`);
    
    const paragraphImages = [];

    // 각 프롬프트에 대해 이미지 생성
    for (let i = 0; i < prompts.length; i++) {
      const promptData = prompts[i];
      const startedAt = Date.now();
      
      console.log(`🔄 단락 ${i + 1} 이미지 생성 중...`);
      
      // FAL AI hidream-i1-dev로 이미지 생성 (고품질)
      const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptData.prompt,
          num_images: 1,
          image_size: "square",
          num_inference_steps: 28,
          seed: null
        })
      });

      if (!falResponse.ok) {
        const errorText = await falResponse.text();
        throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
      }

      const falResult = await falResponse.json();
      console.log('✅ FAL AI hidream-i1-dev 응답:', falResult);

      // FAL AI 사용량 로깅
      await logFALAIUsage('generate-paragraph-images-with-prompts', 'image-generation', {
        paragraphIndex: i,
        prompt: promptData.prompt,
        imageCount: 1,
        durationMs: Date.now() - startedAt
      });

      // hidream-i1-dev는 동기식 응답
      if (!falResult.images || falResult.images.length === 0) {
        throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
      }

      const imageResponse = { data: [{ url: falResult.images[0].url }] };

      // 이미지를 Supabase에 자동 저장
      try {
        console.log(`🔄 단락 ${i + 1} 이미지 Supabase 저장 시작...`);
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/save-generated-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imageResponse.data[0].url,
            fileName: `paragraph-image-custom-${Date.now()}-${i + 1}.png`,
            blogPostId: blogPostId || null
          })
        });
        
        let storedUrl = imageResponse.data[0].url; // 기본값은 원본 URL
        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          storedUrl = saveResult.storedUrl;
          console.log(`✅ 단락 ${i + 1} 이미지 Supabase 저장 성공:`, {
            originalUrl: imageResponse.data[0].url,
            storedUrl: storedUrl,
            fileName: saveResult.fileName
          });
        } else {
          const errorText = await saveResponse.text();
          console.error(`❌ 단락 ${i + 1} 이미지 Supabase 저장 실패:`, {
            status: saveResponse.status,
            error: errorText
          });
          console.warn(`⚠️ 단락 ${i + 1} 원본 FAL AI URL 사용:`, imageResponse.data[0].url);
        }
        
        paragraphImages.push({
          paragraphIndex: i,
          paragraph: promptData.paragraph,
          imageUrl: storedUrl, // Supabase 저장된 URL 사용
          originalUrl: imageResponse.data[0].url, // 원본 URL도 보관
          prompt: promptData.prompt
        });
      } catch (saveError) {
        console.error('이미지 저장 오류:', saveError);
        // 저장 실패 시 원본 URL 사용
        paragraphImages.push({
          paragraphIndex: i,
          paragraph: promptData.paragraph,
          imageUrl: imageResponse.data[0].url,
          prompt: promptData.prompt
        });
      }
    }

    res.status(200).json({
      success: true,
      imageUrls: paragraphImages.map(img => img.imageUrl),
      paragraphImages: paragraphImages,
      totalGenerated: paragraphImages.length
    });

  } catch (error) {
    console.error('❌ 수정된 프롬프트로 이미지 생성 에러:', error);
    res.status(500).json({
      error: '수정된 프롬프트로 이미지 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
