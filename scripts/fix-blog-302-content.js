require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBlog302() {
  try {
    console.log('🔧 블로그 글 302 콘텐츠 수정 시작...\n');
    
    // 1. 현재 블로그 글 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image, content')
      .eq('id', 302)
      .single();
    
    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }
    
    console.log('📝 현재 제목:', post.title);
    console.log('📸 현재 Featured Image:', post.featured_image);
    console.log('\n=== 수정 작업 ===\n');
    
    let updatedContent = post.content || '';
    let updatedFeaturedImage = post.featured_image;
    
    // 2. 요가 이미지 삭제 (featured_image 제거)
    if (updatedFeaturedImage && updatedFeaturedImage.includes('complete-migration-1757777582497-1.webp')) {
      console.log('1️⃣ 요가 이미지 제거 (featured_image)');
      updatedFeaturedImage = null; // 또는 빈 문자열
    }
    
    // 3. 중복 헤드라인 제거
    // 제목: "Mas9Popup - 살다보면 한두번은 비공인 드라이버가 꼭 필요해져요"
    // 콘텐츠 첫 줄: "# 비공인 드라이버의 필요성 - 고반발드라이버 골프드라이버 추천"
    // 두 번째 헤드라인: "## 비공인 드라이버의 중요성"
    
    // 첫 번째 헤드라인 제거 (# 비공인 드라이버의 필요성...)
    const firstHeadingPattern = /^#\s*비공인\s*드라이버의\s*필요성[^\n]*\n/gm;
    if (firstHeadingPattern.test(updatedContent)) {
      console.log('2️⃣ 중복 헤드라인 제거: "# 비공인 드라이버의 필요성..."');
      updatedContent = updatedContent.replace(firstHeadingPattern, '');
    }
    
    // 두 번째 헤드라인도 제목과 중복이므로 제거하거나 단순화
    const secondHeadingPattern = /^##\s*비공인\s*드라이버의\s*중요성\s*\n/gm;
    if (secondHeadingPattern.test(updatedContent)) {
      console.log('3️⃣ 중복 헤드라인 제거: "## 비공인 드라이버의 중요성"');
      updatedContent = updatedContent.replace(secondHeadingPattern, '');
    }
    
    // 4. 3번째 이미지 삭제 (드라이버 샤프트가 너무 짧은 이미지)
    const shortShaftImagePattern = /!\[([^\]]*)\]\([^)]*masgolf-ai-1764415748145-2\.png[^)]*\)/g;
    if (shortShaftImagePattern.test(updatedContent)) {
      console.log('4️⃣ 드라이버 샤프트가 짧은 이미지 제거 (masgolf-ai-1764415748145-2.png)');
      updatedContent = updatedContent.replace(shortShaftImagePattern, '');
    }
    
    // 5. 빈 줄 정리 (3개 이상 연속된 빈 줄을 2개로)
    updatedContent = updatedContent.replace(/\n{4,}/g, '\n\n\n');
    
    // 6. 콘텐츠 앞부분 정리 (불필요한 빈 줄 제거)
    updatedContent = updatedContent.replace(/^\n+/, '');
    
    // 7. 데이터베이스 업데이트
    const updateData = {
      content: updatedContent
    };
    
    if (updatedFeaturedImage === null || updatedFeaturedImage === '') {
      updateData.featured_image = null;
    }
    
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', 302);
    
    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      return;
    }
    
    console.log('\n✅ 수정 완료!');
    console.log('\n=== 수정 결과 ===');
    console.log('제목:', post.title);
    console.log('Featured Image:', updateData.featured_image === null ? '(제거됨)' : updateData.featured_image);
    console.log('\n=== 수정된 콘텐츠 (첫 500자) ===');
    console.log(updatedContent.substring(0, 500));
    
    // 남은 이미지 확인
    const remainingImages = [...updatedContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    console.log('\n=== 남은 이미지 ===');
    if (remainingImages.length === 0) {
      console.log('이미지 없음');
    } else {
      remainingImages.forEach((m, i) => {
        console.log(`${i + 1}. [${m[1]}] ${m[2].substring(0, 80)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  }
}

fixBlog302();

