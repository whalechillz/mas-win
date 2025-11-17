import { logFALAIUsage } from '../../../lib/ai-usage-logger';
import { createClient } from '@supabase/supabase-js';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // 🔍 디버깅: 요청 정보 로깅
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    pathname: req.url?.split('?')[0],
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
      origin: req.headers.origin,
      'x-matched-path': req.headers['x-matched-path'],
      'x-vercel-id': req.headers['x-vercel-id'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
  };
  
  console.log('🔍 [API Debug] generate-paragraph-images-with-prompts 요청 도달:', JSON.stringify(debugInfo, null, 2));
  
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('🔍 [API Debug] OPTIONS 요청 처리');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log(`🔍 [API Debug] 잘못된 메서드: ${req.method}, POST만 허용`);
    return res.status(405).json({ 
      message: 'Method not allowed',
      debug: debugInfo
    });
  }

  try {
    const { prompts, blogPostId, metadata, imageCount = 1 } = req.body; // metadata: { account, type, date, message }, imageCount: 생성할 이미지 개수

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ message: 'Valid prompts array is required' });
    }

    // imageCount는 1, 2, 4만 허용
    const validImageCount = [1, 2, 4].includes(imageCount) ? imageCount : 1;

    console.log(`📝 수정된 프롬프트로 이미지 생성 시작: ${prompts.length}개 프롬프트, 각 ${validImageCount}개 이미지`);
    
    const paragraphImages = [];

    // 각 프롬프트에 대해 이미지 생성
    for (let i = 0; i < prompts.length; i++) {
      const promptData = prompts[i];
      const startedAt = Date.now();
      
      console.log(`🔄 단락 ${i + 1} 이미지 생성 중... (${validImageCount}개)`);
      
      // Phase 2.2: 날짜 기반 시드값 생성 (같은 날짜면 같은 시드, 다른 날짜면 다른 시드)
      let variationSeed = null;
      if (metadata && metadata.date) {
        const dateObj = new Date(metadata.date);
        const dateSeed = dateObj.getTime() % 1000000; // 날짜 기반 시드 (0-999999)
        const accountOffset = metadata.account === 'account1' ? 0 : 1000000;
        const typeOffset = metadata.type === 'background' ? 0 : metadata.type === 'profile' ? 2000000 : 3000000;
        variationSeed = dateSeed + accountOffset + typeOffset;
        console.log(`🌱 날짜 기반 시드값 생성: ${variationSeed} (date: ${metadata.date}, account: ${metadata.account}, type: ${metadata.type})`);
      }
      
      // 기본 방식: FAL AI hidream-i1-dev로 이미지 생성 (고품질)
      const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptData.prompt,
          num_images: validImageCount, // 여러 개 생성 가능
          image_size: "square",
          num_inference_steps: 28,
          seed: variationSeed, // Phase 2.2: 날짜별 고정 시드값
          negative_prompt: "text, words, letters, korean text, chinese text, english text, watermark, caption, subtitle, written content"
        })
      });

      if (!falResponse.ok) {
        const errorText = await falResponse.text();
        let errorMessage = `FAL AI API 오류: ${falResponse.status} - ${errorText}`;
        
        // FAL AI 크레딧 부족 오류 감지
        const isCreditError = 
          falResponse.status === 402 || // Payment Required
          falResponse.status === 403 || // Forbidden (크레딧 부족 가능)
          errorText.toLowerCase().includes('credit') ||
          errorText.toLowerCase().includes('balance') ||
          errorText.toLowerCase().includes('insufficient') ||
          errorText.toLowerCase().includes('quota') ||
          errorText.toLowerCase().includes('payment') ||
          errorText.toLowerCase().includes('billing');
        
        if (isCreditError) {
          console.error('💰 FAL AI 크레딧 부족 감지:', falResponse.status, errorText);
          errorMessage = '💰 FAL AI 계정에 크레딧이 부족합니다. 크레딧을 충전해주세요. (https://fal.ai/dashboard/usage-billing/credits)';
        }
        
        throw new Error(errorMessage);
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

      // 여러 개의 이미지가 생성된 경우 모두 처리
      const generatedImages = falResult.images.map((img, idx) => ({
        url: img.url,
        index: idx
      }));
      
      console.log(`✅ ${generatedImages.length}개 이미지 생성 완료`);

      // 각 이미지를 Supabase에 저장
      const savedImages = [];
      for (let imgIdx = 0; imgIdx < generatedImages.length; imgIdx++) {
        const imageData = generatedImages[imgIdx];
        
        try {
          console.log(`🔄 단락 ${i + 1} 이미지 ${imgIdx + 1}/${generatedImages.length} Supabase 저장 시작...`);
          
          // 외부 이미지 URL에서 이미지 데이터 다운로드
          const imageFetchResponse = await fetch(imageData.url);
          if (!imageFetchResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
          }
          
          let imageBuffer = await imageFetchResponse.arrayBuffer();
          imageBuffer = Buffer.from(imageBuffer);
          
          // 피드 이미지인 경우 카카오톡 최적 사이즈로 크롭 (1080x1350, 세로형 4:5)
          let finalBuffer = imageBuffer;
          let finalFileName, finalFilePath;
          
          if (metadata && metadata.type === 'feed') {
            try {
              console.log(`🔄 피드 이미지 카카오톡 최적화 시작 (1080x1350, 세로형 4:5, AI 크롭)...`);
              
              // Sharp 동적 import (Vercel 환경 호환성)
              const sharp = (await import('sharp')).default;
              
              // 카카오톡 피드 최적 사이즈: 1080x1350 (4:5 세로형) - AI 기반 중요 영역 크롭
              finalBuffer = await sharp(imageBuffer)
                .resize(1080, 1350, {
                  fit: 'cover',
                  position: 'entropy' // AI 기반 중요 영역 자동 감지
                })
                .jpeg({ quality: 90 })
                .toBuffer();
              
              console.log(`✅ 피드 이미지 최적화 완료 (원본: ${imageBuffer.length} bytes → 최적화: ${finalBuffer.length} bytes)`);
            } catch (optimizeError) {
              console.error('⚠️ 피드 이미지 최적화 실패 (원본 사용):', optimizeError);
              // 최적화 실패 시 원본 사용
              finalBuffer = imageBuffer;
            }
          }
          
          // 카카오 콘텐츠인 경우 날짜별 폴더 구조로 저장
          if (metadata && metadata.account && metadata.type && metadata.date) {
            // originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/
            // date가 ISO 형식이거나 YYYY-MM-DD 형식일 수 있음
            let dateStr = metadata.date;
            if (dateStr.includes('T')) {
              dateStr = dateStr.split('T')[0]; // ISO 형식: 2025-11-12T09:00:00.000Z -> 2025-11-12
            } else if (dateStr.includes(' ')) {
              dateStr = dateStr.split(' ')[0]; // 공백 포함: 2025-11-12 09:00:00 -> 2025-11-12
            }
            // 이미 YYYY-MM-DD 형식이면 그대로 사용
            
            const accountFolder = metadata.account === 'account1' ? 'account1' : 'account2';
            const typeFolder = metadata.type; // background, profile, feed
            const timestamp = Date.now();
            
            // 피드 이미지는 최적화된 JPEG로 저장
            if (metadata.type === 'feed') {
              finalFileName = `kakao-${metadata.account}-${metadata.type}-${timestamp}-${i + 1}-${imgIdx + 1}.jpg`;
              finalFilePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${finalFileName}`;
            } else {
              finalFileName = `kakao-${metadata.account}-${metadata.type}-${timestamp}-${i + 1}-${imgIdx + 1}.png`;
              finalFilePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${finalFileName}`;
            }
            
            // 경로 검증 로깅
            console.log(`📁 파일 저장 경로: ${finalFilePath}`);
            console.log(`   - 날짜: ${dateStr}, 계정: ${accountFolder}, 타입: ${typeFolder}`);
          } else {
            // 기존 방식 (블로그 등)
            finalFileName = `paragraph-image-custom-${Date.now()}-${i + 1}-${imgIdx + 1}.png`;
            finalFilePath = finalFileName;
          }
          
          // Supabase Storage에 업로드
          const contentType = metadata && metadata.type === 'feed' ? 'image/jpeg' : 'image/png';
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(finalFilePath, finalBuffer, {
              contentType: contentType,
              upsert: false
            });
          
          if (uploadError) {
            throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
          }
          
          // 공개 URL 생성
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(finalFilePath);
          
          const storedUrl = publicUrl;
          console.log(`✅ 단락 ${i + 1} 이미지 ${imgIdx + 1} Supabase 저장 성공:`, {
            originalUrl: imageData.url,
            storedUrl: storedUrl,
            fileName: finalFileName,
            optimized: metadata && metadata.type === 'feed' ? '카카오톡 피드 최적화 (1080x1350, 4:5 세로형)' : '원본'
          });
          
          // 이미지 메타데이터 저장 (계정, 용도 정보 포함)
          if (metadata) {
            try {
              const metadataPayload = {
                image_url: storedUrl,
                file_name: finalFileName,
                alt_text: metadata.message || promptData.prompt || '',
                title: `${metadata.account === 'account1' ? '대표폰' : '업무폰'} - ${metadata.type === 'background' ? '배경' : metadata.type === 'profile' ? '프로필' : '피드'} (${imgIdx + 1}/${generatedImages.length})`,
                description: promptData.prompt || '',
                tags: [
                  `카카오톡`,
                  metadata.account === 'account1' ? '대표폰' : '업무폰',
                  metadata.type === 'background' ? '배경' : metadata.type === 'profile' ? '프로필' : '피드',
                  metadata.account === 'account1' ? '골드톤' : '블랙톤',
                  metadata.account === 'account1' ? '시니어' : '젊은골퍼',
                  metadata.date || '',
                  `옵션${imgIdx + 1}`
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
          
          savedImages.push({
            paragraphIndex: i,
            paragraph: promptData.paragraph,
            imageUrl: storedUrl, // Supabase 저장된 URL 사용
            originalUrl: imageData.url, // 원본 URL도 보관
            prompt: promptData.prompt,
            optionIndex: imgIdx + 1
          });
        } catch (saveError) {
          console.error(`이미지 ${imgIdx + 1} 저장 오류:`, saveError);
          // 저장 실패 시 원본 URL 사용
          savedImages.push({
            paragraphIndex: i,
            paragraph: promptData.paragraph,
            imageUrl: imageData.url,
            prompt: promptData.prompt,
            optionIndex: imgIdx + 1
          });
        }
      }
      
      // 여러 개 생성된 경우 모두 추가
      paragraphImages.push(...savedImages);
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
    
    // 크레딧 부족 에러인지 확인
    const errorMessage = error.message || '';
    const isCreditError = errorMessage.includes('크레딧') || 
                         errorMessage.includes('credit') ||
                         errorMessage.includes('FAL AI 계정에 크레딧이 부족');
    
    if (isCreditError) {
      return res.status(402).json({
        error: '💰 FAL AI 계정에 크레딧이 부족합니다',
        details: 'FAL AI 계정에 크레딧을 충전해주세요. https://fal.ai/dashboard/usage-billing/credits',
        type: 'insufficient_credit'
      });
    }
    
    res.status(500).json({
      error: '수정된 프롬프트로 이미지 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// ============================================
// 사용되지 않는 함수들 (향후 사용 가능성을 위해 주석 처리)
// ============================================

/*
// 방식 A: square 생성 후 Sharp 크롭
async function generateWithMethodA(promptData, imageCount, metadata, paragraphIndex) {
  const startTime = Date.now();
  console.log(`🔄 방식 A 시작: square 생성 후 Sharp 크롭`);
  
  // FAL AI로 square 이미지 생성
  const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: promptData.prompt,
      num_images: imageCount,
      image_size: "square",
      num_inference_steps: 28,
      seed: null
    })
  });

  if (!falResponse.ok) {
    const errorText = await falResponse.text();
    throw new Error(`방식 A FAL AI API 오류: ${falResponse.status} - ${errorText}`);
  }

  const falResult = await falResponse.json();
  const generatedImages = falResult.images.map((img, idx) => ({
    url: img.url,
    index: idx
  }));
  
  // Sharp로 크롭
  const processedImages = [];
  let totalSize = 0;
  
  for (let imgIdx = 0; imgIdx < generatedImages.length; imgIdx++) {
    const imageData = generatedImages[imgIdx];
    const imageFetchResponse = await fetch(imageData.url);
    let imageBuffer = await imageFetchResponse.arrayBuffer();
    imageBuffer = Buffer.from(imageBuffer);
    
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    
    // Sharp로 1080x1350 크롭
    const finalBuffer = await sharp(imageBuffer)
      .resize(1080, 1350, {
        fit: 'cover',
        position: 'entropy'
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    totalSize += finalBuffer.length;
    
    // Supabase에 저장
    const dateStr = metadata.date.includes('T') 
      ? metadata.date.split('T')[0] 
      : metadata.date.split(' ')[0];
    const accountFolder = metadata.account === 'account1' ? 'account1' : 'account2';
    const timestamp = Date.now();
    const fileName = `kakao-${metadata.account}-${metadata.type}-${timestamp}-${paragraphIndex}-${imgIdx + 1}-methodA.jpg`;
    const filePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${metadata.type}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, finalBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`방식 A Supabase 업로드 실패: ${uploadError.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);
    
    processedImages.push({ 
      imageUrl: publicUrl, 
      originalUrl: imageData.url,
      method: 'A' 
    });
  }
  
  const generationTime = Date.now() - startTime;
  console.log(`✅ 방식 A 완료: ${processedImages.length}개 이미지, ${totalSize} bytes, ${generationTime}ms`);
  
  return {
    images: processedImages,
    totalSize,
    generationTime,
    method: 'square + sharp crop'
  };
}
*/

// 방식 B: portrait로 직접 생성 (현재 미사용)
/*
async function generateWithMethodB(promptData, imageCount, metadata, paragraphIndex) {
  const startTime = Date.now();
  console.log(`🔄 방식 B 시작: portrait 직접 생성`);
  
  // FAL AI로 portrait 이미지 직접 생성
  // 지원하는 옵션: "portrait", "vertical", "4:5" 등 테스트 필요
  const imageSizeOptions = ['portrait', 'vertical', '4:5'];
  let falResult = null;
  let usedSize = null;
  let falResponse = null;
  
  // 여러 옵션 시도 (첫 번째로 성공하는 옵션 사용)
  for (const sizeOption of imageSizeOptions) {
    try {
      falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptData.prompt,
          num_images: imageCount,
          image_size: sizeOption, // portrait, vertical, 4:5 등 시도
          num_inference_steps: 28,
          seed: null
        })
      });
      
      if (falResponse.ok) {
        falResult = await falResponse.json();
        usedSize = sizeOption;
        console.log(`✅ 방식 B 성공: image_size="${sizeOption}" 사용`);
        break;
      } else {
        const errorText = await falResponse.text();
        console.log(`⚠️ 방식 B 옵션 "${sizeOption}" 실패 (${falResponse.status}), 다음 옵션 시도...`);
      }
    } catch (error) {
      console.log(`⚠️ 방식 B 옵션 "${sizeOption}" 오류, 다음 옵션 시도...`, error.message);
      continue;
    }
  }
  
  if (!falResult || !falResult.images) {
    throw new Error('방식 B: FAL AI에서 portrait 이미지 생성 실패 (모든 옵션 시도 실패)');
  }
  
  const generatedImages = falResult.images.map((img, idx) => ({
    url: img.url,
    index: idx
  }));
  
  // 이미 세로형이므로 최소한의 리사이즈만 (필요시)
  const processedImages = [];
  let totalSize = 0;
  
  for (let imgIdx = 0; imgIdx < generatedImages.length; imgIdx++) {
    const imageData = generatedImages[imgIdx];
    const imageFetchResponse = await fetch(imageData.url);
    let imageBuffer = await imageFetchResponse.arrayBuffer();
    imageBuffer = Buffer.from(imageBuffer);
    
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    
    // 필요시 정확한 사이즈로 리사이즈 (이미 세로형이면 스킵 가능)
    let finalBuffer = imageBuffer;
    const sharpImage = sharp(imageBuffer);
    const imageMetadata = await sharpImage.metadata();
    
    // 1080x1350이 아니면 리사이즈
    if (imageMetadata.width !== 1080 || imageMetadata.height !== 1350) {
      finalBuffer = await sharpImage
        .resize(1080, 1350, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      // 이미 올바른 사이즈면 JPEG로만 변환
      finalBuffer = await sharpImage
        .jpeg({ quality: 90 })
        .toBuffer();
    }
    
    totalSize += finalBuffer.length;
    
    // Supabase에 저장
    const dateStr = metadata.date.includes('T') 
      ? metadata.date.split('T')[0] 
      : metadata.date.split(' ')[0];
    const accountFolder = metadata.account === 'account1' ? 'account1' : 'account2';
    const timestamp = Date.now();
    const fileName = `kakao-${metadata.account}-${metadata.type}-${timestamp}-${paragraphIndex}-${imgIdx + 1}-methodB.jpg`;
    const filePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${metadata.type}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, finalBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`방식 B Supabase 업로드 실패: ${uploadError.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);
    
    processedImages.push({ 
      imageUrl: publicUrl, 
      originalUrl: imageData.url,
      method: 'B' 
    });
  }
  
  const generationTime = Date.now() - startTime;
  console.log(`✅ 방식 B 완료: ${processedImages.length}개 이미지, ${totalSize} bytes, ${generationTime}ms (사용된 옵션: ${usedSize})`);
  
  return {
    images: processedImages,
    totalSize,
    generationTime,
    method: `portrait direct (${usedSize})`
  };
}
*/
