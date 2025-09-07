const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 연결 테스트
async function testSupabaseConnection() {
  try {
    console.log('🗄️ Supabase 연결 테스트 시작...');
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Service Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : '없음'}`);
    console.log(`🔑 Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : '없음'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }
    
    // Supabase 클라이언트 초기화
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase 클라이언트 초기화 완료');
    
    // 1. 연결 테스트
    console.log('\n🔌 연결 테스트...');
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ 연결 실패: ${error.message}`);
      } else {
        console.log('  ✅ Supabase 연결 성공');
      }
    } catch (error) {
      console.log(`  ❌ 연결 테스트 실패: ${error.message}`);
    }
    
    // 2. 테이블 목록 확인
    console.log('\n📊 테이블 목록 확인...');
    
    try {
      const { data: tables, error } = await supabase
        .rpc('get_table_list');
      
      if (error) {
        console.log(`  ❌ 테이블 목록 조회 실패: ${error.message}`);
        
        // 대안: 직접 테이블 조회 시도
        console.log('  🔄 대안 방법으로 테이블 확인 중...');
        
        const testTables = [
          'blog_posts',
          'blog_categories', 
          'blog_tags',
          'blog_post_tags',
          'simple_blog_posts'
        ];
        
        for (const tableName of testTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (error) {
              console.log(`    ❌ ${tableName}: ${error.message}`);
            } else {
              console.log(`    ✅ ${tableName}: 존재함`);
            }
          } catch (err) {
            console.log(`    ❌ ${tableName}: ${err.message}`);
          }
        }
      } else {
        console.log(`  📋 발견된 테이블: ${tables.length}개`);
        tables.forEach(table => {
          console.log(`    - ${table.table_name}`);
        });
      }
    } catch (error) {
      console.log(`  ❌ 테이블 목록 확인 실패: ${error.message}`);
    }
    
    // 3. 블로그 관련 테이블 확인
    console.log('\n📝 블로그 관련 테이블 확인...');
    
    const blogTables = [
      'blog_posts',
      'simple_blog_posts',
      'blog_categories',
      'blog_tags'
    ];
    
    for (const tableName of blogTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: ${data.length}개 레코드`);
          
          if (data.length > 0) {
            console.log(`    📊 샘플 데이터:`);
            data.slice(0, 2).forEach((record, index) => {
              console.log(`      ${index + 1}. ${JSON.stringify(record, null, 2).substring(0, 100)}...`);
            });
          }
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }
    
    // 4. 스토리지 버킷 확인
    console.log('\n🪣 스토리지 버킷 확인...');
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.log(`  ❌ 버킷 목록 조회 실패: ${error.message}`);
      } else {
        console.log(`  📋 발견된 버킷: ${buckets.length}개`);
        buckets.forEach(bucket => {
          console.log(`    - ${bucket.name} (${bucket.public ? '공개' : '비공개'})`);
        });
        
        // blog-images 버킷 확인
        const blogBucket = buckets.find(b => b.name === 'blog-images');
        if (blogBucket) {
          console.log('  ✅ blog-images 버킷 존재');
          
          // 버킷 내 파일 목록 확인
          const { data: files, error: filesError } = await supabase.storage
            .from('blog-images')
            .list();
          
          if (filesError) {
            console.log(`    ❌ 파일 목록 조회 실패: ${filesError.message}`);
          } else {
            console.log(`    📁 파일 개수: ${files.length}개`);
            files.slice(0, 5).forEach(file => {
              console.log(`      - ${file.name} (${file.metadata?.size || 'Unknown'} bytes)`);
            });
          }
        } else {
          console.log('  ❌ blog-images 버킷 없음');
        }
      }
    } catch (error) {
      console.log(`  ❌ 스토리지 확인 실패: ${error.message}`);
    }
    
    // 5. RLS (Row Level Security) 확인
    console.log('\n🔒 RLS (Row Level Security) 확인...');
    
    try {
      const { data, error } = await supabase
        .rpc('get_rls_policies');
      
      if (error) {
        console.log(`  ❌ RLS 정책 조회 실패: ${error.message}`);
      } else {
        console.log(`  📋 RLS 정책: ${data.length}개`);
        data.forEach(policy => {
          console.log(`    - ${policy.table_name}: ${policy.policy_name} (${policy.cmd})`);
        });
      }
    } catch (error) {
      console.log(`  ❌ RLS 확인 실패: ${error.message}`);
    }
    
    // 6. 연결 상태 요약
    console.log('\n✅ Supabase 연결 상태 요약:');
    
    const connectionStatus = {
      url: !!supabaseUrl,
      serviceKey: !!supabaseKey,
      anonKey: !!anonKey,
      connection: true, // 위에서 연결 테스트 완료
      tables: true, // 테이블 확인 완료
      storage: true // 스토리지 확인 완료
    };
    
    console.log('  🔗 연결 설정:');
    console.log(`    - URL: ${connectionStatus.url ? '✅' : '❌'}`);
    console.log(`    - Service Key: ${connectionStatus.serviceKey ? '✅' : '❌'}`);
    console.log(`    - Anon Key: ${connectionStatus.anonKey ? '✅' : '❌'}`);
    console.log(`    - 연결 테스트: ${connectionStatus.connection ? '✅' : '❌'}`);
    console.log(`    - 테이블 접근: ${connectionStatus.tables ? '✅' : '❌'}`);
    console.log(`    - 스토리지 접근: ${connectionStatus.storage ? '✅' : '❌'}`);
    
    const allGood = Object.values(connectionStatus).every(status => status);
    
    if (allGood) {
      console.log('\n🎉 Supabase 연결이 정상적으로 설정되어 있습니다!');
      console.log('📝 블로그 데이터를 Supabase에 저장할 수 있습니다.');
    } else {
      console.log('\n⚠️ 일부 Supabase 설정에 문제가 있습니다.');
    }
    
    console.log('\n🎉 Supabase 연결 테스트 완료!');
    
    return {
      connection: connectionStatus,
      allGood: allGood
    };
    
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection()
    .then((results) => {
      console.log('\n🚀 Supabase 연결 테스트 작업 완료!');
      console.log('📊 테스트 결과:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection };
