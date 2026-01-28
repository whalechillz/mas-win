/**
 * 기존 이미지 중 스캔 서류 자동 분류
 * 
 * 실행 방법:
 * node scripts/classify-existing-scanned-documents.js
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

async function classifyExistingDocuments() {
  console.log('🚀 기존 스캔 서류 분류 시작...\n');
  console.log('='.repeat(80));
  
  // 고객 이미지만 조회 (전체 데이터)
  console.log('1️⃣ 고객 이미지 조회 중...');
  
  let allImages = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, is_scanned_document, document_type')
      .ilike('file_path', 'originals/customers/%')
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
  
  console.log('2️⃣ 문서 분류 시작...\n');
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // 이미 분류된 이미지는 건너뛰기 (force 옵션이 없으면)
    if (image.is_scanned_document && image.document_type) {
      skipped++;
      if ((i + 1) % 100 === 0) {
        console.log(`   진행 중... ${i + 1}/${images.length} (분류: ${classified}, 건너뜀: ${skipped})`);
      }
      continue;
    }
    
    // 문서 감지
    const detection = detectScannedDocument(
      image.filename || '',
      image.file_path || ''
    );
    
    if (!detection.isDocument) {
      continue;
    }
    
    // 고객 ID 추출
    let customerId = extractCustomerIdFromTags(image.ai_tags);
    if (!customerId) {
      customerId = await extractCustomerIdFromPath(image.file_path || '');
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
      
      if (classified % 10 === 0) {
        console.log(`   ✅ 분류 완료: ${classified}개 (${image.filename})`);
      }
      
      // API 부하 방지를 위한 딜레이
      if (i % 50 === 0 && i > 0) {
        await delay(1000);
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ 분류 실패: ${image.filename}`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 이미지: ${images.length}개`);
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
  console.log('\n3️⃣ 검증: 분류된 문서 수 확인...');
  const { data: documents, error: verifyError } = await supabase
    .from('scanned_documents')
    .select('document_type', { count: 'exact' });
  
  if (!verifyError && documents) {
    const totalDocuments = documents.length;
    console.log(`✅ 총 분류된 문서: ${totalDocuments}개\n`);
  }
  
  console.log('✅ 작업 완료!');
}

classifyExistingDocuments().catch(console.error);
