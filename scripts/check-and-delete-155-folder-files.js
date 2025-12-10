/**
 * 155번 폴더의 모든 파일 확인 및 삭제
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndDelete155FolderFiles() {
  console.log('🔍 155번 폴더의 모든 파일 확인 및 삭제...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-05/155';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ 폴더가 비어있습니다. 삭제할 파일이 없습니다.\n');
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    if (imageFiles.length === 0) {
      console.log('⚠️ 이미지 파일이 없습니다.\n');
      return;
    }

    // 각 파일 정보 출력
    imageFiles.forEach((file, index) => {
      const filePath = `${folderPath}/${file.name}`;
      const fileSize = file.metadata?.size || 0;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   경로: ${filePath}`);
      console.log(`   크기: ${fileSizeKB} KB (${fileSize} bytes)`);
      console.log(`   생성일: ${file.created_at || '알 수 없음'}`);
      console.log(`   수정일: ${file.updated_at || '알 수 없음'}`);
      
      // 손상된 파일 여부 확인
      if (fileSize < 1000) {
        console.log(`   ⚠️ 경고: 파일 크기가 매우 작습니다 (손상 가능성)`);
      }
      console.log('');
    });

    // 2. 삭제 진행
    console.log('='.repeat(60));
    console.log(`⚠️ 삭제 대상: ${imageFiles.length}개 파일\n`);
      let successCount = 0;
      let errorCount = 0;

      // 각 파일 삭제
      for (const file of imageFiles) {
        const filePath = `${folderPath}/${file.name}`;
        
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ ${file.name} 삭제 실패:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`✅ ${file.name} 삭제 완료`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ ${file.name} 삭제 중 오류:`, error.message);
          errorCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 삭제 결과:');
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ❌ 실패: ${errorCount}개`);
      console.log('='.repeat(60));

      // 3. 삭제 후 확인
      console.log('\n🔍 삭제 후 폴더 확인 중...\n');
      
      const { data: remainingFiles, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100
        });

      if (checkError) {
        console.error('❌ 폴더 확인 실패:', checkError.message);
      } else if (!remainingFiles || remainingFiles.length === 0) {
        console.log('✅ 폴더가 비어있습니다. 모든 파일이 삭제되었습니다.\n');
      } else {
        const remainingImages = remainingFiles.filter(file => {
          const ext = file.name.toLowerCase();
          return imageExtensions.some(extName => ext.endsWith(extName));
        });
        
        if (remainingImages.length === 0) {
          console.log('✅ 모든 이미지 파일이 삭제되었습니다.\n');
        } else {
          console.log(`⚠️ 남은 이미지 파일: ${remainingImages.length}개`);
          remainingImages.forEach(file => {
            console.log(`   - ${file.name}`);
          });
          console.log('');
        }
      }

      // 4. 링크된 이미지 확인
      console.log('🔗 링크된 이미지 확인 중...\n');
      
      const { data: linkedMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', ['sms-155'])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .neq('folder_path', folderPath);

      if (linkedMetadata && linkedMetadata.length > 0) {
        console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견:\n`);
        linkedMetadata.forEach(meta => {
          console.log(`   - ${meta.image_url.split('/').pop()}`);
          console.log(`     원본 폴더: ${meta.folder_path}`);
          console.log(`     태그: ${meta.tags?.join(', ') || '(없음)'}\n`);
        });
      } else {
        console.log('⚠️ 링크된 이미지를 찾을 수 없습니다.\n');
      }

      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   이제 155번 폴더를 열면 링크된 이미지(128번)만 표시됩니다.');
      console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkAndDelete155FolderFiles();


 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndDelete155FolderFiles() {
  console.log('🔍 155번 폴더의 모든 파일 확인 및 삭제...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-05/155';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ 폴더가 비어있습니다. 삭제할 파일이 없습니다.\n');
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    if (imageFiles.length === 0) {
      console.log('⚠️ 이미지 파일이 없습니다.\n');
      return;
    }

    // 각 파일 정보 출력
    imageFiles.forEach((file, index) => {
      const filePath = `${folderPath}/${file.name}`;
      const fileSize = file.metadata?.size || 0;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   경로: ${filePath}`);
      console.log(`   크기: ${fileSizeKB} KB (${fileSize} bytes)`);
      console.log(`   생성일: ${file.created_at || '알 수 없음'}`);
      console.log(`   수정일: ${file.updated_at || '알 수 없음'}`);
      
      // 손상된 파일 여부 확인
      if (fileSize < 1000) {
        console.log(`   ⚠️ 경고: 파일 크기가 매우 작습니다 (손상 가능성)`);
      }
      console.log('');
    });

    // 2. 삭제 진행
    console.log('='.repeat(60));
    console.log(`⚠️ 삭제 대상: ${imageFiles.length}개 파일\n`);
      let successCount = 0;
      let errorCount = 0;

      // 각 파일 삭제
      for (const file of imageFiles) {
        const filePath = `${folderPath}/${file.name}`;
        
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ ${file.name} 삭제 실패:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`✅ ${file.name} 삭제 완료`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ ${file.name} 삭제 중 오류:`, error.message);
          errorCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 삭제 결과:');
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ❌ 실패: ${errorCount}개`);
      console.log('='.repeat(60));

      // 3. 삭제 후 확인
      console.log('\n🔍 삭제 후 폴더 확인 중...\n');
      
      const { data: remainingFiles, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100
        });

      if (checkError) {
        console.error('❌ 폴더 확인 실패:', checkError.message);
      } else if (!remainingFiles || remainingFiles.length === 0) {
        console.log('✅ 폴더가 비어있습니다. 모든 파일이 삭제되었습니다.\n');
      } else {
        const remainingImages = remainingFiles.filter(file => {
          const ext = file.name.toLowerCase();
          return imageExtensions.some(extName => ext.endsWith(extName));
        });
        
        if (remainingImages.length === 0) {
          console.log('✅ 모든 이미지 파일이 삭제되었습니다.\n');
        } else {
          console.log(`⚠️ 남은 이미지 파일: ${remainingImages.length}개`);
          remainingImages.forEach(file => {
            console.log(`   - ${file.name}`);
          });
          console.log('');
        }
      }

      // 4. 링크된 이미지 확인
      console.log('🔗 링크된 이미지 확인 중...\n');
      
      const { data: linkedMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', ['sms-155'])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .neq('folder_path', folderPath);

      if (linkedMetadata && linkedMetadata.length > 0) {
        console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견:\n`);
        linkedMetadata.forEach(meta => {
          console.log(`   - ${meta.image_url.split('/').pop()}`);
          console.log(`     원본 폴더: ${meta.folder_path}`);
          console.log(`     태그: ${meta.tags?.join(', ') || '(없음)'}\n`);
        });
      } else {
        console.log('⚠️ 링크된 이미지를 찾을 수 없습니다.\n');
      }

      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   이제 155번 폴더를 열면 링크된 이미지(128번)만 표시됩니다.');
      console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkAndDelete155FolderFiles();


 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndDelete155FolderFiles() {
  console.log('🔍 155번 폴더의 모든 파일 확인 및 삭제...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-05/155';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ 폴더가 비어있습니다. 삭제할 파일이 없습니다.\n');
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    if (imageFiles.length === 0) {
      console.log('⚠️ 이미지 파일이 없습니다.\n');
      return;
    }

    // 각 파일 정보 출력
    imageFiles.forEach((file, index) => {
      const filePath = `${folderPath}/${file.name}`;
      const fileSize = file.metadata?.size || 0;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   경로: ${filePath}`);
      console.log(`   크기: ${fileSizeKB} KB (${fileSize} bytes)`);
      console.log(`   생성일: ${file.created_at || '알 수 없음'}`);
      console.log(`   수정일: ${file.updated_at || '알 수 없음'}`);
      
      // 손상된 파일 여부 확인
      if (fileSize < 1000) {
        console.log(`   ⚠️ 경고: 파일 크기가 매우 작습니다 (손상 가능성)`);
      }
      console.log('');
    });

    // 2. 삭제 진행
    console.log('='.repeat(60));
    console.log(`⚠️ 삭제 대상: ${imageFiles.length}개 파일\n`);
      let successCount = 0;
      let errorCount = 0;

      // 각 파일 삭제
      for (const file of imageFiles) {
        const filePath = `${folderPath}/${file.name}`;
        
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ ${file.name} 삭제 실패:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`✅ ${file.name} 삭제 완료`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ ${file.name} 삭제 중 오류:`, error.message);
          errorCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 삭제 결과:');
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ❌ 실패: ${errorCount}개`);
      console.log('='.repeat(60));

      // 3. 삭제 후 확인
      console.log('\n🔍 삭제 후 폴더 확인 중...\n');
      
      const { data: remainingFiles, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100
        });

      if (checkError) {
        console.error('❌ 폴더 확인 실패:', checkError.message);
      } else if (!remainingFiles || remainingFiles.length === 0) {
        console.log('✅ 폴더가 비어있습니다. 모든 파일이 삭제되었습니다.\n');
      } else {
        const remainingImages = remainingFiles.filter(file => {
          const ext = file.name.toLowerCase();
          return imageExtensions.some(extName => ext.endsWith(extName));
        });
        
        if (remainingImages.length === 0) {
          console.log('✅ 모든 이미지 파일이 삭제되었습니다.\n');
        } else {
          console.log(`⚠️ 남은 이미지 파일: ${remainingImages.length}개`);
          remainingImages.forEach(file => {
            console.log(`   - ${file.name}`);
          });
          console.log('');
        }
      }

      // 4. 링크된 이미지 확인
      console.log('🔗 링크된 이미지 확인 중...\n');
      
      const { data: linkedMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', ['sms-155'])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .neq('folder_path', folderPath);

      if (linkedMetadata && linkedMetadata.length > 0) {
        console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견:\n`);
        linkedMetadata.forEach(meta => {
          console.log(`   - ${meta.image_url.split('/').pop()}`);
          console.log(`     원본 폴더: ${meta.folder_path}`);
          console.log(`     태그: ${meta.tags?.join(', ') || '(없음)'}\n`);
        });
      } else {
        console.log('⚠️ 링크된 이미지를 찾을 수 없습니다.\n');
      }

      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   이제 155번 폴더를 열면 링크된 이미지(128번)만 표시됩니다.');
      console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkAndDelete155FolderFiles();


 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndDelete155FolderFiles() {
  console.log('🔍 155번 폴더의 모든 파일 확인 및 삭제...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-05/155';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ 폴더가 비어있습니다. 삭제할 파일이 없습니다.\n');
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    if (imageFiles.length === 0) {
      console.log('⚠️ 이미지 파일이 없습니다.\n');
      return;
    }

    // 각 파일 정보 출력
    imageFiles.forEach((file, index) => {
      const filePath = `${folderPath}/${file.name}`;
      const fileSize = file.metadata?.size || 0;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   경로: ${filePath}`);
      console.log(`   크기: ${fileSizeKB} KB (${fileSize} bytes)`);
      console.log(`   생성일: ${file.created_at || '알 수 없음'}`);
      console.log(`   수정일: ${file.updated_at || '알 수 없음'}`);
      
      // 손상된 파일 여부 확인
      if (fileSize < 1000) {
        console.log(`   ⚠️ 경고: 파일 크기가 매우 작습니다 (손상 가능성)`);
      }
      console.log('');
    });

    // 2. 삭제 진행
    console.log('='.repeat(60));
    console.log(`⚠️ 삭제 대상: ${imageFiles.length}개 파일\n`);
      let successCount = 0;
      let errorCount = 0;

      // 각 파일 삭제
      for (const file of imageFiles) {
        const filePath = `${folderPath}/${file.name}`;
        
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ ${file.name} 삭제 실패:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`✅ ${file.name} 삭제 완료`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ ${file.name} 삭제 중 오류:`, error.message);
          errorCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 삭제 결과:');
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ❌ 실패: ${errorCount}개`);
      console.log('='.repeat(60));

      // 3. 삭제 후 확인
      console.log('\n🔍 삭제 후 폴더 확인 중...\n');
      
      const { data: remainingFiles, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100
        });

      if (checkError) {
        console.error('❌ 폴더 확인 실패:', checkError.message);
      } else if (!remainingFiles || remainingFiles.length === 0) {
        console.log('✅ 폴더가 비어있습니다. 모든 파일이 삭제되었습니다.\n');
      } else {
        const remainingImages = remainingFiles.filter(file => {
          const ext = file.name.toLowerCase();
          return imageExtensions.some(extName => ext.endsWith(extName));
        });
        
        if (remainingImages.length === 0) {
          console.log('✅ 모든 이미지 파일이 삭제되었습니다.\n');
        } else {
          console.log(`⚠️ 남은 이미지 파일: ${remainingImages.length}개`);
          remainingImages.forEach(file => {
            console.log(`   - ${file.name}`);
          });
          console.log('');
        }
      }

      // 4. 링크된 이미지 확인
      console.log('🔗 링크된 이미지 확인 중...\n');
      
      const { data: linkedMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', ['sms-155'])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .neq('folder_path', folderPath);

      if (linkedMetadata && linkedMetadata.length > 0) {
        console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견:\n`);
        linkedMetadata.forEach(meta => {
          console.log(`   - ${meta.image_url.split('/').pop()}`);
          console.log(`     원본 폴더: ${meta.folder_path}`);
          console.log(`     태그: ${meta.tags?.join(', ') || '(없음)'}\n`);
        });
      } else {
        console.log('⚠️ 링크된 이미지를 찾을 수 없습니다.\n');
      }

      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   이제 155번 폴더를 열면 링크된 이미지(128번)만 표시됩니다.');
      console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkAndDelete155FolderFiles();


 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndDelete155FolderFiles() {
  console.log('🔍 155번 폴더의 모든 파일 확인 및 삭제...\n');
  console.log('='.repeat(60));

  const folderPath = 'originals/mms/2025-12-05/155';

  try {
    // 1. 폴더 내 모든 파일 조회
    console.log(`📁 폴더 경로: ${folderPath}\n`);
    console.log('🔍 파일 목록 조회 중...\n');

    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ 폴더가 비어있습니다. 삭제할 파일이 없습니다.\n');
      return;
    }

    console.log(`✅ 파일 ${files.length}개 발견:\n`);

    // 이미지 파일만 필터링
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return imageExtensions.some(extName => ext.endsWith(extName)) && 
             !file.name.toLowerCase().includes('.keep');
    });

    if (imageFiles.length === 0) {
      console.log('⚠️ 이미지 파일이 없습니다.\n');
      return;
    }

    // 각 파일 정보 출력
    imageFiles.forEach((file, index) => {
      const filePath = `${folderPath}/${file.name}`;
      const fileSize = file.metadata?.size || 0;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   경로: ${filePath}`);
      console.log(`   크기: ${fileSizeKB} KB (${fileSize} bytes)`);
      console.log(`   생성일: ${file.created_at || '알 수 없음'}`);
      console.log(`   수정일: ${file.updated_at || '알 수 없음'}`);
      
      // 손상된 파일 여부 확인
      if (fileSize < 1000) {
        console.log(`   ⚠️ 경고: 파일 크기가 매우 작습니다 (손상 가능성)`);
      }
      console.log('');
    });

    // 2. 삭제 진행
    console.log('='.repeat(60));
    console.log(`⚠️ 삭제 대상: ${imageFiles.length}개 파일\n`);
      let successCount = 0;
      let errorCount = 0;

      // 각 파일 삭제
      for (const file of imageFiles) {
        const filePath = `${folderPath}/${file.name}`;
        
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ ${file.name} 삭제 실패:`, deleteError.message);
            errorCount++;
          } else {
            console.log(`✅ ${file.name} 삭제 완료`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ ${file.name} 삭제 중 오류:`, error.message);
          errorCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 삭제 결과:');
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ❌ 실패: ${errorCount}개`);
      console.log('='.repeat(60));

      // 3. 삭제 후 확인
      console.log('\n🔍 삭제 후 폴더 확인 중...\n');
      
      const { data: remainingFiles, error: checkError } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: 100
        });

      if (checkError) {
        console.error('❌ 폴더 확인 실패:', checkError.message);
      } else if (!remainingFiles || remainingFiles.length === 0) {
        console.log('✅ 폴더가 비어있습니다. 모든 파일이 삭제되었습니다.\n');
      } else {
        const remainingImages = remainingFiles.filter(file => {
          const ext = file.name.toLowerCase();
          return imageExtensions.some(extName => ext.endsWith(extName));
        });
        
        if (remainingImages.length === 0) {
          console.log('✅ 모든 이미지 파일이 삭제되었습니다.\n');
        } else {
          console.log(`⚠️ 남은 이미지 파일: ${remainingImages.length}개`);
          remainingImages.forEach(file => {
            console.log(`   - ${file.name}`);
          });
          console.log('');
        }
      }

      // 4. 링크된 이미지 확인
      console.log('🔗 링크된 이미지 확인 중...\n');
      
      const { data: linkedMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .contains('tags', ['sms-155'])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .neq('folder_path', folderPath);

      if (linkedMetadata && linkedMetadata.length > 0) {
        console.log(`✅ 링크된 이미지 ${linkedMetadata.length}개 발견:\n`);
        linkedMetadata.forEach(meta => {
          console.log(`   - ${meta.image_url.split('/').pop()}`);
          console.log(`     원본 폴더: ${meta.folder_path}`);
          console.log(`     태그: ${meta.tags?.join(', ') || '(없음)'}\n`);
        });
      } else {
        console.log('⚠️ 링크된 이미지를 찾을 수 없습니다.\n');
      }

      console.log('='.repeat(60));
      console.log('✅ 완료!');
      console.log('   이제 155번 폴더를 열면 링크된 이미지(128번)만 표시됩니다.');
      console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkAndDelete155FolderFiles();

