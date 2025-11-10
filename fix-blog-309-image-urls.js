// ID 309 게시물의 이미지 URL을 Storage에 실제로 존재하는 파일명으로 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 파일명 매핑 (본문 URL → Storage 실제 파일명)
const fileNameMapping = {
  'september-funnel-1757899192753-secret-weapon-4-1.webp': 'september-funnel-1757859192753-secret-weapon-4-1.webp',
  'september-funnel-1757899192933-secret-weapon-black.webp': 'september-funnel-1757859192933-secret-weapon-black.webp',
  'september-funnel-1757899193551-vip-consultation-modern.webp': 'september-funnel-1757859193551-vip-consultation-modern.webp',
  'september-funnel-1757899193866-vip-swing-analysis-modern.webp': 'september-funnel-1757859193866-vip-swing-analysis-modern.webp',
  'september-funnel-1757899193709-vip-discount-modern.webp': 'september-funnel-1757859193709-vip-discount-modern.webp',
};

async function fixBlogPostImages() {
  try {
    console.log('🔧 ID 309 게시물의 이미지 URL 수정 시작...\n');

    // 1. 게시물 가져오기
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .eq('id', 309)
      .single();

    if (fetchError || !post) {
      console.error('❌ 게시물을 찾을 수 없습니다:', fetchError?.message);
      return;
    }

    console.log(`📝 게시물: ${post.title}`);
    console.log(`📝 본문 길이: ${post.content?.length || 0}자\n`);

    // 2. 본문에서 이미지 URL 찾기 및 수정
    let updatedContent = post.content || '';
    let urlUpdated = false;

    // 각 파일명 매핑에 대해 URL 교체
    for (const [oldFileName, newFileName] of Object.entries(fileNameMapping)) {
      // 마크다운 이미지 문법: ![alt](url)
      const markdownPattern = new RegExp(
        `(!\\[[^\\]]*\\]\\()([^)]*${oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^)]*)\\))`,
        'gi'
      );

      if (markdownPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(markdownPattern, (match, prefix, url, suffix) => {
          const newUrl = url.replace(oldFileName, newFileName);
          console.log(`  ✅ 마크다운 URL 교체: ${oldFileName} → ${newFileName}`);
          return `${prefix}${newUrl}${suffix}`;
        });
        urlUpdated = true;
      }

      // HTML img 태그: <img src="url" ...>
      const htmlPattern = new RegExp(
        `(<img[^>]+src=["'])([^"']*${oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^"']*))(["'][^>]*>)`,
        'gi'
      );

      if (htmlPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(htmlPattern, (match, prefix, url, suffix, postfix) => {
          const newUrl = url.replace(oldFileName, newFileName);
          console.log(`  ✅ HTML URL 교체: ${oldFileName} → ${newFileName}`);
          return `${prefix}${newUrl}${postfix}`;
        });
        urlUpdated = true;
      }

      // 일반 URL 교체 (다른 형식)
      const generalPattern = new RegExp(
        oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi'
      );

      if (generalPattern.test(updatedContent) && !updatedContent.includes(newFileName)) {
        updatedContent = updatedContent.replace(generalPattern, newFileName);
        console.log(`  ✅ 일반 URL 교체: ${oldFileName} → ${newFileName}`);
        urlUpdated = true;
      }
    }

    // 3. featured_image도 확인
    let updatedFeaturedImage = post.featured_image || '';
    if (updatedFeaturedImage) {
      for (const [oldFileName, newFileName] of Object.entries(fileNameMapping)) {
        if (updatedFeaturedImage.includes(oldFileName)) {
          updatedFeaturedImage = updatedFeaturedImage.replace(oldFileName, newFileName);
          console.log(`  ✅ featured_image URL 교체: ${oldFileName} → ${newFileName}`);
          urlUpdated = true;
        }
      }
    }

    // 4. 업데이트된 내용이 있으면 저장
    if (urlUpdated) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content: updatedContent,
          featured_image: updatedFeaturedImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', 309);

      if (updateError) {
        console.error('❌ 게시물 업데이트 실패:', updateError.message);
      } else {
        console.log('\n✅ 게시물 업데이트 완료!');
        console.log(`📝 수정된 본문 길이: ${updatedContent.length}자`);
      }
    } else {
      console.log('\n⚠️ 수정할 URL이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixBlogPostImages().catch(console.error);



