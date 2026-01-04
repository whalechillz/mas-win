const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllProductsFolders() {
  console.log('📁 originals/products/ 폴더의 모든 제품 확인 중...\n');
  
  const basePath = 'originals/products';
  
  // 1. products 폴더의 모든 하위 폴더 조회
  console.log(`\n=== ${basePath} 폴더의 제품 목록 ===`);
  const { data: productFolders, error: rootError } = await supabase.storage
    .from('blog-images')
    .list(basePath, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  
  if (rootError) {
    console.error('❌ 폴더 조회 오류:', rootError);
    return;
  }
  
  if (!productFolders || productFolders.length === 0) {
    console.log('📭 제품 폴더가 없습니다.');
    return;
  }
  
  // 폴더만 필터링 (id가 없는 항목)
  const folders = productFolders.filter(item => !item.id);
  console.log(`\n📂 발견된 제품 폴더: ${folders.length}개\n`);
  
  // 각 제품 폴더의 이미지 개수 확인
  const results = [];
  
  for (const folder of folders) {
    const productPath = `${basePath}/${folder.name}`;
    const subFolders = ['composition', 'detail', 'gallery'];
    
    let totalImages = 0;
    const folderCounts = {};
    
    for (const subFolder of subFolders) {
      const subFolderPath = `${productPath}/${subFolder}`;
      
      let imageCount = 0;
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list(subFolderPath, { 
            limit: batchSize,
            offset: offset
          });
        
        if (error) {
          break; // 폴더가 없거나 오류
        }
        
        if (!files || files.length === 0) {
          break;
        }
        
        const images = files.filter(item => item.id && 
          ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => 
            item.name.toLowerCase().endsWith(ext)
          )
        );
        
        imageCount += images.length;
        offset += batchSize;
        
        if (files.length < batchSize) {
          break;
        }
      }
      
      folderCounts[subFolder] = imageCount;
      totalImages += imageCount;
    }
    
    if (totalImages > 0) {
      results.push({
        name: folder.name,
        path: productPath,
        total: totalImages,
        counts: folderCounts
      });
    }
  }
  
  // 결과 정렬 (이미지 개수 많은 순)
  results.sort((a, b) => b.total - a.total);
  
  console.log('📊 이미지가 있는 제품 폴더:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   경로: ${result.path}`);
    console.log(`   총 이미지: ${result.total}개`);
    console.log(`   - composition: ${result.counts.composition}개`);
    console.log(`   - detail: ${result.counts.detail}개`);
    console.log(`   - gallery: ${result.counts.gallery}개`);
    console.log('');
  });
  
  if (results.length === 0) {
    console.log('⚠️ 이미지가 있는 제품 폴더가 없습니다.');
  }
  
  console.log(`\n✅ 확인 완료: 총 ${results.length}개 제품에 이미지가 있습니다.`);
}

checkAllProductsFolders().catch(console.error);






