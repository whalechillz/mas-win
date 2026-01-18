/**
 * 최석호 고객 후기 파일 저장 스크립트
 * 2020.11.18, 2020.12.10 전화후기 파일을 customer_consultations 테이블에 저장
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const iconv = require('iconv-lite');
const chardet = require('chardet');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 고객 정보
const CUSTOMER_NAME = '최석호';
const CUSTOMER_ID = 2304; // 이전 마이그레이션에서 확인된 ID

// 후기 파일 정보
const REVIEW_FILES = [
  {
    folderPath: '/Users/m2/MASLABS/00.blog_customers/add/2020.11.18.최석호_전화후기',
    fileName: '2020.11.18.최석호.전화후기.txt',
    date: '2020-11-18',
    type: 'phone'
  },
  {
    folderPath: '/Users/m2/MASLABS/00.blog_customers/add/2020.12.10.최석호_전화후기',
    fileName: '2020.12.10.최석호.전화후기.txt',
    date: '2020-12-10',
    type: 'phone'
  }
];

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
}

/**
 * 고객 ID 확인
 */
async function verifyCustomer() {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('id', CUSTOMER_ID)
    .single();

  if (error || !data) {
    console.error(`❌ 고객 정보를 찾을 수 없습니다: ${CUSTOMER_ID}`);
    return null;
  }

  console.log(`✅ 고객 확인: ${data.name} (ID: ${data.id}, 전화: ${data.phone || '없음'})`);
  return data;
}

/**
 * 후기 파일 읽기 (인코딩 자동 감지)
 */
function readReviewFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
      return null;
    }

    // 바이너리로 읽어서 인코딩 감지
    const buffer = fs.readFileSync(filePath);
    const detected = chardet.detect(buffer);
    const encoding = detected || 'utf-8';
    
    console.log(`   📝 인코딩 감지: ${encoding}`);
    
    // 인코딩에 따라 변환
    let content;
    if (encoding.toLowerCase().includes('euc-kr') || 
        encoding.toLowerCase().includes('windows-949') ||
        encoding.toLowerCase().includes('iso-2022-kr')) {
      // EUC-KR 또는 Windows-949 인코딩
      content = iconv.decode(buffer, 'euc-kr');
    } else if (encoding.toLowerCase().includes('utf-8') || 
               encoding.toLowerCase().includes('utf8')) {
      // UTF-8 인코딩
      content = buffer.toString('utf-8');
    } else {
      // 기본적으로 UTF-8로 시도
      try {
        content = buffer.toString('utf-8');
      } catch {
        // 실패하면 iconv로 시도
        content = iconv.decode(buffer, encoding);
      }
    }
    
    return normalizeKorean(content.trim());
  } catch (error) {
    console.error(`❌ 파일 읽기 오류 (${filePath}):`, error.message);
    return null;
  }
}

/**
 * 후기 저장
 */
async function saveReview(reviewData) {
  const { customerId, date, content, type } = reviewData;

  // 기존 후기 확인 (중복 방지)
  const { data: existing } = await supabase
    .from('customer_consultations')
    .select('id')
    .eq('customer_id', customerId)
    .eq('consultation_date', `${date}T00:00:00Z`)
    .eq('consultation_type', 'phone')
    .eq('topic', '전화후기')
    .single();

  if (existing) {
    console.log(`   ⚠️  이미 존재하는 후기 (ID: ${existing.id}), 업데이트합니다.`);
    
    const { data, error } = await supabase
      .from('customer_consultations')
      .update({
        content: content,
        review_type: type,
        topic: '전화후기',
        tags: ['전화후기', '후기'],
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // 새 후기 생성
  const { data, error } = await supabase
    .from('customer_consultations')
    .insert({
      customer_id: customerId,
      consultation_type: 'phone',
      consultation_date: `${date}T00:00:00Z`,
      consultant_name: '시스템',
      topic: '전화후기',
      content: content,
      review_type: type,
      tags: ['전화후기', '후기'],
      follow_up_required: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 메인 함수
 */
async function saveChoiseokhoReviews() {
  console.log('🔄 최석호 고객 후기 저장 시작...\n');

  // 고객 확인
  const customer = await verifyCustomer();
  if (!customer) {
    return;
  }

  console.log(`\n📋 후기 파일: ${REVIEW_FILES.length}개\n`);

  let successCount = 0;
  let failCount = 0;

  // 각 후기 파일 처리
  for (let i = 0; i < REVIEW_FILES.length; i++) {
    const reviewFile = REVIEW_FILES[i];
    const filePath = path.join(reviewFile.folderPath, reviewFile.fileName);

    console.log(`[${i + 1}/${REVIEW_FILES.length}] ${reviewFile.fileName}`);
    console.log(`   날짜: ${reviewFile.date}`);

    try {
      // 파일 읽기
      const content = readReviewFile(filePath);
      if (!content) {
        console.log(`   ❌ 파일 읽기 실패`);
        failCount++;
        continue;
      }

      console.log(`   📄 내용 길이: ${content.length}자`);
      console.log(`   📝 내용 미리보기: ${content.substring(0, 100)}...`);

      // 후기 저장
      const savedReview = await saveReview({
        customerId: customer.id,
        date: reviewFile.date,
        content: content,
        type: reviewFile.type
      });

      console.log(`   ✅ 저장 완료 (ID: ${savedReview.id})`);
      successCount++;

    } catch (error) {
      console.log(`   ❌ 저장 실패: ${error.message}`);
      failCount++;
    }

    console.log('');
  }

  console.log(`${'='.repeat(60)}`);
  console.log('📊 후기 저장 완료!');
  console.log(`   성공: ${successCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log('='.repeat(60));
}

// 실행
if (require.main === module) {
  saveChoiseokhoReviews().catch(console.error);
}

module.exports = { saveChoiseokhoReviews };
