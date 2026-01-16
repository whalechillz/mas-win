// 테스트 이미지 생성 스크립트 (삭제 테스트용)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

// 간단한 테스트 이미지 생성 (1x1 픽셀 PNG)
function createTestImage() {
  // PNG 헤더 + 1x1 픽셀 데이터
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG 시그니처
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR 청크
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 크기
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT 청크
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,
    0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND 청크
    0xAE, 0x42, 0x60, 0x82
  ]);
  return pngData;
}

async function createTestImageForDelete() {
  console.log('🖼️ 테스트 이미지 생성 시작...\n');

  try {
    // 테스트 폴더 경로
    const testFolder = 'originals/test-delete';
    const timestamp = Date.now();
    const fileName = `test-delete-${timestamp}.png`;
    const filePath = `${testFolder}/${fileName}`;

    // 테스트 이미지 생성
    const imageBuffer = createTestImage();
    console.log(`📝 테스트 이미지 생성: ${fileName} (${imageBuffer.length} bytes)`);

    // Supabase Storage에 업로드
    console.log(`📤 Supabase Storage에 업로드 중...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`업로드 실패: ${uploadError.message}`);
    }

    console.log(`✅ 업로드 완료: ${filePath}`);

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`🔗 Public URL: ${publicUrl}`);

    // image_metadata에 등록
    console.log(`📋 image_metadata에 등록 중...`);
    const { data: metadataData, error: metadataError } = await supabase
      .from('image_metadata')
      .insert({
        image_url: publicUrl,
        folder_path: testFolder,
        file_name: fileName,
        file_path: filePath,
        source: 'test',
        upload_source: 'test',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (metadataError) {
      console.warn(`⚠️ 메타데이터 등록 실패 (무시): ${metadataError.message}`);
    } else {
      console.log(`✅ 메타데이터 등록 완료 (ID: ${metadataData.id})`);
    }

    // 결과 출력
    console.log('\n✅ 테스트 이미지 생성 완료!\n');
    console.log('📋 생성된 이미지 정보:');
    console.log(`   - 파일명: ${fileName}`);
    console.log(`   - 경로: ${filePath}`);
    console.log(`   - URL: ${publicUrl}`);
    console.log(`   - 메타데이터 ID: ${metadataData?.id || '없음'}`);
    console.log(`\n💡 이 이미지를 삭제 테스트에 사용할 수 있습니다.`);

    // JSON 파일로 저장 (Playwright 테스트에서 사용)
    const testInfo = {
      fileName,
      filePath,
      publicUrl,
      metadataId: metadataData?.id || null,
      createdAt: new Date().toISOString()
    };

    const testInfoPath = path.join(__dirname, 'test-image-info.json');
    fs.writeFileSync(testInfoPath, JSON.stringify(testInfo, null, 2));
    console.log(`\n💾 테스트 정보 저장: ${testInfoPath}`);

    return testInfo;

  } catch (error) {
    console.error('❌ 테스트 이미지 생성 실패:', error);
    throw error;
  }
}

createTestImageForDelete()
  .then(() => {
    console.log('\n✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error);
    process.exit(1);
  });
