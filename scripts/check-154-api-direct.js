/**
 * 154번 메시지 이미지 조회 API 직접 호출 확인
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function check154APIDirect() {
  console.log('🔍 154번 메시지 이미지 조회 API 직접 호출 확인...\n');
  console.log('='.repeat(60));

  // 154번 폴더 조회
  const apiUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04%2F154&includeChildren=true&source=mms&channel=sms`;
  
  console.log('📤 API 요청 URL:');
  console.log(apiUrl);
  console.log('\n');

  try {
    const data = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON 파싱 오류: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('요청 타임아웃'));
      });
    });

    console.log(`📥 응답 상태: 200 OK\n`);
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    console.log('📈 요약:');
    console.log(`   count: ${data.count || 0}`);
    console.log(`   total: ${data.total || 0}`);
    console.log(`   images 배열 길이: ${data.images?.length || 0}`);
    console.log(`   pagination: ${JSON.stringify(data.pagination || {})}\n`);

    if (data.images && data.images.length > 0) {
      console.log('✅ 이미지 목록:');
      data.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
        if (img.isLinked) {
          console.log(`      🔗 링크된 이미지 (원본: ${img.originalFolder || '알 수 없음'})`);
        }
      });
    } else {
      console.log('⚠️ 이미지가 없습니다.\n');
      
      // 상위 폴더 조회
      console.log('📁 상위 폴더 조회 시도...\n');
      const parentUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04&includeChildren=true&source=mms&channel=sms`;
      
      try {
        const parentData = await new Promise((resolve, reject) => {
          const url = new URL(parentUrl);
          const client = url.protocol === 'https:' ? https : http;
          
          const req = client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON 파싱 오류: ${e.message}`));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              }
            });
          });
          
          req.on('error', reject);
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('요청 타임아웃'));
          });
        });
        console.log('📊 상위 폴더 응답:');
        console.log(`   count: ${parentData.count || 0}`);
        console.log(`   total: ${parentData.total || 0}`);
        console.log(`   images 배열 길이: ${parentData.images?.length || 0}\n`);
        
        if (parentData.images && parentData.images.length > 0) {
          console.log('✅ 상위 폴더 이미지 목록:');
          parentData.images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
            if (img.folder_path) {
              console.log(`      📁 폴더: ${img.folder_path}`);
            }
          });
        }
      } catch (parentError) {
        console.error('❌ 상위 폴더 조회 오류:', parentError.message);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
  }
}

check154APIDirect();


 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function check154APIDirect() {
  console.log('🔍 154번 메시지 이미지 조회 API 직접 호출 확인...\n');
  console.log('='.repeat(60));

  // 154번 폴더 조회
  const apiUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04%2F154&includeChildren=true&source=mms&channel=sms`;
  
  console.log('📤 API 요청 URL:');
  console.log(apiUrl);
  console.log('\n');

  try {
    const data = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON 파싱 오류: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('요청 타임아웃'));
      });
    });

    console.log(`📥 응답 상태: 200 OK\n`);
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    console.log('📈 요약:');
    console.log(`   count: ${data.count || 0}`);
    console.log(`   total: ${data.total || 0}`);
    console.log(`   images 배열 길이: ${data.images?.length || 0}`);
    console.log(`   pagination: ${JSON.stringify(data.pagination || {})}\n`);

    if (data.images && data.images.length > 0) {
      console.log('✅ 이미지 목록:');
      data.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
        if (img.isLinked) {
          console.log(`      🔗 링크된 이미지 (원본: ${img.originalFolder || '알 수 없음'})`);
        }
      });
    } else {
      console.log('⚠️ 이미지가 없습니다.\n');
      
      // 상위 폴더 조회
      console.log('📁 상위 폴더 조회 시도...\n');
      const parentUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04&includeChildren=true&source=mms&channel=sms`;
      
      try {
        const parentData = await new Promise((resolve, reject) => {
          const url = new URL(parentUrl);
          const client = url.protocol === 'https:' ? https : http;
          
          const req = client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON 파싱 오류: ${e.message}`));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              }
            });
          });
          
          req.on('error', reject);
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('요청 타임아웃'));
          });
        });
        console.log('📊 상위 폴더 응답:');
        console.log(`   count: ${parentData.count || 0}`);
        console.log(`   total: ${parentData.total || 0}`);
        console.log(`   images 배열 길이: ${parentData.images?.length || 0}\n`);
        
        if (parentData.images && parentData.images.length > 0) {
          console.log('✅ 상위 폴더 이미지 목록:');
          parentData.images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
            if (img.folder_path) {
              console.log(`      📁 폴더: ${img.folder_path}`);
            }
          });
        }
      } catch (parentError) {
        console.error('❌ 상위 폴더 조회 오류:', parentError.message);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
  }
}

check154APIDirect();


 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function check154APIDirect() {
  console.log('🔍 154번 메시지 이미지 조회 API 직접 호출 확인...\n');
  console.log('='.repeat(60));

  // 154번 폴더 조회
  const apiUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04%2F154&includeChildren=true&source=mms&channel=sms`;
  
  console.log('📤 API 요청 URL:');
  console.log(apiUrl);
  console.log('\n');

  try {
    const data = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON 파싱 오류: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('요청 타임아웃'));
      });
    });

    console.log(`📥 응답 상태: 200 OK\n`);
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    console.log('📈 요약:');
    console.log(`   count: ${data.count || 0}`);
    console.log(`   total: ${data.total || 0}`);
    console.log(`   images 배열 길이: ${data.images?.length || 0}`);
    console.log(`   pagination: ${JSON.stringify(data.pagination || {})}\n`);

    if (data.images && data.images.length > 0) {
      console.log('✅ 이미지 목록:');
      data.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
        if (img.isLinked) {
          console.log(`      🔗 링크된 이미지 (원본: ${img.originalFolder || '알 수 없음'})`);
        }
      });
    } else {
      console.log('⚠️ 이미지가 없습니다.\n');
      
      // 상위 폴더 조회
      console.log('📁 상위 폴더 조회 시도...\n');
      const parentUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04&includeChildren=true&source=mms&channel=sms`;
      
      try {
        const parentData = await new Promise((resolve, reject) => {
          const url = new URL(parentUrl);
          const client = url.protocol === 'https:' ? https : http;
          
          const req = client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON 파싱 오류: ${e.message}`));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              }
            });
          });
          
          req.on('error', reject);
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('요청 타임아웃'));
          });
        });
        console.log('📊 상위 폴더 응답:');
        console.log(`   count: ${parentData.count || 0}`);
        console.log(`   total: ${parentData.total || 0}`);
        console.log(`   images 배열 길이: ${parentData.images?.length || 0}\n`);
        
        if (parentData.images && parentData.images.length > 0) {
          console.log('✅ 상위 폴더 이미지 목록:');
          parentData.images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
            if (img.folder_path) {
              console.log(`      📁 폴더: ${img.folder_path}`);
            }
          });
        }
      } catch (parentError) {
        console.error('❌ 상위 폴더 조회 오류:', parentError.message);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
  }
}

check154APIDirect();


 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function check154APIDirect() {
  console.log('🔍 154번 메시지 이미지 조회 API 직접 호출 확인...\n');
  console.log('='.repeat(60));

  // 154번 폴더 조회
  const apiUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04%2F154&includeChildren=true&source=mms&channel=sms`;
  
  console.log('📤 API 요청 URL:');
  console.log(apiUrl);
  console.log('\n');

  try {
    const data = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON 파싱 오류: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('요청 타임아웃'));
      });
    });

    console.log(`📥 응답 상태: 200 OK\n`);
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    console.log('📈 요약:');
    console.log(`   count: ${data.count || 0}`);
    console.log(`   total: ${data.total || 0}`);
    console.log(`   images 배열 길이: ${data.images?.length || 0}`);
    console.log(`   pagination: ${JSON.stringify(data.pagination || {})}\n`);

    if (data.images && data.images.length > 0) {
      console.log('✅ 이미지 목록:');
      data.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
        if (img.isLinked) {
          console.log(`      🔗 링크된 이미지 (원본: ${img.originalFolder || '알 수 없음'})`);
        }
      });
    } else {
      console.log('⚠️ 이미지가 없습니다.\n');
      
      // 상위 폴더 조회
      console.log('📁 상위 폴더 조회 시도...\n');
      const parentUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04&includeChildren=true&source=mms&channel=sms`;
      
      try {
        const parentData = await new Promise((resolve, reject) => {
          const url = new URL(parentUrl);
          const client = url.protocol === 'https:' ? https : http;
          
          const req = client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON 파싱 오류: ${e.message}`));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              }
            });
          });
          
          req.on('error', reject);
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('요청 타임아웃'));
          });
        });
        console.log('📊 상위 폴더 응답:');
        console.log(`   count: ${parentData.count || 0}`);
        console.log(`   total: ${parentData.total || 0}`);
        console.log(`   images 배열 길이: ${parentData.images?.length || 0}\n`);
        
        if (parentData.images && parentData.images.length > 0) {
          console.log('✅ 상위 폴더 이미지 목록:');
          parentData.images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
            if (img.folder_path) {
              console.log(`      📁 폴더: ${img.folder_path}`);
            }
          });
        }
      } catch (parentError) {
        console.error('❌ 상위 폴더 조회 오류:', parentError.message);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
  }
}

check154APIDirect();


 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function check154APIDirect() {
  console.log('🔍 154번 메시지 이미지 조회 API 직접 호출 확인...\n');
  console.log('='.repeat(60));

  // 154번 폴더 조회
  const apiUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04%2F154&includeChildren=true&source=mms&channel=sms`;
  
  console.log('📤 API 요청 URL:');
  console.log(apiUrl);
  console.log('\n');

  try {
    const data = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`JSON 파싱 오류: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('요청 타임아웃'));
      });
    });

    console.log(`📥 응답 상태: 200 OK\n`);
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    console.log('📈 요약:');
    console.log(`   count: ${data.count || 0}`);
    console.log(`   total: ${data.total || 0}`);
    console.log(`   images 배열 길이: ${data.images?.length || 0}`);
    console.log(`   pagination: ${JSON.stringify(data.pagination || {})}\n`);

    if (data.images && data.images.length > 0) {
      console.log('✅ 이미지 목록:');
      data.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
        if (img.isLinked) {
          console.log(`      🔗 링크된 이미지 (원본: ${img.originalFolder || '알 수 없음'})`);
        }
      });
    } else {
      console.log('⚠️ 이미지가 없습니다.\n');
      
      // 상위 폴더 조회
      console.log('📁 상위 폴더 조회 시도...\n');
      const parentUrl = `${BASE_URL}/api/admin/all-images?limit=24&offset=0&prefix=originals%2Fmms%2F2025-12-04&includeChildren=true&source=mms&channel=sms`;
      
      try {
        const parentData = await new Promise((resolve, reject) => {
          const url = new URL(parentUrl);
          const client = url.protocol === 'https:' ? https : http;
          
          const req = client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON 파싱 오류: ${e.message}`));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              }
            });
          });
          
          req.on('error', reject);
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('요청 타임아웃'));
          });
        });
        console.log('📊 상위 폴더 응답:');
        console.log(`   count: ${parentData.count || 0}`);
        console.log(`   total: ${parentData.total || 0}`);
        console.log(`   images 배열 길이: ${parentData.images?.length || 0}\n`);
        
        if (parentData.images && parentData.images.length > 0) {
          console.log('✅ 상위 폴더 이미지 목록:');
          parentData.images.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.name || img.url || '이름 없음'}`);
            if (img.folder_path) {
              console.log(`      📁 폴더: ${img.folder_path}`);
            }
          });
        }
      } catch (parentError) {
        console.error('❌ 상위 폴더 조회 오류:', parentError.message);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
  }
}

check154APIDirect();

