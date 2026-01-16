/**
 * 장진수 고객 이미지 Supabase 업로드 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 장진수 고객 정보
const CUSTOMER_INFO = {
  name: '장진수',
  nameEn: 'jang-jinsu',
  initials: 'jjs',
  phone: null, // 전화번호 없으면 null로 설정 (이름만으로 검색)
  // phone: '010-9193-8189', // 전화번호가 있으면 이렇게 설정
  folderName: null, // 자동 생성됨
  visitDate: '2022-04-18',
  customerId: null // 수동으로 지정하려면 여기에 ID 입력
};

/**
 * 고객 ID 찾기 (이름 우선, 전화번호는 선택)
 */
async function findCustomerId() {
  // 수동으로 고객 ID가 지정된 경우
  if (CUSTOMER_INFO.customerId) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('id', CUSTOMER_INFO.customerId)
      .single();
    
    if (error || !data) {
      console.error('❌ 지정된 고객 ID를 찾을 수 없습니다:', error);
      return null;
    }
    
    console.log(`✅ 지정된 고객 ID 사용: ${data.id} (${data.name})`);
    return data.id;
  }
  
  // 1차: 이름 + 전화번호로 찾기 (정확한 매칭, 전화번호가 있는 경우)
  if (CUSTOMER_INFO.phone) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('name', CUSTOMER_INFO.name)
      .eq('phone', CUSTOMER_INFO.phone)
      .single();
    
    if (!error && data) {
      console.log(`✅ 고객 찾음 (이름+전화번호): ID ${data.id}`);
      return data.id;
    }
  }
  
  // 2차: 이름만으로 찾기 (전화번호 없거나 매칭 실패 시)
  console.log(`🔍 이름으로 고객 검색: "${CUSTOMER_INFO.name}"`);
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('name', CUSTOMER_INFO.name)
    .order('updated_at', { ascending: false }) // 최신순
    .limit(1)
    .single();
  
  if (error || !data) {
    console.error('❌ 고객을 찾을 수 없습니다:', error);
    return null;
  }
  
  // 중복 이름이 있는 경우 확인 및 경고
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('name', CUSTOMER_INFO.name);
  
  if (count > 1) {
    // 중복 이름인 모든 고객 정보 조회
    const { data: duplicateCustomers } = await supabase
      .from('customers')
      .select('id, name, phone, updated_at')
      .eq('name', CUSTOMER_INFO.name)
      .order('updated_at', { ascending: false });
    
    console.warn(`\n⚠️  중복 이름 발견: "${CUSTOMER_INFO.name}" (${count}명)`);
    console.warn(`\n📋 중복 고객 목록:`);
    duplicateCustomers.forEach((customer, index) => {
      const isSelected = customer.id === data.id;
      const marker = isSelected ? '👉' : '  ';
      const phoneDisplay = customer.phone || '(전화번호 없음)';
      console.warn(`${marker} ${index + 1}. ID: ${customer.id}, 전화번호: ${phoneDisplay}${isSelected ? ' (선택됨)' : ''}`);
    });
    console.warn(`\n   가장 최근 업데이트된 고객(ID: ${data.id})을 사용합니다.`);
    console.warn(`   다른 고객을 사용하려면 스크립트의 CUSTOMER_INFO.customerId를 설정하세요.\n`);
  } else {
    console.log(`✅ 고객 찾음 (이름만): ID ${data.id}`);
  }
  
  return data.id;
}

/**
 * 고객 정보 업데이트 (영문 이름, 이니셜, 폴더명)
 */
async function updateCustomerInfo(customerId) {
  const { error } = await supabase
    .from('customers')
    .update({
      name_en: CUSTOMER_INFO.nameEn,
      initials: CUSTOMER_INFO.initials,
      folder_name: CUSTOMER_INFO.folderName
    })
    .eq('id', customerId);
  
  if (error) {
    console.warn('⚠️  고객 정보 업데이트 실패:', error.message);
  } else {
    console.log('✅ 고객 정보 업데이트 완료\n');
  }
}

/**
 * 이미지 업로드
 */
async function uploadImage(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
      upsert: true
    });
  
  if (error) {
    throw error;
  }
  
  // 공개 URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

/**
 * 메타데이터 저장
 */
async function saveMetadata(imageData) {
  // image_metadata 테이블에 저장할 데이터 구성
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${CUSTOMER_INFO.name} - ${imageData.visitDate}`,
    alt_text: `${CUSTOMER_INFO.name} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: [`customer-${imageData.customerId}`, `visit-${imageData.visitDate}`],
    upload_source: 'customer-migration',
    updated_at: new Date().toISOString()
  };
  
  // 확장 컬럼들 (마이그레이션 스키마가 적용된 경우)
  // 존재하지 않으면 무시됨
  try {
    metadataPayload.file_name = imageData.englishFileName;
    metadataPayload.story_scene = imageData.scene;
    metadataPayload.image_type = imageData.type;
    metadataPayload.original_filename = imageData.originalFileName;
    metadataPayload.english_filename = imageData.englishFileName;
    metadataPayload.customer_name_en = CUSTOMER_INFO.nameEn;
    metadataPayload.customer_initials = CUSTOMER_INFO.initials;
    metadataPayload.image_quality = 'final';
    metadataPayload.metadata = {
      visitDate: imageData.visitDate,
      customerName: CUSTOMER_INFO.name,
      customerPhone: CUSTOMER_INFO.phone || null
    };
  } catch (e) {
    // 확장 필드 추가 실패 시 무시
  }
  
  const { data, error } = await supabase
    .from('image_metadata')
    .insert(metadataPayload)
    .select()
    .single();
  
  if (error) {
    // file_name 컬럼이 없으면 제거하고 재시도
    if (error.message.includes('file_name')) {
      delete metadataPayload.file_name;
      delete metadataPayload.story_scene;
      delete metadataPayload.image_type;
      delete metadataPayload.original_filename;
      delete metadataPayload.english_filename;
      delete metadataPayload.customer_name_en;
      delete metadataPayload.customer_initials;
      delete metadataPayload.image_quality;
      delete metadataPayload.metadata;
      
      // 메타데이터는 JSONB 필드에 저장
      metadataPayload.metadata = {
        visitDate: imageData.visitDate,
        customerName: CUSTOMER_INFO.name,
        customerPhone: CUSTOMER_INFO.phone || null,
        englishFileName: imageData.englishFileName,
        originalFileName: imageData.originalFileName,
        scene: imageData.scene,
        type: imageData.type,
        customerNameEn: CUSTOMER_INFO.nameEn,
        customerInitials: CUSTOMER_INFO.initials
      };
      
      const { data: retryData, error: retryError } = await supabase
        .from('image_metadata')
        .insert(metadataPayload)
        .select()
        .single();
      
      if (retryError) {
        throw retryError;
      }
      
      return retryData;
    }
    
    throw error;
  }
  
  return data;
}

/**
 * 마이그레이션 결과 읽기
 */
function readMigrationResults() {
  const resultFile = path.join(process.cwd(), 'migrated', 'jang-jinsu', 'migration-results.json');
  
  if (!fs.existsSync(resultFile)) {
    console.error('❌ 마이그레이션 결과 파일을 찾을 수 없습니다:', resultFile);
    console.error('   먼저 migrate-customer-jangjinsu.js를 실행해주세요.');
    return null;
  }
  
  return JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
}

/**
 * 업로드 실행
 */
