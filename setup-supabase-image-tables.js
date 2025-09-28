const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupSupabaseImageTables() {
  console.log('🚀 Supabase 이미지 관리 테이블 생성 시작');
  console.log('==========================================');
  
  // Supabase 클라이언트 초기화
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.log('필요한 환경 변수:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. 이미지 자산 테이블 생성
    console.log('📝 1단계: image_assets 테이블 생성 중...');
    
    const { data: table1, error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS image_assets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          width INTEGER,
          height INTEGER,
          format VARCHAR(10) NOT NULL,
          
          -- SEO 최적화 필드
          alt_text TEXT,
          title TEXT,
          caption TEXT,
          description TEXT,
          
          -- AI 인식 결과
          ai_tags JSONB DEFAULT '[]',
          ai_objects JSONB DEFAULT '[]',
          ai_colors JSONB DEFAULT '[]',
          ai_text_extracted TEXT,
          ai_confidence_score DECIMAL(3,2),
          
          -- 중복 관리
          hash_md5 VARCHAR(32) UNIQUE,
          hash_sha256 VARCHAR(64) UNIQUE,
          is_duplicate BOOLEAN DEFAULT FALSE,
          original_image_id UUID REFERENCES image_assets(id),
          
          -- 성능 최적화
          optimized_versions JSONB DEFAULT '{}',
          cdn_url TEXT,
          
          -- 사용 통계
          usage_count INTEGER DEFAULT 0,
          last_used_at TIMESTAMP WITH TIME ZONE,
          
          -- 관리 정보
          uploaded_by VARCHAR(100),
          upload_source VARCHAR(50) DEFAULT 'manual',
          status VARCHAR(20) DEFAULT 'active',
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error1) {
      console.log('⚠️ image_assets 테이블 생성 중 오류:', error1.message);
    } else {
      console.log('✅ image_assets 테이블 생성 완료');
    }
    
    // 2. 이미지 태그 테이블 생성
    console.log('📝 2단계: image_tags 테이블 생성 중...');
    
    const { data: table2, error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS image_tags (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
          tag_name VARCHAR(100) NOT NULL,
          tag_type VARCHAR(20) NOT NULL,
          confidence_score DECIMAL(3,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error2) {
      console.log('⚠️ image_tags 테이블 생성 중 오류:', error2.message);
    } else {
      console.log('✅ image_tags 테이블 생성 완료');
    }
    
    // 3. 이미지 사용 기록 테이블 생성
    console.log('📝 3단계: image_usage_logs 테이블 생성 중...');
    
    const { data: table3, error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS image_usage_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
          blog_post_id UUID,
          usage_type VARCHAR(20) NOT NULL,
          usage_position INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error3) {
      console.log('⚠️ image_usage_logs 테이블 생성 중 오류:', error3.message);
    } else {
      console.log('✅ image_usage_logs 테이블 생성 완료');
    }
    
    // 4. 이미지 검색 인덱스 테이블 생성
    console.log('📝 4단계: image_search_index 테이블 생성 중...');
    
    const { data: table4, error: error4 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS image_search_index (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
          search_vector TSVECTOR,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error4) {
      console.log('⚠️ image_search_index 테이블 생성 중 오류:', error4.message);
    } else {
      console.log('✅ image_search_index 테이블 생성 완료');
    }
    
    // 5. 이미지 최적화 설정 테이블 생성
    console.log('📝 5단계: image_optimization_settings 테이블 생성 중...');
    
    const { data: table5, error: error5 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS image_optimization_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          width INTEGER,
          height INTEGER,
          quality INTEGER DEFAULT 85,
          format VARCHAR(10) DEFAULT 'webp',
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error5) {
      console.log('⚠️ image_optimization_settings 테이블 생성 중 오류:', error5.message);
    } else {
      console.log('✅ image_optimization_settings 테이블 생성 완료');
    }
    
    // 6. 인덱스 생성
    console.log('📝 6단계: 인덱스 생성 중...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_image_assets_hash_md5 ON image_assets(hash_md5);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_hash_sha256 ON image_assets(hash_sha256);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_upload_source ON image_assets(upload_source);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_status ON image_assets(status);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_usage_count ON image_assets(usage_count DESC);',
      'CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);',
      'CREATE INDEX IF NOT EXISTS idx_image_tags_tag_name ON image_tags(tag_name);',
      'CREATE INDEX IF NOT EXISTS idx_image_usage_logs_image_id ON image_usage_logs(image_id);',
      'CREATE INDEX IF NOT EXISTS idx_image_search_index_vector ON image_search_index USING GIN(search_vector);'
    ];
    
    for (const indexSql of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (error) {
        console.log('⚠️ 인덱스 생성 중 오류:', error.message);
      }
    }
    
    console.log('✅ 인덱스 생성 완료');
    
    // 7. 기본 최적화 설정 데이터 삽입
    console.log('📝 7단계: 기본 최적화 설정 데이터 삽입 중...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('image_optimization_settings')
      .select('*');
    
    if (settings && settings.length === 0) {
      const defaultSettings = [
        { name: 'thumbnail', width: 150, height: 150, quality: 80, format: 'webp', is_default: false },
        { name: 'small', width: 300, height: 300, quality: 85, format: 'webp', is_default: false },
        { name: 'medium', width: 600, height: 600, quality: 90, format: 'webp', is_default: true },
        { name: 'large', width: 1200, height: 1200, quality: 95, format: 'webp', is_default: false },
        { name: 'original', width: null, height: null, quality: 100, format: 'original', is_default: false }
      ];
      
      const { error: insertError } = await supabase
        .from('image_optimization_settings')
        .insert(defaultSettings);
      
      if (insertError) {
        console.log('⚠️ 기본 설정 데이터 삽입 중 오류:', insertError.message);
      } else {
        console.log('✅ 기본 최적화 설정 데이터 삽입 완료');
      }
    } else {
      console.log('✅ 기본 최적화 설정 데이터가 이미 존재합니다');
    }
    
    // 8. 테이블 생성 확인
    console.log('📝 8단계: 테이블 생성 확인 중...');
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'image_%'
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.log('⚠️ 테이블 확인 중 오류:', tablesError.message);
    } else {
      console.log('✅ 생성된 테이블 목록:');
      console.log(tables);
    }
    
    console.log('\n🎉 Supabase 이미지 관리 테이블 생성 완료!');
    console.log('==========================================');
    console.log('📋 생성된 테이블:');
    console.log('  - image_assets: 이미지 메타데이터');
    console.log('  - image_tags: 이미지 태그');
    console.log('  - image_usage_logs: 이미지 사용 기록');
    console.log('  - image_search_index: 이미지 검색 인덱스');
    console.log('  - image_optimization_settings: 최적화 설정');
    console.log('\n📋 다음 단계:');
    console.log('1. 이미지 AI 분석 API 테스트');
    console.log('2. 이미지 업로드 및 분석 테스트');
    console.log('3. 블로그 관리 페이지에서 이미지 관리 기능 테스트');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n🔧 수동 설정 방법:');
    console.log('1. Supabase Dashboard 접속');
    console.log('2. SQL Editor에서 database/image_management_schema.sql 실행');
    console.log('3. 테이블 생성 확인');
  }
}

// 실행
if (require.main === module) {
  setupSupabaseImageTables();
}

module.exports = { setupSupabaseImageTables };
