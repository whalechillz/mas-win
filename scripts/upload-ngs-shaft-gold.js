/**
 * 다운로드 폴더의 사프트 골드.webp를 ngs-common/composition/ngs-shaft-gold.webp로 업로드
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

const TARGET_FOLDER = 'originals/products/ngs-common/composition';
const SOURCE_FILE = '사프트 골드.webp';
const TARGET_FILE = 'ngs-shaft-gold.webp';

async function uploadFile() {
  try {
    const sourcePath = path.join(downloadsPath, SOURCE_FILE);

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${sourcePath}`);
      return { success: false, error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(sourcePath);
    const storagePath = `${TARGET_FOLDER}/${TARGET_FILE}`;

    console.log(`📤 업로드 중: ${SOURCE_FILE} → ${storagePath}`);

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true, // 이미 존재하면 덮어쓰기
      });

    if (error) {
      console.error(`❌ 업로드 오류:`, error);
      return { success: false, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${TARGET_FILE}`);
    console.log(`   📁 경로: ${storagePath}`);
    console.log(`   🔗 URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 NGS 골드 샤프트 이미지 업로드 시작\n');
  console.log(`📁 다운로드 폴더: ${downloadsPath}`);
  console.log(`📁 대상 폴더: ${TARGET_FOLDER}\n`);

  const result = await uploadFile();

  if (result.success) {
    console.log('\n✅ 업로드 완료!');
  } else {
    console.log('\n❌ 업로드 실패!');
    process.exit(1);
  }
}

main().catch(console.error);
