/**
 * 김구식 글의 프로필 이미지를 Wix에서 다운로드하여 Supabase Storage에 저장
 * 사용법: node scripts/download-kim-goo-sik-image.js
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`이미지 다운로드 실패: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadKimGooSikImage() {
  console.log('🔧 김구식 글 프로필 이미지 다운로드 시작...\n');
  console.log('='.repeat(80));
  
  // 1. 현재 블로그 글 content 확인
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content, published_at')
    .eq('id', 122)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  // 2. content에서 Wix 이미지 URL 찾기
  const wixImagePattern = /!\[([^\]]*)\]\((https:\/\/static\.wixstatic\.com[^)]+)\)/;
  const match = post.content.match(wixImagePattern);
  
  if (!match) {
    console.log('✅ Wix 이미지 URL이 없습니다. 이미 수정되었거나 다른 URL을 사용 중입니다.');
    return;
  }
  
  const altText = match[1];
  const wixImageUrl = match[2];
  
  console.log(`📸 발견된 Wix 이미지:`);
  console.log(`   Alt: ${altText}`);
  console.log(`   URL: ${wixImageUrl}\n`);
  
  // 3. 이미지 다운로드
  console.log('📥 이미지 다운로드 중...');
  let imageBuffer;
  try {
    imageBuffer = await downloadImage(wixImageUrl);
    console.log(`✅ 이미지 다운로드 완료 (${(imageBuffer.length / 1024).toFixed(2)}KB)\n`);
  } catch (error) {
    console.error('❌ 이미지 다운로드 실패:', error.message);
    return;
  }
  
  // 4. 발행일 기반 폴더 경로 생성
  const publishedAt = new Date(post.published_at);
  const yearMonth = publishedAt.toISOString().substring(0, 7);
  const targetFolder = `originals/blog/${yearMonth}/122`;
  const fileName = `kim-goo-sik-profile-${Date.now()}.png`;
  const targetPath = `${targetFolder}/${fileName}`;
  
  // 5. Supabase Storage에 업로드
  console.log('📤 Supabase Storage에 업로드 중...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(targetPath, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (uploadError) {
    console.error('❌ 업로드 실패:', uploadError.message);
    return;
  }
  
  console.log(`✅ 업로드 완료: ${targetPath}\n`);
  
  // 6. 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(targetPath);
  
  const publicUrl = urlData.publicUrl;
  console.log(`✅ 공개 URL: ${publicUrl}\n`);
  
  // 7. content의 이미지 URL 업데이트
  const newContent = post.content.replace(
    wixImagePattern,
    `![${altText}](${publicUrl})`
  );
  
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ 
      content: newContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', 122);
  
  if (updateError) {
    console.error('❌ content 업데이트 실패:', updateError);
    return;
  }
  
  console.log('='.repeat(80));
  console.log('✅ 이미지 다운로드 및 저장 완료');
  console.log('='.repeat(80));
  console.log(`다운로드한 이미지: ${wixImageUrl}`);
  console.log(`저장 경로: ${targetPath}`);
  console.log(`공개 URL: ${publicUrl}`);
  console.log(`content 업데이트 완료`);
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  downloadKimGooSikImage()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { downloadKimGooSikImage };

