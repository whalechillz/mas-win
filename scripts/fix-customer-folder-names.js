/**
 * 고객 폴더명 및 파일명 수정 스크립트
 * 1. unmatched/unmatched → unmatched/kim-sungjun 변경
 * 2. unmatched_s* → ss_s* 파일명 변경
 * 3. 모든 customer 폴더명을 jang-jinsu-8189 스타일로 변경
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 고객 이니셜 생성
 */
function getCustomerInitials(name) {
  if (!name) return 'unknown';
  if (/[가-힣]/.test(name)) {
    const nameEn = translateKoreanToEnglish(name);
    if (nameEn && nameEn.trim() !== '') {
      const parts = nameEn.split(/[\s-]+/);
      const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
      if (initials && initials.length > 0 && /^[a-z]+$/.test(initials)) {
        return initials;
      }
    }
  }
  const parts = name.split(/[\s-]+/);
  const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
  return /^[a-z]+$/.test(initials) ? initials : 'unknown';
}

/**
 * 폴더명 생성 (jang-jinsu-8189 스타일)
 * 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
 * 전화번호가 없으면: {영문이름}-{고객ID}
 */
function generateFolderName(customerName, phone, customerId) {
  const nameEn = translateKoreanToEnglish(customerName);
  
  if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
    // 영문 변환이 실패하면 고객 ID 사용
    if (customerId) {
      return `customer-${String(customerId).padStart(4, '0')}`;
    }
    return 'customer-unknown';
  }
  
  // 한글 제거 및 정리
  let cleanNameEn = nameEn.replace(/[가-힣]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (!cleanNameEn || cleanNameEn.trim() === '') {
    // 정리 후에도 비어있으면 고객 ID 사용
    if (customerId) {
      return `customer-${String(customerId).padStart(4, '0')}`;
    }
    return 'customer-unknown';
  }
  
  // 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
  if (phone && phone.trim() !== '') {
    const phoneLast4 = phone.replace(/-/g, '').slice(-4);
    if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
      return `${cleanNameEn}-${phoneLast4}`;
    }
  }
  
  // 전화번호가 없으면: {영문이름}-{고객ID} (jang-jinsu-8189 스타일 유지)
  if (customerId) {
    return `${cleanNameEn}-${String(customerId).padStart(4, '0')}`;
  }
  
  return `${cleanNameEn}-unknown`;
}

/**
 * 1. unmatched/unmatched → unmatched/kim-sungjun 변경
 */
