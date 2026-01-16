/**
 * 1. unknown 파일명을 고객 이름으로 변경
 * 2. customers/ 하부 폴더명을 영문-전화번호뒷자리4개 형태로 변경
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
    // 한글 이름의 각 글자에서 초성 추출
    const koreanInitials = name.split('').map(char => {
      if (/[가-힣]/.test(char)) {
        const code = char.charCodeAt(0) - 0xAC00;
        if (code >= 0 && code < 11172) {
          const initialIndex = Math.floor(code / 588);
          const initialChars = ['g', 'n', 'd', 'r', 'm', 'b', 's', '', 'j', 'ch', 'k', 't', 'p', 'h'];
          if (initialIndex >= 0 && initialIndex < initialChars.length && initialChars[initialIndex]) {
            return initialChars[initialIndex];
          }
        }
      }
      return '';
    }).filter(c => c !== '').join('');
    
    if (koreanInitials && koreanInitials.length > 0) {
      return koreanInitials;
    }
    
    // 초성 추출 실패 시 영문 변환 후 이니셜 추출
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
 * 파일명에서 장면과 타입 추출
 */
function extractSceneAndType(fileName) {
  // unknown_s5_art-wall_01.webp 형식에서 추출
  const match = fileName.match(/unknown_s(\d+)_(.+?)_(\d+)\.webp/);
  if (match) {
    return {
      scene: parseInt(match[1]),
      type: match[2],
      number: match[3]
    };
  }
  return null;
}

/**
 * 1. unknown 파일명을 고객 이름으로 변경
 */
async function fixUnknownFilenames() {
  console.log('🔄 unknown 파일명 수정 시작...\n');
  
  // unknown 파일명을 가진 고객 폴더에서 고객 정보 찾기
  const unknownFolders = [
    'customer-2112-7010',
    'customer-1693-3445',
    'customer-1783-4758',
    'customer-1715-5458',
    'customer-1781-8385'
  ];
  
  const targetCustomers = [];
  
  // 각 폴더에서 고객 정보 찾기
  for (const folderName of unknownFolders) {
    const { data: images } = await supabase
      .from('image_metadata')
      .select('tags, customer_name_en')
      .like('folder_path', `%/${folderName}/%`)
      .limit(1);
    
    if (images && images.length > 0) {
      const img = images[0];
      const customerId = img.tags?.find(t => t.startsWith('customer-'))?.replace('customer-', '');
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('id', customerId)
          .single();
        
        if (customer) {
          targetCustomers.push({
            name: customer.name,
            id: customer.id,
            phone: customer.phone,
            folderName: folderName
          });
        }
      }
    }
  }
  
  let totalFixed = 0;
  
  for (const customerInfo of targetCustomers) {
    const customerName = customerInfo.name;
    const customerId = customerInfo.id;
    const folderName = customerInfo.folderName;
    
    console.log(`\n📋 고객: ${customerName} (폴더: ${folderName})`);
    
    const initials = getCustomerInitials(customerName);
    console.log(`   이니셜: ${initials}`);
    
    // unknown으로 시작하는 파일명을 가진 이미지 찾기
    const { data: images, error: imageError } = await supabase
      .from('image_metadata')
      .select('*')
      .contains('tags', [`customer-${customerId}`])
      .like('english_filename', 'unknown_%');
    
    if (imageError) {
      console.error(`   ❌ 이미지 조회 실패: ${imageError.message}`);
      continue;
    }
    
    if (!images || images.length === 0) {
      console.log(`   ⚠️  unknown 파일명을 가진 이미지가 없습니다.`);
      continue;
    }
    
    console.log(`   📸 발견된 이미지: ${images.length}개`);
    
    let fixedCount = 0;
    
    for (const image of images) {
      try {
        const oldFileName = image.english_filename;
        const sceneAndType = extractSceneAndType(oldFileName);
        
        if (!sceneAndType) {
          console.warn(`   ⚠️  파일명 형식 파싱 실패: ${oldFileName}`);
          continue;
        }
        
        // 새 파일명 생성: {이니셜}_s{장면}_{타입}_{번호}.webp
        const newFileName = `${initials}_s${sceneAndType.scene}_${sceneAndType.type}_${sceneAndType.number.padStart(2, '0')}.webp`;
        
        // Supabase Storage에서 파일 이동
        const oldImageUrl = image.image_url;
        const folderPath = image.folder_path || '';
        
        // folder_path에서 storage path 구성
        // 예: originals/customers/jang-jinsu-8189/2022-04-18/unknown_s5_art-wall_01.webp
        let oldStoragePath = folderPath ? `${folderPath}/${oldFileName}` : oldFileName;
        
        // URL에서 직접 추출 시도
        if (oldImageUrl.includes('/storage/v1/object/public/')) {
          const urlPath = oldImageUrl.split('/storage/v1/object/public/')[1];
          // blog-images/originals/... 형식에서 blog-images/ 제거
          if (urlPath.startsWith(`${bucketName}/`)) {
            oldStoragePath = urlPath.substring(bucketName.length + 1);
          } else {
            oldStoragePath = urlPath;
          }
        }
        
        const newStoragePath = oldStoragePath.replace(oldFileName, newFileName);
        const newImageUrl = oldImageUrl.replace(oldFileName, newFileName);
        
        console.log(`   📁 경로: ${oldStoragePath} → ${newStoragePath}`);
        
        // Supabase Storage에서 파일 이동 (move 사용)
        const { data: moveData, error: moveError } = await supabase.storage
          .from(bucketName)
          .move(oldStoragePath, newStoragePath);
        
        if (moveError) {
          // move가 실패하면 copy + remove 시도
          console.warn(`   move 실패, copy 시도: ${moveError.message}`);
          
          // 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(oldStoragePath);
          
          if (downloadError) {
            // 다운로드도 실패하면 메타데이터만 업데이트
            console.warn(`   파일 다운로드 실패, 메타데이터만 업데이트: ${downloadError.message}`);
            
            const { error: updateError } = await supabase
              .from('image_metadata')
              .update({
                english_filename: newFileName,
                customer_initials: initials,
                customer_name_en: translateKoreanToEnglish(customerName)
              })
              .eq('id', image.id);
            
            if (updateError) {
              throw updateError;
            }
            
            fixedCount++;
            console.log(`   ⚠️  메타데이터만 업데이트 (파일 이동 실패): ${oldFileName} → ${newFileName}`);
            continue;
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
          
          // 원본 파일 삭제
          await supabase.storage
            .from(bucketName)
            .remove([oldStoragePath]);
        }
        
        // 메타데이터 업데이트
        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            english_filename: newFileName,
            image_url: newImageUrl,
            customer_initials: initials,
            customer_name_en: translateKoreanToEnglish(customerName)
          })
          .eq('id', image.id);
        
        if (updateError) {
          throw updateError;
        }
        
        fixedCount++;
        console.log(`   ✅ ${oldFileName} → ${newFileName}`);
        
      } catch (error) {
        console.error(`   ❌ 실패: ${image.english_filename} - ${error.message}`);
      }
    }
    
    console.log(`   📊 완료: ${fixedCount}개 수정`);
    totalFixed += fixedCount;
  }
  
  console.log(`\n📊 총 ${totalFixed}개 파일명 수정 완료`);
}

