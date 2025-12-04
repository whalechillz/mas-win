require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function moveImagesToCorrectFolder() {
  try {
    console.log('🔧 블로그 글 302 이미지를 올바른 폴더로 이동 시작...\n');
    
    // 1. 블로그 글 302의 이미지 URL 추출
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 302)
      .single();
    
    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }
    
    console.log('📝 블로그 글:', post.title);
    
    // 2. 콘텐츠에서 이미지 URL 추출
    const imageMatches = [...post.content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    const imageUrls = imageMatches.map(m => ({
      alt: m[1],
      url: m[2]
    }));
    
    console.log(`\n📊 발견된 이미지: ${imageUrls.length}개\n`);
    
    const targetFolder = 'originals/blog/2017-03/302';
    const movedImages = [];
    
    // 3. 각 이미지 확인 및 이동
    for (let i = 0; i < imageUrls.length; i++) {
      const img = imageUrls[i];
      console.log(`\n${i + 1}/${imageUrls.length}. 이미지 처리 중: [${img.alt}]`);
      console.log(`   URL: ${img.url}`);
      
      // URL에서 경로 추출 (모든 originals 폴더 지원)
      const urlMatch = img.url.match(/originals\/(.+)/);
      if (!urlMatch) {
        console.log('   ⚠️ 경로를 추출할 수 없습니다. 스킵합니다.');
        continue;
      }
      
      const currentPath = `originals/${urlMatch[1]}`;
      const fileName = currentPath.split('/').pop();
      
      console.log(`   현재 경로: ${currentPath}`);
      console.log(`   파일명: ${fileName}`);
      
      // 이미 올바른 폴더에 있으면 스킵
      if (currentPath === `${targetFolder}/${fileName}`) {
        console.log('   ✅ 이미 올바른 폴더에 있습니다. 스킵합니다.');
        continue;
      }
      
      // 4. 이미지 다운로드
      console.log('   📥 이미지 다운로드 중...');
      const imageResponse = await fetch(img.url);
      if (!imageResponse.ok) {
        console.error(`   ❌ 이미지 다운로드 실패: ${imageResponse.status}`);
        continue;
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      console.log(`   ✅ 다운로드 완료 (${imageBuffer.length} bytes)`);
      
      // 5. 올바른 폴더에 업로드
      const newPath = `${targetFolder}/${fileName}`;
      console.log(`   📤 새 경로에 업로드 중: ${newPath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(newPath, imageBuffer, {
          contentType: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`   ❌ 업로드 실패: ${uploadError.message}`);
        continue;
      }
      
      console.log('   ✅ 업로드 완료');
      
      // 6. 새 URL 생성
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(newPath);
      
      const newUrl = urlData.publicUrl;
      console.log(`   새 URL: ${newUrl}`);
      
      // 7. 기존 파일 삭제 (다른 경로에 있는 경우)
      if (currentPath !== newPath) {
        console.log(`   🗑️ 기존 파일 삭제 중: ${currentPath}`);
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([currentPath]);
        
        if (deleteError) {
          console.warn(`   ⚠️ 기존 파일 삭제 실패 (무시): ${deleteError.message}`);
        } else {
          console.log('   ✅ 기존 파일 삭제 완료');
        }
      }
      
      movedImages.push({
        oldUrl: img.url,
        newUrl: newUrl,
        alt: img.alt
      });
    }
    
    if (movedImages.length === 0) {
      console.log('\n✅ 이동할 이미지가 없습니다. 모든 이미지가 이미 올바른 폴더에 있습니다.');
      return;
    }
    
    // 8. 블로그 콘텐츠 업데이트 (새 URL로 교체)
    console.log('\n📝 블로그 콘텐츠 업데이트 중...');
    let updatedContent = post.content;
    
    movedImages.forEach(img => {
      updatedContent = updatedContent.replace(img.oldUrl, img.newUrl);
    });
    
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 302);
    
    if (updateError) {
      console.error('❌ 콘텐츠 업데이트 실패:', updateError.message);
      return;
    }
    
    console.log('✅ 콘텐츠 업데이트 완료');
    
    // 9. 결과 요약
    console.log('\n=== 이동 완료 ===');
    console.log(`총 ${movedImages.length}개 이미지 이동:`);
    movedImages.forEach((img, i) => {
      console.log(`\n${i + 1}. [${img.alt}]`);
      console.log(`   이전: ${img.oldUrl.substring(0, 80)}...`);
      console.log(`   새: ${img.newUrl.substring(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  }
}

moveImagesToCorrectFolder();

