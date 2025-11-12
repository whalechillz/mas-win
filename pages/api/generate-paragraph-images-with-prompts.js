import { logFALAIUsage } from '../../lib/ai-usage-logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompts, blogPostId, metadata } = req.body; // metadata: { account, type, date, message }

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

      // 이미지를 Supabase에 직접 저장 (다른 API들과 동일한 방식)
      try {
        console.log(`🔄 단락 ${i + 1} 이미지 Supabase 저장 시작...`);
        
        // 외부 이미지 URL에서 이미지 데이터 다운로드
        const imageFetchResponse = await fetch(imageResponse.data[0].url);
        if (!imageFetchResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
        }
        
        const imageBuffer = await imageFetchResponse.arrayBuffer();
        
        // 카카오 콘텐츠인 경우 날짜별 폴더 구조로 저장
        let fileName, filePath;
        if (metadata && metadata.account && metadata.type && metadata.date) {
          // originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/
          // date가 ISO 형식이거나 YYYY-MM-DD 형식일 수 있음
          const dateStr = metadata.date.includes('T') 
            ? metadata.date.split('T')[0] 
            : metadata.date.split(' ')[0]; // YYYY-MM-DD
          const accountFolder = metadata.account === 'account1' ? 'account1' : 'account2';
          const typeFolder = metadata.type; // background, profile, feed
          const timestamp = Date.now();
          fileName = `kakao-${metadata.account}-${metadata.type}-${timestamp}-${i + 1}.png`;
          filePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${fileName}`;
        } else {
          // 기존 방식 (블로그 등)
          fileName = `paragraph-image-custom-${Date.now()}-${i + 1}.png`;
          filePath = fileName;
        }
        
        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });
        
        if (uploadError) {
          throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
        }
        
        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);
        
        const storedUrl = publicUrl;
        console.log(`✅ 단락 ${i + 1} 이미지 Supabase 저장 성공:`, {
          originalUrl: imageResponse.data[0].url,
          storedUrl: storedUrl,
          fileName: fileName
        });
        
        // 이미지 메타데이터 저장 (계정, 용도 정보 포함)
        if (metadata) {
          try {
            const metadataPayload = {
              image_url: storedUrl,
              file_name: fileName,
              alt_text: metadata.message || promptData.prompt || '',
              title: `${metadata.account === 'account1' ? '대표폰' : '업무폰'} - ${metadata.type === 'background' ? '배경' : metadata.type === 'profile' ? '프로필' : '피드'}`,
              description: promptData.prompt || '',
              tags: [
                `카카오톡`,
                metadata.account === 'account1' ? '대표폰' : '업무폰',
                metadata.type === 'background' ? '배경' : metadata.type === 'profile' ? '프로필' : '피드',
                metadata.account === 'account1' ? '골드톤' : '블랙톤',
                metadata.account === 'account1' ? '시니어' : '젊은골퍼',
                metadata.date || ''
              ],
              category: metadata.account === 'account1' ? '시니어 골퍼' : '젊은 골퍼',
              upload_source: 'kakao_content_ai',
              channel: 'kakao',
              updated_at: new Date().toISOString()
            };
            
            const { error: metadataError } = await supabase
              .from('image_metadata')
              .upsert(metadataPayload, { onConflict: 'image_url' });
            
            if (metadataError) {
              console.error('메타데이터 저장 오류:', metadataError);
            } else {
              console.log('✅ 이미지 메타데이터 저장 완료:', metadataPayload.title);
            }
          } catch (metadataError) {
            console.error('메타데이터 저장 중 오류:', metadataError);
          }
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
      totalGenerated: paragraphImages.length,
      // 생성된 프롬프트도 반환 (캘린더 JSON 저장용)
      generatedPrompts: paragraphImages.map(img => img.prompt)
    });

  } catch (error) {
    console.error('❌ 수정된 프롬프트로 이미지 생성 에러:', error);
    res.status(500).json({
      error: '수정된 프롬프트로 이미지 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
