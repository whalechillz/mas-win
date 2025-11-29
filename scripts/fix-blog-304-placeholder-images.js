require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPlaceholderImages() {
  try {
    console.log('🔧 블로그 글 304 플레이스홀더 이미지 제거 시작...\n');

    // 1. 게시물 가져오기
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 304)
      .single();

    if (fetchError || !post) {
      console.error('❌ 게시물을 찾을 수 없습니다:', fetchError?.message);
      return;
    }

    console.log(`📝 게시물: ${post.title}`);
    console.log(`📝 본문 길이: ${post.content?.length || 0}자\n`);

    // 2. 플레이스홀더 이미지 제거
    let updatedContent = post.content || '';
    
    // 마크다운 이미지 문법에서 플레이스홀더 제거
    const placeholderPatterns = [
      /!\[([^\]]*)\]\(드라이버이미지URL\)/g,
      /!\[([^\]]*)\]\(마쓰구이미지URL\)/g,
      /!\[([^\]]*)\]\(이미지URL\)/g,
    ];

    let removedCount = 0;
    placeholderPatterns.forEach(pattern => {
      const matches = updatedContent.match(pattern);
      if (matches) {
        removedCount += matches.length;
        updatedContent = updatedContent.replace(pattern, '');
      }
    });

    if (removedCount === 0) {
      console.log('✅ 플레이스홀더 이미지가 없습니다.');
      return;
    }

    console.log(`🔍 제거된 플레이스홀더 이미지: ${removedCount}개\n`);

    // 3. 연속된 빈 줄 정리
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');

    // 4. 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 304);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      return;
    }

    console.log('✅ 플레이스홀더 이미지 제거 완료');
    console.log(`📝 업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content?.length || 0}자)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

fixPlaceholderImages();

