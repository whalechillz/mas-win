/**
 * 고객 폴더의 이미지 메타데이터에서 고객명 확인 스크립트
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 확인할 고객 ID 목록
const customerIds = ['13528', '15203', '2213', '602'];

async function checkCustomerNames() {
  console.log('🔍 고객명 확인 중...\n');

  const results = [];

  for (const customerId of customerIds) {
    try {
      // image_metadata 테이블에서 해당 고객의 이미지 조회
      const { data, error } = await supabase
        .from('image_metadata')
        .select('title, alt_text, folder_path, tags, created_at')
        .contains('tags', [`customer-${customerId}`])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`❌ 고객 ${customerId} 조회 오류:`, error.message);
        results.push({
          customerId,
          customerName: '조회 실패',
          error: error.message
        });
        continue;
      }

      if (!data || data.length === 0) {
        // 메타데이터가 없으면 폴더 경로로 직접 확인
        const folderPath = `originals/customers/customer-${customerId}`;
        console.log(`⚠️ 메타데이터 없음: ${folderPath}`);
        results.push({
          customerId,
          customerName: '메타데이터 없음',
          folderPath
        });
        continue;
      }

      // title 필드에서 고객명 추출 (형식: "고객명 - YYYY-MM-DD")
      const metadata = data[0];
      let customerName = '알 수 없음';

      if (metadata.title) {
        // "고객명 - YYYY-MM-DD" 형식에서 고객명 추출
        const match = metadata.title.match(/^(.+?)\s*-\s*\d{4}-\d{2}-\d{2}/);
        if (match) {
          customerName = match[1].trim();
        } else {
          customerName = metadata.title;
        }
      } else if (metadata.alt_text) {
        // alt_text에서 추출 (형식: "고객명 고객 방문 이미지 (YYYY-MM-DD)")
        const match = metadata.alt_text.match(/^(.+?)\s+고객 방문 이미지/);
        if (match) {
          customerName = match[1].trim();
        }
      }

      results.push({
        customerId,
        customerName,
        folderPath: metadata.folder_path,
        visitDate: metadata.folder_path?.split('/').pop() || '알 수 없음',
        hasMetadata: true
      });

      console.log(`✅ customer-${customerId}: ${customerName} (${metadata.folder_path?.split('/').pop() || 'N/A'})`);

    } catch (error) {
      console.error(`❌ 고객 ${customerId} 처리 오류:`, error);
      results.push({
        customerId,
        customerName: '오류 발생',
        error: error.message
      });
    }
  }

  console.log('\n📊 결과 요약:');
  console.log('='.repeat(60));
  results.forEach(result => {
    console.log(`고객 ID: customer-${result.customerId}`);
    console.log(`고객명: ${result.customerName}`);
    if (result.folderPath) {
      console.log(`폴더: ${result.folderPath}`);
    }
    if (result.visitDate) {
      console.log(`방문일: ${result.visitDate}`);
    }
    if (result.error) {
      console.log(`오류: ${result.error}`);
    }
    console.log('-'.repeat(60));
  });

  return results;
}

// 스크립트 실행
checkCustomerNames()
  .then(() => {
    console.log('\n✅ 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });


