// ID 88 게시물의 이미지 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBlog88Images() {
  try {
    console.log('🔍 ID 88 게시물의 이미지 확인 시작...\n');

    // 1. 블로그 게시물 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .eq('id', 88)
      .single();

    if (postError || !post) {
      console.error('❌ 게시물을 찾을 수 없습니다:', postError?.message);
      return;
    }

    console.log(`📝 게시물: ${post.title}`);
    console.log(`📝 본문 길이: ${post.content?.length || 0}자\n`);

    // 2. 본문에서 이미지 URL 추출
    const images = [];
    
    // featured_image 확인
    if (post.featured_image) {
      images.push({
        url: post.featured_image,
        type: 'featured',
        source: 'featured_image'
      });
    }
    
    // content에서 이미지 URL 추출
    if (post.content) {
      // HTML img 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const matches = post.content.matchAll(imgRegex);
      
      for (const match of matches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({
            url: imageUrl,
            type: 'content',
            source: 'html_img'
          });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      const markdownMatches = post.content.matchAll(markdownImgRegex);
      
      for (const match of markdownMatches) {
        const imageUrl = match[1];
        if (imageUrl && !images.find(img => img.url === imageUrl)) {
          images.push({
            url: imageUrl,
            type: 'content',
            source: 'markdown'
          });
        }
      }
    }

    console.log(`📊 추출된 이미지: ${images.length}개\n`);

    // 3. 각 이미지 URL 분석 및 Storage 확인
    const imageResults = [];
    
    for (const img of images) {
      console.log(`\n🔍 이미지 확인: ${img.url}`);
      console.log(`  타입: ${img.type} (${img.source})`);
      
      // URL에서 경로 추출
      const urlMatch = img.url.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)/);
      let imagePath = null;
      
      if (urlMatch) {
        imagePath = urlMatch[1].split('?')[0];
        console.log(`  경로: ${imagePath}`);
      } else {
        // 다른 형식의 URL
        const pathMatch = img.url.match(/\/blog-images\/(.+)/);
        if (pathMatch) {
          imagePath = pathMatch[1].split('?')[0];
          console.log(`  경로 (대체): ${imagePath}`);
        } else {
          console.log(`  ⚠️ Storage 경로를 추출할 수 없음`);
        }
      }
      
      // 파일명 추출
      const fileName = imagePath ? imagePath.split('/').pop() : null;
      console.log(`  파일명: ${fileName || '(없음)'}`);
      
      // Storage에서 파일 존재 확인
      let exists = false;
      let actualPath = null;
      
      if (imagePath) {
        try {
          // 1. 경로로 직접 확인
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(imagePath);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await fetch(urlData.publicUrl, { 
              method: 'HEAD',
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              exists = true;
              actualPath = imagePath;
              console.log(`  ✅ 파일 존재 (경로: ${imagePath})`);
            } else {
              console.log(`  ❌ 파일 없음 (HTTP ${response.status})`);
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              console.log(`  ⚠️ 타임아웃`);
            } else {
              console.log(`  ❌ 확인 실패: ${fetchError.message}`);
            }
          }
          
          // 2. 파일명으로 검색 (경로로 찾지 못한 경우)
          if (!exists && fileName) {
            console.log(`  🔍 파일명으로 검색 시도: ${fileName}`);
            
            // 폴더 경로 추출
            const folderPath = imagePath.split('/').slice(0, -1).join('/');
            console.log(`  📁 폴더 경로: ${folderPath}`);
            
            // 폴더 내 파일 목록 확인
            const { data: files, error: listError } = await supabase.storage
              .from('blog-images')
              .list(folderPath, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' }
              });
            
            if (!listError && files && files.length > 0) {
              const matchingFile = files.find(file => 
                file.name === fileName || 
                file.name.includes(fileName) ||
                fileName.includes(file.name)
              );
              
              if (matchingFile) {
                actualPath = folderPath ? `${folderPath}/${matchingFile.name}` : matchingFile.name;
                console.log(`  ✅ 파일 발견 (실제 경로: ${actualPath})`);
                exists = true;
              } else {
                console.log(`  ❌ 폴더 내 파일 목록에 없음`);
                console.log(`  📋 폴더 내 파일 개수: ${files.length}개`);
                if (files.length > 0) {
                  console.log(`  📋 첫 5개 파일:`);
                  files.slice(0, 5).forEach((file, i) => {
                    console.log(`    ${i + 1}. ${file.name}`);
                  });
                }
              }
            } else {
              console.log(`  ❌ 폴더 목록 조회 실패: ${listError?.message || '알 수 없음'}`);
            }
          }
        } catch (error) {
          console.log(`  ❌ 확인 오류: ${error.message}`);
        }
      }
      
      imageResults.push({
        url: img.url,
        type: img.type,
        source: img.source,
        path: imagePath,
        fileName: fileName,
        exists: exists,
        actualPath: actualPath
      });
    }
    
    // 4. 결과 요약
    console.log('\n\n📊 결과 요약:');
    const existing = imageResults.filter(r => r.exists);
    const missing = imageResults.filter(r => !r.exists);
    
    console.log(`\n✅ 존재하는 파일: ${existing.length}개`);
    existing.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.fileName || r.path || r.url}`);
      if (r.actualPath && r.actualPath !== r.path) {
        console.log(`     실제 경로: ${r.actualPath}`);
      }
    });
    
    console.log(`\n❌ 없는 파일: ${missing.length}개`);
    missing.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.fileName || r.path || r.url}`);
      console.log(`     경로: ${r.path || '(추출 실패)'}`);
    });
    
    // 5. Storage 폴더 확인 (originals/blog/2025-07/88)
    console.log('\n\n🔍 Storage 폴더 확인: originals/blog/2025-07/88');
    try {
      const { data: folderFiles, error: folderError } = await supabase.storage
        .from('blog-images')
        .list('originals/blog/2025-07/88', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (folderError) {
        console.log(`  ❌ 폴더 조회 실패: ${folderError.message}`);
      } else {
        console.log(`  📁 폴더 내 파일 개수: ${folderFiles?.length || 0}개`);
        if (folderFiles && folderFiles.length > 0) {
          console.log(`  📋 파일 목록:`);
          folderFiles.forEach((file, i) => {
            console.log(`    ${i + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`);
          });
        } else {
          console.log(`  ⚠️ 폴더가 비어있거나 존재하지 않음`);
        }
      }
    } catch (error) {
      console.log(`  ❌ 폴더 확인 오류: ${error.message}`);
    }
    
    console.log('\n✅ 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkBlog88Images().catch(console.error);

