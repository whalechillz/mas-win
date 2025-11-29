/**
 * 이경영 글의 이미지를 올바른 폴더로 이동
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

async function moveImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 이미지 이동 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 정보 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image, content, published_at, created_at')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  // 2. 목표 폴더 경로 계산
  const publishDate = post.published_at ? new Date(post.published_at) : (post.created_at ? new Date(post.created_at) : new Date());
  const year = publishDate.getFullYear();
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const dateFolder = `${year}-${month}`;
  const targetFolder = `originals/blog/${dateFolder}/${post.id}`;
  
  console.log(`📁 목표 폴더: ${targetFolder}\n`);
  
  // 3. 이미지 URL 추출
  const images = [];
  if (post.featured_image) {
    images.push({
      url: post.featured_image,
      type: 'featured'
    });
  }
  
  const contentMatches = [...post.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  contentMatches.forEach(m => {
    images.push({
      url: m[2],
      alt: m[1],
      type: 'content'
    });
  });
  
  console.log(`📊 발견된 이미지: ${images.length}개\n`);
  
  // 4. 각 이미지의 현재 경로 확인 및 이동
  let movedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const urlMappings = new Map();
  
  for (const image of images) {
    try {
      const url = image.url;
      
      // URL에서 경로 추출
      const urlMatch = url.match(/\/public\/blog-images\/(.+?)(?:\?|$)/);
      if (!urlMatch) {
        console.log(`⚠️ URL 파싱 실패: ${url.substring(0, 80)}...`);
        continue;
      }
      
      const currentPath = urlMatch[1].split('?')[0].split('#')[0]; // 쿼리 파라미터 제거
      const pathParts = currentPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const targetPath = `${targetFolder}/${fileName}`;
      
      // 이미 올바른 위치에 있는지 확인
      if (currentPath === targetPath) {
        console.log(`✅ [${image.alt || '대표 이미지'}] 이미 올바른 위치: ${currentPath}`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔄 [${image.alt || '대표 이미지'}] 이동 중...`);
      console.log(`   현재: ${currentPath}`);
      console.log(`   목표: ${targetPath}`);
      
      // 폴더 존재 확인 및 생성
      const folderParts = targetFolder.split('/');
      let currentFolderPath = '';
      for (const part of folderParts) {
        currentFolderPath = currentFolderPath ? `${currentFolderPath}/${part}` : part;
        const { data: folderData } = await supabase.storage
          .from('blog-images')
          .list(currentFolderPath, { limit: 1 });
        
        // 폴더가 없으면 빈 파일을 만들어 폴더 생성 (Supabase Storage 트릭)
        if (!folderData || folderData.length === 0) {
          const { error: createError } = await supabase.storage
            .from('blog-images')
            .upload(`${currentFolderPath}/.keep`, new Blob([''], { type: 'text/plain' }), {
              upsert: true
            });
          
          if (createError && !createError.message.includes('already exists')) {
            console.log(`   ⚠️ 폴더 생성 시도: ${currentFolderPath}`);
          }
        }
      }
      
      // 이미지 이동
      const { data: moveData, error: moveError } = await supabase.storage
        .from('blog-images')
        .move(currentPath, targetPath);
      
      if (moveError) {
        if (moveError.message.includes('duplicate') || moveError.message.includes('already exists')) {
          console.log(`   ⚠️ 대상 폴더에 이미 같은 파일이 있습니다.`);
          skippedCount++;
          
          // URL 매핑 추가 (이미 이동된 파일 사용)
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(targetPath);
          
          if (urlData?.publicUrl) {
            urlMappings.set(url, urlData.publicUrl);
            urlMappings.set(url.split('?')[0], urlData.publicUrl);
          }
        } else {
          console.error(`   ❌ 이동 실패: ${moveError.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ 이동 완료`);
        movedCount++;
        
        // URL 매핑 추가
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(targetPath);
        
        if (urlData?.publicUrl) {
          urlMappings.set(url, urlData.publicUrl);
          urlMappings.set(url.split('?')[0], urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      errorCount++;
    }
  }
  
  // 5. 블로그 글의 URL 업데이트
  if (urlMappings.size > 0) {
    console.log(`\n📝 블로그 글 URL 업데이트 중...`);
    
    let updatedContent = post.content;
    let updatedFeaturedImage = post.featured_image;
    let contentUpdated = false;
    let featuredUpdated = false;
    
    // content의 이미지 URL 업데이트
    for (const [oldUrl, newUrl] of urlMappings.entries()) {
      if (updatedContent.includes(oldUrl)) {
        updatedContent = updatedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        contentUpdated = true;
      }
      if (post.featured_image && post.featured_image.includes(oldUrl.split('?')[0])) {
        updatedFeaturedImage = newUrl;
        featuredUpdated = true;
      }
    }
    
    // 데이터베이스 업데이트
    const updateData = {};
    if (contentUpdated) {
      updateData.content = updatedContent;
    }
    if (featuredUpdated) {
      updateData.featured_image = updatedFeaturedImage;
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', blogPostId);
      
      if (updateError) {
        console.error('❌ 블로그 글 업데이트 실패:', updateError);
      } else {
        console.log(`   ✅ URL 업데이트 완료 (${Object.keys(updateData).length}개 필드)`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 이미지 이동 완료');
  console.log('='.repeat(80));
  console.log(`이동된 이미지: ${movedCount}개`);
  console.log(`건너뛴 이미지: ${skippedCount}개`);
  console.log(`오류: ${errorCount}개`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 305;
  
  moveImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { moveImages };