/**
 * 2. customers/ 하부 폴더명을 영문-전화번호뒷자리4개 형태로 변경
 */
async function fixCustomerFolderNames() {
  console.log('\n🔄 customers 폴더명 수정 시작...\n');
  
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
    const nameEn = translateKoreanToEnglish(customer.name);
    
    if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
      skipCount++;
      continue;
    }
    
    // 한글 제거 및 정리
    let cleanNameEn = nameEn.replace(/[가-힣]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    if (!cleanNameEn || cleanNameEn.trim() === '') {
      skipCount++;
      continue;
    }
    
    // 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
    let correctFolderName;
    if (customer.phone && customer.phone.trim() !== '') {
      const phoneLast4 = customer.phone.replace(/-/g, '').slice(-4);
      if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
        correctFolderName = `${cleanNameEn}-${phoneLast4}`;
      } else {
        // 전화번호 형식이 올바르지 않으면 고객 ID 사용
        correctFolderName = `${cleanNameEn}-${String(customer.id).padStart(4, '0')}`;
      }
    } else {
      // 전화번호가 없으면: {영문이름}-{고객ID}
      correctFolderName = `${cleanNameEn}-${String(customer.id).padStart(4, '0')}`;
    }
    
    // 이미 올바른 형식이면 스킵 (단, customer-로 시작하는 경우는 무조건 업데이트)
    if (customer.folder_name === correctFolderName && !customer.folder_name?.startsWith('customer-')) {
      skipCount++;
      continue;
    }
    
    console.log(`[${customer.id}] ${customer.name}`);
    console.log(`   기존 폴더: ${folderName}`);
    console.log(`   변경: ${correctFolderName}`);
    
    // customers 테이블 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        folder_name: correctFolderName,
        name_en: nameEn,
        initials: getCustomerInitials(customer.name)
      })
      .eq('id', customer.id);
    
    if (updateError) {
      console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
      continue;
    }
    
    // image_metadata 테이블의 folder_path 업데이트
    const { data: imagesToUpdate, error: imageError } = await supabase
      .from('image_metadata')
      .select('id, folder_path, image_url')
      .like('folder_path', `%${folderName}%`);
    
    if (!imageError && imagesToUpdate && imagesToUpdate.length > 0) {
      for (const image of imagesToUpdate) {
        const newFolderPath = image.folder_path.replace(
          `customers/${folderName}`,
          `customers/${correctFolderName}`
        );
        const newImageUrl = image.image_url.replace(
          `customers/${folderName}`,
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
      
      console.log(`   ✅ 이미지 메타데이터 ${imagesToUpdate.length}개 업데이트`);
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
  console.log('unknown 파일명 및 customers 폴더명 수정 스크립트');
  console.log('='.repeat(60));
  
  // 1. unknown 파일명 수정
  await fixUnknownFilenames();
  
  // 2. customers 폴더명 수정
  await fixCustomerFolderNames();
  
  console.log('\n✅ 모든 작업 완료!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixUnknownFilenames, fixCustomerFolderNames };
