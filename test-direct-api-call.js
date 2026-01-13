/**
 * API를 직접 호출해서 서버 로그 확인
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

async function testDirectStorageQuery() {
  console.log('🔍 Supabase Storage 직접 조회 테스트...\n');
  
  const folderPath = 'originals/daily-branding/kakao/2026-01-13/account1/background';
  
  console.log(`📁 폴더: ${folderPath}\n`);
  
  // 1. 직접 Storage 조회
  console.log('1️⃣ Supabase Storage 직접 조회...');
  const { data: files, error } = await supabase.storage
    .from('blog-images')
    .list(folderPath, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) {
    console.error('❌ 에러:', error);
    return;
  }
  
  console.log(`✅ 조회 성공: ${files?.length || 0}개 항목\n`);
  
  if (!files || files.length === 0) {
    console.log('❌ 파일이 없습니다');
    return;
  }
  
  // 파일과 폴더 분리
  const folders = files.filter(f => !f.id);
  const fileItems = files.filter(f => f.id);
  
  console.log(`📂 폴더: ${folders.length}개`);
  console.log(`📄 파일: ${fileItems.length}개\n`);
  
  // 이미지 파일 필터링
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'];
  const imageFiles = fileItems.filter(file => {
    const ext = file.name.toLowerCase();
    return imageExtensions.some(extType => ext.endsWith(extType)) && 
           file.name.toLowerCase() !== '.keep.png';
  });
  
  console.log(`🖼️ 이미지 파일: ${imageFiles.length}개\n`);
  
  if (imageFiles.length > 0) {
    console.log('📋 이미지 파일 목록:');
    imageFiles.forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file.name}`);
      console.log(`      - id: ${file.id}`);
      console.log(`      - created_at: ${file.created_at}`);
      console.log(`      - metadata: ${JSON.stringify(file.metadata || {})}`);
      console.log('');
    });
  }
  
  // 2. API 엔드포인트 테스트 (인증 필요)
  console.log('\n2️⃣ API 엔드포인트 테스트는 인증이 필요하므로 스킵\n');
  
  console.log('✅ 테스트 완료\n');
}

testDirectStorageQuery().catch(console.error);
