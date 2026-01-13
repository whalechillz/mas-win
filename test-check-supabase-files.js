/**
 * Supabase Storage에 실제로 파일이 있는지 확인하는 스크립트
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFilesInFolder(folderPath) {
  console.log(`\n🔍 폴더 확인: ${folderPath || '루트'}`);
  
  try {
    // 1. 현재 폴더의 파일 목록 조회
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error(`❌ 폴더 조회 에러:`, error);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log(`   📭 파일 없음`);
      return;
    }
    
    console.log(`   📁 총 ${files.length}개 항목 발견`);
    
    // 파일과 폴더 분리
    const folders = files.filter(f => !f.id);
    const fileItems = files.filter(f => f.id);
    
    console.log(`   📂 폴더: ${folders.length}개`);
    console.log(`   📄 파일: ${fileItems.length}개`);
    
    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'];
    const imageFiles = fileItems.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extType => ext.endsWith(extType)) && 
             file.name.toLowerCase() !== '.keep.png' &&
             !(folderPath ? `${folderPath}/${file.name}` : file.name).startsWith('temp/');
    });
    
    console.log(`   🖼️ 이미지 파일: ${imageFiles.length}개`);
    
    if (imageFiles.length > 0) {
      console.log(`\n   📋 이미지 파일 목록:`);
      imageFiles.forEach((file, idx) => {
        const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fullPath);
        console.log(`      ${idx + 1}. ${file.name}`);
        console.log(`         경로: ${fullPath}`);
        console.log(`         URL: ${urlData.publicUrl}`);
        console.log(`         크기: ${(file.metadata?.size / 1024).toFixed(2)}KB`);
        console.log(`         생성일: ${file.created_at}`);
        console.log('');
      });
    }
    
    // 하위 폴더도 확인
    if (folders.length > 0) {
      console.log(`\n   📂 하위 폴더 확인:`);
      for (const folder of folders.slice(0, 5)) { // 최대 5개만
        const subFolderPath = folderPath ? `${folderPath}/${folder.name}` : folder.name;
        await checkFilesInFolder(subFolderPath);
      }
    }
    
  } catch (error) {
    console.error(`❌ 오류 발생:`, error);
  }
}

(async () => {
  console.log('🔍 Supabase Storage 파일 확인 시작...\n');
  
  // 테스트할 폴더 경로들
  const testFolders = [
    'originals/daily-branding/kakao/2026-01-13/account1/background',
    'originals/daily-branding/kakao/2026-01-13/account1/profile',
    'originals/daily-branding/kakao/2026-01-13/account1/feed',
    'originals/daily-branding/kakao/2026-01-12/account1/background',
    'originals/daily-branding/kakao/2026-01-12/account1/profile',
    'originals/daily-branding/kakao/2026-01-12/account1/feed'
  ];
  
  for (const folderPath of testFolders) {
    await checkFilesInFolder(folderPath);
  }
  
  console.log('\n✅ 파일 확인 완료\n');
})();
