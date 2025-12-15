/**
 * 설문 조사 이미지를 JPEG로 변환하여 Supabase Storage에 업로드
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImageToSupabase() {
  console.log('='.repeat(100));
  console.log('🖼️ 설문 조사 이미지 Supabase Storage 업로드');
  console.log('='.repeat(100));
  console.log('');

  const imagePath = 'public/main/products/goods/good-reviews/bucket-hat-muziik-8.webp';
  const fullPath = path.join(process.cwd(), imagePath);

  // 1. 이미지 파일 확인
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 이미지 파일을 찾을 수 없습니다: ${fullPath}`);
    process.exit(1);
  }

  console.log(`✅ 이미지 파일 발견: ${imagePath}`);
  const imageBuffer = fs.readFileSync(fullPath);
  console.log(`   파일 크기: ${(imageBuffer.length / 1024).toFixed(2)}KB\n`);

  // 2. WebP를 JPEG로 변환
  console.log('🔄 WebP → JPEG 변환 중...');
  let jpegBuffer;
  
  try {
    const sharp = require('sharp');
    jpegBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 85, mozjpeg: true })
      .resize(640, 480, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    console.log(`✅ JPEG 변환 완료: ${(jpegBuffer.length / 1024).toFixed(2)}KB\n`);
  } catch (error) {
    console.error('❌ Sharp 모듈 오류:', error.message);
    process.exit(1);
  }

  // 3. Supabase Storage에 업로드
  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10);
  const folderPath = `originals/mms/${dateFolder}/survey`;
  const fileName = `bucket-hat-muziik-8-${now.getTime()}.jpg`;
  const storagePath = `${folderPath}/${fileName}`;

  console.log('📤 Supabase Storage에 업로드 중...');
  console.log(`   경로: ${storagePath}`);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(storagePath, jpegBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ Supabase Storage 업로드 실패:', uploadError.message);
    process.exit(1);
  }

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(storagePath);
  
  const supabaseImageUrl = urlData.publicUrl;
  console.log(`✅ Supabase Storage 업로드 성공!`);
  console.log(`   URL: ${supabaseImageUrl}\n`);

  // 4. image_metadata에 메타데이터 저장
  console.log('💾 image_metadata에 메타데이터 저장 중...');
  
  const { error: metaError } = await supabase
    .from('image_metadata')
    .upsert({
      image_url: supabaseImageUrl,
      folder_path: folderPath,
      date_folder: dateFolder,
      source: 'mms',
      channel: 'sms',
      file_size: jpegBuffer.length,
      format: 'jpg',
      upload_source: 'survey-mms',
      tags: ['survey', 'mms', 'bucket-hat', 'muziik'],
      title: '설문 조사 MMS 이미지 - 버킷햇',
      alt_text: 'MASSGOO X MUZIIK 콜라보 버킷햇',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }, { onConflict: 'image_url' });

  if (metaError) {
    console.error('❌ image_metadata 저장 실패:', metaError.message);
    process.exit(1);
  }

  console.log('✅ image_metadata 저장 완료!\n');

  console.log('='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`\n📋 Supabase Image URL: ${supabaseImageUrl}`);
  console.log('💡 이제 이미지가 갤러리에서 표시됩니다.\n');
}

uploadImageToSupabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


