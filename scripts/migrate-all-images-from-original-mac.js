/**
 * 오리지널 맥의 모든 이미지를 Storage로 마이그레이션
 * 
 * 방법:
 * 1. 로컬 맥의 모든 고객 폴더 스캔
 * 2. 각 폴더의 모든 이미지 파일 찾기
 * 3. 폴더명에서 고객명과 날짜 추출
 * 4. customers 테이블에서 고객 매칭 (이름 + 전화번호)
 * 5. Storage에 업로드 (이미 있으면 스킵)
 * 6. image_assets에 등록
 * 7. ai_tags에 customer-{id} 태그 추가
 * 8. customers 테이블의 folder_name 업데이트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';
const ORIGINAL_MAC_FOLDER = '/Users/m2/MASLABS/00.blog_customers';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 한글 이름을 영문으로 변환
function translateKoreanToEnglish(name) {
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  return translateKoreanToEnglish(name);
}

// 폴더명에서 고객명과 날짜 추출
function extractInfoFromFolderName(folderName) {
  const match = folderName.match(/^(\d{4})\.(\d{2})\.(\d{2})\.(.+)$/);
  if (!match) return null;
  
  const [, year, month, day, namePart] = match;
  const date = `${year}-${month}-${day}`;
  
  const phoneMatch = namePart.match(/-(\d{3}-\d{4}-\d{4})$/);
  let customerName = namePart;
  let phone = null;
  
  if (phoneMatch) {
    customerName = namePart.replace(/-(\d{3}-\d{4}-\d{4})$/, '');
    phone = phoneMatch[1];
  }
  
  // "_전화후기" 같은 접미사 제거
  customerName = customerName.replace(/_[^_]+$/, '').trim();
  
  return { date, customerName, phone };
}

// 고객명으로 고객 찾기 (정확한 매칭 우선)
async function findCustomerByName(customerName) {
  // 고객명 정리 (공백, 특수문자 제거)
  const cleanedName = customerName.trim().replace(/[._-]/g, '');
  
  // 1. 정확한 이름 매칭
  const { data: exactMatches, error: exactError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .eq('name', cleanedName)
    .limit(10);
  
  if (!exactError && exactMatches && exactMatches.length > 0) {
    return exactMatches;
  }
  
  // 2. 부분 일치 검색 (앞부분부터)
  const { data: startsWithMatches, error: startsWithError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .ilike('name', `${cleanedName}%`)
    .limit(10);
  
  if (!startsWithError && startsWithMatches && startsWithMatches.length > 0) {
    return startsWithMatches;
  }
  
  // 3. 부분 일치 검색 (포함)
  const { data: partialMatches, error: partialError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .ilike('name', `%${cleanedName}%`)
    .limit(10);
  
  if (partialError) {
    console.warn(`⚠️ 고객 조회 오류:`, partialError.message);
    return [];
  }
  
  return partialMatches || [];
}

// 전화번호로 고객 찾기
async function findCustomerByPhone(phone) {
  if (!phone) return null;
  
  const normalizedPhone = phone.replace(/-/g, '').replace(/\s/g, '');
  const phoneLast4 = normalizedPhone.slice(-4);
  
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (error) return null;
  
  const matches = (customers || []).filter(c => {
    if (!c.phone) return false;
    const customerPhone = c.phone.replace(/-/g, '').replace(/\s/g, '');
    return customerPhone === normalizedPhone || customerPhone.slice(-4) === phoneLast4;
  });
  
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    return matches.sort((a, b) => b.id - a.id)[0];
  }
  
  return null;
}

// 재귀적으로 폴더의 모든 이미지 파일 찾기
function getAllImageFiles(folderPath) {
  const imageFiles = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase().slice(1);
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
          const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'm4v'];
          
          if (imageExtensions.includes(ext) || videoExtensions.includes(ext)) {
            imageFiles.push({
              name: item,
              path: itemPath,
              size: stat.size,
              extension: ext,
              isVideo: videoExtensions.includes(ext),
              modified: stat.mtime
            });
          }
        }
      }
    } catch (error) {
      // 무시
    }
  }
  
  scanDirectory(folderPath);
  return imageFiles;
}

// 한글 파일명을 영문으로 변환
function convertFileNameToEnglish(originalFileName, customerName) {
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  
  // 확장자 분리
  const ext = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, ext);
  
  // 한글이 포함되어 있으면 영문으로 변환
  const hasKorean = /[가-힣]/.test(baseName);
  
  if (hasKorean) {
    // 한글 부분을 영문으로 변환
    let englishName = translateKoreanToEnglish(baseName);
    
    // 특수문자 제거 및 정규화
    englishName = englishName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // 타임스탬프 추가 (중복 방지)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${englishName}-${timestamp}-${random}${ext}`;
  }
  
  // 이미 영문이면 그대로 사용 (특수문자만 정리)
  const cleanedName = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${cleanedName}${ext}`;
}

// Storage에 파일 업로드
async function uploadToStorage(file, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(file.path);
    
    // 한글 파일명 처리: storagePath에서 파일명만 영문으로 변환
    const pathParts = storagePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');
    
    // 한글 파일명을 영문으로 변환
    const englishFileName = convertFileNameToEnglish(fileName, '');
    const finalStoragePath = `${folderPath}/${englishFileName}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(finalStoragePath, fileBuffer, {
        contentType: file.isVideo 
          ? `video/${file.extension === 'mov' ? 'quicktime' : file.extension}`
          : `image/${file.extension === 'jpg' ? 'jpeg' : file.extension === 'heic' || file.extension === 'heif' ? 'heic' : file.extension}`,
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalStoragePath);
    
    return {
      success: true,
      path: finalStoragePath,
      url: publicUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// image_assets에 이미지 등록
async function ensureImageAsset(filePath, cdnUrl, customerId, visitDate) {
  // file_path로 이미 존재하는지 확인
  const { data: existing, error: checkError } = await supabase
    .from('image_assets')
    .select('id, ai_tags')
    .eq('file_path', filePath)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    return { success: false, error: checkError.message };
  }
  
  const customerTag = `customer-${customerId}`;
  const visitTag = `visit-${visitDate}`;
  
  if (existing) {
    // 업데이트
    const tags = existing.ai_tags || [];
    const newTags = Array.isArray(tags) ? [...tags] : [];
    
    if (!newTags.includes(customerTag)) {
      newTags.push(customerTag);
    }
    if (!newTags.includes(visitTag)) {
      newTags.push(visitTag);
    }
    
    const uniqueTags = [...new Set(newTags)];
    
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({ 
        ai_tags: uniqueTags,
        cdn_url: cdnUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true, action: 'updated', id: existing.id };
  } else {
    // 새로 등록
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
    
    const newAsset = {
      file_path: filePath,
      cdn_url: cdnUrl,
      filename: fileName,
      original_filename: fileName,
      ai_tags: [customerTag, visitTag],
      format: ext,
      mime_type: isVideo 
        ? `video/${ext === 'mov' ? 'quicktime' : ext}`
        : `image/${ext === 'jpg' ? 'jpeg' : ext === 'heic' || ext === 'heif' ? 'heic' : ext}`,
      upload_source: 'original-mac-migration',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('image_assets')
      .insert(newAsset)
      .select('id')
      .single();
    
    if (insertError) {
      return { success: false, error: insertError.message };
    }
    
    return { success: true, action: 'inserted', id: inserted.id };
  }
}

// 고객 folder_name 생성
function generateFolderName(customer) {
  const nameEn = translateKoreanToEnglish(customer.name);
  const nameEnNormalized = nameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (customer.phone) {
    const phoneLast4 = customer.phone.replace(/-/g, '').slice(-4);
    return `${nameEnNormalized}-${phoneLast4}`;
  } else {
    return `${nameEnNormalized}-${String(customer.id).padStart(4, '0')}`;
  }
}

async function migrateAllImagesFromOriginalMac() {
  console.log('🚀 오리지널 맥의 모든 이미지 마이그레이션 시작...\n');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(ORIGINAL_MAC_FOLDER)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${ORIGINAL_MAC_FOLDER}`);
    return;
  }
  
  // 연도별 폴더 확인
  const yearFolders = fs.readdirSync(ORIGINAL_MAC_FOLDER)
    .filter(item => {
      const itemPath = path.join(ORIGINAL_MAC_FOLDER, item);
      return fs.statSync(itemPath).isDirectory() && /^\d{4}$/.test(item);
    })
    .sort();
  
  console.log(`✅ 발견된 연도 폴더: ${yearFolders.join(', ')}\n`);
  
  // 모든 고객 폴더 수집
  const allCustomerFolders = [];
  
  for (const year of yearFolders) {
    const yearPath = path.join(ORIGINAL_MAC_FOLDER, year);
    const customerFolders = fs.readdirSync(yearPath)
      .filter(item => {
        const itemPath = path.join(yearPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    for (const folder of customerFolders) {
      const folderPath = path.join(yearPath, folder);
      const info = extractInfoFromFolderName(folder);
      
      if (info) {
        allCustomerFolders.push({
          year,
          folderName: folder,
          folderPath,
          ...info
        });
      }
    }
  }
  
  console.log(`✅ 총 ${allCustomerFolders.length}개의 고객 폴더 발견\n`);
  
  // customers 테이블 로드
  console.log('1️⃣ customers 테이블 로드...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${allCustomers?.length || 0}명의 고객 로드\n`);
  
  // 각 폴더 처리
  console.log('2️⃣ 각 폴더의 이미지 마이그레이션 시작...\n');
  
  const stats = {
    total: allCustomerFolders.length,
    matched: 0,
    unmatched: 0,
    imagesFound: 0,
    imagesUploaded: 0,
    imagesSkipped: 0,
    imagesRegistered: 0,
    imagesUpdated: 0,
    folderNameUpdated: 0,
    errors: 0
  };
  
  for (let i = 0; i < allCustomerFolders.length; i++) {
    const folder = allCustomerFolders[i];
    
    console.log(`[${i + 1}/${allCustomerFolders.length}] 📁 ${folder.folderName}`);
    
    // 고객 매칭
    let customer = null;
    
    // 전화번호로 먼저 검색
    if (folder.phone) {
      customer = await findCustomerByPhone(folder.phone);
    }
    
    // 이름으로 검색
    if (!customer) {
      const nameMatches = await findCustomerByName(folder.customerName);
      if (nameMatches.length === 1) {
        customer = nameMatches[0];
      } else if (nameMatches.length > 1) {
        // 여러 고객이 매칭되는 경우, 가장 최근 고객 선택
        customer = nameMatches.sort((a, b) => b.id - a.id)[0];
      }
    }
    
    if (!customer) {
      console.log(`   ⚠️  매칭되는 고객 없음 (고객명: ${folder.customerName}, 전화: ${folder.phone || '없음'})\n`);
      stats.unmatched++;
      continue;
    }
    
    console.log(`   ✅ 매칭된 고객: ${customer.name} (ID: ${customer.id}, 전화: ${customer.phone || '없음'})`);
    
    // folder_name 생성 및 업데이트
    const targetFolderName = generateFolderName(customer);
    const storageBasePath = `originals/customers/${targetFolderName}`;
    
    if (customer.folder_name !== targetFolderName) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ folder_name: targetFolderName })
        .eq('id', customer.id);
      
      if (updateError) {
        console.warn(`   ⚠️  folder_name 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ folder_name 업데이트: ${customer.folder_name || '없음'} → ${targetFolderName}`);
        stats.folderNameUpdated++;
      }
    }
    
    stats.matched++;
    
    // 폴더의 모든 이미지 파일 찾기
    const imageFiles = getAllImageFiles(folder.folderPath);
    
    if (imageFiles.length === 0) {
      console.log(`   ⏭️  이미지 없음\n`);
      continue;
    }
    
    stats.imagesFound += imageFiles.length;
    console.log(`   📸 이미지 ${imageFiles.length}개 발견`);
    
    // 각 이미지 처리
    let uploaded = 0;
    let skipped = 0;
    let registered = 0;
    let updated = 0;
    let errors = 0;
    
    for (const imageFile of imageFiles) {
      // Storage 경로 생성
      const storagePath = `${storageBasePath}/${folder.date}/${imageFile.name}`;
      
      // Storage에 업로드
      const uploadResult = await uploadToStorage(imageFile, storagePath);
      
      if (!uploadResult.success) {
        console.warn(`   ⚠️  업로드 실패 (${imageFile.name}):`, uploadResult.error);
        errors++;
        continue;
      }
      
      // 이미 존재하는 파일인지 확인
      const { data: existing } = await supabase
        .from('image_assets')
        .select('id')
        .eq('file_path', storagePath)
        .maybeSingle();
      
      if (existing) {
        skipped++;
      } else {
        uploaded++;
      }
      
      // image_assets에 등록
      const assetResult = await ensureImageAsset(
        storagePath,
        uploadResult.url,
        customer.id,
        folder.date
      );
      
      if (assetResult.success) {
        if (assetResult.action === 'inserted') {
          registered++;
        } else if (assetResult.action === 'updated') {
          updated++;
        }
      } else {
        console.warn(`   ⚠️  등록 실패 (${imageFile.name}):`, assetResult.error);
        errors++;
      }
    }
    
    stats.imagesUploaded += uploaded;
    stats.imagesSkipped += skipped;
    stats.imagesRegistered += registered;
    stats.imagesUpdated += updated;
    stats.errors += errors;
    
    if (uploaded > 0 || registered > 0 || updated > 0) {
      console.log(`   ✅ 업로드: ${uploaded}개, 스킵: ${skipped}개, 등록: ${registered}개, 업데이트: ${updated}개`);
    }
    
    console.log('');
    
    // 진행 상황 출력 (10개마다)
    if ((i + 1) % 10 === 0) {
      console.log(`   📊 진행 상황: ${i + 1}/${allCustomerFolders.length} 처리 완료\n`);
    }
  }
  
  // 최종 통계
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 고객 폴더: ${stats.total}개`);
  console.log(`   ✅ 매칭 성공: ${stats.matched}개`);
  console.log(`   ⚠️  매칭 실패: ${stats.unmatched}개`);
  console.log(`   📝 folder_name 업데이트: ${stats.folderNameUpdated}개`);
  console.log(`   📸 발견된 이미지: ${stats.imagesFound}개`);
  console.log(`   ⬆️  새로 업로드: ${stats.imagesUploaded}개`);
  console.log(`   ⏭️  스킵 (이미 존재): ${stats.imagesSkipped}개`);
  console.log(`   ➕ 새로 등록: ${stats.imagesRegistered}개`);
  console.log(`   🔄 업데이트: ${stats.imagesUpdated}개`);
  console.log(`   ❌ 오류: ${stats.errors}개`);
  console.log('='.repeat(80));
  
  // 검증
  console.log('\n3️⃣ 검증: 이미지 있는 고객 수 확인...');
  const { data: customersWithImages, error: verifyError } = await supabase
    .from('image_assets')
    .select('ai_tags')
    .not('ai_tags', 'is', null)
    .ilike('file_path', 'originals/customers/%');
  
  if (!verifyError && customersWithImages) {
    const customerIds = new Set();
    customersWithImages.forEach(img => {
      const tags = img.ai_tags || [];
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (typeof tag === 'string' && tag.startsWith('customer-')) {
            const customerId = parseInt(tag.replace('customer-', ''), 10);
            if (!isNaN(customerId)) {
              customerIds.add(customerId);
            }
          }
        });
      }
    });
    
    console.log(`✅ 이미지 있는 고객: ${customerIds.size}명\n`);
  }
  
  console.log('✅ 작업 완료!');
}

migrateAllImagesFromOriginalMac().catch(console.error);
