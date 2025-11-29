require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTitleAndContent() {
  try {
    console.log('🔧 블로그 글 302 제목 및 콘텐츠 수정 시작...\n');

    // 1. 블로그 글 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 302)
      .single();

    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }

    console.log(`📝 현재 제목: ${post.title}\n`);

    // 2. 제목 수정: "Mas9Popup:" → "Mas9Popup -"
    let newTitle = post.title;
    if (newTitle.startsWith('Mas9Popup:')) {
      newTitle = newTitle.replace(/^Mas9Popup:\s*/, 'Mas9Popup - ');
      console.log(`✅ 제목 수정: "${post.title}" → "${newTitle}"`);
    }

    // 3. 콘텐츠에서 플레이스홀더 이미지 제거
    let updatedContent = post.content || '';
    
    // "이미지URL" 플레이스홀더 제거
    const placeholderPattern = /!\[([^\]]*)\]\(이미지URL\)/g;
    const placeholderMatches = updatedContent.match(placeholderPattern);
    if (placeholderMatches) {
      updatedContent = updatedContent.replace(placeholderPattern, '');
      console.log(`✅ 플레이스홀더 이미지 제거: ${placeholderMatches.length}개`);
    }

    // 4. 연속된 빈 줄 정리
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');

    // 5. 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        title: newTitle,
        content: updatedContent 
      })
      .eq('id', 302);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      return;
    }

    console.log(`\n✅ 제목 및 콘텐츠 수정 완료`);
    console.log(`📝 업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content?.length || 0}자)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

fixTitleAndContent();

