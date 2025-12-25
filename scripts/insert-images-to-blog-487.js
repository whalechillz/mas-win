/**
 * 487 블로그에 이미지를 본문에 삽입
 * - originals/blog/2025-12/487/ 폴더의 이미지를 찾아서 본문에 삽입
 * - 파일명 형식: blog-scene-{sceneStep}.jpg 또는 ai-generated-*.jpg
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 487 블로그에 이미지 삽입
 */
async function insertImagesToBlog487() {
  try {
    console.log('🚀 487 블로그 이미지 삽입 시작...\n');
    
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
    console.log(`   현재 본문 길이: ${(blog487.content || '').length}자\n`);
    
    // 2. originals/blog/2025-12/487/ 폴더의 이미지 찾기
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
    
    console.log(`✅ 이미지 ${images.length}개 발견:`);
    images.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.name}`);
    });
    console.log();
    
    // 3. 이미지 URL 생성 및 sceneStep 추출
    const imageList = images
      .filter(img => img.name.endsWith('.jpg') || img.name.endsWith('.png'))
      .map((img, index) => {
        // sceneStep 추출 (blog-scene-{sceneStep}.jpg 또는 ai-generated-*-scene{sceneStep}-*.jpg)
        let sceneStep = null;
        const sceneMatch = img.name.match(/scene(\d+)/i);
        if (sceneMatch) {
          sceneStep = parseInt(sceneMatch[1]);
        } else {
          // ai-generated-1766559316717-1-1.jpg 형식에서 timestamp 추출 불가
          // 파일명 순서로 추정 (1, 2, 3, 4, 5...)
          sceneStep = index + 1;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${folderPath}/${img.name}`);
        
        return {
          name: img.name,
          url: publicUrl,
          path: `${folderPath}/${img.name}`,
          sceneStep: sceneStep || 999, // sceneStep이 없으면 마지막에 배치
          index: index, // 원본 순서 보존
        };
      })
      .sort((a, b) => {
        // sceneStep이 999면 원본 순서 사용
        if (a.sceneStep === 999 && b.sceneStep === 999) {
          return a.index - b.index;
        }
        return a.sceneStep - b.sceneStep;
      }); // sceneStep 순서대로 정렬
    
    console.log('📸 이미지 정렬 완료:');
    imageList.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.name} (장면 ${img.sceneStep})`);
    });
    console.log();
    
    // 4. 본문에 이미지 삽입
    let blogContent = blog487.content || '';
    
    // 이미 이미지가 삽입되어 있는지 확인
    const hasImages = blogContent.includes('![') || blogContent.includes('<img');
    
    if (hasImages) {
      console.log('⚠️ 본문에 이미 이미지가 있습니다. 기존 이미지를 제거하고 새로 삽입합니다.\n');
      // 기존 이미지 마크다운 제거
      blogContent = blogContent
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/\n\n\n+/g, '\n\n'); // 연속된 줄바꿈 정리
    }
    
    // 단락으로 분리
    const paragraphs = blogContent.split('\n\n').filter(p => p.trim().length > 0);
    
    console.log(`📝 단락 수: ${paragraphs.length}`);
    
    // 첫 번째 이미지는 featured_image로 사용 (제외)
    const contentImages = imageList.slice(1); // 첫 번째 제외
    
    if (contentImages.length === 0) {
      console.log('⚠️ 본문에 삽입할 이미지가 없습니다 (첫 번째 이미지는 featured_image로 사용).\n');
      return;
    }
    
    // 장면별 키워드 매칭 규칙
    const sceneKeywordMapping = {
      1: ['들어가며', '시작', '소개', '개요', '서론'], // 장면1: 행복한 주인공
      2: ['비법', '방법', '기술', '팁', '시작', '5가지'], // 장면2: 행복+불안 전조
      3: ['백스윙', '타이밍', '문제', '고민', '어려움', '1.', '첫 번째'], // 장면3: 문제 발생
      4: ['다운스윙', '가속화', '피팅', '상담', '데이터', '설명', '2.', '두 번째'], // 장면4: 가이드 만남
      5: ['체중', '이동', '활용', '3.', '세 번째'], // 장면5: 가이드 장소 (배경 이미지)
      6: ['릴리스', '성공', '회복', '만족', '성취', '결과', '4.', '네 번째', '5.', '다섯 번째'], // 장면6: 성공 회복
      7: ['유연성', '근력', '마무리', '결론', '마지막', '시니어', '특별'], // 장면7: 여운 정적
    };
    
    /**
     * 맥락 기반 이미지 배치 찾기
     */
    function findContextualImagePlacement(paragraphs, contentImages) {
      const placements = [];
      
      // 각 단락을 분석하여 키워드 추출
      paragraphs.forEach((paragraph, index) => {
        const paragraphText = paragraph.toLowerCase();
        
        // 제목/헤딩 확인
        const isHeading = paragraph.match(/^#+\s/);
        const headingText = isHeading ? paragraph.replace(/^#+\s*/, '').toLowerCase() : '';
        
        // 각 이미지의 장면과 매칭 점수 계산
        contentImages.forEach((image, imgIdx) => {
          if (placements.find(p => p.imageIndex === imgIdx)) return; // 이미 배치된 이미지는 제외
          
          const sceneStep = image.sceneStep;
          const keywords = sceneKeywordMapping[sceneStep] || [];
          
          let matchScore = 0;
          
          // 제목/헤딩과 키워드 매칭
          if (isHeading && headingText) {
            keywords.forEach(keyword => {
              if (headingText.includes(keyword)) {
                matchScore += 10; // 제목 매칭은 높은 점수
              }
            });
          }
          
          // 본문 내용과 키워드 매칭
          keywords.forEach(keyword => {
            if (paragraphText.includes(keyword)) {
              matchScore += 5;
            }
          });
          
          // 다음 단락도 확인 (섹션 시작 부분)
          if (index < paragraphs.length - 1) {
            const nextParagraph = paragraphs[index + 1].toLowerCase();
            keywords.forEach(keyword => {
              if (nextParagraph.includes(keyword)) {
                matchScore += 3;
              }
            });
          }
          
          // 높은 점수를 받은 이미지를 해당 위치에 배치
          if (matchScore >= 8) {
            placements.push({
              paragraphIndex: index,
              imageIndex: imgIdx,
              image: image,
              matchScore: matchScore,
              reason: isHeading ? `제목 매칭: ${headingText.substring(0, 30)}` : `키워드 매칭: ${keywords.filter(k => paragraphText.includes(k)).join(', ')}`
            });
          }
        });
      });
      
      // 점수 순으로 정렬 (높은 점수부터)
      placements.sort((a, b) => b.matchScore - a.matchScore);
      
      // 중복 제거 (같은 이미지는 한 번만 배치)
      const uniquePlacements = [];
      const usedImageIndices = new Set();
      
      placements.forEach(placement => {
        if (!usedImageIndices.has(placement.imageIndex)) {
          uniquePlacements.push(placement);
          usedImageIndices.add(placement.imageIndex);
        }
      });
      
      return uniquePlacements;
    }
    
    // 맥락 기반 이미지 배치 찾기
    const contextualPlacements = findContextualImagePlacement(paragraphs, contentImages);
    
    console.log(`📊 맥락 기반 이미지 배치 분석:`);
    if (contextualPlacements.length > 0) {
      contextualPlacements.forEach(p => {
        console.log(`   장면 ${p.image.sceneStep}: ${p.paragraphIndex + 1}번째 단락 후 (${p.reason}, 점수: ${p.matchScore})`);
      });
    } else {
      console.log(`   맥락 매칭 없음 - 균등 배치 사용\n`);
    }
    console.log();
    
    // 맥락 기반 배치와 균등 배치를 결합
    const contentWithImages = [];
    let imageIndex = 0;
    const placedImageIndices = new Set(contextualPlacements.map(p => p.imageIndex));
    
    // 이미지/단락 비율 계산 (권장: 0.5-1.0)
    const imageParagraphRatio = contentImages.length / Math.max(paragraphs.length, 1);
    const paragraphsPerImage = imageParagraphRatio > 1.0 
      ? 1  // 이미지가 많으면 각 단락마다
      : imageParagraphRatio < 0.3
      ? 4  // 이미지가 적으면 4단락마다
      : 3; // 기본값: 3단락마다
    
    for (let i = 0; i < paragraphs.length; i++) {
      contentWithImages.push(paragraphs[i]);
      
      // 맥락 기반 배치 확인
      const contextualPlacement = contextualPlacements.find(p => p.paragraphIndex === i);
      if (contextualPlacement) {
        const image = contextualPlacement.image;
        const imageMarkdown = `\n\n![장면 ${image.sceneStep}](${image.url})\n\n`;
        contentWithImages.push(imageMarkdown);
        console.log(`   📝 맥락 기반 이미지 삽입 (${i + 1}번째 단락 후): ${image.name} (장면 ${image.sceneStep}) - ${contextualPlacement.reason}`);
        imageIndex++;
      }
      // 맥락 기반 배치가 없는 경우 균등 배치
      else if (imageIndex < contentImages.length && !placedImageIndices.has(imageIndex)) {
        // 첫 번째 이미지는 3-4단락 후에 배치
        if (imageIndex === 0 && i >= 3) {
          const image = contentImages[imageIndex];
          const imageMarkdown = `\n\n![장면 ${image.sceneStep}](${image.url})\n\n`;
          contentWithImages.push(imageMarkdown);
          console.log(`   📝 본문에 이미지 삽입 (${i + 1}번째 단락 후): ${image.name} (장면 ${image.sceneStep})`);
          imageIndex++;
        }
        // 나머지는 균등 배치
        else if (imageIndex > 0 && (i + 1) % paragraphsPerImage === 0) {
          const image = contentImages[imageIndex];
          const imageMarkdown = `\n\n![장면 ${image.sceneStep}](${image.url})\n\n`;
          contentWithImages.push(imageMarkdown);
          console.log(`   📝 본문에 이미지 삽입 (${i + 1}번째 단락 후): ${image.name} (장면 ${image.sceneStep})`);
          imageIndex++;
        }
      }
    }
    
    // 남은 이미지들을 마지막 단락 전에 배치 (맥락 매칭 실패한 이미지들)
    const remainingImages = contentImages.filter((img, idx) => !placedImageIndices.has(idx) && idx >= imageIndex);
    if (remainingImages.length > 0 && paragraphs.length > 0) {
      const lastParagraphIndex = contentWithImages.length - 1;
      const insertPositions = [];
      
      if (remainingImages.length === 1) {
        insertPositions.push(Math.max(0, lastParagraphIndex - 2));
      } else {
        const spacing = Math.floor((lastParagraphIndex - imageIndex) / (remainingImages.length + 1));
        for (let j = 0; j < remainingImages.length; j++) {
          insertPositions.push(imageIndex + (j + 1) * spacing);
        }
      }
      
      insertPositions.reverse().forEach((pos, idx) => {
        if (pos < contentWithImages.length && idx < remainingImages.length) {
          const image = remainingImages[idx];
          const imageMarkdown = `\n\n![장면 ${image.sceneStep}](${image.url})\n\n`;
          contentWithImages.splice(pos, 0, imageMarkdown);
          console.log(`   📝 본문에 이미지 삽입 (${pos}번째 위치): ${image.name} (장면 ${image.sceneStep})`);
        }
      });
    }
    
    // 본문 업데이트
    const updatedContent = contentWithImages.join('\n\n');
    
    // 5. featured_image 설정 (첫 번째 이미지)
    const featuredImage = imageList[0];
    const { data: { publicUrl: featuredImageUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(featuredImage.path);
    
    // 6. 블로그 포스트 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        featured_image: featuredImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 487);
    
    if (updateError) {
      console.error('❌ 블로그 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n🎉 블로그 이미지 삽입 완료!');
    console.log(`\n📊 삽입 결과:`);
    console.log(`   본문에 삽입된 이미지: ${imageIndex}개`);
    console.log(`   featured_image: ${featuredImage.name}`);
    console.log(`   최종 본문 길이: ${updatedContent.length}자\n`);
    
  } catch (error) {
    console.error('❌ 이미지 삽입 오류:', error);
  }
}

// 스크립트 실행
insertImagesToBlog487();

