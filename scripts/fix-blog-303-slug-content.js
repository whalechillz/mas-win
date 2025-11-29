require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSlugAndContent() {
  try {
    console.log('🔧 블로그 글 303 슬러그 변경 및 콘텐츠 수정 시작...\n');

    // 1. 블로그 글 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content')
      .eq('id', 303)
      .single();

    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }

    console.log(`📝 게시물: ${post.title}`);
    console.log(`📝 현재 슬러그: ${post.slug}\n`);

    let updatedContent = post.content || '';
    let updatedSlug = 'golf-event-with-stars-and-massgoo';

    // 2. 특정 링크 제거
    const linkPattern = /\[\[Mas9Golf\] 충북경제단체 골프친선대회 협찬행사\^\^\]\(\/blog\/mas9golf friendly-tournament-sponsorship\)/g;
    const linkMatches = updatedContent.match(linkPattern);
    if (linkMatches) {
      updatedContent = updatedContent.replace(linkPattern, '');
      console.log(`✅ 링크 제거: ${linkMatches.length}개`);
    }

    // 3. 특정 이미지 제거 (complete migration 1757772544303 1)
    const imagePattern = /!\[([^\]]*complete migration 1757772544303 1[^\]]*)\]\([^)]+\)/gi;
    const imageMatches = updatedContent.match(imagePattern);
    if (imageMatches) {
      updatedContent = updatedContent.replace(imagePattern, '');
      console.log(`✅ 이미지 제거: ${imageMatches.length}개`);
    }

    // 4. YouTube 영상 추가
    const youtubeUrl = 'https://www.youtube.com/watch?v=pdXs9OgRbFU&t=18s';
    const youtubeEmbed = `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/pdXs9OgRbFU?start=18" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n\n`;
    
    // 콘텐츠 끝에 YouTube 영상 추가 (이미 있으면 추가하지 않음)
    if (!updatedContent.includes('youtube.com/embed/pdXs9OgRbFU')) {
      updatedContent += youtubeEmbed;
      console.log(`✅ YouTube 영상 추가`);
    } else {
      console.log(`⏭️ YouTube 영상 이미 존재`);
    }

    // 5. 연속된 빈 줄 정리
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');

    // 6. 슬러그 및 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        slug: updatedSlug,
        content: updatedContent 
      })
      .eq('id', 303);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      return;
    }

    console.log(`\n✅ 슬러그 변경: ${post.slug} → ${updatedSlug}`);
    console.log(`✅ 콘텐츠 업데이트 완료`);
    console.log(`📝 업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content?.length || 0}자)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

fixSlugAndContent();

