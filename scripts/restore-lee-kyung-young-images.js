/**
 * 이경영 글의 이미지 복구 및 추가
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

async function restoreImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 이미지 복구 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 정보 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content, published_at, created_at')
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
  
  // 3. 복구할 이미지 목록 (Storage에 존재하는 이미지)
  const imagesToRestore = [
    {
      fileName: 'complete-migration-1757777702664-3.webp',
      alt: '배우 이경영의 골프 모습',
      description: '주황색 옷을 입은 이경영님이 골프 스윙을 하는 모습'
    },
    {
      fileName: 'complete-migration-1757777705122-5.webp',
      alt: '골프 스윙',
      description: '이경영님의 골프 스윙 연습 모습'
    }
  ];
  
  const movedImages = [];
  const urlMappings = new Map();
  
  // 4. 각 이미지를 갤러리 폴더로 이동
  for (const image of imagesToRestore) {
    try {
      const currentPath = image.fileName;
      const targetPath = `${targetFolder}/${image.fileName}`;
      
      console.log(`🔄 [${image.alt}] 이동 중...`);
      console.log(`   현재: ${currentPath}`);
      console.log(`   목표: ${targetPath}`);
      
      // 이미지 이동
      const { data: moveData, error: moveError } = await supabase.storage
        .from('blog-images')
        .move(currentPath, targetPath);
      
      if (moveError) {
        if (moveError.message.includes('duplicate') || moveError.message.includes('already exists')) {
          console.log(`   ⚠️ 대상 폴더에 이미 같은 파일이 있습니다.`);
          
          // URL 매핑 추가 (이미 이동된 파일 사용)
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(targetPath);
          
          if (urlData?.publicUrl) {
            const oldUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${currentPath}`;
            urlMappings.set(oldUrl, urlData.publicUrl);
            movedImages.push({
              ...image,
              url: urlData.publicUrl
            });
          }
        } else {
          console.error(`   ❌ 이동 실패: ${moveError.message}`);
          continue;
        }
      } else {
        console.log(`   ✅ 이동 완료`);
        
        // URL 매핑 추가
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(targetPath);
        
        if (urlData?.publicUrl) {
          const oldUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${currentPath}`;
          urlMappings.set(oldUrl, urlData.publicUrl);
          movedImages.push({
            ...image,
            url: urlData.publicUrl
          });
        }
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
    }
  }
  
  // 5. 블로그 글 content에 이미지 추가
  if (movedImages.length > 0) {
    console.log(`\n📝 블로그 글에 이미지 추가 중...`);
    
    let updatedContent = post.content;
    
    // 현재 이미지가 있는지 확인
    const existingImages = [...updatedContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    
    // 이미지가 없으면 첫 번째 단락 다음에 추가
    if (existingImages.length === 0) {
      const lines = updatedContent.split('\n');
      let insertIndex = 0;
      
      // 첫 번째 비어있지 않은 줄 찾기
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].trim().startsWith('#')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      // 이미지 추가
      const imageMarkdowns = movedImages.map(img => `![${img.alt}](${img.url})`).join('\n\n');
      lines.splice(insertIndex, 0, '', imageMarkdowns, '');
      updatedContent = lines.join('\n');
    } else {
      // 이미지가 있으면 마지막 이미지 다음에 추가
      const lastImageMatch = existingImages[existingImages.length - 1];
      const lastImageIndex = updatedContent.lastIndexOf(lastImageMatch[0]);
      const afterLastImage = updatedContent.substring(lastImageIndex + lastImageMatch[0].length);
      
      const imageMarkdowns = movedImages.map(img => `![${img.alt}](${img.url})`).join('\n\n');
      updatedContent = updatedContent.substring(0, lastImageIndex + lastImageMatch[0].length) + 
                       '\n\n' + imageMarkdowns + afterLastImage;
    }
    
    // 데이터베이스 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 블로그 글 업데이트 실패:', updateError);
      return;
    }
    
    console.log(`   ✅ ${movedImages.length}개 이미지 추가 완료`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 이미지 복구 완료');
  console.log('='.repeat(80));
  console.log(`복구된 이미지: ${movedImages.length}개`);
  movedImages.forEach((img, i) => {
    console.log(`  ${i + 1}. [${img.alt}] ${img.fileName}`);
  });
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 305;
  
  restoreImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { restoreImages };

