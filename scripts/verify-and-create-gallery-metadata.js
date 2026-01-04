/**
 * 이동된 Gallery 이미지 확인 및 메타데이터 생성
 * 1. Storage에 실제로 이미지가 있는지 확인
 * 2. image_metadata 테이블에 메타데이터가 있는지 확인
 * 3. 없으면 메타데이터 생성
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';
const SUPABASE_BASE_URL = 'https://yyytjudftvpmcnppaymw.supabase.co';

const results = {
  bucketHatBlack: { found: [], missing: [], metadataCreated: [], errors: [] },
  bucketHatWhite: { found: [], missing: [], metadataCreated: [], errors: [] },
  golfHatBeige: { found: [], missing: [], metadataCreated: [], errors: [] },
  golfHatWhite: { found: [], missing: [], metadataCreated: [], errors: [] }
};

/**
 * 폴더의 모든 파일 조회
 */
async function listFiles(folderPath) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      throw error;
    }

    return data ? data.filter(file => file.id !== null) : [];
  } catch (error) {
    console.error(`❌ 폴더 목록 조회 실패: ${folderPath}`, error.message);
    return [];
  }
}

/**
 * image_metadata에 메타데이터 생성
 */
async function createMetadata(imagePath, fileName) {
  try {
    const fullUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
    
    // 폴더 경로 추출
    const folderPath = imagePath.substring(0, imagePath.lastIndexOf('/'));
    const originalPath = imagePath;
    
    // 파일명에서 확장자 추출
    const ext = fileName.split('.').pop()?.toLowerCase() || 'webp';
    
    // .keep.png 파일은 제외
    if (fileName === '.keep.png') {
      return { success: false, error: 'Skipping .keep.png file' };
    }
    
    // 메타데이터 생성 (image_metadata 테이블 스키마에 맞춤)
    const metadataRecord = {
      image_url: fullUrl,
      original_path: originalPath,
      title: fileName.replace(/\.[^/.]+$/, ''), // 확장자 제거한 파일명
      file_size: 0, // Storage에서 가져올 수 있으면 업데이트
      format: ext,
      upload_source: 'migration',
      tags: [folderPath.split('/').pop() || 'gallery'],
      status: 'active',
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // upsert (image_url이 unique key)
    const { data, error } = await supabase
      .from('image_metadata')
      .upsert(metadataRecord, { 
        onConflict: 'image_url',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 버킷햇 블랙 이미지 확인 및 메타데이터 생성
 */
async function verifyBucketHatBlack() {
  console.log('\n1️⃣ 버킷햇 블랙 이미지 확인 중...\n');
  
  const folderPath = 'originals/goods/bucket-hat-muziik-black/gallery';
  const files = await listFiles(folderPath);
  
  console.log(`   📋 Storage에서 발견된 이미지: ${files.length}개`);
  
  for (const file of files) {
    const imagePath = `${folderPath}/${file.name}`;
    const fullUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
    
    // image_metadata 테이블에서 확인
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('id, image_url')
      .eq('image_url', fullUrl)
      .maybeSingle();
    
    if (existingMetadata) {
      results.bucketHatBlack.found.push({
        fileName: file.name,
        imagePath,
        metadataId: existingMetadata.id
      });
      console.log(`   ✅ 메타데이터 존재: ${file.name}`);
    } else {
      results.bucketHatBlack.missing.push({
        fileName: file.name,
        imagePath
      });
      console.log(`   ⚠️ 메타데이터 없음: ${file.name}`);
      
      // 메타데이터 생성
      const result = await createMetadata(imagePath, file.name);
      if (result.success) {
        results.bucketHatBlack.metadataCreated.push({
          fileName: file.name,
          imagePath
        });
        console.log(`   ✅ 메타데이터 생성 완료: ${file.name}`);
      } else {
        results.bucketHatBlack.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 메타데이터 생성 실패: ${file.name} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n   ✅ 버킷햇 블랙 확인 완료:`);
  console.log(`      - 기존 메타데이터: ${results.bucketHatBlack.found.length}개`);
  console.log(`      - 새로 생성: ${results.bucketHatBlack.metadataCreated.length}개`);
  if (results.bucketHatBlack.errors.length > 0) {
    console.log(`      - 오류: ${results.bucketHatBlack.errors.length}개`);
  }
}

/**
 * 버킷햇 화이트 이미지 확인 및 메타데이터 생성
 */
async function verifyBucketHatWhite() {
  console.log('\n2️⃣ 버킷햇 화이트 이미지 확인 중...\n');
  
  const folderPath = 'originals/goods/bucket-hat-muziik-white/gallery';
  const files = await listFiles(folderPath);
  
  console.log(`   📋 Storage에서 발견된 이미지: ${files.length}개`);
  
  for (const file of files) {
    const imagePath = `${folderPath}/${file.name}`;
    const fullUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
    
    // image_metadata 테이블에서 확인
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('id, image_url')
      .eq('image_url', fullUrl)
      .maybeSingle();
    
    if (existingMetadata) {
      results.bucketHatWhite.found.push({
        fileName: file.name,
        imagePath,
        metadataId: existingMetadata.id
      });
      console.log(`   ✅ 메타데이터 존재: ${file.name}`);
    } else {
      results.bucketHatWhite.missing.push({
        fileName: file.name,
        imagePath
      });
      console.log(`   ⚠️ 메타데이터 없음: ${file.name}`);
      
      // 메타데이터 생성
      const result = await createMetadata(imagePath, file.name);
      if (result.success) {
        results.bucketHatWhite.metadataCreated.push({
          fileName: file.name,
          imagePath
        });
        console.log(`   ✅ 메타데이터 생성 완료: ${file.name}`);
      } else {
        results.bucketHatWhite.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 메타데이터 생성 실패: ${file.name} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n   ✅ 버킷햇 화이트 확인 완료:`);
  console.log(`      - 기존 메타데이터: ${results.bucketHatWhite.found.length}개`);
  console.log(`      - 새로 생성: ${results.bucketHatWhite.metadataCreated.length}개`);
  if (results.bucketHatWhite.errors.length > 0) {
    console.log(`      - 오류: ${results.bucketHatWhite.errors.length}개`);
  }
}

/**
 * 골프모자 베이지 이미지 확인 및 메타데이터 생성
 */
async function verifyGolfHatBeige() {
  console.log('\n3️⃣ 골프모자 베이지 이미지 확인 중...\n');
  
  const folderPath = 'originals/goods/golf-hat-muziik-beige/gallery';
  const files = await listFiles(folderPath);
  
  console.log(`   📋 Storage에서 발견된 이미지: ${files.length}개`);
  
  for (const file of files) {
    const imagePath = `${folderPath}/${file.name}`;
    const fullUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
    
    // image_metadata 테이블에서 확인
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('id, image_url')
      .eq('image_url', fullUrl)
      .maybeSingle();
    
    if (existingMetadata) {
      results.golfHatBeige.found.push({
        fileName: file.name,
        imagePath,
        metadataId: existingMetadata.id
      });
      console.log(`   ✅ 메타데이터 존재: ${file.name}`);
    } else {
      results.golfHatBeige.missing.push({
        fileName: file.name,
        imagePath
      });
      console.log(`   ⚠️ 메타데이터 없음: ${file.name}`);
      
      // 메타데이터 생성
      const result = await createMetadata(imagePath, file.name);
      if (result.success) {
        results.golfHatBeige.metadataCreated.push({
          fileName: file.name,
          imagePath
        });
        console.log(`   ✅ 메타데이터 생성 완료: ${file.name}`);
      } else {
        results.golfHatBeige.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 메타데이터 생성 실패: ${file.name} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n   ✅ 골프모자 베이지 확인 완료:`);
  console.log(`      - 기존 메타데이터: ${results.golfHatBeige.found.length}개`);
  console.log(`      - 새로 생성: ${results.golfHatBeige.metadataCreated.length}개`);
  if (results.golfHatBeige.errors.length > 0) {
    console.log(`      - 오류: ${results.golfHatBeige.errors.length}개`);
  }
}

/**
 * 골프모자 화이트 이미지 확인 및 메타데이터 생성
 */
async function verifyGolfHatWhite() {
  console.log('\n4️⃣ 골프모자 화이트 이미지 확인 중...\n');
  
  const folderPath = 'originals/goods/golf-hat-muziik-white/gallery';
  const files = await listFiles(folderPath);
  
  console.log(`   📋 Storage에서 발견된 이미지: ${files.length}개`);
  
  for (const file of files) {
    const imagePath = `${folderPath}/${file.name}`;
    const fullUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
    
    // image_metadata 테이블에서 확인
    const { data: existingMetadata } = await supabase
      .from('image_metadata')
      .select('id, image_url')
      .eq('image_url', fullUrl)
      .maybeSingle();
    
    if (existingMetadata) {
      results.golfHatWhite.found.push({
        fileName: file.name,
        imagePath,
        metadataId: existingMetadata.id
      });
      console.log(`   ✅ 메타데이터 존재: ${file.name}`);
    } else {
      results.golfHatWhite.missing.push({
        fileName: file.name,
        imagePath
      });
      console.log(`   ⚠️ 메타데이터 없음: ${file.name}`);
      
      // 메타데이터 생성
      const result = await createMetadata(imagePath, file.name);
      if (result.success) {
        results.golfHatWhite.metadataCreated.push({
          fileName: file.name,
          imagePath
        });
        console.log(`   ✅ 메타데이터 생성 완료: ${file.name}`);
      } else {
        results.golfHatWhite.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 메타데이터 생성 실패: ${file.name} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n   ✅ 골프모자 화이트 확인 완료:`);
  console.log(`      - 기존 메타데이터: ${results.golfHatWhite.found.length}개`);
  console.log(`      - 새로 생성: ${results.golfHatWhite.metadataCreated.length}개`);
  if (results.golfHatWhite.errors.length > 0) {
    console.log(`      - 오류: ${results.golfHatWhite.errors.length}개`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Gallery 이미지 메타데이터 확인 및 생성 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 버킷햇 블랙
    await verifyBucketHatBlack();

    // 2. 버킷햇 화이트
    await verifyBucketHatWhite();

    // 3. 골프모자 베이지
    await verifyGolfHatBeige();

    // 4. 골프모자 화이트
    await verifyGolfHatWhite();

    // 결과 저장
    const resultPath = path.join(__dirname, 'verify-and-create-gallery-metadata-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ 메타데이터 확인 및 생성 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   버킷햇 블랙:`);
    console.log(`      - 기존: ${results.bucketHatBlack.found.length}개`);
    console.log(`      - 새로 생성: ${results.bucketHatBlack.metadataCreated.length}개`);
    console.log(`   버킷햇 화이트:`);
    console.log(`      - 기존: ${results.bucketHatWhite.found.length}개`);
    console.log(`      - 새로 생성: ${results.bucketHatWhite.metadataCreated.length}개`);
    console.log(`   골프모자 베이지:`);
    console.log(`      - 기존: ${results.golfHatBeige.found.length}개`);
    console.log(`      - 새로 생성: ${results.golfHatBeige.metadataCreated.length}개`);
    console.log(`   골프모자 화이트:`);
    console.log(`      - 기존: ${results.golfHatWhite.found.length}개`);
    console.log(`      - 새로 생성: ${results.golfHatWhite.metadataCreated.length}개`);
    
    const totalErrors = 
      results.bucketHatBlack.errors.length +
      results.bucketHatWhite.errors.length +
      results.golfHatBeige.errors.length +
      results.golfHatWhite.errors.length;
    
    if (totalErrors > 0) {
      console.log(`\n⚠️ 오류 발생: ${totalErrors}개`);
    } else {
      console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    }

  } catch (error) {
    console.error('\n❌ 치명적 오류:', error);
    process.exit(1);
  }
}

// 실행
main();

