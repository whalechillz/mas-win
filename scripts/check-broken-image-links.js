/**
 * 웹사이트/블로그/홈페이지에서 깨진 이미지 링크 확인
 */

const fs = require('fs');
const path = require('path');

/**
 * /main/products/ 경로를 /originals/products/로 변경해야 하는 파일들 찾기
 */
function findFilesWithMainProducts() {
  const filesToCheck = [];
  
  // 확인할 디렉토리들
  const directories = [
    'pages',
    'components',
    'public',
  ];
  
  const extensions = ['.tsx', '.ts', '.js', '.jsx', '.md', '.html'];
  
  function searchDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // node_modules, .next 등 제외
        if (!item.startsWith('.') && item !== 'node_modules') {
          searchDirectory(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('/main/products/')) {
          filesToCheck.push({
            file: fullPath,
            lines: content.split('\n').map((line, idx) => ({
              line: idx + 1,
              content: line
            })).filter(l => l.content.includes('/main/products/'))
          });
        }
      }
    }
  }
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      searchDirectory(dir);
    }
  }
  
  return filesToCheck;
}

/**
 * 블로그 포스트에서 제품 이미지 링크 확인
 */
async function checkBlogPosts() {
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase 환경 변수가 없어 블로그 포스트를 확인할 수 없습니다.');
    return [];
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image')
      .limit(100);
    
    if (error) {
      console.error('❌ 블로그 포스트 조회 오류:', error.message);
      return [];
    }
    
    const brokenLinks = [];
    
    for (const post of posts || []) {
      const content = post.content || '';
      const featuredImage = post.featured_image || '';
      
      // /main/products/ 경로 찾기
      const mainProductsRegex = /\/main\/products\/[^\s"')]+/g;
      const matches = [...content.matchAll(mainProductsRegex)];
      
      if (matches.length > 0) {
        brokenLinks.push({
          postId: post.id,
          title: post.title,
          type: 'content',
          links: matches.map(m => m[0])
        });
      }
      
      if (featuredImage.includes('/main/products/')) {
        brokenLinks.push({
          postId: post.id,
          title: post.title,
          type: 'featured_image',
          links: [featuredImage]
        });
      }
    }
    
    return brokenLinks;
  } catch (error) {
    console.error('❌ 블로그 포스트 확인 오류:', error.message);
    return [];
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🔍 웹사이트/블로그에서 깨진 이미지 링크 확인 중...\n');
  
  // 1. 파일 시스템에서 /main/products/ 경로 찾기
  console.log('📁 파일 시스템 검색 중...');
  const filesWithMainProducts = findFilesWithMainProducts();
  
  console.log(`\n✅ 발견된 파일: ${filesWithMainProducts.length}개\n`);
  
  for (const fileInfo of filesWithMainProducts) {
    console.log(`📄 ${fileInfo.file}`);
    fileInfo.lines.forEach(l => {
      console.log(`   ${l.line}: ${l.content.trim()}`);
    });
    console.log('');
  }
  
  // 2. 블로그 포스트 확인
  console.log('\n📝 블로그 포스트 확인 중...');
  const blogBrokenLinks = await checkBlogPosts();
  
  if (blogBrokenLinks.length > 0) {
    console.log(`\n✅ 발견된 블로그 포스트: ${blogBrokenLinks.length}개\n`);
    blogBrokenLinks.forEach(link => {
      console.log(`📄 포스트 ID: ${link.postId} - ${link.title}`);
      console.log(`   타입: ${link.type}`);
      console.log(`   링크: ${link.links.join(', ')}\n`);
    });
  } else {
    console.log('\n✅ 블로그 포스트에서 깨진 링크 없음\n');
  }
  
  // 요약
  console.log('\n📊 요약:');
  console.log(`   - 파일 시스템: ${filesWithMainProducts.length}개 파일`);
  console.log(`   - 블로그 포스트: ${blogBrokenLinks.length}개 포스트`);
  console.log(`   - 총 발견: ${filesWithMainProducts.length + blogBrokenLinks.length}개\n`);
}

main().catch(console.error);


