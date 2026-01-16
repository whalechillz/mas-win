/**
 * customers 폴더 전체 삭제 스크립트
 * Supabase Storage와 image_metadata 테이블에서 모두 삭제
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteCustomersFolder() {
  console.log('='.repeat(60));
  console.log('customers 폴더 전체 삭제');
  console.log('='.repeat(60));
  console.log('\n⚠️  경고: 이 작업은 되돌릴 수 없습니다!\n');
  
  // 1. image_metadata에서 customers 폴더의 이미지 개수 확인
  const { data: images, count } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path', { count: 'exact' })
    .like('folder_path', 'originals/customers/%');
  
  if (!images || images.length === 0) {
    console.log('✅ 삭제할 이미지가 없습니다.');
    return;
  }
  
  console.log(`📊 발견된 이미지: ${count}개`);
  console.log(`📊 발견된 메타데이터: ${images.length}개\n`);
  
  // 2. 메타데이터 삭제
  console.log('🗑️  메타데이터 삭제 중...');
  const { error: deleteError } = await supabase
    .from('image_metadata')
    .delete()
    .like('folder_path', 'originals/customers/%');
  
  if (deleteError) {
    console.error('❌ 메타데이터 삭제 실패:', deleteError);
    return;
  }
  
  console.log(`✅ 메타데이터 ${images.length}개 삭제 완료\n`);
  
  // 3. Supabase Storage에서 폴더 삭제
  console.log('🗑️  Storage 폴더 삭제 중...');
  
  // customers 폴더 내의 모든 파일 목록 가져오기
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list('originals/customers', {
      limit: 10000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (listError) {
    console.error('❌ 파일 목록 조회 실패:', listError);
    return;
  }
  
  if (!files || files.length === 0) {
    console.log('✅ 삭제할 파일이 없습니다.');
    return;
  }
  
  console.log(`📊 발견된 파일/폴더: ${files.length}개`);
  
  // 재귀적으로 모든 파일 삭제
  async function deleteRecursive(path) {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit: 10000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`❌ ${path} 목록 조회 실패:`, error);
      return;
    }
    
    if (!items || items.length === 0) {
      return;
    }
    
    for (const item of items) {
      const itemPath = `${path}/${item.name}`;
      
      if (item.id) {
        // 파일인 경우
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([itemPath]);
        
        if (deleteError) {
          console.error(`❌ 파일 삭제 실패: ${itemPath} -`, deleteError);
        } else {
          console.log(`   ✅ 삭제: ${itemPath}`);
        }
      } else {
        // 폴더인 경우 재귀 삭제
        await deleteRecursive(itemPath);
      }
    }
  }
  
  // customers 폴더 내의 모든 항목 삭제
  for (const file of files) {
    const filePath = `originals/customers/${file.name}`;
    await deleteRecursive(filePath);
  }
  
  console.log('\n✅ customers 폴더 삭제 완료!');
  
  // 4. customers 테이블의 folder_name, name_en, initials 컬럼 초기화
  console.log('\n🔄 customers 테이블 초기화 중...');
  const { data: customers, error: fetchCustomersError } = await supabase
    .from('customers')
    .select('id');
  
  if (fetchCustomersError) {
    console.error('❌ 고객 목록 조회 실패:', fetchCustomersError.message);
    return;
  }
  
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    const { error: updateCustomersError } = await supabase
      .from('customers')
      .update({
        folder_name: null,
        name_en: null,
        initials: null
      })
      .in('id', customerIds);
    
    if (updateCustomersError) {
      console.error('❌ customers 테이블 초기화 실패:', updateCustomersError.message);
      return;
    }
    console.log(`📊 초기화 대상: ${customerIds.length}개`);
    console.log(`✅ customers 테이블 초기화 완료!\n`);
  } else {
    console.log('📊 초기화할 고객이 없습니다.\n');
  }
  
  // 5. 삭제 확인
  await verifyDeletion();
  
  console.log('\n✅ 전체 삭제 완료!');
  console.log('='.repeat(60));
}

async function verifyDeletion() {
  console.log('🔍 삭제 확인 중...\n');
  
  // 메타데이터 확인
  const { count: metadataCount, error: metadataError } = await supabase
    .from('image_metadata')
    .select('id', { count: 'exact', head: true })
    .like('folder_path', 'originals/customers/%');
  
  if (metadataError) {
    console.error('❌ 메타데이터 확인 실패:', metadataError.message);
  } else {
    console.log(`📊 남은 customer 메타데이터: ${metadataCount}개`);
  }
  
  // Storage 확인
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(bucketName)
    .list('originals/customers', { limit: 1 });
  
  if (storageError) {
    console.error('❌ Storage 확인 실패:', storageError.message);
  } else {
    console.log(`📊 Storage customers 폴더 항목: ${storageFiles?.length || 0}개`);
  }
  
  // customers 테이블 초기화 확인
  const { count: customersCount, error: customersError } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .or('folder_name.not.is.null,name_en.not.is.null,initials.not.is.null');
  
  if (customersError) {
    console.error('❌ customers 테이블 초기화 확인 실패:', customersError.message);
  } else {
    console.log(`📊 초기화되지 않은 customers: ${customersCount}개`);
  }
  
  if (metadataCount > 0 || (storageFiles && storageFiles.length > 0) || customersCount > 0) {
    console.warn('\n⚠️  일부 데이터가 남아있을 수 있습니다.');
  } else {
    console.log('\n✅ 모든 데이터가 성공적으로 삭제 및 초기화되었습니다.');
  }
}

if (require.main === module) {
  deleteCustomersFolder().catch(console.error);
}

module.exports = { deleteCustomersFolder };
