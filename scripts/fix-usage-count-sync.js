/**
 * 기존 잘못된 usage_count를 정리하는 스크립트
 * 모든 image_metadata의 usage_count를 used_in 배열 길이로 동기화
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

async function fixUsageCount() {
  console.log('🔄 usage_count 동기화 시작...');
  
  try {
    // 먼저 used_in 컬럼 존재 여부 확인
    const { data: testData, error: testError } = await supabase
      .from('image_metadata')
      .select('id, usage_count, used_in, image_url')
      .limit(1);
    
    if (testError && testError.code === '42703') {
      console.log('⚠️ used_in 컬럼이 존재하지 않습니다. 컬럼을 추가합니다...');
      
      // used_in 컬럼 추가
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE image_metadata ADD COLUMN IF NOT EXISTS used_in JSONB DEFAULT '[]';`
      });
      
      if (alterError) {
        // RPC가 없으면 직접 SQL 실행 시도
        console.log('⚠️ RPC를 통한 컬럼 추가 실패. Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.log('   ALTER TABLE image_metadata ADD COLUMN IF NOT EXISTS used_in JSONB DEFAULT \'[]\';');
        console.log('   CREATE INDEX IF NOT EXISTS idx_image_metadata_used_in ON image_metadata USING GIN(used_in);');
        console.log('\n💡 컬럼 추가 후 스크립트를 다시 실행하세요.');
        return;
      }
      
      console.log('✅ used_in 컬럼 추가 완료!');
    }
    
    // 모든 image_metadata 조회 (페이지네이션)
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    const allMetadata = [];
    
    console.log('📥 이미지 메타데이터 로드 중...');
    while (hasMore) {
      const { data, error: fetchError } = await supabase
        .from('image_metadata')
        .select('id, usage_count, used_in, image_url')
        .range(from, from + pageSize - 1);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data && data.length > 0) {
        allMetadata.push(...data);
        from += pageSize;
        hasMore = data.length === pageSize;
        console.log(`📥 ${allMetadata.length}개 로드 중...`);
      } else {
        hasMore = false;
      }
    }
    
    if (allMetadata.length === 0) {
      console.log('✅ 동기화할 데이터가 없습니다.');
      return;
    }
    
    console.log(`📊 총 ${allMetadata.length}개 이미지 메타데이터 확인 중...`);
    
    let fixedCount = 0;
    let correctCount = 0;
    let filledCount = 0; // used_in 배열을 채운 경우
    let errors = [];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    for (const metadata of allMetadata) {
      try {
        // used_in 배열 파싱
        let usedIn = [];
        if (metadata.used_in) {
          try {
            usedIn = Array.isArray(metadata.used_in) ? metadata.used_in : JSON.parse(metadata.used_in);
          } catch (e) {
            usedIn = [];
          }
        }
        
        const currentCount = metadata.usage_count || 0;
        
        // used_in 배열이 비어있지만 usage_count > 0인 경우, 실제 사용 위치 확인
        if (usedIn.length === 0 && currentCount > 0) {
          try {
            console.log(`🔍 사용 위치 확인 중: ${metadata.image_url.substring(0, 50)}...`);
            const usageResponse = await fetch(
              `${siteUrl}/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(metadata.image_url)}`
            );
            
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              // API 응답 구조 확인: usage.used_in 또는 직접 used_in 배열
              if (usageData.usage) {
                // used_in 배열 구성 (API에서 제공하는 모든 사용 위치 수집)
                const foundUsedIn = [];
                
                if (usageData.usage.blogPosts && usageData.usage.blogPosts.length > 0) {
                  foundUsedIn.push(...usageData.usage.blogPosts.map(post => ({
                    type: 'blog',
                    title: post.title,
                    url: post.url,
                    id: post.id,
                    slug: post.slug,
                    isFeatured: post.isFeatured,
                    isInContent: post.isInContent,
                    status: post.status,
                    isPublished: post.isPublished,
                    created_at: post.created_at
                  })));
                }
                
                if (usageData.usage.funnelPages && usageData.usage.funnelPages.length > 0) {
                  foundUsedIn.push(...usageData.usage.funnelPages.map(page => ({
                    type: 'funnel',
                    title: page.title,
                    url: page.url,
                    id: page.id,
                    slug: page.slug,
                    isFeatured: page.isFeatured,
                    isInContent: page.isInContent,
                    created_at: page.created_at
                  })));
                }
                
                if (usageData.usage.homepage && usageData.usage.homepage.length > 0) {
                  foundUsedIn.push(...usageData.usage.homepage.map(item => ({
                    type: 'homepage',
                    title: item.title,
                    url: item.url,
                    isFeatured: item.isFeatured,
                    isInContent: item.isInContent
                  })));
                }
                
                if (usageData.usage.muziik && usageData.usage.muziik.length > 0) {
                  foundUsedIn.push(...usageData.usage.muziik.map(item => ({
                    type: 'muziik',
                    title: item.title,
                    url: item.url,
                    isFeatured: item.isFeatured,
                    isInContent: item.isInContent
                  })));
                }
                
                if (usageData.usage.survey && usageData.usage.survey.length > 0) {
                  foundUsedIn.push(...usageData.usage.survey.map(item => ({
                    type: 'survey',
                    title: item.title,
                    url: item.url,
                    isFeatured: item.isFeatured,
                    isInContent: item.isInContent
                  })));
                }
                
                if (usageData.usage.kakaoProfile && usageData.usage.kakaoProfile.length > 0) {
                  foundUsedIn.push(...usageData.usage.kakaoProfile.map(item => ({
                    type: 'kakao_profile',
                    title: item.title,
                    url: item.url,
                    date: item.date,
                    account: item.account,
                    isBackground: item.isBackground,
                    isProfile: item.isProfile,
                    created_at: item.created_at
                  })));
                }
                
                if (usageData.usage.kakaoFeed && usageData.usage.kakaoFeed.length > 0) {
                  foundUsedIn.push(...usageData.usage.kakaoFeed.map(item => ({
                    type: 'kakao_feed',
                    title: item.title,
                    url: item.url,
                    date: item.date,
                    account: item.account,
                    created_at: item.created_at
                  })));
                }
                
                if (foundUsedIn.length > 0) {
                  usedIn = foundUsedIn;
                  filledCount++;
                  console.log(`✅ 사용 위치 발견: ${metadata.id} - ${usedIn.length}개 위치`);
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ 사용 위치 확인 실패 (${metadata.id}):`, error.message);
          }
        }
        
        // 올바른 사용 횟수 계산
        const correctUsageCount = usedIn.length;
        
        // usage_count가 다르거나 used_in 배열이 업데이트된 경우 수정
        if (currentCount !== correctUsageCount || (usedIn.length > 0 && metadata.used_in === null)) {
          const updateData = {
            usage_count: correctUsageCount,
            last_used_at: new Date().toISOString()
          };
          
          // used_in 배열이 채워진 경우 업데이트
          if (usedIn.length > 0) {
            updateData.used_in = usedIn;
          }
          
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update(updateData)
            .eq('id', metadata.id);
          
          if (updateError) {
            errors.push({
              id: metadata.id,
              image_url: metadata.image_url,
              error: updateError.message
            });
            console.error(`❌ 업데이트 실패 (${metadata.id}):`, updateError.message);
          } else {
            fixedCount++;
            if (usedIn.length > 0 && metadata.used_in === null) {
              console.log(`✅ 수정 및 채움: ${metadata.id} - ${currentCount} → ${correctUsageCount}회 (${usedIn.length}개 위치)`);
            } else {
              console.log(`✅ 수정: ${metadata.id} - ${currentCount} → ${correctUsageCount}회`);
            }
          }
        } else {
          correctCount++;
        }
      } catch (error) {
        errors.push({
          id: metadata.id,
          image_url: metadata.image_url,
          error: error.message
        });
        console.error(`❌ 처리 실패 (${metadata.id}):`, error.message);
      }
    }
    
    console.log('\n📊 동기화 결과:');
    console.log(`  ✅ 수정됨: ${fixedCount}개`);
    console.log(`  📝 used_in 배열 채움: ${filledCount}개`);
    console.log(`  ✓ 이미 정확함: ${correctCount}개`);
    console.log(`  ❌ 오류: ${errors.length}개`);
    
    if (errors.length > 0) {
      console.log('\n❌ 오류 상세:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ID: ${err.id}, URL: ${err.image_url}`);
        console.log(`     오류: ${err.error}`);
      });
    }
    
    console.log('\n✅ usage_count 동기화 완료!');
    
  } catch (error) {
    console.error('❌ 동기화 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
fixUsageCount()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
