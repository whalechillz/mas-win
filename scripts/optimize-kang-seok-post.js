/**
 * 강석 글 최적화 스크립트
 * 1. 이미지 배치 최적화
 * 2. 메타 태그 점검
 * 3. 이미지 폴더 이동
 * 4. 이미지 메타 태그 생성
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

async function optimizeKangSeokPost() {
  try {
    console.log('🚀 강석 글(ID 123) 최적화 시작...\n');
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
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📎 글 ID: ${post.id}`);
    console.log(`📅 발행일: ${post.published_at || post.created_at}\n`);
    
    // 2. 현재 content 확인
    const currentContent = post.content || '';
    
    // 3. 이미지 배치 최적화
    console.log('📸 1단계: 이미지 배치 최적화...\n');
    
    // content를 문단별로 분리하고 이미지를 적절히 배치
    const paragraphs = currentContent.split(/\n\n+/);
    const optimizedContent = [];
    let imageIndex = 0;
    
    // 이미지 URL 추출
    const imageUrls = [];
    const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    let match;
    while ((match = markdownImgRegex.exec(currentContent)) !== null) {
      imageUrls.push({
        alt: match[1].trim(),
        url: match[2].trim()
      });
    }
    
    console.log(`   발견된 이미지: ${imageUrls.length}개\n`);
    
    // 문단을 순회하면서 이미지를 적절히 배치
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // 이미지 마크다운이면 그대로 유지
      if (paragraph.match(/^!\[.*?\]\(.*?\)$/)) {
        optimizedContent.push(paragraph);
        continue;
      }
      
      // 문단 추가
      optimizedContent.push(paragraph);
      
      // 문단이 끝나고 이미지가 남아있으면 적절한 위치에 배치
      // 첫 번째 문단 후, 중간 문단 후, 마지막 문단 전에 배치
      if (imageIndex < imageUrls.length) {
        const shouldInsertImage = 
          (i === 0 && imageIndex === 0) || // 첫 문단 후 첫 이미지
          (i === Math.floor(paragraphs.length / 3) && imageIndex === 1) || // 1/3 지점
          (i === Math.floor(paragraphs.length * 2 / 3) && imageIndex === 2) || // 2/3 지점
          (i === paragraphs.length - 2 && imageIndex >= 3); // 마지막 문단 전
        
        if (shouldInsertImage) {
          const img = imageUrls[imageIndex];
          optimizedContent.push(`![${img.alt}](${img.url})`);
          imageIndex++;
        }
      }
    }
    
    // 남은 이미지 추가
    while (imageIndex < imageUrls.length) {
      const img = imageUrls[imageIndex];
      optimizedContent.push(`![${img.alt}](${img.url})`);
      imageIndex++;
    }
    
    const newContent = optimizedContent.join('\n\n');
    
    // 4. 메타 태그 점검
    console.log('📋 2단계: 메타 태그 점검...\n');
    
    const metaChecks = {
      meta_title: post.meta_title || null,
      meta_description: post.meta_description || null,
      meta_keywords: post.meta_keywords || null,
      tags: post.tags || null
    };
    
    console.log('   현재 메타 태그:');
    Object.entries(metaChecks).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value || '(없음)'}`);
    });
    
    // 메타 태그가 없으면 기본값 생성
    const updatedMeta = {
      meta_title: post.meta_title || post.title,
      meta_description: post.meta_description || post.summary || post.excerpt || `${post.title} - 마쓰구골프`,
      meta_keywords: post.meta_keywords || (post.tags ? post.tags.join(', ') : '골프, 드라이버, 마쓰구골프')
    };
    
    console.log('\n   업데이트할 메타 태그:');
    Object.entries(updatedMeta).forEach(([key, value]) => {
      console.log(`   ✅ ${key}: ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`);
    });
    
    // 5. 데이터베이스 업데이트
    console.log('\n💾 3단계: 데이터베이스 업데이트...\n');
    
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: newContent,
        ...updatedMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', 123);
    
    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }
    
    console.log('   ✅ Content 업데이트 완료');
    console.log('   ✅ 메타 태그 업데이트 완료\n');
    
    // 6. 이미지 폴더 이동 준비
    console.log('📁 4단계: 이미지 폴더 이동 준비...\n');
    
    const publishDate = post.published_at ? new Date(post.published_at) : (post.created_at ? new Date(post.created_at) : new Date());
    const year = publishDate.getFullYear();
    const month = String(publishDate.getMonth() + 1).padStart(2, '0');
    const dateFolder = `${year}-${month}`;
    const targetFolder = `originals/blog/${dateFolder}/${post.id}`;
    
    console.log(`   목표 폴더: ${targetFolder}`);
    console.log(`   이동할 이미지: ${imageUrls.length}개\n`);
    
    // API 호출로 이미지 이동
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const organizeResponse = await fetch(`${baseUrl}/api/admin/organize-images-by-blog?blogPostId=123`, {
      method: 'GET'
    });
    
    if (organizeResponse.ok) {
      const organizeData = await organizeResponse.json();
      console.log('   ✅ 이미지 폴더 이동 완료');
      console.log(`   이동된 이미지: ${organizeData.movedCount || 0}개\n`);
    } else {
      console.log('   ⚠️ 이미지 폴더 이동 API 호출 실패 (수동으로 진행 필요)');
    }
    
    // 7. 이미지 메타 태그 생성
    console.log('🏷️ 5단계: 이미지 메타 태그 생성...\n');
    
    const metadataResponse = await fetch(`${baseUrl}/api/admin/generate-metadata-for-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderPath: targetFolder,
        limit: 10
      })
    });
    
    if (metadataResponse.ok) {
      const metadataData = await metadataResponse.json();
      console.log('   ✅ 이미지 메타 태그 생성 완료');
      console.log(`   처리된 이미지: ${metadataData.processed || 0}개\n`);
    } else {
      console.log('   ⚠️ 이미지 메타 태그 생성 API 호출 실패 (수동으로 진행 필요)');
    }
    
    console.log('='.repeat(80));
    console.log('✅ 강석 글 최적화 완료!\n');
    
    return {
      post,
      imageUrls,
      updatedMeta,
      targetFolder
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  optimizeKangSeokPost()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { optimizeKangSeokPost };

