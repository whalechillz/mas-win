require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSlugAndImages() {
  try {
    console.log('🔧 블로그 글 303 슬러그 변경 및 이미지 복구 시작...\n');

    // 1. 슬러그 변경
    const { error: slugError } = await supabase
      .from('blog_posts')
      .update({ slug: 'massgoo' })
      .eq('id', 303);

    if (slugError) {
      console.error('❌ 슬러그 변경 실패:', slugError.message);
      return;
    }

    console.log('✅ 슬러그 변경 완료: golf-event-with-stars-and-matsugu → massgoo\n');

    // 2. 루트 폴더에서 massgoo 관련 이미지 찾기
    const { data: rootFiles, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 500 });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      return;
    }

    const massgooImages = rootFiles.filter(f => 
      f.name && 
      (f.name.toLowerCase().includes('massgoo') || 
       f.name.toLowerCase().includes('mas9') ||
       f.name.toLowerCase().includes('303') ||
       f.name.toLowerCase().includes('스타') ||
       f.name.toLowerCase().includes('star'))
    );

    console.log(`📊 발견된 massgoo 관련 이미지: ${massgooImages.length}개\n`);

    if (massgooImages.length === 0) {
      console.log('⚠️ 복구할 이미지가 없습니다.');
      return;
    }

    // 3. 이미지 URL 생성 및 콘텐츠에 추가
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 303)
      .single();

    if (postError || !post) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', postError?.message);
      return;
    }

    let updatedContent = post.content || '';
    const imageUrls = [];

    // 각 이미지에 대해 URL 생성 및 콘텐츠에 추가
    for (const file of massgooImages) {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(file.name);

      const imageUrl = urlData.publicUrl;
      imageUrls.push({ name: file.name, url: imageUrl });

      // 이미 콘텐츠에 있는지 확인
      if (!updatedContent.includes(imageUrl)) {
        // 콘텐츠 끝에 이미지 추가
        const altText = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/-/g, ' ');
        updatedContent += `\n\n![${altText}](${imageUrl})`;
      }
    }

    // 4. 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: updatedContent })
      .eq('id', 303);

    if (updateError) {
      console.error('❌ 콘텐츠 업데이트 실패:', updateError.message);
      return;
    }

    console.log('✅ 이미지 복구 완료');
    console.log(`📝 추가된 이미지: ${imageUrls.length}개\n`);
    imageUrls.forEach((img, i) => {
      console.log(`${i + 1}. ${img.name}`);
      console.log(`   URL: ${img.url.substring(0, 80)}...`);
    });

    // 5. 이미지를 올바른 폴더로 이동
    console.log('\n📁 이미지를 갤러리 폴더로 이동 중...');
    const targetFolder = 'originals/blog/2017-03/303';

    for (const file of massgooImages) {
      try {
        // 파일 읽기
        const { data: fileData, error: readError } = await supabase.storage
          .from('blog-images')
          .download(file.name);

        if (readError) {
          console.error(`   ❌ ${file.name} 읽기 실패: ${readError.message}`);
          continue;
        }

        // 새 경로로 업로드
        const newPath = `${targetFolder}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(newPath, fileData, { upsert: true });

        if (uploadError) {
          console.error(`   ❌ ${file.name} 이동 실패: ${uploadError.message}`);
          continue;
        }

        // 기존 파일 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([file.name]);

        if (deleteError) {
          console.warn(`   ⚠️ ${file.name} 삭제 실패 (이미 이동됨): ${deleteError.message}`);
        }

        console.log(`   ✅ ${file.name} → ${newPath}`);
      } catch (error) {
        console.error(`   ❌ ${file.name} 처리 오류: ${error.message}`);
      }
    }

    console.log('\n✅ 모든 작업 완료');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

fixSlugAndImages();

