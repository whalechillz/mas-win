/**
 * 블로그 글에서 중복 이미지 제거
 * 사용법: node scripts/remove-duplicate-blog-images.js <blogPostId>
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

async function removeDuplicateBlogImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 중복 이미지 제거 시작...\n`);
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
  const imageMatches = [];
  
  // 마크다운 이미지: ![alt](url)
  const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
  let match;
  let index = 0;
  while ((match = markdownRegex.exec(post.content)) !== null) {
    imageMatches.push({
      index: index++,
      type: 'markdown',
      fullMatch: match[0],
      alt: match[1].trim(),
      url: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // HTML 이미지: <img src="url">
  const htmlRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlRegex.exec(post.content)) !== null) {
    imageMatches.push({
      index: index++,
      type: 'html',
      fullMatch: match[0],
      url: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  console.log(`📊 추출된 이미지: ${imageMatches.length}개\n`);
  
  // 3. URL별로 그룹화하여 중복 찾기
  const urlGroups = {};
  imageMatches.forEach(img => {
    if (!urlGroups[img.url]) {
      urlGroups[img.url] = [];
    }
    urlGroups[img.url].push(img);
  });
  
  // 4. 중복 이미지 식별 (첫 번째는 유지, 나머지는 제거)
  const imagesToRemove = [];
  Object.entries(urlGroups).forEach(([url, imgs]) => {
    if (imgs.length > 1) {
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      console.log(`\n🔍 중복 발견: ${fileName}`);
      console.log(`   총 ${imgs.length}번 사용됨`);
      
      // 첫 번째는 유지, 나머지는 제거 대상
      for (let i = 1; i < imgs.length; i++) {
        imagesToRemove.push(imgs[i]);
        console.log(`   제거 대상: [${imgs[i].alt || '(alt 없음)'}] (${imgs[i].type}, 위치: ${imgs[i].index}번째)`);
      }
    }
  });
  
  if (imagesToRemove.length === 0) {
    console.log('\n✅ 중복 이미지가 없습니다.');
    return;
  }
  
  // 5. content에서 중복 이미지 제거 (역순으로 제거하여 인덱스 유지)
  let newContent = post.content;
  imagesToRemove
    .sort((a, b) => b.startIndex - a.startIndex) // 역순 정렬
    .forEach(img => {
      // 마크다운 이미지의 경우 앞뒤 공백/줄바꿈도 함께 제거
      let beforeChar = newContent[img.startIndex - 1];
      let afterChar = newContent[img.endIndex];
      
      let removeStart = img.startIndex;
      let removeEnd = img.endIndex;
      
      // 앞의 줄바꿈 제거
      if (beforeChar === '\n') {
        removeStart--;
        // 앞의 공백도 제거
        while (removeStart > 0 && (newContent[removeStart - 1] === ' ' || newContent[removeStart - 1] === '\t')) {
          removeStart--;
        }
      }
      
      // 뒤의 줄바꿈 제거
      if (afterChar === '\n') {
        removeEnd++;
        // 뒤의 공백도 제거
        while (removeEnd < newContent.length && (newContent[removeEnd] === ' ' || newContent[removeEnd] === '\t')) {
          removeEnd++;
        }
      }
      
      newContent = newContent.substring(0, removeStart) + newContent.substring(removeEnd);
      console.log(`   ✅ 제거 완료: [${img.alt || '(alt 없음)'}]`);
    });
  
  // 6. 연속된 빈 줄 정리 (3개 이상 → 2개)
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
  console.log('✅ 중복 이미지 제거 완료');
  console.log('='.repeat(80));
  console.log(`   제거된 이미지: ${imagesToRemove.length}개`);
  console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  removeDuplicateBlogImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { removeDuplicateBlogImages };

