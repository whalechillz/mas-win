/**
 * 강석 글 이미지 폴더 이동 및 메타 태그 생성
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

async function moveKangSeokImagesAndGenerateMetadata() {
  try {
    console.log('🚀 강석 글 이미지 폴더 이동 및 메타 태그 생성 시작...\n');
    console.log('='.repeat(80));
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    const publishDate = post.published_at ? new Date(post.published_at) : (post.created_at ? new Date(post.created_at) : new Date());
    const year = publishDate.getFullYear();
    const month = String(publishDate.getMonth() + 1).padStart(2, '0');
    const dateFolder = `${year}-${month}`;
    const targetFolder = `originals/blog/${dateFolder}/${post.id}`;
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📁 목표 폴더: ${targetFolder}\n`);
    
    // 2. 이미지 URL 추출
    const imageUrls = [];
    if (post.content) {
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      let match;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        imageUrls.push({
          alt: match[1].trim(),
          url: match[2].trim()
        });
      }
    }
    
    if (post.featured_image) {
      imageUrls.push({
        alt: post.title,
        url: post.featured_image
      });
    }
    
    console.log(`📸 발견된 이미지: ${imageUrls.length}개\n`);
    
    // 3. 이미지 폴더 이동 (API 호출)
    console.log('📁 1단계: 이미지 폴더 이동...\n');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // 먼저 이미지 정렬 정보 조회
    const checkResponse = await fetch(`${baseUrl}/api/admin/organize-images-by-blog?blogPostId=123`);
    const checkData = await checkResponse.json();
    
    console.log(`   발견된 이미지: ${checkData.images?.length || 0}개`);
    
    // 실제 이동 실행
    const moveResponse = await fetch(`${baseUrl}/api/admin/organize-images-by-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogPostId: 123,
        moveImages: true
      })
    });
    
    if (moveResponse.ok) {
      const moveData = await moveResponse.json();
      console.log(`   ✅ 이미지 폴더 이동 완료`);
      console.log(`   이동된 이미지: ${moveData.movedCount || 0}개\n`);
    } else {
      const errorText = await moveResponse.text();
      console.log(`   ⚠️ 이미지 폴더 이동 실패: ${errorText.substring(0, 200)}\n`);
    }
    
    // 4. 이미지 메타 태그 생성
    console.log('🏷️ 2단계: 이미지 메타 태그 생성...\n');
    
    // 폴더의 이미지 목록 확인
    const { data: folderFiles, error: folderError } = await supabase.storage
      .from('blog-images')
      .list(targetFolder);
    
    if (folderError) {
      console.log(`   ⚠️ 폴더 조회 실패: ${folderError.message}`);
      console.log(`   폴더가 아직 생성되지 않았을 수 있습니다.\n`);
    } else {
      const imageFiles = (folderFiles || []).filter(f => {
        const ext = f.name.toLowerCase();
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
               ext.endsWith('.gif') || ext.endsWith('.webp');
      });
      
      console.log(`   폴더의 이미지 파일: ${imageFiles.length}개`);
      
      if (imageFiles.length > 0) {
        // 메타 태그 생성 API 호출
        const metadataResponse = await fetch(`${baseUrl}/api/admin/generate-metadata-for-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderPath: targetFolder,
            limit: imageFiles.length
          })
        });
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          console.log(`   ✅ 이미지 메타 태그 생성 완료`);
          console.log(`   처리된 이미지: ${metadataData.processed || 0}개`);
          console.log(`   성공: ${metadataData.successCount || 0}개`);
          console.log(`   실패: ${metadataData.failCount || 0}개\n`);
        } else {
          const errorText = await metadataResponse.text();
          console.log(`   ⚠️ 메타 태그 생성 실패: ${errorText.substring(0, 200)}\n`);
        }
      } else {
        console.log(`   ⚠️ 폴더에 이미지가 없습니다. 이미지 이동을 먼저 완료해야 합니다.\n`);
      }
    }
    
    console.log('='.repeat(80));
    console.log('✅ 작업 완료!\n');
    
    return {
      post,
      targetFolder,
      imageUrls
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  moveKangSeokImagesAndGenerateMetadata()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { moveKangSeokImagesAndGenerateMetadata };