async function fixUnmatchedFolder() {
  console.log('🔄 unmatched 폴더 수정 시작...\n');
  
  const oldPath = 'originals/customers/unmatched/unmatched';
  const newFolderName = 'kim-sungjun';
  const newPath = `originals/customers/unmatched/${newFolderName}`;
  
  // image_metadata에서 unmatched 폴더의 이미지 찾기
  const { data: images, error: metadataError } = await supabase
    .from('image_metadata')
    .select('*')
    .like('folder_path', `${oldPath}%`);
  
  if (metadataError) {
    console.error('❌ 메타데이터 조회 실패:', metadataError);
    return;
  }
  
  if (!images || images.length === 0) {
    console.log('⚠️  이동할 이미지가 없습니다.');
    return;
  }
  
  console.log(`📁 발견된 이미지: ${images.length}개\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const image of images) {
    try {
      const oldImageUrl = image.image_url;
      const oldFileName = image.english_filename || image.original_filename || '';
      
      // 파일명 변경: unmatched_s* → ss_s*
      let newFileName = oldFileName;
      if (oldFileName.startsWith('unmatched_')) {
        newFileName = oldFileName.replace(/^unmatched_/, 'ss_');
      } else if (!oldFileName.startsWith('ss_')) {
        // unmatched_가 없으면 ss_로 시작하도록 변경
        newFileName = oldFileName.replace(/^[^_]+_/, 'ss_');
      }
      
      // 날짜 폴더 추출
      const dateFolder = image.date_folder || '2023-10-24';
      const newImageUrl = oldImageUrl
        .replace(`/unmatched/unmatched/`, `/unmatched/${newFolderName}/`)
        .replace(oldFileName, newFileName);
      
      const newFolderPath = `${newPath}/${dateFolder}`;
      
      // Supabase Storage에서 파일 이동
      const urlParts = oldImageUrl.split('/');
      const oldStoragePath = urlParts.slice(urlParts.indexOf('blog-images') + 1).join('/');
      const newStoragePath = oldStoragePath
        .replace(`unmatched/unmatched/`, `unmatched/${newFolderName}/`)
        .replace(oldFileName, newFileName);
      
      // 파일 다운로드
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(oldStoragePath);
      
      if (downloadError) {
        throw downloadError;
      }
      
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 새 경로에 업로드
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newStoragePath, buffer, {
          contentType: 'image/webp',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // 메타데이터 업데이트
      await supabase
        .from('image_metadata')
        .update({
          folder_path: newFolderPath,
          image_url: newImageUrl,
          english_filename: newFileName,
          customer_name_en: 'kim-sungjun',
          customer_initials: 'ss',
          metadata: {
            ...(image.metadata || {}),
            unmatchedCustomerName: '김성준',
            folderName: newPath
          }
        })
        .eq('id', image.id);
      
      // 원본 파일 삭제
      await supabase.storage
        .from(bucketName)
        .remove([oldStoragePath]);
      
      successCount++;
      console.log(`   ✅ ${oldFileName} → ${newFileName}`);
      
    } catch (error) {
      failCount++;
      console.error(`   ❌ 실패: ${image.english_filename || image.original_filename} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

/**
 * 2. 모든 customer 폴더명을 jang-jinsu-8189 스타일로 변경
 */
async function fixAllCustomerFolders() {
  console.log('\n🔄 모든 고객 폴더명 수정 시작...\n');
  
  // customers 테이블에서 모든 고객 조회
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('❌ 고객 목록 조회 실패:', error);
    return;
  }
  
  console.log(`📋 총 고객 수: ${customers.length}명\n`);
  
  let updateCount = 0;
  let skipCount = 0;
  
  for (const customer of customers) {
    const correctFolderName = generateFolderName(customer.name, customer.phone, customer.id);
    
    // 이미 올바른 형식이면 스킵 (단, customer-로 시작하는 경우는 무조건 업데이트)
    if (customer.folder_name === correctFolderName && !customer.folder_name?.startsWith('customer-')) {
      skipCount++;
      continue;
    }
    
    console.log(`[${customer.id}] ${customer.name}`);
    console.log(`   기존: ${customer.folder_name || '(없음)'}`);
    console.log(`   변경: ${correctFolderName}`);
    
    // customers 테이블 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        folder_name: correctFolderName,
        name_en: translateKoreanToEnglish(customer.name),
        initials: getCustomerInitials(customer.name)
      })
      .eq('id', customer.id);
    
    if (updateError) {
      console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
      continue;
    }
    
    // image_metadata 테이블의 folder_path 업데이트
    if (customer.folder_name) {
      const { data: images, error: imageError } = await supabase
        .from('image_metadata')
        .select('id, folder_path, image_url')
        .like('folder_path', `%${customer.folder_name}%`);
      
      if (!imageError && images && images.length > 0) {
        for (const image of images) {
          const newFolderPath = image.folder_path.replace(
            `customers/${customer.folder_name}`,
            `customers/${correctFolderName}`
          );
          const newImageUrl = image.image_url.replace(
            `customers/${customer.folder_name}`,
            `customers/${correctFolderName}`
          );
          
          await supabase
            .from('image_metadata')
            .update({
              folder_path: newFolderPath,
              image_url: newImageUrl
            })
            .eq('id', image.id);
        }
        
        console.log(`   ✅ 이미지 메타데이터 ${images.length}개 업데이트`);
      }
    }
    
    updateCount++;
    console.log('');
  }
  
  console.log(`\n📊 완료: 업데이트 ${updateCount}개, 스킵 ${skipCount}개`);
}

/**
 * 메인 실행
 */
async function main() {
  console.log('='.repeat(60));
  console.log('고객 폴더명 및 파일명 수정 스크립트');
  console.log('='.repeat(60));
  
  // 1. unmatched 폴더 수정
  await fixUnmatchedFolder();
  
  // 2. 모든 customer 폴더명 수정
  await fixAllCustomerFolders();
  
  console.log('\n✅ 모든 작업 완료!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixUnmatchedFolder, fixAllCustomerFolders };
