/**
 * 전유근 고객의 실제 파일 위치 찾기 스크립트
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

async function findJeonyugunFiles() {
  console.log('🔍 전유근 고객의 실제 파일 위치 찾기...\n');

  try {
    // 1. 전유근 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. originals 버킷의 customers 폴더 전체 확인
    console.log('📁 originals/customers 폴더 확인 중...\n');
    
    const { data: customerFolders } = await supabase.storage
      .from('originals')
      .list('customers', { limit: 1000 });

    if (customerFolders) {
      // jeonyugun으로 시작하는 폴더 찾기
      const jeonyugunFolders = customerFolders.filter(f => 
        f.name.toLowerCase().includes('jeonyugun') || 
        f.name.toLowerCase().includes('jeonyugeun')
      );
      
      console.log(`✅ jeonyugun 관련 폴더 ${jeonyugunFolders.length}개 발견:\n`);
      
      for (const folder of jeonyugunFolders) {
        console.log(`📁 폴더: ${folder.name}`);
        
        // 재귀적으로 모든 하위 폴더와 파일 확인
        await listFilesRecursive('originals', `customers/${folder.name}`, 0);
        console.log('');
      }
    }

    // 3. 다른 버킷도 확인 (blog-images 등)
    console.log('\n📁 blog-images 버킷 확인 중...\n');
    const { data: blogFolders } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 100 });

    if (blogFolders) {
      const jeonyugunInBlog = blogFolders.filter(f => 
        f.name.toLowerCase().includes('jeonyugun') || 
        f.name.toLowerCase().includes('jeonyugeun')
      );
      
      if (jeonyugunInBlog.length > 0) {
        console.log(`✅ blog-images에 jeonyugun 관련 폴더 ${jeonyugunInBlog.length}개 발견`);
        for (const folder of jeonyugunInBlog) {
          await listFilesRecursive('blog-images', folder.name, 0);
        }
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

async function listFilesRecursive(bucket, path, depth) {
  const indent = '  '.repeat(depth);
  
  try {
    const { data: items, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit: 1000 });

    if (error) {
      console.log(`${indent}❌ 오류: ${error.message}`);
      return;
    }

    if (!items || items.length === 0) {
      return;
    }

    const files = items.filter(item => !item.id); // 파일
    const folders = items.filter(item => item.id === null); // 폴더

    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop();
      let type = '파일';
      if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) type = '🎬 동영상';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) type = '🖼️ 이미지';
      else if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) type = '📄 서류';
      
      console.log(`${indent}${type}: ${file.name} (${file.metadata?.size || 0} bytes)`);
    }

    for (const folder of folders) {
      if (folder.name) {
        console.log(`${indent}📁 ${folder.name}/`);
        await listFilesRecursive(bucket, `${path}/${folder.name}`, depth + 1);
      }
    }
  } catch (error) {
    console.log(`${indent}❌ 오류: ${error.message}`);
  }
}

findJeonyugunFiles().catch(console.error);
