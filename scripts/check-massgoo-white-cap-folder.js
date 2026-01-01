const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFolderStructure() {
  console.log('📁 originals/products/massgoo-white-cap 폴더 구조 확인 중...\n');
  
  const basePath = 'originals/products/massgoo-white-cap';
  
  // 1. 상위 폴더의 파일/폴더 목록
  console.log(`\n=== ${basePath} 폴더 내용 ===`);
  const { data: rootFiles, error: rootError } = await supabase.storage
    .from('blog-images')
    .list(basePath, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  
  if (rootError) {
    console.error('❌ 폴더 조회 오류:', rootError);
    return;
  }
  
  if (rootFiles && rootFiles.length > 0) {
    // 폴더와 파일 분리
    const folders = rootFiles.filter(item => !item.id); // 폴더는 id가 없음
    const files = rootFiles.filter(item => item.id); // 파일은 id가 있음
    
    console.log(`\n📂 하위 폴더 (${folders.length}개):`);
    folders.forEach(folder => {
      console.log(`  - ${folder.name}/`);
    });
    
    console.log(`\n📄 직접 파일 (${files.length}개):`);
    files.slice(0, 20).forEach(file => {
      console.log(`  - ${file.name} (${(file.metadata?.size || 0) / 1024}KB)`);
    });
    if (files.length > 20) {
      console.log(`  ... 외 ${files.length - 20}개 파일`);
    }
  } else {
    console.log('📭 상위 폴더가 비어있습니다. 하위 폴더를 확인합니다...\n');
  }
  
  // 2. 하위 폴더 확인 (composition, detail, gallery) - 배치 조회로 모든 파일 확인
  const subFolders = ['composition', 'detail', 'gallery'];
  
  for (const subFolder of subFolders) {
    const subFolderPath = `${basePath}/${subFolder}`;
    console.log(`\n=== ${subFolderPath} 폴더 내용 (전체 조회) ===`);
    
    let allFilesInFolder = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data: subFiles, error: subError } = await supabase.storage
        .from('blog-images')
        .list(subFolderPath, { 
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' } 
        });
      
      if (subError) {
        console.log(`  ⚠️ 폴더 조회 오류 (offset: ${offset}): ${subError.message}`);
        break;
      }
      
      if (!subFiles || subFiles.length === 0) {
        break; // 더 이상 파일이 없음
      }
      
      allFilesInFolder = allFilesInFolder.concat(subFiles);
      offset += batchSize;
      
      // 마지막 배치면 종료
      if (subFiles.length < batchSize) {
        break;
      }
    }
    
    if (allFilesInFolder.length === 0) {
      console.log(`  📭 폴더가 비어있습니다.`);
      continue;
    }
    
    const imageFiles = allFilesInFolder.filter(item => item.id && 
      ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => 
        item.name.toLowerCase().endsWith(ext)
      )
    );
    
    console.log(`  📸 이미지 파일: ${imageFiles.length}개 (전체 항목: ${allFilesInFolder.length}개)`);
    imageFiles.slice(0, 10).forEach(file => {
      console.log(`    - ${file.name} (${(file.metadata?.size || 0) / 1024}KB)`);
    });
    if (imageFiles.length > 10) {
      console.log(`    ... 외 ${imageFiles.length - 10}개 이미지`);
    }
  }
  
  // 3. 전체 이미지 개수 확인
  console.log(`\n=== 전체 이미지 개수 요약 ===`);
  let totalImages = 0;
  for (const subFolder of subFolders) {
    const subFolderPath = `${basePath}/${subFolder}`;
    const { data: subFiles } = await supabase.storage
      .from('blog-images')
      .list(subFolderPath, { limit: 10000 });
    
    if (subFiles) {
      const imageCount = subFiles.filter(item => item.id && 
        ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => 
          item.name.toLowerCase().endsWith(ext)
        )
      ).length;
      totalImages += imageCount;
      console.log(`  ${subFolder}: ${imageCount}개`);
    }
  }
  console.log(`  총 이미지: ${totalImages}개`);
  
  console.log('\n✅ 폴더 구조 확인 완료');
}

checkFolderStructure().catch(console.error);

