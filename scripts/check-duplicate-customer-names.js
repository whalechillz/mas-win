/**
 * 중복 이름 고객 목록 조회 스크립트
 * 이름이 2개 이상인 고객을 조회합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicateNames() {
  console.log('🔍 중복 이름 고객 조회 중...\n');

  try {
    // 모든 고객 조회
    const { data: allCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('name', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!allCustomers || allCustomers.length === 0) {
      console.log('고객 데이터가 없습니다.');
      return;
    }

    // 이름별로 그룹화
    const nameMap = new Map();
    
    allCustomers.forEach(customer => {
      const name = customer.name?.trim();
      if (!name) return;
      
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name).push({
        id: customer.id,
        phone: customer.phone,
        name: customer.name
      });
    });

    // 중복 이름 필터링 (2명 이상)
    const duplicates = Array.from(nameMap.entries())
      .filter(([name, customers]) => customers.length >= 2)
      .sort((a, b) => b[1].length - a[1].length); // 중복 수가 많은 순으로 정렬

    console.log(`📊 전체 고객 수: ${allCustomers.length}명`);
    console.log(`📊 고유 이름 수: ${nameMap.size}개`);
    console.log(`📊 중복 이름 수: ${duplicates.length}개\n`);

    if (duplicates.length === 0) {
      console.log('✅ 중복 이름 고객이 없습니다.');
      return;
    }

    // 결과 출력
    console.log('='.repeat(80));
    console.log('중복 이름 고객 목록');
    console.log('='.repeat(80));
    console.log();

    duplicates.forEach(([name, customers], index) => {
      console.log(`${index + 1}. ${name} (${customers.length}명)`);
      customers.forEach((customer, idx) => {
        const phoneDisplay = customer.phone 
          ? customer.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
          : '전화번호 없음';
        console.log(`   ${idx + 1}) ID: ${customer.id}, 전화번호: ${phoneDisplay}`);
      });
      console.log();
    });

    // 요약 통계
    console.log('='.repeat(80));
    console.log('요약 통계');
    console.log('='.repeat(80));
    console.log(`총 중복 이름: ${duplicates.length}개`);
    console.log(`총 중복 고객 수: ${duplicates.reduce((sum, [_, customers]) => sum + customers.length, 0)}명`);
    
    // 중복 수별 분포
    const distribution = {};
    duplicates.forEach(([name, customers]) => {
      const count = customers.length;
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log('\n중복 수별 분포:');
    Object.entries(distribution)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([count, names]) => {
        console.log(`  ${count}명: ${names}개 이름`);
      });

    // 전화번호 입력이 필요한 고객 수
    const totalDuplicateCustomers = duplicates.reduce((sum, [_, customers]) => sum + customers.length, 0);
    console.log(`\n⚠️  전화번호 입력이 필요한 고객 수: ${totalDuplicateCustomers}명`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkDuplicateNames();

