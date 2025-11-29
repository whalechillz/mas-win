require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateImageUrls() {
  try {
    console.log('🔧 블로그 글 303 이미지 URL 업데이트 시작...\n');

    // 1. 블로그 글 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 303)
      .single();

    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }

    let updatedContent = post.content || '';
    let updatedCount = 0;

    // 2. 루트 경로의 이미지 URL을 새 경로로 변경
    const imageUrlPattern = /!\[([^\]]*)\]\((https:\/\/[^)]+\/blog-images\/)(complete-migration-[^)]+)\)/g;
    
    updatedContent = updatedContent.replace(imageUrlPattern, (match, alt, baseUrl, filename) => {
      const newUrl = `${baseUrl}originals/blog/2017-03/303/${filename}`;
      updatedCount++;
      console.log(`   ✅ ${filename}`);
      console.log(`      ${baseUrl}${filename}`);
      console.log(`      → ${newUrl}`);
      return `![${alt}](${newUrl})`;
    });

    if (updatedCount === 0) {
      console.log('✅ 업데이트할 이미지 URL이 없습니다.');
      return;
    }

    // 3. 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 303);

    if (updateError) {
      console.error('❌ 콘텐츠 업데이트 실패:', updateError.message);
      return;
    }

    console.log(`\n✅ 이미지 URL 업데이트 완료 (${updatedCount}개)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

updateImageUrls();

