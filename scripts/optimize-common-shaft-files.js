/**
 * 공통 샤프트 이미지 최적화 스크립트
 * 
 * 1. Supabase Storage에서 기존 파일 확인
 * 2. secret-force-common-shaft-grip.webp → secret-force-common-shaft-01.webp
 * 3. secret-force-common-shaft.webp → secret-force-common-shaft-02.webp
 * 4. 새 파일명으로 복사
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const targetFolder = 'originals/products/secret-force-common/composition';

/**
 * Supabase Storage에서 파일 복사
 */
async function copyFileInStorage(sourcePath, targetPath) {
  try {
    console.log(`📋 복사 중: ${path.basename(sourcePath)} → ${path.basename(targetPath)}`);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(sourcePath);

    if (downloadError) {
      console.error(`❌ 파일 다운로드 실패:`, downloadError);
      return { success: false, error: downloadError };
    }

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(targetPath, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ 파일 업로드 실패:`, uploadError);
      return { success: false, error: uploadError };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(targetPath);

    console.log(`✅ 복사 완료: ${path.basename(targetPath)}`);
    return { success: true, url: publicUrl, path: targetPath };
  } catch (error) {
    console.error(`❌ 파일 복사 오류:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 공통 샤프트 이미지 최적화 시작\n');
  console.log(`📁 대상 폴더: ${targetFolder}\n`);

  // 1. 기존 파일 확인
  console.log('📋 1단계: 기존 파일 확인\n');
  const { data: existingFiles, error: listError } = await supabase.storage
    .from('blog-images')
    .list(targetFolder);

  if (listError) {
    console.error('❌ 폴더 목록 조회 실패:', listError);
    process.exit(1);
  }

  console.log(`📄 폴더 내 파일 개수: ${existingFiles?.length || 0}개\n`);

  // 2. 파일명 매핑
  const fileMappings = [
    {
      old: 'secret-force-common-shaft-grip.webp',
      new: 'secret-force-common-shaft-01.webp',
      description: '그립 포함 샤프트'
    },
    {
      old: 'secret-force-common-shaft.webp',
      new: 'secret-force-common-shaft-02.webp',
      description: '그립 없음 샤프트'
    }
  ];

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 3. 각 파일 복사
  for (const mapping of fileMappings) {
    const oldPath = `${targetFolder}/${mapping.old}`;
    const newPath = `${targetFolder}/${mapping.new}`;

    // 기존 파일이 있는지 확인
    const fileExists = existingFiles?.some(f => f.name === mapping.old);
    
    if (fileExists) {
      console.log(`📝 ${mapping.description}: ${mapping.old} → ${mapping.new}`);
      const result = await copyFileInStorage(oldPath, newPath);
      
      results.push({
        old: mapping.old,
        new: mapping.new,
        description: mapping.description,
        ...result,
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${mapping.old}`);
      errorCount++;
    }
    console.log('');
  }

  // 4. 결과 확인
  console.log('📋 2단계: 최종 파일 확인\n');
  const { data: finalFiles } = await supabase.storage
    .from('blog-images')
    .list(targetFolder);

  const newFiles = fileMappings.map(m => m.new);
  const foundNewFiles = finalFiles?.filter(f => newFiles.includes(f.name)) || [];

  console.log(`✅ 새 파일명으로 생성된 파일: ${foundNewFiles.length}개`);
  foundNewFiles.forEach(f => {
    console.log(`   ✅ ${f.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 최적화 완료!');
  console.log('='.repeat(60));
  console.log(`📊 요약: 성공 ${successCount}개, 실패 ${errorCount}개`);
  console.log(`📁 대상 폴더: ${targetFolder}`);
}

main().catch(console.error);
