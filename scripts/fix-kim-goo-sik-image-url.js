/**
 * 김구식 글의 잘못된 이미지 URL 수정
 * 사용법: node scripts/fix-kim-goo-sik-image-url.js
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixKimGooSikImageUrl() {
  console.log('🔧 김구식 글(ID: 122) 이미지 URL 수정 시작...\n');
  console.log('='.repeat(80));
  
  // 1. 백업 파일에서 원본 이미지 URL 확인
  const backupPath = 'mas9golf/backup-20250907/blog/all-33-pages-posts/post-63-massgoogolfblog20150915.json';
  let backupData = null;
  
  try {
    backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log('✅ 백업 파일 로드 완료\n');
  } catch (error) {
    console.error('❌ 백업 파일을 읽을 수 없습니다:', error.message);
    return;
  }
  
  // 2. 현재 블로그 글 content 확인
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content')
    .eq('id', 122)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  // 3. content에서 "이미지URL" 찾기
  const brokenImagePattern = /!\[([^\]]*)\]\(이미지URL\)/g;
  const matches = [...post.content.matchAll(brokenImagePattern)];
  
  console.log(`🔍 잘못된 이미지 URL 발견: ${matches.length}개\n`);
  
  if (matches.length === 0) {
    console.log('✅ 잘못된 이미지 URL이 없습니다.');
    return;
  }
  
  // 4. 백업 파일에서 프로필 이미지 찾기
  // 백업 파일의 images 배열에서 프로필 이미지 찾기
  const profileImage = backupData.images?.find(img => 
    img.alt && (img.alt.includes('프로필') || img.alt.includes('ree') || img.alt === 'ree')
  ) || backupData.images?.[1]; // 두 번째 이미지가 프로필일 가능성
  
  if (!profileImage) {
    console.error('❌ 백업 파일에서 프로필 이미지를 찾을 수 없습니다.');
    return;
  }
  
  console.log('📸 백업 파일의 프로필 이미지:');
  console.log(`   Alt: ${profileImage.alt}`);
  console.log(`   URL: ${profileImage.src}`);
  console.log(`   LocalPath: ${profileImage.localPath}\n`);
  
  // 5. Storage에서 이미지 찾기
  let foundImageUrl = null;
  
  // localPath 기반으로 찾기
  if (profileImage.localPath) {
    const fileName = profileImage.localPath.split('/').pop();
    const { data: storageFiles } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 1000, search: fileName });
    
    if (storageFiles && storageFiles.length > 0) {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(storageFiles[0].name);
      foundImageUrl = urlData.publicUrl;
      console.log(`✅ Storage에서 이미지 찾음: ${foundImageUrl}\n`);
    }
  }
  
  // 6. 갤러리 폴더에서 찾기
  if (!foundImageUrl) {
    const { data: galleryFiles } = await supabase.storage
      .from('blog-images')
      .list('originals/blog/2015-09/122', { limit: 10 });
    
    if (galleryFiles && galleryFiles.length > 0) {
      // 프로필 이미지가 아닌 다른 이미지일 수 있음
      // featured_image가 아닌 이미지 찾기
      const nonFeaturedImage = galleryFiles.find(f => 
        !f.name.includes('complete-migration-1757771572213-1')
      );
      
      if (nonFeaturedImage) {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`originals/blog/2015-09/122/${nonFeaturedImage.name}`);
        foundImageUrl = urlData.publicUrl;
        console.log(`✅ 갤러리 폴더에서 이미지 찾음: ${foundImageUrl}\n`);
      }
    }
  }
  
  // 7. 원본 Wix URL 사용 (임시)
  if (!foundImageUrl && profileImage.src) {
    foundImageUrl = profileImage.src;
    console.log(`⚠️ Storage에서 찾지 못해 원본 URL 사용: ${foundImageUrl}\n`);
  }
  
  if (!foundImageUrl) {
    console.error('❌ 이미지 URL을 찾을 수 없습니다.');
    return;
  }
  
  // 8. content 수정
  let newContent = post.content;
  
  matches.forEach((match, idx) => {
    const altText = match[1] || '김구식 선생님 프로필';
    const oldMarkdown = match[0];
    const newMarkdown = `![${altText}](${foundImageUrl})`;
    
    newContent = newContent.replace(oldMarkdown, newMarkdown);
    console.log(`✅ 이미지 URL 수정: [${altText}]`);
  });
  
  // 9. 데이터베이스 업데이트
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ 
      content: newContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', 122);
  
  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError);
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 이미지 URL 수정 완료');
  console.log('='.repeat(80));
  console.log(`수정된 이미지: ${matches.length}개`);
  console.log(`새 이미지 URL: ${foundImageUrl}`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  fixKimGooSikImageUrl()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { fixKimGooSikImageUrl };

