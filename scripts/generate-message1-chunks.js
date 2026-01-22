/**
 * 메시지 1 (50km 이내 고객) 200명씩 청크 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-message1-chunks.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 메시지 1 템플릿
// 호칭은 버튼에서 선택하므로 메시지에는 {name}만 입력
const MESSAGE_1_TEMPLATE = `[마쓰구골프] {name}, 근거리 시타 특별 초대!

{name}, 약 {distance_km}km 거리에 계시는 고객님을 위한 특별 혜택입니다!

[근거리 특별 혜택]
• 마쓰구 티타늄 샤프트 (뮤직 장착) 신제품 시타
• 맞춤형 피팅 서비스 무료 제공
• 직접 방문 시 추가 할인 적용

힘 빼고 휘둘러도, 거리는 충분합니다
가까운 거리에서 직접 체험해보세요!

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 온라인 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888
☎ 매장 문의: 031-215-0013

KGFA 1급 피팅 전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.

마쓰구 수원본점
수원시 영통구 법조로149번길 200`;

// 변수 치환 함수
function formatCustomerName(name) {
  if (!name || name.trim() === '') return '';
  return name.trim();
}

function generatePersonalizedMessage(template, customer) {
  let message = template;
  
  // {name} 변수 치환 (템플릿에 이미 "님"이 있으므로 이름만 치환)
  const customerName = formatCustomerName(customer.name);
  const nameOnly = customerName || '고객';
  message = message.replace(/\{name\}/g, nameOnly);
  message = message.replace(/\{고객명\}/g, nameOnly);
  
  // {distance_km} 변수 치환 (소수점 첫째자리까지)
  const distanceKm = customer.distance_km ? Math.round(customer.distance_km * 10) / 10 : '0';
  message = message.replace(/\{distance_km\}/g, distanceKm);
  
  return message;
}

async function generateMessage1Chunks() {
  console.log('='.repeat(80));
  console.log('📝 메시지 1 (50km 이내 고객) 200명씩 청크 생성');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. 50km 이내 고객 조회 (customer_address_cache와 조인)
    console.log('🔍 50km 이내 고객 조회 중...');
    
    // SQL 쿼리로 직접 조회 (설문 주소 우선, 고객 주소 대체)
    const { data: customersData, error: queryError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT DISTINCT
          c.id as customer_id,
          c.name,
          c.phone,
          c.address as customer_address,
          s.address as survey_address,
          CASE 
            WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
            ELSE c.address
          END as effective_address,
          cache.distance_km,
          cache.geocoding_status
        FROM customers c
        LEFT JOIN surveys s ON s.phone = c.phone
        LEFT JOIN customer_address_cache cache ON (
          cache.customer_id = c.id 
          AND cache.address = CASE 
            WHEN s.address IS NOT NULL AND s.address != '' AND s.address NOT LIKE '[%' AND s.address != 'N/A' THEN s.address
            ELSE c.address
          END
        )
        WHERE c.opt_out = false
          AND c.phone IS NOT NULL
          AND cache.geocoding_status = 'success'
          AND cache.distance_km IS NOT NULL
          AND cache.distance_km <= 50
        ORDER BY cache.distance_km ASC
      `
    });

    // RPC가 없으면 직접 조회
    let customersWithDistance = [];
    
    if (queryError || !customersData) {
      console.log('   RPC 사용 불가, 직접 조회로 전환...');
      
      // customer_address_cache에서 50km 이내 고객 조회
      const { data: cacheData, error: cacheError } = await supabase
        .from('customer_address_cache')
        .select(`
          customer_id,
          distance_km,
          geocoding_status,
          customers!inner (
            id,
            name,
            phone,
            address
          )
        `)
        .eq('geocoding_status', 'success')
        .not('distance_km', 'is', null)
        .lte('distance_km', 50)
        .eq('customers.opt_out', false)
        .not('customers.phone', 'is', null)
        .order('distance_km', { ascending: true });

      if (cacheError) {
        console.error('❌ 거리 정보 조회 오류:', cacheError);
        throw cacheError;
      }

      // 중복 제거 (같은 고객이 여러 주소로 등록된 경우 최신 것만 사용)
      const customerMap = new Map();
      
      for (const cache of cacheData || []) {
        const customerId = cache.customer_id;
        if (!customerMap.has(customerId) || 
            (cache.distance_km && (!customerMap.get(customerId).distance_km || cache.distance_km < customerMap.get(customerId).distance_km))) {
          customerMap.set(customerId, {
            id: cache.customers.id,
            name: cache.customers.name,
            phone: cache.customers.phone,
            distance_km: cache.distance_km
          });
        }
      }
      
      customersWithDistance = Array.from(customerMap.values());
    } else {
      // RPC 결과 사용
      customersWithDistance = (customersData || []).map(row => ({
        id: row.customer_id,
        name: row.name,
        phone: row.phone,
        distance_km: row.distance_km
      }));
    }

    console.log(`   거리 정보 있는 고객: ${customersWithDistance.length}명`);
    console.log('');

    if (customersWithDistance.length === 0) {
      console.log('⚠️  50km 이내 고객이 없습니다.');
      return;
    }

    // 3. 200명씩 청크로 분할
    const chunkSize = 200;
    const chunks = [];
    
    for (let i = 0; i < customersWithDistance.length; i += chunkSize) {
      chunks.push(customersWithDistance.slice(i, i + chunkSize));
    }

    console.log(`📦 총 ${chunks.length}개 청크 생성 (각 ${chunkSize}명씩)`);
    console.log('');

    // 4. 각 청크별 메시지 생성
    const results = [];
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkNumber = chunkIndex + 1;
      
      console.log(`📝 청크 ${chunkNumber}/${chunks.length} 생성 중... (${chunk.length}명)`);
      
      const chunkMessages = chunk.map((customer, index) => {
        const personalizedMessage = generatePersonalizedMessage(MESSAGE_1_TEMPLATE, customer);
        
        return {
          순번: chunkIndex * chunkSize + index + 1,
          고객ID: customer.id,
          이름: customer.name || '(이름 없음)',
          전화번호: customer.phone,
          거리: `${customer.distance_km}km`,
          메시지: personalizedMessage
        };
      });

      results.push({
        청크번호: chunkNumber,
        총청크수: chunks.length,
        고객수: chunk.length,
        시작순번: chunkIndex * chunkSize + 1,
        끝순번: chunkIndex * chunkSize + chunk.length,
        메시지목록: chunkMessages
      });
    }

    console.log('');
    console.log('✅ 청크 생성 완료!');
    console.log('');

    // 5. 결과 출력
    console.log('='.repeat(80));
    console.log('📊 생성 결과 요약');
    console.log('='.repeat(80));
    console.log(`총 고객 수: ${customersWithDistance.length}명`);
    console.log(`총 청크 수: ${chunks.length}개`);
    console.log(`청크당 인원: ${chunkSize}명 (마지막 청크: ${chunks[chunks.length - 1]?.length || 0}명)`);
    console.log('');

    // 6. 각 청크별 요약 출력
    results.forEach((result, index) => {
      console.log(`청크 ${result.청크번호}/${result.총청크수}: ${result.고객수}명 (순번 ${result.시작순번}~${result.끝순번})`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('📄 상세 메시지 (첫 3명 샘플)');
    console.log('='.repeat(80));
    console.log('');

    // 첫 청크의 첫 3명만 샘플 출력
    if (results[0] && results[0].메시지목록.length > 0) {
      const sampleCount = Math.min(3, results[0].메시지목록.length);
      for (let i = 0; i < sampleCount; i++) {
        const msg = results[0].메시지목록[i];
        console.log(`[${msg.순번}] ${msg.이름} (${msg.전화번호}) - ${msg.거리}`);
        console.log(msg.메시지);
        console.log('');
        console.log('─'.repeat(80));
        console.log('');
      }
    }

    // 7. JSON 파일로 저장 (선택사항)
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(process.cwd(), 'scripts', 'message-chunks');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFile = path.join(outputDir, `message1-chunks-${timestamp}.json`);
    
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
    
    console.log(`💾 전체 결과가 저장되었습니다: ${outputFile}`);
    console.log('');

    // 8. CSV 파일로도 저장 (발송용)
    const csvFile = path.join(outputDir, `message1-chunks-${timestamp}.csv`);
    const csvLines = ['순번,고객ID,이름,전화번호,거리(km),메시지'];
    
    results.forEach(result => {
      result.메시지목록.forEach(msg => {
        const csvMessage = msg.메시지.replace(/\n/g, '\\n').replace(/"/g, '""');
        csvLines.push(`"${msg.순번}","${msg.고객ID}","${msg.이름}","${msg.전화번호}","${msg.거리}","${csvMessage}"`);
      });
    });
    
    fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf-8');
    console.log(`💾 CSV 파일도 저장되었습니다: ${csvFile}`);
    console.log('');

    return results;

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  generateMessage1Chunks()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateMessage1Chunks };
