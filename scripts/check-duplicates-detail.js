/**
 * 중복 파일 상세 확인 스크립트
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
  const productFolders = [
    'originals/products/black-beryl',
    'originals/products/black-weapon',
    'originals/products/gold-weapon4',
    'originals/products/gold2',
    'originals/products/gold2-sapphire',
    'originals/products/pro3',
    'originals/products/pro3-muziik',
    'originals/products/v3',
    'originals/products/goods'
  ];

  const allFiles = new Map();
  
  for (const folder of productFolders) {
    const getAllFilesRecursive = async (currentFolder) => {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(currentFolder, {
          limit: 1000
        });
      
      if (error) {
        console.log(`  ⚠️  ${currentFolder} 조회 실패: ${error.message}`);
        return;
      }
      
      if (!files || files.length === 0) return;
      
      for (const file of files) {
        if (!file.id) {
          await getAllFilesRecursive(`${currentFolder}/${file.name}`);
        } else {
          const fileName = file.name.toLowerCase();
          const fullPath = `${currentFolder}/${file.name}`;
          
          if (!allFiles.has(fileName)) {
            allFiles.set(fileName, []);
          }
          allFiles.get(fileName).push({
            path: fullPath,
            folder: currentFolder,
            name: file.name
          });
        }
      }
    };
    
    await getAllFilesRecursive(folder);
  }
  
  // 중복 파일 찾기
  const duplicates = [];
  allFiles.forEach((paths, fileName) => {
    if (paths.length > 1) {
      const goodsPaths = paths.filter(p => p.folder.includes('goods/'));
      const otherPaths = paths.filter(p => !p.folder.includes('goods/'));
      
      if (goodsPaths.length > 0) {
        duplicates.push({
          fileName,
          goodsPaths,
          otherPaths,
          total: paths.length
        });
      }
    }
  });
  
  console.log(`\n📊 중복 파일 그룹: ${duplicates.length}개\n`);
  
  // 상위 20개만 출력
  duplicates.slice(0, 20).forEach((dup, idx) => {
    console.log(`${idx + 1}. ${dup.fileName} (총 ${dup.total}개)`);
    console.log(`   goods 경로: ${dup.goodsPaths.map(p => p.path).join('\n              ')}`);
    if (dup.otherPaths.length > 0) {
      console.log(`   다른 경로: ${dup.otherPaths.map(p => p.path).join('\n              ')}`);
    }
    console.log('');
  });
}

checkDuplicates().catch(console.error);

