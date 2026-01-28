/**
 * 박성우 고객의 Storage 실제 파일 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageFiles() {
  console.log('🔍 박성우 고객의 Storage 실제 파일 확인...\n');

  try {
    const folderName = 'parksungwoo-6003';
    
    // 재귀적으로 모든 파일 탐색
    const allFiles = [];
    const traverseFolder = async (path) => {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(path, { limit: 1000 });
      
      if (error) {
        console.error(`❌ 폴더 조회 실패 (${path}):`, error);
        return;
      }
      
      if (files) {
        for (const file of files) {
          if (file.name.endsWith('/')) {
            // 폴더인 경우 재귀 탐색
            await traverseFolder(`${path}/${file.name.slice(0, -1)}`);
          } else {
            // 파일인 경우 추가
            allFiles.push({
              path: `${path}/${file.name}`,
              name: file.name,
              size: file.metadata?.size || 0,
              updated: file.updated_at
            });
          }
        }
      }
    };
    
    await traverseFolder(`originals/customers/${folderName}`);
    
    console.log(`✅ Storage 전체 파일: ${allFiles.length}개\n`);
    
    if (allFiles.length > 0) {
      console.log('📋 파일 목록:\n');
      allFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path}`);
        console.log(`   크기: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   수정일: ${file.updated || '알 수 없음'}\n`);
      });
    } else {
      console.log('⚠️ Storage에 파일이 없습니다.\n');
    }
    
    // 특정 파일 확인 (로드 실패한 파일들)
    const failedFiles = [
      'parksungwoo_s1_7_01.webp',
      'parksungwoo_s1_7_02.webp'
    ];
    
    console.log('🔍 로드 실패한 파일 확인:\n');
    for (const fileName of failedFiles) {
      const found = allFiles.find(f => f.name === fileName);
      if (found) {
        console.log(`✅ ${fileName} - 존재함: ${found.path}`);
      } else {
        console.log(`❌ ${fileName} - Storage에 없음`);
        
        // 모든 폴더에서 검색
        for (const file of allFiles) {
          if (file.name.includes(fileName.split('.')[0])) {
            console.log(`   유사한 파일: ${file.path}`);
          }
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkStorageFiles().catch(console.error);
