/**
 * SMS 발송 상태 확인 스크립트
 * 
 * 사용법:
 *   node scripts/check-sms-sending-status.js <messageId>
 * 
 * 예시:
 *   node scripts/check-sms-sending-status.js 26
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// 간단한 fetch 구현
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          });
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'JSON 파싱 실패', data })
          });
        }
      });
    }).on('error', reject);
  });
}

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const MESSAGE_ID = process.argv[2];

if (!MESSAGE_ID) {
  console.error('❌ 사용법: node scripts/check-sms-sending-status.js <messageId>');
  console.error('   예시: node scripts/check-sms-sending-status.js 26');
  process.exit(1);
}

async function checkSendingStatus() {
  console.log('🔍 SMS 발송 상태 확인 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  console.log(`🌐 API URL: ${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}\n`);

  try {
    const response = await fetch(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ 오류:', data.message || '알 수 없는 오류');
      process.exit(1);
    }

    const { result, analysis, recommendations } = data;

    console.log('='.repeat(60));
    console.log('📊 발송 상태 분석 결과');
    console.log('='.repeat(60));
    console.log(`\n📝 메시지 내용: ${result.messageText}`);
    console.log(`\n💾 DB 데이터:`);
    console.log(`   - 수신자 수: ${result.dbData.recipientCount}명`);
    console.log(`   - 발송 시도 건수: ${result.dbData.sentCount}건`);
    console.log(`   - 성공 건수: ${result.dbData.successCount}건`);
    console.log(`   - 실패 건수: ${result.dbData.failCount}건`);
    console.log(`   - 상태: ${result.dbData.status}`);
    console.log(`   - Solapi 그룹 ID: ${result.dbData.solapiGroupId || '없음'}`);
    console.log(`   - 발송일: ${result.dbData.sentAt ? new Date(result.dbData.sentAt).toLocaleString('ko-KR') : '없음'}`);

    if (result.solapiGroups.length > 0) {
      console.log(`\n📡 Solapi 첫 번째 그룹 정보:`);
      const group = result.solapiGroups[0];
      console.log(`   - 그룹 ID: ${group.groupId}`);
      console.log(`   - 총 건수: ${group.count || group.totalCount || 0}건`);
      console.log(`   - 성공: ${group.successCount || 0}건`);
      console.log(`   - 실패: ${group.failCount || 0}건`);
      console.log(`   - 발송중: ${group.sendingCount || 0}건`);
      console.log(`   - 상태: ${group.status}`);
    }

    console.log(`\n📈 분석 결과:`);
    console.log(`   - 총 수신자: ${analysis.totalRecipients}명`);
    console.log(`   - DB 발송 건수: ${analysis.dbSentCount}건`);
    console.log(`   - Solapi 첫 그룹 건수: ${analysis.solapiFirstGroupCount}건`);
    console.log(`   - 누락된 건수: ${analysis.missingCount}건`);
    console.log(`   - 발송 완료 여부: ${analysis.isComplete ? '✅ 완료' : '❌ 불완전'}`);

    if (analysis.warning) {
      console.log(`\n⚠️  경고:`);
      console.log(analysis.warning);
    }

    if (recommendations && recommendations.length > 0) {
      console.log(`\n💡 권장 사항:`);
      recommendations.forEach((rec, idx) => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 다음 단계:');
    console.log('='.repeat(60));
    
    if (!analysis.isComplete) {
      console.log('\n1. 서버 콘솔 로그 확인:');
      console.log('   발송 시 서버 콘솔에 다음과 같은 로그가 출력됩니다:');
      console.log('   📋 생성된 그룹 IDs (Solapi 콘솔에서 각각 확인 가능):');
      console.log('      1. G1234567890');
      console.log('      2. G1234567891');
      console.log('      ...');
      
      console.log('\n2. Solapi 콘솔 확인:');
      console.log('   - https://console.solapi.com/message-log 접속');
      console.log('   - 발송 날짜로 필터링');
      console.log('   - 각 그룹을 개별적으로 확인');
      
      console.log('\n3. 나머지 수신자 재발송 (필요시):');
      console.log('   - SMS 편집 페이지에서 미발송 수신자만 선별');
      console.log('   - 재발송 실행');
    } else {
      console.log('\n✅ 모든 수신자에게 발송이 완료되었습니다!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

checkSendingStatus();


 * 
 * 사용법:
 *   node scripts/check-sms-sending-status.js <messageId>
 * 
 * 예시:
 *   node scripts/check-sms-sending-status.js 26
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// 간단한 fetch 구현
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          });
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'JSON 파싱 실패', data })
          });
        }
      });
    }).on('error', reject);
  });
}

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const MESSAGE_ID = process.argv[2];

if (!MESSAGE_ID) {
  console.error('❌ 사용법: node scripts/check-sms-sending-status.js <messageId>');
  console.error('   예시: node scripts/check-sms-sending-status.js 26');
  process.exit(1);
}

async function checkSendingStatus() {
  console.log('🔍 SMS 발송 상태 확인 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  console.log(`🌐 API URL: ${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}\n`);

  try {
    const response = await fetch(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ 오류:', data.message || '알 수 없는 오류');
      process.exit(1);
    }

    const { result, analysis, recommendations } = data;

    console.log('='.repeat(60));
    console.log('📊 발송 상태 분석 결과');
    console.log('='.repeat(60));
    console.log(`\n📝 메시지 내용: ${result.messageText}`);
    console.log(`\n💾 DB 데이터:`);
    console.log(`   - 수신자 수: ${result.dbData.recipientCount}명`);
    console.log(`   - 발송 시도 건수: ${result.dbData.sentCount}건`);
    console.log(`   - 성공 건수: ${result.dbData.successCount}건`);
    console.log(`   - 실패 건수: ${result.dbData.failCount}건`);
    console.log(`   - 상태: ${result.dbData.status}`);
    console.log(`   - Solapi 그룹 ID: ${result.dbData.solapiGroupId || '없음'}`);
    console.log(`   - 발송일: ${result.dbData.sentAt ? new Date(result.dbData.sentAt).toLocaleString('ko-KR') : '없음'}`);

    if (result.solapiGroups.length > 0) {
      console.log(`\n📡 Solapi 첫 번째 그룹 정보:`);
      const group = result.solapiGroups[0];
      console.log(`   - 그룹 ID: ${group.groupId}`);
      console.log(`   - 총 건수: ${group.count || group.totalCount || 0}건`);
      console.log(`   - 성공: ${group.successCount || 0}건`);
      console.log(`   - 실패: ${group.failCount || 0}건`);
      console.log(`   - 발송중: ${group.sendingCount || 0}건`);
      console.log(`   - 상태: ${group.status}`);
    }

    console.log(`\n📈 분석 결과:`);
    console.log(`   - 총 수신자: ${analysis.totalRecipients}명`);
    console.log(`   - DB 발송 건수: ${analysis.dbSentCount}건`);
    console.log(`   - Solapi 첫 그룹 건수: ${analysis.solapiFirstGroupCount}건`);
    console.log(`   - 누락된 건수: ${analysis.missingCount}건`);
    console.log(`   - 발송 완료 여부: ${analysis.isComplete ? '✅ 완료' : '❌ 불완전'}`);

    if (analysis.warning) {
      console.log(`\n⚠️  경고:`);
      console.log(analysis.warning);
    }

    if (recommendations && recommendations.length > 0) {
      console.log(`\n💡 권장 사항:`);
      recommendations.forEach((rec, idx) => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 다음 단계:');
    console.log('='.repeat(60));
    
    if (!analysis.isComplete) {
      console.log('\n1. 서버 콘솔 로그 확인:');
      console.log('   발송 시 서버 콘솔에 다음과 같은 로그가 출력됩니다:');
      console.log('   📋 생성된 그룹 IDs (Solapi 콘솔에서 각각 확인 가능):');
      console.log('      1. G1234567890');
      console.log('      2. G1234567891');
      console.log('      ...');
      
      console.log('\n2. Solapi 콘솔 확인:');
      console.log('   - https://console.solapi.com/message-log 접속');
      console.log('   - 발송 날짜로 필터링');
      console.log('   - 각 그룹을 개별적으로 확인');
      
      console.log('\n3. 나머지 수신자 재발송 (필요시):');
      console.log('   - SMS 편집 페이지에서 미발송 수신자만 선별');
      console.log('   - 재발송 실행');
    } else {
      console.log('\n✅ 모든 수신자에게 발송이 완료되었습니다!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

checkSendingStatus();

 * 
 * 사용법:
 *   node scripts/check-sms-sending-status.js <messageId>
 * 
 * 예시:
 *   node scripts/check-sms-sending-status.js 26
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// 간단한 fetch 구현
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          });
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'JSON 파싱 실패', data })
          });
        }
      });
    }).on('error', reject);
  });
}

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const MESSAGE_ID = process.argv[2];

if (!MESSAGE_ID) {
  console.error('❌ 사용법: node scripts/check-sms-sending-status.js <messageId>');
  console.error('   예시: node scripts/check-sms-sending-status.js 26');
  process.exit(1);
}

async function checkSendingStatus() {
  console.log('🔍 SMS 발송 상태 확인 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  console.log(`🌐 API URL: ${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}\n`);

  try {
    const response = await fetch(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ 오류:', data.message || '알 수 없는 오류');
      process.exit(1);
    }

    const { result, analysis, recommendations } = data;

    console.log('='.repeat(60));
    console.log('📊 발송 상태 분석 결과');
    console.log('='.repeat(60));
    console.log(`\n📝 메시지 내용: ${result.messageText}`);
    console.log(`\n💾 DB 데이터:`);
    console.log(`   - 수신자 수: ${result.dbData.recipientCount}명`);
    console.log(`   - 발송 시도 건수: ${result.dbData.sentCount}건`);
    console.log(`   - 성공 건수: ${result.dbData.successCount}건`);
    console.log(`   - 실패 건수: ${result.dbData.failCount}건`);
    console.log(`   - 상태: ${result.dbData.status}`);
    console.log(`   - Solapi 그룹 ID: ${result.dbData.solapiGroupId || '없음'}`);
    console.log(`   - 발송일: ${result.dbData.sentAt ? new Date(result.dbData.sentAt).toLocaleString('ko-KR') : '없음'}`);

    if (result.solapiGroups.length > 0) {
      console.log(`\n📡 Solapi 첫 번째 그룹 정보:`);
      const group = result.solapiGroups[0];
      console.log(`   - 그룹 ID: ${group.groupId}`);
      console.log(`   - 총 건수: ${group.count || group.totalCount || 0}건`);
      console.log(`   - 성공: ${group.successCount || 0}건`);
      console.log(`   - 실패: ${group.failCount || 0}건`);
      console.log(`   - 발송중: ${group.sendingCount || 0}건`);
      console.log(`   - 상태: ${group.status}`);
    }

    console.log(`\n📈 분석 결과:`);
    console.log(`   - 총 수신자: ${analysis.totalRecipients}명`);
    console.log(`   - DB 발송 건수: ${analysis.dbSentCount}건`);
    console.log(`   - Solapi 첫 그룹 건수: ${analysis.solapiFirstGroupCount}건`);
    console.log(`   - 누락된 건수: ${analysis.missingCount}건`);
    console.log(`   - 발송 완료 여부: ${analysis.isComplete ? '✅ 완료' : '❌ 불완전'}`);

    if (analysis.warning) {
      console.log(`\n⚠️  경고:`);
      console.log(analysis.warning);
    }

    if (recommendations && recommendations.length > 0) {
      console.log(`\n💡 권장 사항:`);
      recommendations.forEach((rec, idx) => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 다음 단계:');
    console.log('='.repeat(60));
    
    if (!analysis.isComplete) {
      console.log('\n1. 서버 콘솔 로그 확인:');
      console.log('   발송 시 서버 콘솔에 다음과 같은 로그가 출력됩니다:');
      console.log('   📋 생성된 그룹 IDs (Solapi 콘솔에서 각각 확인 가능):');
      console.log('      1. G1234567890');
      console.log('      2. G1234567891');
      console.log('      ...');
      
      console.log('\n2. Solapi 콘솔 확인:');
      console.log('   - https://console.solapi.com/message-log 접속');
      console.log('   - 발송 날짜로 필터링');
      console.log('   - 각 그룹을 개별적으로 확인');
      
      console.log('\n3. 나머지 수신자 재발송 (필요시):');
      console.log('   - SMS 편집 페이지에서 미발송 수신자만 선별');
      console.log('   - 재발송 실행');
    } else {
      console.log('\n✅ 모든 수신자에게 발송이 완료되었습니다!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

checkSendingStatus();


 * 
 * 사용법:
 *   node scripts/check-sms-sending-status.js <messageId>
 * 
 * 예시:
 *   node scripts/check-sms-sending-status.js 26
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// 간단한 fetch 구현
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          });
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'JSON 파싱 실패', data })
          });
        }
      });
    }).on('error', reject);
  });
}

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const MESSAGE_ID = process.argv[2];

if (!MESSAGE_ID) {
  console.error('❌ 사용법: node scripts/check-sms-sending-status.js <messageId>');
  console.error('   예시: node scripts/check-sms-sending-status.js 26');
  process.exit(1);
}

async function checkSendingStatus() {
  console.log('🔍 SMS 발송 상태 확인 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  console.log(`🌐 API URL: ${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}\n`);

  try {
    const response = await fetch(`${LOCAL_URL}/api/channels/sms/check-sending-status?messageId=${MESSAGE_ID}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ 오류:', data.message || '알 수 없는 오류');
      process.exit(1);
    }

    const { result, analysis, recommendations } = data;

    console.log('='.repeat(60));
    console.log('📊 발송 상태 분석 결과');
    console.log('='.repeat(60));
    console.log(`\n📝 메시지 내용: ${result.messageText}`);
    console.log(`\n💾 DB 데이터:`);
    console.log(`   - 수신자 수: ${result.dbData.recipientCount}명`);
    console.log(`   - 발송 시도 건수: ${result.dbData.sentCount}건`);
    console.log(`   - 성공 건수: ${result.dbData.successCount}건`);
    console.log(`   - 실패 건수: ${result.dbData.failCount}건`);
    console.log(`   - 상태: ${result.dbData.status}`);
    console.log(`   - Solapi 그룹 ID: ${result.dbData.solapiGroupId || '없음'}`);
    console.log(`   - 발송일: ${result.dbData.sentAt ? new Date(result.dbData.sentAt).toLocaleString('ko-KR') : '없음'}`);

    if (result.solapiGroups.length > 0) {
      console.log(`\n📡 Solapi 첫 번째 그룹 정보:`);
      const group = result.solapiGroups[0];
      console.log(`   - 그룹 ID: ${group.groupId}`);
      console.log(`   - 총 건수: ${group.count || group.totalCount || 0}건`);
      console.log(`   - 성공: ${group.successCount || 0}건`);
      console.log(`   - 실패: ${group.failCount || 0}건`);
      console.log(`   - 발송중: ${group.sendingCount || 0}건`);
      console.log(`   - 상태: ${group.status}`);
    }

    console.log(`\n📈 분석 결과:`);
    console.log(`   - 총 수신자: ${analysis.totalRecipients}명`);
    console.log(`   - DB 발송 건수: ${analysis.dbSentCount}건`);
    console.log(`   - Solapi 첫 그룹 건수: ${analysis.solapiFirstGroupCount}건`);
    console.log(`   - 누락된 건수: ${analysis.missingCount}건`);
    console.log(`   - 발송 완료 여부: ${analysis.isComplete ? '✅ 완료' : '❌ 불완전'}`);

    if (analysis.warning) {
      console.log(`\n⚠️  경고:`);
      console.log(analysis.warning);
    }

    if (recommendations && recommendations.length > 0) {
      console.log(`\n💡 권장 사항:`);
      recommendations.forEach((rec, idx) => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 다음 단계:');
    console.log('='.repeat(60));
    
    if (!analysis.isComplete) {
      console.log('\n1. 서버 콘솔 로그 확인:');
      console.log('   발송 시 서버 콘솔에 다음과 같은 로그가 출력됩니다:');
      console.log('   📋 생성된 그룹 IDs (Solapi 콘솔에서 각각 확인 가능):');
      console.log('      1. G1234567890');
      console.log('      2. G1234567891');
      console.log('      ...');
      
      console.log('\n2. Solapi 콘솔 확인:');
      console.log('   - https://console.solapi.com/message-log 접속');
      console.log('   - 발송 날짜로 필터링');
      console.log('   - 각 그룹을 개별적으로 확인');
      
      console.log('\n3. 나머지 수신자 재발송 (필요시):');
      console.log('   - SMS 편집 페이지에서 미발송 수신자만 선별');
      console.log('   - 재발송 실행');
    } else {
      console.log('\n✅ 모든 수신자에게 발송이 완료되었습니다!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

checkSendingStatus();

