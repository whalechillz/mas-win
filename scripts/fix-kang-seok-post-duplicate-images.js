/**
 * 강석 글(ID 123)의 중복 이미지 제거 스크립트
 * 각 이미지가 1번씩만 나타나도록 수정
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

async function fixKangSeokPostDuplicateImages() {
  try {
    console.log('🔧 강석 글(ID 123)의 중복 이미지 제거 시작...\n');
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📎 글 ID: ${post.id}\n`);
    
    // 2. 모든 이미지 URL 추출 (순서대로)
    const allImageMatches = [];
    
    if (post.content) {
      // 마크다운 이미지 모두 찾기
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      let match;
      let index = 0;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        const alt = match[1].trim();
        const url = match[2].trim();
        const fileName = url.split('/').pop();
        
        allImageMatches.push({
          index: index,
          alt: alt,
          url: url,
          fileName: fileName,
          fullMatch: match[0]
        });
        index++;
      }
    }
    
    console.log(`📊 총 이미지 개수: ${allImageMatches.length}개\n`);
    
    // 3. 각 이미지 파일명별로 첫 번째만 유지하고 나머지 제거
    const seenFileNames = new Set();
    const imagesToKeep = [];
    const imagesToRemove = [];
    
    allImageMatches.forEach((img, idx) => {
      if (seenFileNames.has(img.fileName)) {
        // 이미 본 파일명이면 제거 대상
        imagesToRemove.push({
          index: idx + 1,
          alt: img.alt,
          fileName: img.fileName
        });
      } else {
        // 첫 번째로 본 파일명이면 유지
        seenFileNames.add(img.fileName);
        imagesToKeep.push({
          index: idx + 1,
          alt: img.alt,
          fileName: img.fileName
        });
      }
    });
    
    console.log('📋 유지할 이미지:');
    console.log('='.repeat(60));
    imagesToKeep.forEach(img => {
      console.log(`${img.index}. [${img.alt}] - ${img.fileName}`);
    });
    
    console.log('\n📋 제거할 이미지:');
    console.log('='.repeat(60));
    imagesToRemove.forEach(img => {
      console.log(`${img.index}. [${img.alt}] - ${img.fileName}`);
    });
    
    // 4. content에서 중복 이미지 제거
    let updatedContent = post.content;
    let removedCount = 0;
    
    // 역순으로 제거 (인덱스가 변경되지 않도록)
    imagesToRemove.reverse().forEach(imgToRemove => {
      // 해당 인덱스의 이미지를 찾아서 제거
      const allMatches = [...updatedContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/gi)];
      if (allMatches.length > imgToRemove.index - 1) {
        const matchToRemove = allMatches[allMatches.length - imagesToRemove.length + imagesToRemove.index - 1];
        if (matchToRemove) {
          const fileName = matchToRemove[2].split('/').pop();
          if (fileName === imgToRemove.fileName) {
            // 해당 이미지 마크다운 제거
            updatedContent = updatedContent.replace(matchToRemove[0], '');
            removedCount++;
            console.log(`✅ 제거: ${imgToRemove.index}번째 [${imgToRemove.alt}]`);
          }
        }
      }
    });
    
    // 더 간단한 방법: 각 파일명의 첫 번째만 유지
    const seenUrls = new Set();
    updatedContent = updatedContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/gi, (match, alt, url) => {
      const fileName = url.split('/').pop();
      if (seenUrls.has(fileName)) {
        // 이미 본 파일명이면 제거 (빈 문자열 반환)
        return '';
      } else {
        // 첫 번째로 본 파일명이면 유지
        seenUrls.add(fileName);
        return match;
      }
    });
    
    // 빈 줄 정리 (연속된 빈 줄 제거)
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');
    
    // 5. 업데이트된 이미지 개수 확인
    const finalImageMatches = [...updatedContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/gi)];
    console.log(`\n📊 최종 이미지 개수: ${finalImageMatches.length}개`);
    
    // 6. 데이터베이스 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', 123);
    
    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n✅ 중복 이미지 제거 완료!');
    console.log(`   제거된 이미지: ${imagesToRemove.length}개`);
    console.log(`   유지된 이미지: ${imagesToKeep.length}개`);
    
    return {
      post,
      imagesToKeep,
      imagesToRemove,
      finalImageCount: finalImageMatches.length
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  fixKangSeokPostDuplicateImages()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { fixKangSeokPostDuplicateImages };

