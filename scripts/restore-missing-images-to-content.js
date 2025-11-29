/**
 * 블로그 글 content에 누락된 이미지 복구
 * 사용법: node scripts/restore-missing-images-to-content.js <blogPostId>
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

async function restoreMissingImagesToContent(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 누락된 이미지 복구 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content, published_at')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  // 2. 갤러리 폴더의 이미지 목록 확인
  let galleryFolder = '';
  if (post.published_at) {
    const publishedAt = new Date(post.published_at);
    const yearMonth = publishedAt.toISOString().substring(0, 7);
    galleryFolder = `originals/blog/${yearMonth}/${blogPostId}`;
  } else {
    galleryFolder = `originals/blog/2015-08/${blogPostId}`;
  }
  
  const { data: galleryFiles, error: galleryError } = await supabase.storage
    .from('blog-images')
    .list(galleryFolder, { limit: 100 });
  
  if (galleryError) {
    console.error('⚠️ 갤러리 폴더를 찾을 수 없습니다:', galleryError.message);
    return;
  }
  
  const galleryImages = galleryFiles
    .filter(f => f.id)
    .map(f => {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`${galleryFolder}/${f.name}`);
      return {
        name: f.name,
        url: urlData.publicUrl
      };
    });
  
  console.log(`📊 갤러리 이미지: ${galleryImages.length}개\n`);
  
  // 3. content에 있는 이미지 URL 추출
  const contentImages = [];
  if (post.content) {
    const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    let match;
    while ((match = markdownRegex.exec(post.content)) !== null) {
      contentImages.push({
        alt: match[1].trim(),
        url: match[2].trim()
      });
    }
  }
  
  console.log(`📊 content 이미지: ${contentImages.length}개\n`);
  
  // 4. featured_image 확인 (content에 포함하지 않음)
  const { data: postWithFeatured } = await supabase
    .from('blog_posts')
    .select('featured_image')
    .eq('id', blogPostId)
    .single();
  
  const featuredImageUrl = postWithFeatured?.featured_image || null;
  
  // 5. 갤러리에 있지만 content에 없는 이미지 찾기 (featured_image 제외)
  const missingImages = galleryImages.filter(galleryImg => {
    // featured_image는 제외
    if (featuredImageUrl && galleryImg.url === featuredImageUrl) {
      return false;
    }
    // content에 없는 이미지만
    return !contentImages.some(contentImg => contentImg.url === galleryImg.url);
  });
  
  console.log(`📊 누락된 이미지: ${missingImages.length}개\n`);
  
  if (missingImages.length === 0) {
    console.log('✅ 누락된 이미지가 없습니다.');
    return;
  }
  
  // 5. 누락된 이미지를 content에 추가
  let newContent = post.content || '';
  
  missingImages.forEach((img, idx) => {
    // 파일명에서 alt 텍스트 추출 (예: complete-migration-1757771590842-7.webp → 골프 연습)
    const altText = getAltTextFromFileName(img.name);
    const imageMarkdown = `\n![${altText}](${img.url})\n`;
    
    // content 끝에 추가
    newContent += imageMarkdown;
    console.log(`   ✅ 이미지 추가: [${altText}] (${img.name})`);
  });
  
  // 6. 연속된 빈 줄 정리
  newContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  // 7. 데이터베이스 업데이트
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ 
      content: newContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', blogPostId);
  
  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError);
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 누락된 이미지 복구 완료');
  console.log('='.repeat(80));
  console.log(`   복구된 이미지: ${missingImages.length}개`);
  console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
  console.log('='.repeat(80));
}

// 파일명에서 alt 텍스트 추출 (이미지 메타데이터에서 가져오는 것이 더 정확하지만, 여기서는 파일명 기반으로 추정)
function getAltTextFromFileName(fileName) {
  // 파일명 패턴에 따라 alt 텍스트 추정
  // 실제로는 image_assets 테이블에서 alt_text를 가져오는 것이 좋음
  const nameMap = {
    'complete-migration-1757771590842-7.webp': '골프 연습',
    'complete-migration-1757771592268-10.webp': '골프 체험 후기',
    'complete-migration-1757771593103-12.webp': '골프 시타 현장'
  };
  
  return nameMap[fileName] || '골프 이미지';
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  restoreMissingImagesToContent(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { restoreMissingImagesToContent };

