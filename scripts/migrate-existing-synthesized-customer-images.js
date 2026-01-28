/**
 * 기존 합성 고객 이미지 메타데이터 마이그레이션
 * 
 * Storage에 있는 합성 이미지 파일을 찾아서:
 * 1. image_assets 테이블에 메타데이터가 없으면 생성
 * 2. ai_tags에 customer-{id}, visit-{date} 추가
 * 
 * 실행 방법:
 * node scripts/migrate-existing-synthesized-customer-images.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = 'blog-images';

// 합성 이미지 파일명 패턴
const SYNTHESIZED_PATTERNS = [
  /customers-.*-nanobanana-/i,
  /customers-.*-fal-/i,
  /customers-.*-replicate-/i,
  /-composed-/i,
  /nanobanana-variation-/i,
  /existing-variation-/i,
  /replicate-variation-/
];

// 고객 폴더에서 모든 파일 재귀적으로 찾기
async function getAllFilesInCustomerFolder(folderPath) {
  const allFiles = [];
  
  async function scanFolder(path) {
    try {
      const { data: items, error } = await supabase.storage
        .from(bucketName)
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        if (error.message.includes('not found') || error.statusCode === '404') {
          return;
        }
        console.warn(`⚠️ 폴더 스캔 오류 (${path}):`, error.message);
        return;
      }
      
      if (!items || items.length === 0) return;
      
      for (const item of items) {
        const isFolder = item.id === null && item.metadata === null;
        
        if (isFolder) {
          // 하위 폴더 재귀 스캔
          const subFolderPath = `${path}/${item.name}`;
          await scanFolder(subFolderPath);
        } else {
          // 파일인 경우
          const filePath = `${path}/${item.name}`;
          
          // 합성 이미지 패턴 확인
          const isSynthesized = SYNTHESIZED_PATTERNS.some(pattern => 
            pattern.test(item.name)
          );
          
          if (isSynthesized) {
            allFiles.push({
              name: item.name,
              path: filePath,
              size: item.metadata?.size || 0,
              updated_at: item.updated_at,
              created_at: item.created_at
            });
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 스캔 오류 (${path}):`, error.message);
    }
  }
  
  await scanFolder(folderPath);
  return allFiles;
}

// file_path에서 고객 폴더명 추출
function extractCustomerFolderName(filePath) {
  const match = filePath.match(/customers\/([^/]+)/);
  return match ? match[1] : null;
}

// file_path에서 날짜 추출
function extractDateFromPath(filePath) {
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : null;
}

// 파일명에서 고객명 추출 (보조 방법)
function extractCustomerNameFromFileName(fileName) {
  // customers-{고객명}-nanobanana-...
  const match = fileName.match(/^customers-([^-]+)-/);
  if (match && match[1] !== 'none') {
    return match[1];
  }
  return null;
}

// 공개 URL 생성
function getPublicUrl(filePath) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// image_assets에 메타데이터 생성/업데이트
async function ensureImageMetadata(fileInfo, customerId, visitDate) {
  const publicUrl = getPublicUrl(fileInfo.path);
  
  // 기존 메타데이터 확인 (cdn_url과 file_path 모두 확인)
  let existing = null;
  
  // 1. cdn_url로 확인
  const { data: existingByUrl, error: checkError1 } = await supabase
    .from('image_assets')
    .select('id, ai_tags, file_path')
    .eq('cdn_url', publicUrl)
    .maybeSingle();
  
  if (!checkError1 && existingByUrl) {
    existing = existingByUrl;
  } else {
    // 2. file_path로 확인 (cdn_url이 다른 경우)
    const { data: existingByPath, error: checkError2 } = await supabase
      .from('image_assets')
      .select('id, ai_tags, file_path')
      .eq('file_path', fileInfo.path)
      .maybeSingle();
    
    if (!checkError2 && existingByPath) {
      existing = existingByPath;
    }
  }
  
  if (checkError1 && !checkError1.message.includes('No rows') && 
      checkError2 && !checkError2.message.includes('No rows')) {
    console.warn(`⚠️ 메타데이터 확인 오류 (${fileInfo.name}):`, checkError1?.message || checkError2?.message);
    return { success: false, error: checkError1?.message || checkError2?.message };
  }
  
  const customerTag = `customer-${customerId}`;
  const visitTag = `visit-${visitDate}`;
  
  if (existing) {
    // 기존 메타데이터 업데이트
    const existingTags = Array.isArray(existing.ai_tags) ? existing.ai_tags : [];
    const tagsWithoutCustomer = existingTags.filter(
      (tag) => typeof tag === 'string' && !tag.startsWith('customer-') && !tag.startsWith('visit-')
    );
    const updatedTags = [customerTag, visitTag, ...tagsWithoutCustomer];
    
    // file_path도 업데이트 (없는 경우)
    const updateData = {
      ai_tags: updatedTags,
      updated_at: new Date().toISOString()
    };
    
    if (!existing.file_path || existing.file_path !== fileInfo.path) {
      updateData.file_path = fileInfo.path;
    }
    
    // cdn_url도 업데이트 (없는 경우)
    if (!existing.cdn_url || existing.cdn_url !== publicUrl) {
      updateData.cdn_url = publicUrl;
    }
    
    const { error: updateError } = await supabase
      .from('image_assets')
      .update(updateData)
      .eq('id', existing.id);
    
    if (updateError) {
      console.warn(`⚠️ 메타데이터 업데이트 오류 (${fileInfo.name}):`, updateError.message);
      return { success: false, error: updateError.message };
    }
    
    return { success: true, action: 'updated', id: existing.id };
  } else {
    // 새 메타데이터 생성
    const { data: newRecord, error: insertError } = await supabase
      .from('image_assets')
      .insert({
        cdn_url: publicUrl,
        file_path: fileInfo.path,
        ai_tags: [customerTag, visitTag],
        file_size: fileInfo.size,
        upload_source: 'synthesized-image-migration',
        status: 'active',
        created_at: fileInfo.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.warn(`⚠️ 메타데이터 생성 오류 (${fileInfo.name}):`, insertError.message);
      return { success: false, error: insertError.message };
    }
    
    return { success: true, action: 'created', id: newRecord.id };
  }
}

async function migrateSynthesizedImages() {
  console.log('🚀 기존 합성 고객 이미지 마이그레이션 시작...\n');
  console.log('='.repeat(80));
  
  try {
    // 1. 모든 고객 폴더 찾기
    console.log('1️⃣ 고객 폴더 스캔 중...');
    const { data: customerFolders, error: folderError } = await supabase.storage
      .from(bucketName)
      .list('originals/customers', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (folderError) {
      console.error('❌ 고객 폴더 조회 오류:', folderError);
      return;
    }
    
    if (!customerFolders || customerFolders.length === 0) {
      console.log('⚠️ 고객 폴더가 없습니다.');
      return;
    }
    
    console.log(`✅ ${customerFolders.length}개 고객 폴더 발견\n`);
    
    // 2. 각 고객 폴더에서 합성 이미지 찾기
    console.log('2️⃣ 합성 이미지 파일 찾기...');
    let allSynthesizedFiles = [];
    
    for (const folder of customerFolders) {
      if (folder.id === null && folder.metadata === null) {
        // 폴더인 경우
        const folderPath = `originals/customers/${folder.name}`;
        const files = await getAllFilesInCustomerFolder(folderPath);
        allSynthesizedFiles = [...allSynthesizedFiles, ...files];
        
        if (files.length > 0) {
          console.log(`   ${folder.name}: ${files.length}개 합성 이미지 발견`);
        }
      }
    }
    
    console.log(`\n✅ 총 ${allSynthesizedFiles.length}개 합성 이미지 파일 발견\n`);
    
    if (allSynthesizedFiles.length === 0) {
      console.log('⚠️ 합성 이미지가 없습니다.');
      return;
    }
    
    // 3. 각 파일 처리
    console.log('3️⃣ 메타데이터 생성/업데이트 중...\n');
    
    let successCount = 0;
    let updateCount = 0;
    let createCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const fileInfo of allSynthesizedFiles) {
      try {
        // 고객 폴더명 추출
        const customerFolderName = extractCustomerFolderName(fileInfo.path);
        if (!customerFolderName) {
          console.warn(`⚠️ 고객 폴더명 추출 실패: ${fileInfo.name}`);
          errorCount++;
          errors.push({ file: fileInfo.name, error: '고객 폴더명 추출 실패' });
          continue;
        }
        
        // 고객 정보 조회
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, name, folder_name')
          .eq('folder_name', customerFolderName)
          .maybeSingle();
        
        if (customerError || !customer) {
          console.warn(`⚠️ 고객 정보 조회 실패 (${customerFolderName}):`, customerError?.message || '고객을 찾을 수 없음');
          errorCount++;
          errors.push({ file: fileInfo.name, error: `고객 정보 조회 실패: ${customerFolderName}` });
          continue;
        }
        
        // 날짜 추출
        const visitDate = extractDateFromPath(fileInfo.path) || new Date().toISOString().slice(0, 10);
        
        // 메타데이터 생성/업데이트
        const result = await ensureImageMetadata(fileInfo, customer.id, visitDate);
        
        if (result.success) {
          successCount++;
          if (result.action === 'created') {
            createCount++;
            console.log(`✅ 생성: ${fileInfo.name} (고객: ${customer.name}, ID: ${customer.id})`);
          } else {
            updateCount++;
            console.log(`✅ 업데이트: ${fileInfo.name} (고객: ${customer.name}, ID: ${customer.id})`);
          }
        } else {
          errorCount++;
          errors.push({ file: fileInfo.name, error: result.error });
          console.warn(`⚠️ 실패: ${fileInfo.name} - ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        errors.push({ file: fileInfo.name, error: error.message });
        console.error(`❌ 처리 오류 (${fileInfo.name}):`, error.message);
      }
    }
    
    // 4. 결과 요약
    console.log('\n' + '='.repeat(80));
    console.log('📊 최종 통계:');
    console.log('='.repeat(80));
    console.log(`   총 합성 이미지: ${allSynthesizedFiles.length}개`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`      - 새로 생성: ${createCount}개`);
    console.log(`      - 업데이트: ${updateCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);
    
    if (errors.length > 0) {
      console.log('\n   오류 상세:');
      errors.slice(0, 10).forEach(err => {
        console.log(`      - ${err.file}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`      ... 외 ${errors.length - 10}개 오류`);
      }
    }
    
    console.log('='.repeat(80));
    console.log('\n✅ 작업 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  }
}

migrateSynthesizedImages();
