/**
 * MUZIIK 샤프트 이미지 업로드 스크립트
 * 
 * 3개의 MUZIIK 샤프트 이미지를 muziik-common/composition 폴더에 업로드
 * 파일명: muziik-shaft-01.webp, muziik-shaft-02.webp, muziik-shaft-03.webp
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
    console.log(`   📁 경로: ${storagePath}`);
    console.log(`   🔗 URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 MUZIIK 샤프트 이미지 업로드 시작\n');
  console.log(`📁 다운로드 폴더: ${downloadsPath}\n`);

  const targetFolder = 'originals/products/muziik-common/composition';
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 파일명 매핑
  const fileMappings = {
    'secret-force-pro-3-muziik-shaft-01.webp': 'muziik-shaft-01.webp',
    'secret-force-pro-3-muziik-shaft-02.webp': 'muziik-shaft-02.webp',
    'secret-force-pro-3-muziik-shaft-03.webp': 'muziik-shaft-03.webp',
  };

  for (const [originalName, newName] of Object.entries(fileMappings)) {
    const sourceLocalPath = path.join(downloadsPath, originalName);
    const storagePath = `${targetFolder}/${newName}`;

    if (!fs.existsSync(sourceLocalPath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${originalName}`);
      console.warn(`   경로: ${sourceLocalPath}`);
      errorCount++;
      continue;
    }

    const result = await uploadFile(sourceLocalPath, storagePath);
    results.push({
      originalName,
      newName,
      storagePath,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 업로드 완료!');
  console.log('='.repeat(60));
  console.log(`📊 요약: 성공 ${successCount}개, 실패 ${errorCount}개`);
  console.log(`📁 대상 폴더: ${targetFolder}`);
  console.log('\n📁 업로드된 파일:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  ✅ ${r.newName}`);
  });
}

main().catch(console.error);
