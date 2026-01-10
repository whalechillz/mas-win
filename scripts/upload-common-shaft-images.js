/**
 * 공통 샤프트 이미지 업로드 및 최적화 스크립트
 * 
 * 1. secret-force-common-shaft*.webp 파일을 secret-force-common-shaft-01.webp 형식으로 변경
 * 2. secret-force-common 폴더에 업로드
 * 3. V3, PRO 3 제품에서 공통으로 사용 가능하도록
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads');

/**
 * 파일을 Supabase Storage에 업로드
 */
async function uploadFile(localPath, storagePath) {
  try {
    if (!fs.existsSync(localPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${localPath}`);
      return { success: false, error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(localPath);
    console.log(`📤 업로드 중: ${path.basename(localPath)} → ${storagePath}`);

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`❌ 업로드 오류:`, error);
      return { success: false, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${path.basename(storagePath)}`);
    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류:`, error);
    return { success: false, error };
  }
}

/**
 * Supabase Storage에서 파일 복사
 */
async function copyFileInStorage(sourcePath, targetPath) {
  try {
    console.log(`📋 복사 중: ${sourcePath} → ${targetPath}`);

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
  console.log(`📁 다운로드 폴더: ${downloadsPath}\n`);

  const targetFolder = 'originals/products/secret-force-common/composition';
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 1. 다운로드 폴더에서 파일 찾기 및 업로드
  console.log('📋 1단계: 다운로드 폴더에서 파일 업로드\n');

  const fileMappings = [
    {
      source: 'secret-force-common-shaft-grip.webp',
      target: 'secret-force-common-shaft-01.webp', // 그립 포함 = 01
    },
    {
      source: 'secret-force-common-shaft.webp',
      target: 'secret-force-common-shaft-02.webp', // 그립 없음 = 02
    }
  ];

  for (const mapping of fileMappings) {
    const sourceLocalPath = path.join(downloadsPath, mapping.source);
    const storagePath = `${targetFolder}/${mapping.target}`;

    if (!fs.existsSync(sourceLocalPath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${mapping.source}`);
      console.warn(`   경로: ${sourceLocalPath}`);
      
      // Supabase Storage에서 기존 파일 확인
      const existingPath = `${targetFolder}/${mapping.source}`;
      const { data: existingFiles } = await supabase.storage
        .from('blog-images')
        .list(targetFolder, { search: mapping.source });

      if (existingFiles && existingFiles.length > 0) {
        console.log(`   📋 Supabase Storage에서 기존 파일 발견, 복사 중...`);
        const result = await copyFileInStorage(existingPath, storagePath);
        results.push({
          source: mapping.source,
          target: mapping.target,
          ...result,
        });
        if (result.success) successCount++;
        else errorCount++;
      } else {
        errorCount++;
      }
      continue;
    }

    const result = await uploadFile(sourceLocalPath, storagePath);
    results.push({
      source: mapping.source,
      target: mapping.target,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // 2. 기존 파일명으로 된 파일이 있으면 새 파일명으로 복사
  console.log('\n📋 2단계: 기존 파일명 확인 및 복사\n');

  const existingFiles = [
    { old: 'secret-force-common-shaft-grip.webp', new: 'secret-force-common-shaft-01.webp' },
    { old: 'secret-force-common-shaft.webp', new: 'secret-force-common-shaft-02.webp' },
  ];

  for (const file of existingFiles) {
    const oldPath = `${targetFolder}/${file.old}`;
    const newPath = `${targetFolder}/${file.new}`;

    // 기존 파일이 있는지 확인
    const { data: files } = await supabase.storage
      .from('blog-images')
      .list(targetFolder, { search: file.old });

    if (files && files.some(f => f.name === file.old)) {
      // 새 파일명으로 복사
      const result = await copyFileInStorage(oldPath, newPath);
      if (result.success) {
        console.log(`   ✅ ${file.old} → ${file.new}`);
        successCount++;
      } else {
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 업로드 완료!');
  console.log('='.repeat(60));
  console.log(`📊 요약: 성공 ${successCount}개, 실패 ${errorCount}개`);
  console.log(`📁 대상 폴더: ${targetFolder}`);
  console.log('\n📁 업로드된 파일:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  ✅ ${r.target}`);
  });
}

main().catch(console.error);