async function uploadToSupabase() {
  console.log('🔄 장진수 고객 이미지 Supabase 업로드 시작...\n');
  
  // 고객 ID 찾기
  const customerId = await findCustomerId();
  if (!customerId) {
    console.error('❌ 고객을 찾을 수 없습니다.');
    console.error('   고객 이름을 확인하거나 CUSTOMER_INFO.customerId를 설정해주세요.');
    return;
  }
  
  console.log(`✅ 고객 ID: ${customerId}\n`);
  
  // 고객 정보 조회 (전화번호 확인)
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('id', customerId)
    .single();
  
  if (customerError || !customer) {
    console.error('❌ 고객 정보 조회 실패:', customerError);
    return;
  }
  
  // 폴더명 생성 (전화번호 있으면 사용, 없으면 ID 사용)
  function generateCustomerFolderName(customer) {
    const nameEn = translateKoreanToEnglish(customer.name);
    
    // 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
    if (customer.phone) {
      const phoneLast4 = customer.phone.replace(/-/g, '').slice(-4);
      return `${nameEn}-${phoneLast4}`;
    }
    
    // 전화번호가 없으면: {영문이름}-{고객ID}
    if (customer.id) {
      return `${nameEn}-${String(customer.id).padStart(4, '0')}`;
    }
    
    // ID도 없으면: {영문이름}-unknown
    return `${nameEn}-unknown`;
  }
  
  const folderName = generateCustomerFolderName({ 
    name: customer.name, 
    phone: customer.phone || undefined,
    id: customer.id 
  });
  
  // CUSTOMER_INFO 업데이트
  CUSTOMER_INFO.folderName = folderName;
  CUSTOMER_INFO.phone = customer.phone || null;
  
  console.log(`📁 폴더명: ${folderName}`);
  if (!customer.phone) {
    console.log(`   ⚠️  전화번호 없음 - 고객 ID(${customer.id})로 구분`);
  }
  console.log('');
  
  // 고객 정보 업데이트 (영문 이름, 이니셜, 폴더명)
  await updateCustomerInfo(customerId);
  
  // 마이그레이션 결과 읽기
  const migrationResults = readMigrationResults();
  if (!migrationResults) {
    return;
  }
  
  const successResults = migrationResults.results.filter(r => r.status === 'success');
  console.log(`📸 업로드할 이미지: ${successResults.length}개\n`);
  
  if (successResults.length === 0) {
    console.log('❌ 업로드할 이미지가 없습니다.');
    return;
  }
  
  // 폴더 경로
  const folderPath = `originals/customers/${CUSTOMER_INFO.folderName}/${CUSTOMER_INFO.visitDate}`;
  
  let uploadCount = 0;
  let failCount = 0;
  
  // 각 이미지 업로드
  for (const result of successResults) {
    try {
      console.log(`📤 업로드 중: ${result.new}`);
      
      // 파일 읽기
      const filePath = result.path;
      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ 파일을 찾을 수 없음: ${filePath}`);
        failCount++;
        continue;
      }
      
      const fileStats = fs.statSync(filePath);
      
      // Storage 경로
      const storagePath = `${folderPath}/${result.new}`;
      
      // 업로드
      const url = await uploadImage(filePath, storagePath);
      console.log(`   ✅ 업로드 완료: ${url}`);
      
      // 메타데이터 저장
      await saveMetadata({
        customerId,
        originalFileName: result.original,
        englishFileName: result.new,
        url,
        folderPath,
        visitDate: CUSTOMER_INFO.visitDate,
        scene: result.scene,
        type: result.type,
        fileSize: fileStats.size
      });
      
      console.log(`   ✅ 메타데이터 저장 완료\n`);
      uploadCount++;
      
    } catch (error) {
      console.error(`   ❌ 업로드 실패: ${error.message}\n`);
      failCount++;
    }
  }
  
  console.log('\n📊 업로드 완료!');
  console.log(`   성공: ${uploadCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log(`\n📁 Storage 경로: ${folderPath}\n`);
}

// 실행
if (require.main === module) {
  uploadToSupabase().catch(console.error);
}

module.exports = { uploadToSupabase };
