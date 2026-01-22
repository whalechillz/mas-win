const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersWithAddresses() {
  console.log('='.repeat(80));
  console.log('📊 실제 주소가 있는 고객 수 확인');
  console.log('='.repeat(80));
  console.log('');

  // 1. 전체 고객 수
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`1. 전체 고객 수: ${totalCustomers || 0}명\n`);

  // 2. 고객관리주소가 있는 고객 수
  const { count: customersWithAddressCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .not('address', 'is', null)
    .neq('address', '')
    .not('address', 'like', '[%')
    .neq('address', 'N/A');

  console.log(`2. 고객관리주소가 있는 고객 수: ${customersWithAddressCount || 0}명\n`);

  // 3. 설문주소가 있는 고객 수
  const { count: surveysWithAddress } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .not('address', 'is', null)
    .neq('address', '')
    .not('address', 'like', '[%')
    .neq('address', 'N/A');

  console.log(`3. 설문주소가 있는 설문 수: ${surveysWithAddress || 0}건\n`);

  // 4. 설문주소가 있는 고객의 고유 전화번호 수
  const { data: surveysData } = await supabase
    .from('surveys')
    .select('phone')
    .not('address', 'is', null)
    .neq('address', '')
    .not('address', 'like', '[%')
    .neq('address', 'N/A');

  const uniquePhonesFromSurveys = new Set(
    surveysData?.map(s => s.phone?.replace(/[^0-9]/g, '')).filter(Boolean) || []
  );

  console.log(`4. 설문주소가 있는 고객의 고유 전화번호 수: ${uniquePhonesFromSurveys.size}명\n`);

  // 5. 고객관리주소 또는 설문주소 중 하나라도 있는 고객 수 (직접 계산)
  console.log('5. 주소가 있는 고객 수 계산 중...');
  
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, phone, address');

  const { data: allSurveys } = await supabase
    .from('surveys')
    .select('phone, address');

  // 고객 ID 기준으로 주소 있는 고객 추적
  const customersWithAddress = new Set();
  
  // 고객관리주소가 있는 고객
  allCustomers?.forEach(c => {
    if (c.id && c.address && c.address !== '' && !c.address.startsWith('[') && c.address !== 'N/A') {
      customersWithAddress.add(c.id);
    }
  });

  // 설문주소가 있는 고객 (전화번호로 매칭)
  const customerPhoneMap = new Map();
  allCustomers?.forEach(c => {
    if (c.id && c.phone) {
      const phone = c.phone.replace(/[^0-9]/g, '');
      if (phone) {
        if (!customerPhoneMap.has(phone)) {
          customerPhoneMap.set(phone, []);
        }
        customerPhoneMap.get(phone).push(c.id);
      }
    }
  });

  allSurveys?.forEach(s => {
    if (s.phone && s.address && s.address !== '' && !s.address.startsWith('[') && s.address !== 'N/A') {
      const phone = s.phone.replace(/[^0-9]/g, '');
      if (phone && customerPhoneMap.has(phone)) {
        customerPhoneMap.get(phone).forEach(customerId => {
          customersWithAddress.add(customerId);
        });
      }
    }
  });

  console.log(`5. 주소가 있는 고객 수 (고객 ID 기준): ${customersWithAddress.size}명\n`);

  // 6. API 엔드포인트로 확인
  console.log('6. API 엔드포인트로 확인:');
  console.log('   GET /api/admin/customers/geocoding?hasAddress=with&status=all&limit=10000');
  console.log('   (이 값이 1000으로 제한되는지 확인 필요)\n');

  console.log('='.repeat(80));
  console.log('✅ 확인 완료');
  console.log('='.repeat(80));
}

checkCustomersWithAddresses().catch(console.error);
