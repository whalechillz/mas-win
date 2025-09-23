// Supabase 연결 테스트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 환경 변수 확인:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '❌ 없음');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '❌ 없음');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  try {
    console.log('\n🔗 Supabase 연결 테스트 중...');
    
    // 1. 스토리지 버킷 목록 확인
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ 스토리지 버킷 조회 실패:', bucketsError);
      return;
    }
    
    console.log('✅ 스토리지 버킷 목록:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? '공개' : '비공개'})`);
    });
    
    // 2. blog-images 버킷 확인
    const blogImagesBucket = buckets.find(bucket => bucket.name === 'blog-images');
    if (!blogImagesBucket) {
      console.error('❌ blog-images 버킷을 찾을 수 없습니다.');
      return;
    }
    
    console.log('✅ blog-images 버킷 확인됨');
    
    // 3. 버킷 내 파일 목록 확인
    const { data: files, error: filesError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 5 });
    
    if (filesError) {
      console.error('❌ 파일 목록 조회 실패:', filesError);
      return;
    }
    
    console.log(`✅ blog-images 버킷에 ${files.length}개 파일 확인`);
    if (files.length > 0) {
      console.log('최근 파일들:');
      files.slice(0, 3).forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || '크기 불명'} bytes)`);
      });
    }
    
    // 4. 테스트 파일 업로드
    console.log('\n🧪 테스트 파일 업로드 중...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for Supabase connection.';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ 테스트 파일 업로드 실패:', uploadError);
      return;
    }
    
    console.log('✅ 테스트 파일 업로드 성공:', uploadData.path);
    
    // 5. 테스트 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([testFileName]);
    
    if (deleteError) {
      console.error('⚠️ 테스트 파일 삭제 실패:', deleteError);
    } else {
      console.log('✅ 테스트 파일 삭제 성공');
    }
    
    console.log('\n🎉 Supabase 연결 테스트 완료!');
    
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error);
  }
}

testSupabaseConnection();

