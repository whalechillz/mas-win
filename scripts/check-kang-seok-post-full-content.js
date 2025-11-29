/**
 * 강석 글(ID 123)의 전체 content에서 이미지 URL 상세 확인
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

async function checkKangSeokPostFullContent() {
  try {
    console.log('🔍 강석 글(ID 123)의 전체 content 확인 중...\n');
    
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
          index: index + 1,
          alt: alt,
          url: url,
          fileName: fileName
        });
        index++;
      }
    }
    
    console.log(`📊 총 이미지 개수: ${allImageMatches.length}개\n`);
    console.log('='.repeat(80));
    
    // 3. 각 이미지 출력
    allImageMatches.forEach((img, idx) => {
      console.log(`${idx + 1}. [${img.alt}]`);
      console.log(`   파일명: ${img.fileName}`);
      console.log(`   URL: ${img.url}`);
      console.log('');
    });
    
    // 4. 파일명별 그룹화
    const fileNameGroups = {};
    allImageMatches.forEach(img => {
      if (!fileNameGroups[img.fileName]) {
        fileNameGroups[img.fileName] = [];
      }
      fileNameGroups[img.fileName].push(img);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 파일명별 그룹화:');
    console.log('='.repeat(80));
    
    Object.entries(fileNameGroups).forEach(([fileName, images]) => {
      console.log(`\n${fileName} - ${images.length}번 사용됨:`);
      images.forEach((img, idx) => {
        console.log(`  ${idx + 1}. [${img.alt}] (위치: ${img.index}번째)`);
      });
    });
    
    // 5. 예상 이미지와 비교
    console.log('\n' + '='.repeat(80));
    console.log('📋 예상 보존 이미지 5개 확인:');
    console.log('='.repeat(80));
    
    const expectedImages = [
      'complete-migration-1757771589208-3.webp',
      'complete-migration-1757771590044-5.webp',
      'complete-migration-1757771590842-7.webp',
      'complete-migration-1757771591887-9.webp',
      'complete-migration-1757771592666-11.webp'
    ];
    
    expectedImages.forEach(fileName => {
      const found = fileNameGroups[fileName];
      if (found) {
        console.log(`✅ ${fileName} - ${found.length}번 사용됨`);
        found.forEach(img => {
          console.log(`   - [${img.alt}] (위치: ${img.index}번째)`);
        });
      } else {
        console.log(`❌ ${fileName} - 없음`);
      }
    });
    
    return {
      post,
      allImageMatches,
      fileNameGroups
    };
    
  } catch (error) {
    console.error('❌ 확인 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkKangSeokPostFullContent()
    .then(() => {
      console.log('\n✅ 확인 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkKangSeokPostFullContent };

