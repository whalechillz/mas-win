#!/usr/bin/env node

/**
 * 관리자 페이지에서 이미지 미리보기를 개선하는 스크립트
 * 편집 모드에서도 이미지가 보이도록 개선
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 관리자 페이지 개선을 위한 안내 메시지
const ADMIN_IMPROVEMENT_GUIDE = `
# 관리자 페이지 이미지 표시 개선 가이드

## 현재 상황:
- 관리자 페이지에서 편집 모드일 때는 Markdown 원시 텍스트만 표시
- 이미지는 미리보기 모드에서만 정상 표시

## 해결 방법:

### 1. 미리보기 모드 사용:
- 관리자 페이지에서 "미리보기" 버튼 클릭
- 이미지가 정상적으로 표시됨

### 2. 편집 모드에서 이미지 확인:
- Markdown 형식: ![이미지 설명](이미지URL)
- 현재 강석님 글의 이미지들:
  - 강석님 프로필: kang-seok-profile-*.webp
  - 골프 장비: kang-seok-equipment-*.webp
  - 드라이버 헤드: kang-seok-driver-*.webp
  - 스윙 모습: kang-seok-swing-*.webp
  - 골프 클럽: kang-seok-club-*.webp
  - 골프 장비 세트: kang-seok-equipment-set-*.webp
  - 골프 공: kang-seok-ball-*.webp

### 3. 이미지 URL 확인:
모든 이미지는 Supabase Storage에 저장되어 있으며, 
다음과 같은 형식입니다:
https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/

## 개선 사항:
1. 편집 모드에서도 이미지 미리보기 표시
2. 이미지 업로드 및 관리 기능 강화
3. WYSIWYG 에디터 도입 고려
`;

// 강석님 글의 이미지 URL 목록 확인
async function checkKangSeokImages() {
  try {
    console.log('🔍 강석님 글의 이미지 URL 확인 중...');
    
    // 1. 현재 강석님 글 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'mbc-kang-seok-mc-experience-massgoo-secret-weapon-driver-22-years-tradition')
      .single();
    
    if (fetchError) {
      console.error('❌ 강석님 글 조회 실패:', fetchError);
      return;
    }
    
    console.log(`📄 현재 글 ID: ${currentPost.id}`);
    
    // 2. 이미지 URL 추출
    const imageMatches = currentPost.content.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
    
    if (imageMatches) {
      console.log(`\n📸 발견된 이미지 수: ${imageMatches.length}개`);
      
      imageMatches.forEach((match, index) => {
        const altMatch = match.match(/!\[([^\]]*)\]/);
        const urlMatch = match.match(/\(([^)]+)\)/);
        
        if (altMatch && urlMatch) {
          const alt = altMatch[1];
          const url = urlMatch[1];
          console.log(`${index + 1}. ${alt}`);
          console.log(`   URL: ${url}`);
        }
      });
    } else {
      console.log('❌ 이미지를 찾을 수 없습니다.');
    }
    
    // 3. Featured Image 확인
    console.log(`\n🖼️ Featured Image: ${currentPost.featured_image}`);
    
    // 4. 개선 가이드 출력
    console.log('\n' + ADMIN_IMPROVEMENT_GUIDE);
    
    return {
      post: currentPost,
      images: imageMatches || [],
      featuredImage: currentPost.featured_image
    };
    
  } catch (error) {
    console.error('❌ 확인 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkKangSeokImages()
    .then(result => {
      console.log('\n🎉 강석님 글 이미지 확인 완료!');
      console.log('관리자 페이지에서 "미리보기" 버튼을 클릭하면 이미지를 확인할 수 있습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 확인 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkKangSeokImages };
