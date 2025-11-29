/**
 * 블로그 글에 이미지를 적절한 위치에 배치
 * 사용법: node scripts/optimize-image-placement.js <blogPostId>
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function optimizeImagePlacement(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 이미지 배치 최적화 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  if (!post.content) {
    console.log('⚠️ content가 비어있습니다.');
    return;
  }
  
  // 2. 모든 이미지 추출 (순서 유지)
  const images = [];
  if (post.content) {
    const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    let match;
    while ((match = markdownRegex.exec(post.content)) !== null) {
      images.push({
        alt: match[1].trim(),
        url: match[2].trim(),
        markdown: match[0]
      });
    }
  }
  
  console.log(`📊 추출된 이미지: ${images.length}개\n`);
  
  if (images.length === 0) {
    console.log('⚠️ 이미지가 없습니다.');
    return;
  }
  
  // 3. content에서 기존 이미지 제거 (나중에 재배치)
  let contentWithoutImages = post.content;
  images.forEach(img => {
    contentWithoutImages = contentWithoutImages.replace(img.markdown, '');
  });
  
  // 4. content를 단락으로 분리 (제목과 텍스트 구분)
  const allParagraphs = contentWithoutImages
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // 제목과 텍스트 단락 구분
  const paragraphs = [];
  const headings = [];
  
  allParagraphs.forEach(p => {
    if (p.match(/^#+\s/)) {
      headings.push(p);
    } else {
      paragraphs.push(p);
    }
  });
  
  console.log(`📊 제목 개수: ${headings.length}개`);
  console.log(`📊 텍스트 단락 개수: ${paragraphs.length}개\n`);
  
  // 5. 이미지를 적절한 위치에 배치하는 로직
  // 규칙:
  // - 첫 번째 이미지는 첫 번째 텍스트 단락 다음
  // - 나머지 이미지는 1-2개 텍스트 단락마다 배치 (이미지/단락 비율 0.5-1.0 유지)
  // - 마지막 이미지는 마지막 텍스트 단락 전
  
  const optimizedParagraphs = [];
  let imageIndex = 0;
  let headingIndex = 0;
  let paragraphIndex = 0;
  
  // 첫 번째 제목 추가 (메인 제목)
  if (headingIndex < headings.length) {
    optimizedParagraphs.push(headings[headingIndex]);
    headingIndex++;
  }
  
  // 텍스트 단락과 이미지 배치
  // 이미지가 많으면 텍스트 단락마다 이미지 배치
  const imagesPerParagraph = Math.ceil(images.length / Math.max(paragraphs.length, 1));
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // 현재 텍스트 단락 추가
    optimizedParagraphs.push(paragraph);
    
    // 이미지 배치 조건 확인
    // 텍스트 단락이 적으면 각 단락마다 이미지 배치
    if (imageIndex < images.length) {
      // 첫 번째 텍스트 단락 다음에는 항상 이미지 배치
      if (i === 0) {
        optimizedParagraphs.push(`\n![${images[imageIndex].alt}](${images[imageIndex].url})\n`);
        console.log(`   ✅ 이미지 배치: [${images[imageIndex].alt}] (${i + 1}번째 텍스트 단락 다음)`);
        imageIndex++;
      }
      // 나머지 텍스트 단락에도 이미지가 남아있으면 배치
      else if (i > 0 && imageIndex < images.length) {
        optimizedParagraphs.push(`\n![${images[imageIndex].alt}](${images[imageIndex].url})\n`);
        console.log(`   ✅ 이미지 배치: [${images[imageIndex].alt}] (${i + 1}번째 텍스트 단락 다음)`);
        imageIndex++;
      }
    }
    
    // 다음 제목이 있으면 추가 (섹션 제목)
    if (headingIndex < headings.length && i < paragraphs.length - 1) {
      optimizedParagraphs.push(headings[headingIndex]);
      headingIndex++;
      
      // 제목 다음에도 이미지가 남아있으면 배치
      if (imageIndex < images.length) {
        optimizedParagraphs.push(`\n![${images[imageIndex].alt}](${images[imageIndex].url})\n`);
        console.log(`   ✅ 이미지 배치: [${images[imageIndex].alt}] (제목 다음)`);
        imageIndex++;
      }
    }
  }
  
  // 6. 남은 이미지가 있으면 마지막에 추가
  while (imageIndex < images.length) {
    optimizedParagraphs.push(`\n![${images[imageIndex].alt}](${images[imageIndex].url})\n`);
    console.log(`   ✅ 이미지 배치: [${images[imageIndex].alt}] (마지막)`);
    imageIndex++;
  }
  
  const newContent = optimizedParagraphs.join('\n\n');
  
  // 7. 연속된 빈 줄 정리 (3개 이상 → 2개)
  const finalContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  // 8. 데이터베이스 업데이트
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ 
      content: finalContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', blogPostId);
  
  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError);
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 이미지 배치 최적화 완료');
  console.log('='.repeat(80));
  console.log(`   배치된 이미지: ${imageIndex}개`);
  console.log(`   업데이트된 content 길이: ${finalContent.length}자 (기존: ${post.content.length}자)`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  optimizeImagePlacement(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { optimizeImagePlacement };

