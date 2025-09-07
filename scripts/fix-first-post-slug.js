const fs = require('fs').promises;
const path = require('path');

// 한글을 영문으로 변환하는 함수
function koreanToEnglish(text) {
  const koreanMap = {
    '뜨거운': 'hot',
    '여름': 'summer',
    '완벽한': 'perfect',
    '스윙': 'swing',
    '로얄살루트': 'royal-salute',
    '증정': 'gift',
    '행사': 'event',
    '골프': 'golf',
    '드라이버': 'driver',
    '고반발': 'high-rebound',
    '비거리': 'distance',
    '향상': 'improvement',
    '피팅': 'fitting',
    '전문': 'professional',
    '브랜드': 'brand',
    '마쓰구': 'masgolf',
    'MASGOLF': 'masgolf'
  };
  
  let result = text;
  
  // 한글 키워드를 영문으로 변환
  for (const [korean, english] of Object.entries(koreanMap)) {
    result = result.replace(new RegExp(korean, 'g'), english);
  }
  
  // 나머지 특수문자 제거 및 정리
  result = result
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return result;
}

async function fixFirstPostSlug() {
  try {
    console.log('🔧 첫 번째 게시물 슬러그 수정 시작...');
    
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1--.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    console.log(`📄 원본 제목: ${postData.title}`);
    
    // 새로운 슬러그 생성
    const newSlug = koreanToEnglish(postData.title);
    console.log(`🔗 새로운 슬러그: ${newSlug}`);
    
    // 데이터 업데이트
    postData.slug = newSlug;
    postData.meta_title = `${postData.title} | MASGOLF High-Rebound Driver`;
    postData.meta_description = `${postData.title} - 마쓰구골프 고반발 드라이버로 비거리를 늘려보세요. 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.`;
    
    // 파일명 변경
    const newFilePath = path.join(__dirname, '../mas9golf/migrated-posts', `post-1-${newSlug}.json`);
    
    // 새 파일로 저장
    await fs.writeFile(newFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    // 기존 파일 삭제
    await fs.unlink(postFilePath);
    
    console.log(`✅ 슬러그 수정 완료: ${newSlug}`);
    console.log(`📁 새 파일: ${newFilePath}`);
    
    // 이미지 파일명도 업데이트
    const imagesDir = path.join(__dirname, '../mas9golf/migrated-posts/images');
    const files = await fs.readdir(imagesDir);
    
    for (const file of files) {
      if (file.startsWith('post-1-')) {
        const newFileName = file.replace('post-1-', `post-1-${newSlug}-`);
        const oldPath = path.join(imagesDir, file);
        const newPath = path.join(imagesDir, newFileName);
        
        await fs.rename(oldPath, newPath);
        console.log(`  📸 이미지 파일명 변경: ${file} → ${newFileName}`);
        
        // 데이터에서 이미지 경로도 업데이트
        if (file === 'post-1-featured.jpg') {
          postData.featured_image = `/mas9golf/blog/images/${newFileName}`;
        }
        
        // 갤러리 이미지 경로 업데이트
        postData.images.forEach((img, index) => {
          if (img.localPath.includes(file)) {
            img.localPath = `/mas9golf/blog/images/${newFileName}`;
          }
        });
      }
    }
    
    // 업데이트된 데이터 다시 저장
    await fs.writeFile(newFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log('\n🎉 첫 번째 게시물 슬러그 수정 완료!');
    
  } catch (error) {
    console.error('❌ 슬러그 수정 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixFirstPostSlug()
    .then(() => {
      console.log('\n🚀 슬러그 수정 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixFirstPostSlug };
