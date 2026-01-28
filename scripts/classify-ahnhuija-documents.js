/**
 * 안희자 고객의 서류 수동 분류 스크립트
 * 
 * 실행 방법:
 * node scripts/classify-ahnhuija-documents.js
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

// 문서 감지 함수 (lib/scanned-document-detector.ts와 동일한 로직)
function detectScannedDocument(fileName, filePath) {
  if (!fileName) {
    return { isDocument: false, confidence: 0 };
  }

  const lowerFileName = fileName.toLowerCase();
  const lowerFilePath = filePath?.toLowerCase() || '';
  
  // 'seukaen' 또는 'scan' 포함 여부 확인
  const hasScanKeyword = 
    lowerFileName.includes('seukaen') || 
    lowerFileName.includes('scan') ||
    lowerFilePath.includes('seukaen') ||
    lowerFilePath.includes('scan');
  
  if (!hasScanKeyword) {
    return { isDocument: false, confidence: 0 };
  }
  
  // 문서 타입 패턴 매칭
  const patterns = {
    order_spec: [
      /주문.*사양서/i,
      /order.*spec/i,
      /사양서/i,
      /피팅/i,
      /specification/i,
      /주문서/i
    ],
    survey: [
      /설문.*조사/i,
      /survey/i,
      /조사/i,
      /질문/i,
      /questionnaire/i
    ],
    consent: [
      /동의/i,
      /consent/i,
      /agree/i,
      /승인/i,
      /approval/i
    ]
  };
  
  // 각 문서 타입별 패턴 매칭 시도
  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      if (pattern.test(lowerFileName) || pattern.test(lowerFilePath)) {
        return {
          isDocument: true,
          documentType: type,
          confidence: 0.9
        };
      }
    }
  }
  
  // 패턴 매칭 실패 시 'other'로 분류
  return {
    isDocument: true,
    documentType: 'other',
    confidence: 0.7
  };
}

/**
 * file_path에서 날짜 추출
 */
