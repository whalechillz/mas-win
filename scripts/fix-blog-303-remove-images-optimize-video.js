require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeImagesAndOptimizeVideo() {
  try {
    console.log('🔧 블로그 글 303 이미지 제거 및 YouTube 영상 최적화 시작...\n');

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

    console.log(`📝 게시물: ${post.title}\n`);

    let updatedContent = post.content || '';

    // 2. 모든 마크다운 이미지 제거
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const imageMatches = updatedContent.match(imagePattern);
    
    if (imageMatches) {
      console.log(`📊 발견된 이미지: ${imageMatches.length}개`);
      imageMatches.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
      });
      
      updatedContent = updatedContent.replace(imagePattern, '');
      console.log(`✅ 이미지 제거 완료: ${imageMatches.length}개\n`);
    } else {
      console.log('⚠️ 제거할 이미지가 없습니다.\n');
    }

    // 3. YouTube iframe 최적화 (반응형으로 변경)
    // 기존: <iframe width="560" height="315" ...>
    // 변경: <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" ...></iframe></div>
    
    const iframePattern = /<iframe([^>]*width=["']560["'][^>]*height=["']315["'][^>]*)><\/iframe>/gi;
    
    updatedContent = updatedContent.replace(iframePattern, (match, attributes) => {
      // width와 height 속성 제거하고 나머지 속성 유지
      const cleanAttributes = attributes
        .replace(/\s*width=["']560["']/gi, '')
        .replace(/\s*height=["']315["']/gi, '')
        .trim();
      
      const optimizedIframe = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" ${cleanAttributes}></iframe>
</div>`;
      
      console.log('✅ YouTube 영상 반응형 최적화 완료');
      return optimizedIframe;
    });

    // 4. 연속된 빈 줄 정리
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');

    // 5. 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 303);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError.message);
      return;
    }

    console.log(`\n✅ 모든 작업 완료`);
    console.log(`📝 업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content?.length || 0}자)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

removeImagesAndOptimizeVideo();

