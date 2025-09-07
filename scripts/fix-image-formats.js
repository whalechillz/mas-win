const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 이미지 형식 변환 및 수정 스크립트
async function fixImageFormats() {
  try {
    console.log('🔧 이미지 형식 변환 시작...');
    
    const imagesDir = path.join(__dirname, '../public/mas9golf/blog/images');
    const files = await fs.readdir(imagesDir);
    
    console.log(`📊 발견된 이미지 파일: ${files.length}개`);
    
    for (const file of files) {
      if (file.startsWith('post-1-')) {
        const filePath = path.join(imagesDir, file);
        console.log(`\n🖼️ 처리 중: ${file}`);
        
        // 파일 형식 확인
        try {
          const { stdout } = await execAsync(`file "${filePath}"`);
          console.log(`  📋 파일 형식: ${stdout.trim()}`);
          
          // AVIF 파일인 경우 PNG로 변환
          if (stdout.includes('AVIF Image')) {
            const newFileName = file.replace('.jpg', '.png');
            const newFilePath = path.join(imagesDir, newFileName);
            
            console.log(`  🔄 AVIF → PNG 변환: ${file} → ${newFileName}`);
            
            // ImageMagick을 사용한 변환 (없으면 ffmpeg 사용)
            try {
              await execAsync(`magick "${filePath}" "${newFilePath}"`);
              console.log(`  ✅ ImageMagick 변환 완료`);
            } catch (magickError) {
              try {
                await execAsync(`ffmpeg -i "${filePath}" "${newFilePath}" -y`);
                console.log(`  ✅ FFmpeg 변환 완료`);
              } catch (ffmpegError) {
                console.log(`  ❌ 변환 실패: ImageMagick과 FFmpeg 모두 없음`);
                // 수동으로 파일명만 변경
                await fs.rename(filePath, newFilePath);
                console.log(`  📝 파일명만 변경: ${file} → ${newFileName}`);
              }
            }
            
            // 기존 파일 삭제
            try {
              await fs.unlink(filePath);
              console.log(`  🗑️ 기존 파일 삭제: ${file}`);
            } catch (error) {
              console.log(`  ⚠️ 기존 파일 삭제 실패: ${error.message}`);
            }
            
          } else {
            console.log(`  ✅ 이미 올바른 형식: ${file}`);
          }
          
        } catch (error) {
          console.log(`  ❌ 파일 확인 실패: ${error.message}`);
        }
      }
    }
    
    console.log('\n🔄 게시물 데이터 업데이트 중...');
    
    // 게시물 데이터에서 이미지 경로 업데이트
    const postFilePath = path.join(__dirname, '../mas9golf/migrated-posts/post-1-hot-summer-perfect-swing-royal-salute-gift-event.json');
    const postData = JSON.parse(await fs.readFile(postFilePath, 'utf8'));
    
    // featured_image 경로 업데이트
    if (postData.featured_image && postData.featured_image.includes('.jpg')) {
      postData.featured_image = postData.featured_image.replace('.jpg', '.png');
      console.log(`  📝 Featured Image 경로 업데이트: ${postData.featured_image}`);
    }
    
    // gallery images 경로 업데이트
    if (postData.images && Array.isArray(postData.images)) {
      postData.images.forEach((img, index) => {
        if (img.localPath && img.localPath.includes('.jpg')) {
          img.localPath = img.localPath.replace('.jpg', '.png');
          console.log(`  📝 Gallery Image ${index + 1} 경로 업데이트: ${img.localPath}`);
        }
      });
    }
    
    // content HTML에서 이미지 경로 업데이트
    if (postData.content) {
      postData.content = postData.content.replace(/\.jpg/g, '.png');
      console.log(`  📝 Content HTML 이미지 경로 업데이트 완료`);
    }
    
    // 업데이트된 데이터 저장
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    console.log(`  ✅ 게시물 데이터 저장 완료`);
    
    // API 파일들 업데이트
    console.log('🔄 API 파일들 업데이트 중...');
    
    const posts = [postData];
    
    // posts.js 업데이트
    const postsApiContent = `// Blog posts API endpoint
export default function handler(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  // Import the posts data
  const posts = ${JSON.stringify(posts, null, 2)};
  
  const paginatedPosts = posts.slice(startIndex, endIndex);
  
  res.status(200).json({
    posts: paginatedPosts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(posts.length / limit),
      totalPosts: posts.length,
      hasNext: endIndex < posts.length,
      hasPrev: startIndex > 0
    }
  });
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/blog/posts.js'), postsApiContent, 'utf8');
    console.log('  ✅ posts.js 업데이트 완료');
    
    // [slug].js 업데이트
    const slugApiContent = `// Individual blog post API endpoint
export default function handler(req, res) {
  const { slug } = req.query;
  
  // Import the posts data
  const posts = ${JSON.stringify(posts, null, 2)};
  
  const post = posts.find(p => p.slug === slug);
  
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  
  // Find related posts (same category, excluding current post)
  const relatedPosts = posts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);
  
  res.status(200).json({
    post,
    relatedPosts
  });
}`;
    
    await fs.writeFile(path.join(__dirname, '../pages/api/blog/[slug].js'), slugApiContent, 'utf8');
    console.log('  ✅ [slug].js 업데이트 완료');
    
    console.log('\n🎉 이미지 형식 변환 완료!');
    console.log('📊 변환 결과:');
    console.log(`  🖼️ 이미지 형식: AVIF → PNG`);
    console.log(`  📁 파일 경로: .jpg → .png`);
    console.log(`  🔗 API 업데이트: 완료`);
    
  } catch (error) {
    console.error('❌ 이미지 형식 변환 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixImageFormats()
    .then(() => {
      console.log('\n🚀 이미지 형식 변환 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixImageFormats };
