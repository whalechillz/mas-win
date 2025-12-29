/**
 * 487번 블로그의 모든 인물 모자를 MASSGOO 모자로 랜덤 교체
 * - AI 이미지 생성 + 제품 합성 활성화 기능 사용
 * - 모든 인물의 모자를 MASSGOO 모자 중 하나로 랜덤 변경
 * - 합성된 이미지로 블로그 본문 업데이트
 */

const { createClient } = require('@supabase/supabase-js');
const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// FAL AI API 키 설정
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  });
} else if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY
  });
}

/**
 * MASSGOO 모자 제품 목록 조회
 */
async function getMassgooCaps() {
  try {
    console.log('🔍 MASSGOO 모자 제품 목록 조회 중...\n');
    
    const { data: caps, error } = await supabase
      .from('product_composition')
      .select('id, slug, name, display_name, image_url')
      .eq('category', 'hat')
      .eq('composition_target', 'head')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('❌ 모자 제품 조회 실패:', error);
      throw error;
    }
    
    if (!caps || caps.length === 0) {
      console.warn('⚠️ 활성화된 모자 제품이 없습니다.');
      return [];
    }
    
    console.log(`✅ 모자 제품 ${caps.length}개 발견:`);
    caps.forEach((cap, idx) => {
      console.log(`   ${idx + 1}. ${cap.display_name || cap.name} (ID: ${cap.id}, slug: ${cap.slug})`);
    });
    console.log();
    
    return caps;
  } catch (error) {
    console.error('❌ 모자 제품 조회 오류:', error);
    throw error;
  }
}

/**
 * 랜덤 모자 선택
 */
function getRandomCap(caps) {
  if (!caps || caps.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * caps.length);
  return caps[randomIndex];
}

/**
 * 제품 합성 프롬프트 생성 (모자용)
 */
function generateHatCompositionPrompt(cap) {
  const hatTypeText = cap.hat_type === 'bucket' ? '버킷햇' : 
                     cap.hat_type === 'baseball' ? '야구모자' : 
                     cap.hat_type === 'visor' ? '비저' : '모자';
  
  return `Place the ${cap.display_name || cap.name} ${hatTypeText} on the person's head. The hat should fit naturally on the head, maintaining the person's facial features, hair, and all other elements exactly the same. Keep the original background exactly as it is. The hat should match the person's head size, angle, lighting, and shadows. Maintain natural shadows and reflections. The hat should appear as if it was originally part of the image, with the MASSGOO logo clearly visible if present.`;
}

/**
 * FAL AI를 직접 호출하여 모자 합성
 */
async function composeHatToImage(modelImageUrl, cap) {
  try {
    console.log(`   🎨 모자 합성 중: ${cap.display_name || cap.name}...`);
    
    // 제품 이미지 URL 가져오기 (참조 이미지로 사용)
    const imageUrls = [modelImageUrl];
    
    // 제품 이미지 URL 추가 (Supabase에서 가져온 경로를 절대 URL로 변환)
    if (cap.image_url) {
      // 상대 경로인 경우 Supabase 공개 URL로 변환
      let productImageUrl = cap.image_url;
      if (!productImageUrl.startsWith('http')) {
        // Supabase Storage 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(cap.image_url.startsWith('/') ? cap.image_url.substring(1) : cap.image_url);
        productImageUrl = publicUrl;
      }
      imageUrls.push(productImageUrl);
      console.log(`   📸 제품 이미지 추가: ${cap.image_url}`);
    }
    
    // 합성 프롬프트 생성
    const compositionPrompt = generateHatCompositionPrompt(cap);
    console.log(`   📝 프롬프트: ${compositionPrompt.substring(0, 100)}...`);
    
    // FAL AI 직접 호출
    console.log(`   🚀 FAL AI API 호출 중...`);
    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt: compositionPrompt,
        image_urls: imageUrls,
        num_images: 1,
        aspect_ratio: 'auto',
        output_format: 'png',
        resolution: '1K'
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((msg) => {
            console.log(`   📊 FAL AI: ${msg}`);
          });
        }
      },
    });
    
    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
    }
    
    const composedImage = result.data.images[0];
    console.log(`   ✅ 합성 완료: ${composedImage.url}`);
    
    return {
      url: composedImage.url,
      path: composedImage.url // 임시로 URL 사용
    };
  } catch (error) {
    console.error(`   ❌ 모자 합성 실패:`, error.message);
    if (error.body && error.body.detail) {
      console.error(`   상세 오류:`, JSON.stringify(error.body.detail, null, 2));
    }
    throw error;
  }
}

/**
 * 합성된 이미지를 블로그 폴더에 저장
 */
async function saveComposedImageToBlog(imageUrl, originalFileName, blogId, dateStr) {
  try {
    const yearMonth = dateStr.substring(0, 7); // YYYY-MM
    const folderPath = `originals/blog/${yearMonth}/${blogId}`;
    
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const timestamp = Date.now();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    
    // 원본 파일명에서 확장자 제거하고 새 이름 생성
    const originalNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${originalNameWithoutExt}-with-hat-${timestamp}.${fileExtension}`;
    const filePath = `${folderPath}/${newFileName}`;
    
    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || `image/${fileExtension}`,
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);
    
    console.log(`   ✅ 합성 이미지 저장 완료: ${newFileName}`);
    
    return {
      fileName: newFileName,
      publicUrl: publicUrl,
      path: filePath,
      originalUrl: imageUrl
    };
  } catch (error) {
    console.error('❌ 이미지 저장 실패:', error);
    throw error;
  }
}

/**
 * 487번 블로그의 모든 이미지에 모자 합성 적용
 */
async function composeHatsToBlog487() {
  try {
    console.log('🚀 487번 블로그 모자 합성 시작...\n');
    
    // 1. 487 블로그 포스트 확인
    const { data: blog487, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, content, published_at')
      .eq('id', 487)
      .single();
    
    if (blogError || !blog487) {
      console.error('❌ 487 블로그를 찾을 수 없습니다:', blogError);
      return;
    }
    
    console.log('✅ 487 블로그 확인:');
    console.log(`   제목: ${blog487.title}`);
    console.log(`   발행일: ${blog487.published_at || '없음'}\n`);
    
    const contentDate = blog487.published_at ? blog487.published_at.split('T')[0] : '2025-12-16';
    
    // 2. 블로그 이미지 목록 조회
    const folderPath = 'originals/blog/2025-12/487';
    
    console.log(`📁 이미지 폴더 확인: ${folderPath}\n`);
    
    const { data: images, error: imagesError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (imagesError) {
      console.error('❌ 이미지 목록 조회 실패:', imagesError);
      return;
    }
    
    if (!images || images.length === 0) {
      console.error('❌ 이미지를 찾을 수 없습니다.');
      return;
    }
    
    // 이미지 파일만 필터링
    let imageFiles = images.filter(img => 
      img.name.endsWith('.jpg') || 
      img.name.endsWith('.jpeg') || 
      img.name.endsWith('.png') || 
      img.name.endsWith('.webp')
    );
    
    // 테스트: 첫 번째 이미지만 처리
    // imageFiles = imageFiles.slice(0, 1);
    
    console.log(`✅ 이미지 ${imageFiles.length}개 발견:`);
    imageFiles.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.name}`);
    });
    console.log();
    
    // 3. MASSGOO 모자 제품 목록 조회
    const caps = await getMassgooCaps();
    
    if (caps.length === 0) {
      console.error('❌ 모자 제품이 없어 작업을 중단합니다.');
      return;
    }
    
    // 4. 각 이미지에 모자 합성 적용
    console.log('🎨 이미지 모자 합성 시작...\n');
    
    const composedImages = [];
    const errors = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const image = imageFiles[i];
      console.log(`\n[${i + 1}/${imageFiles.length}] ${image.name} 처리 중...`);
      
      try {
        // 이미지 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${image.name}`);
        
        // 랜덤 모자 선택
        const randomCap = getRandomCap(caps);
        console.log(`   선택된 모자: ${randomCap.display_name || randomCap.name} (ID: ${randomCap.id}, slug: ${randomCap.slug})`);
        
        // 모자 합성 API 호출
        const composedImage = await composeHatToImage(publicUrl, randomCap);
        
        if (!composedImage || !composedImage.url) {
          throw new Error('합성된 이미지 URL이 없습니다.');
        }
        
        // 합성된 이미지를 블로그 폴더에 저장
        const savedImage = await saveComposedImageToBlog(
          composedImage.url,
          image.name,
          blog487.id,
          contentDate
        );
        
        composedImages.push({
          original: {
            name: image.name,
            url: publicUrl,
            path: `${folderPath}/${image.name}`
          },
          composed: savedImage,
          cap: randomCap
        });
        
        console.log(`   ✅ 완료: ${savedImage.fileName}`);
        
        // API 호출 간 딜레이 (FAL AI rate limit 방지)
        if (i < imageFiles.length - 1) {
          console.log(`   ⏳ 다음 이미지 처리 전 대기 중... (3초)`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
        }
        
      } catch (error) {
        console.error(`   ❌ 오류: ${error.message}`);
        errors.push({
          image: image.name,
          error: error.message
        });
      }
    }
    
    console.log('\n📊 합성 결과:');
    console.log(`   성공: ${composedImages.length}개`);
    console.log(`   실패: ${errors.length}개\n`);
    
    if (errors.length > 0) {
      console.log('❌ 실패한 이미지:');
      errors.forEach(err => {
        console.log(`   - ${err.image}: ${err.error}`);
      });
      console.log();
    }
    
    if (composedImages.length === 0) {
      console.error('❌ 합성된 이미지가 없어 블로그를 업데이트할 수 없습니다.');
      return;
    }
    
    // 5. 블로그 본문 업데이트
    console.log('📝 블로그 본문 업데이트 중...\n');
    
    let updatedContent = blog487.content || '';
    
    // 각 원본 이미지 URL을 합성된 이미지 URL로 교체
    composedImages.forEach(({ original, composed }) => {
      // 마크다운 이미지 형식: ![alt](url)
      const markdownPattern = new RegExp(
        `!\\[[^\\]]*\\]\\(${escapeRegex(original.url)}\\)`,
        'g'
      );
      updatedContent = updatedContent.replace(
        markdownPattern,
        `![${original.name}](${composed.publicUrl})`
      );
      
      // HTML img 태그 형식: <img src="url" ...>
      const htmlPattern = new RegExp(
        `<img[^>]*src=["']${escapeRegex(original.url)}["'][^>]*>`,
        'gi'
      );
      updatedContent = updatedContent.replace(
        htmlPattern,
        `<img src="${composed.publicUrl}" alt="${original.name}">`
      );
      
      // 일반 URL 교체 (마크다운이나 HTML 형식이 아닌 경우)
      updatedContent = updatedContent.replace(
        new RegExp(escapeRegex(original.url), 'g'),
        composed.publicUrl
      );
      
      console.log(`   ✅ ${original.name} → ${composed.fileName}`);
    });
    
    // featured_image도 첫 번째 합성 이미지로 업데이트 (선택사항)
    const firstComposedImage = composedImages[0].composed;
    
    // 6. 블로그 포스트 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        featured_image: firstComposedImage.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 487);
    
    if (updateError) {
      console.error('❌ 블로그 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n🎉 블로그 모자 합성 완료!');
    console.log(`\n📊 최종 결과:`);
    console.log(`   처리된 이미지: ${composedImages.length}개`);
    console.log(`   실패한 이미지: ${errors.length}개`);
    console.log(`   featured_image 업데이트: ${firstComposedImage.fileName}`);
    console.log(`   본문 길이: ${updatedContent.length}자\n`);
    
    // 결과 요약 출력
    console.log('📋 사용된 모자 통계:');
    const capUsage = {};
    composedImages.forEach(({ cap }) => {
      const capName = cap.display_name || cap.name;
      capUsage[capName] = (capUsage[capName] || 0) + 1;
    });
    Object.entries(capUsage).forEach(([capName, count]) => {
      console.log(`   ${capName}: ${count}개`);
    });
    console.log();
    
  } catch (error) {
    console.error('❌ 모자 합성 오류:', error);
  }
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 스크립트 실행
composeHatsToBlog487();