function extractDateFromPath(filePath) {
  if (!filePath) return null;
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * ai_tags에서 고객 ID 추출
 */
function extractCustomerIdFromTags(aiTags) {
  if (!aiTags || !Array.isArray(aiTags)) return null;
  
  for (const tag of aiTags) {
    if (typeof tag === 'string' && tag.startsWith('customer-')) {
      const customerId = parseInt(tag.replace('customer-', ''), 10);
      if (!isNaN(customerId)) {
        return customerId;
      }
    }
  }
  
  return null;
}

/**
 * file_path에서 고객 ID 추출 (folder_name 사용)
 */
async function extractCustomerIdFromPath(filePath) {
  if (!filePath) return null;
  
  // originals/customers/{folder_name}/... 패턴에서 폴더명 추출
  const match = filePath.match(/originals\/customers\/([^\/]+)/);
  if (!match) return null;
  
  const folderName = match[1];
  
  // folder_name으로 고객 찾기
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id')
    .eq('folder_name', folderName)
    .maybeSingle();
  
  if (error || !customer) {
    return null;
  }
  
  return customer.id;
}

async function classifyAhnhuijaDocuments() {
  console.log('🚀 안희자 고객 서류 분류 시작...\n');
  console.log('='.repeat(80));
  
  // 안희자 고객 찾기
  console.log('1️⃣ 안희자 고객 조회 중...');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .ilike('name', '%안희자%')
    .maybeSingle();
  
  if (customerError || !customer) {
    console.error('❌ 안희자 고객을 찾을 수 없습니다:', customerError);
    process.exit(1);
  }
  
  console.log(`✅ 고객 찾음: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name || '없음'})\n`);
  
  // 안희자 고객의 이미지 조회
  console.log('2️⃣ 안희자 고객 이미지 조회 중...');
  
  let allImages = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  
  while (hasMore) {
    // ai_tags에서 고객 ID 검색을 위한 쿼리
    let query = supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, is_scanned_document, document_type');
    
    // file_path로 먼저 필터링 시도
    if (customer.folder_name) {
      query = query.ilike('file_path', `originals/customers/${customer.folder_name}%`);
    } else {
      // folder_name이 없으면 고객명으로 검색
      const customerNameLower = customer.name.toLowerCase();
      query = query.ilike('file_path', `originals/customers/${customerNameLower}%`);
    }
    
    const { data: images, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 이미지 조회 오류:', error);
      break;
    }
    
    if (!images || images.length === 0) {
      hasMore = false;
    } else {
      allImages = [...allImages, ...images];
      offset += limit;
      
      if (images.length < limit) {
        hasMore = false;
      }
      
      console.log(`   조회 중... ${allImages.length}개`);
    }
  }
  
  const images = allImages;
  console.log(`✅ ${images.length}개 이미지 조회 완료\n`);
  
  // seukaen이 포함된 파일 찾기
  console.log('3️⃣ 서류 후보 파일 찾기...');
  const documentCandidates = images.filter(img => {
    const fileName = (img.filename || '').toLowerCase();
    const filePath = (img.file_path || '').toLowerCase();
    return fileName.includes('seukaen') || filePath.includes('seukaen');
  });
  
  console.log(`✅ 서류 후보: ${documentCandidates.length}개\n`);
  
  if (documentCandidates.length === 0) {
    console.log('⚠️  서류 후보가 없습니다. 파일명에 "seukaen"이 포함된 파일이 있는지 확인하세요.');
    process.exit(0);
  }
  
  // 각 후보 파일 상세 정보 출력
  console.log('📋 서류 후보 상세:');
  documentCandidates.forEach((img, index) => {
    console.log(`\n${index + 1}. 파일명: ${img.filename || '없음'}`);
    console.log(`   경로: ${img.file_path || '없음'}`);
    console.log(`   현재 분류: is_scanned_document=${img.is_scanned_document}, document_type=${img.document_type || 'null'}`);
    const detection = detectScannedDocument(img.filename || '', img.file_path || '');
    console.log(`   감지 결과: ${detection.isDocument ? `문서 (${detection.documentType})` : '일반 이미지'}`);
  });
  
  let classified = 0;
  let skipped = 0;
  let errors = 0;
  const stats = {
    order_spec: 0,
    survey: 0,
    consent: 0,
    other: 0
  };
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  console.log('\n4️⃣ 문서 분류 시작...\n');
  
  for (let i = 0; i < documentCandidates.length; i++) {
    const image = documentCandidates[i];
    
    // 이미 분류된 이미지는 건너뛰기
    if (image.is_scanned_document && image.document_type) {
      skipped++;
      console.log(`   ⏭️  건너뜀 (이미 분류됨): ${image.filename}`);
      continue;
    }
    
    // 문서 감지
    const detection = detectScannedDocument(
      image.filename || '',
      image.file_path || ''
    );
    
    if (!detection.isDocument) {
      console.log(`   ⚠️  문서로 감지되지 않음: ${image.filename}`);
      continue;
    }
    
    // 고객 ID 추출
    let customerId = extractCustomerIdFromTags(image.ai_tags);
    if (!customerId) {
      customerId = await extractCustomerIdFromPath(image.file_path || '');
    }
    if (!customerId) {
      customerId = customer.id; // 안희자 고객 ID 사용
    }
    
    // 날짜 추출
    const visitDate = extractDateFromPath(image.file_path || '');
    
    try {
      // image_assets 업데이트
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({
          is_scanned_document: true,
          document_type: detection.documentType,
          updated_at: new Date().toISOString()
        })
        .eq('id', image.id);
      
      if (updateError) {
        throw new Error(`image_assets 업데이트 실패: ${updateError.message}`);
      }
      
      // scanned_documents 레코드 생성/업데이트
      const documentData = {
        customer_id: customerId,
        image_asset_id: image.id,
        document_type: detection.documentType,
        file_path: image.file_path,
        file_name: image.filename,
        original_url: image.cdn_url,
        visit_date: visitDate,
        detected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 기존 레코드 확인
      const { data: existingDoc } = await supabase
        .from('scanned_documents')
        .select('id')
        .eq('image_asset_id', image.id)
        .maybeSingle();
      
      if (existingDoc) {
        const { error: updateDocError } = await supabase
          .from('scanned_documents')
          .update(documentData)
          .eq('id', existingDoc.id);
        
        if (updateDocError) {
          throw new Error(`scanned_documents 업데이트 실패: ${updateDocError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('scanned_documents')
          .insert(documentData);
        
        if (insertError) {
          throw new Error(`scanned_documents 생성 실패: ${insertError.message}`);
        }
      }
      
      classified++;
      stats[detection.documentType]++;
      console.log(`   ✅ 분류 완료: ${image.filename} → ${detection.documentType}`);
      
      // API 부하 방지를 위한 딜레이
      if (i % 10 === 0 && i > 0) {
        await delay(500);
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ 분류 실패: ${image.filename}`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 서류 후보: ${documentCandidates.length}개`);
  console.log(`   ✅ 새로 분류: ${classified}개`);
  console.log(`   ⏭️  건너뜀 (이미 분류됨): ${skipped}개`);
  console.log(`   ❌ 오류: ${errors}개`);
  console.log('\n   문서 타입별 통계:');
  console.log(`   - 주문사양서: ${stats.order_spec}개`);
  console.log(`   - 설문조사: ${stats.survey}개`);
  console.log(`   - 동의서: ${stats.consent}개`);
  console.log(`   - 기타: ${stats.other}개`);
  console.log('='.repeat(80));
  
  // 검증
  console.log('\n5️⃣ 검증: 분류된 문서 수 확인...');
  const { data: documents, error: verifyError } = await supabase
    .from('scanned_documents')
    .select('document_type', { count: 'exact' })
    .eq('customer_id', customer.id);
  
  if (!verifyError && documents) {
    const totalDocuments = documents.length;
    console.log(`✅ 안희자 고객의 총 분류된 문서: ${totalDocuments}개\n`);
  }
  
  console.log('✅ 작업 완료!');
}

classifyAhnhuijaDocuments().catch(console.error);
