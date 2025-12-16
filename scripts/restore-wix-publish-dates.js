/**
 * Wix 마이그레이션된 블로그 게시물의 원본 발행일 복구 스크립트
 * 
 * 마이그레이션된 JSON 파일에서 원본 published_at을 읽어서
 * 현재 Supabase blog_posts 테이블과 매칭하여 복구합니다.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 마이그레이션된 JSON 파일 경로들
const migrationPaths = [
  path.join(__dirname, '../mas9golf/migrated-posts'),
  path.join(__dirname, '../mas9golf/backup-20250907/migrated-posts')
];

/**
 * 마이그레이션된 JSON 파일들 읽기
 */
async function loadMigrationFiles() {
  const migrationData = [];
  
  for (const migrationPath of migrationPaths) {
    try {
      const files = await fs.readdir(migrationPath);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('summary') && !f.includes('migration'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(migrationPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          // published_at 또는 publishedAt 필드에서 날짜 추출
          const publishedAt = data.published_at || data.publishedAt;
          
          if (publishedAt) {
            // 마이그레이션 날짜(2025-09-07)가 아닌 원본 날짜만 사용
            const date = new Date(publishedAt);
            const migrationDate = new Date('2025-09-07');
            
            // 2025-09-07 이후 날짜는 마이그레이션 날짜로 간주하고 제외
            if (date < migrationDate) {
              migrationData.push({
                title: data.title,
                slug: data.slug,
                original_url: data.original_url,
                published_at: publishedAt,
                source_file: file
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ 파일 읽기 실패: ${file}`, error.message);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 디렉토리 읽기 실패: ${migrationPath}`, error.message);
    }
  }
  
  return migrationData;
}

/**
 * 제목 정규화 (매칭을 위해)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * 게시물 매칭 (제목, slug, original_url 기준)
 */
function matchPost(migrationPost, dbPost) {
  // 1. slug로 매칭 (가장 정확)
  if (migrationPost.slug && dbPost.slug) {
    if (migrationPost.slug === dbPost.slug) {
      return { matched: true, method: 'slug', confidence: 'high', score: 100 };
    }
  }
  
  // 2. original_url로 매칭
  if (migrationPost.original_url && dbPost.slug) {
    const urlSlug = migrationPost.original_url.split('/post/')[1];
    if (urlSlug) {
      // URL slug와 DB slug 비교
      if (urlSlug === dbPost.slug || urlSlug.replace(/-/g, '') === dbPost.slug.replace(/-/g, '')) {
        return { matched: true, method: 'original_url', confidence: 'high', score: 95 };
      }
    }
  }
  
  // 3. 제목으로 매칭 (유사도 체크)
  if (migrationPost.title && dbPost.title) {
    const normalizedMigration = normalizeTitle(migrationPost.title);
    const normalizedDb = normalizeTitle(dbPost.title);
    
    // 완전 일치
    if (normalizedMigration === normalizedDb) {
      return { matched: true, method: 'title', confidence: 'high', score: 90 };
    }
    
    // 부분 일치 (60% 이상으로 낮춤 - 더 많은 매칭 시도)
    const similarity = calculateSimilarity(normalizedMigration, normalizedDb);
    if (similarity >= 0.6) {
      return { matched: true, method: 'title', confidence: similarity >= 0.8 ? 'medium' : 'low', similarity, score: similarity * 100 };
    }
    
    // 핵심 키워드 매칭 (제목에 공통 키워드가 3개 이상)
    const migrationWords = new Set(normalizedMigration.split(' ').filter(w => w.length > 2));
    const dbWords = new Set(normalizedDb.split(' ').filter(w => w.length > 2));
    const commonWords = [...migrationWords].filter(w => dbWords.has(w));
    if (commonWords.length >= 3) {
      return { matched: true, method: 'title_keywords', confidence: 'low', commonWords: commonWords.length, score: commonWords.length * 20 };
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * 문자열 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 원본 발행일 복구
 */
async function restorePublishDates() {
  try {
    console.log('🔍 Wix 마이그레이션 파일에서 원본 발행일 로드 중...');
    const migrationData = await loadMigrationFiles();
    console.log(`✅ ${migrationData.length}개의 마이그레이션 데이터 로드 완료\n`);
    
    if (migrationData.length === 0) {
      console.log('⚠️ 복구할 마이그레이션 데이터가 없습니다.');
      return;
    }
    
    // 마이그레이션 데이터 출력
    console.log('📋 마이그레이션 데이터 목록:');
    migrationData.forEach((data, index) => {
      console.log(`  ${index + 1}. ${data.title.substring(0, 50)}...`);
      console.log(`     slug: ${data.slug}`);
      console.log(`     published_at: ${data.published_at}`);
      console.log(`     source: ${data.source_file}\n`);
    });
    
    console.log('🔍 Supabase에서 published_at이 null인 게시물 조회 중...');
    const { data: postsWithoutDate, error: fetchError1 } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, created_at, updated_at')
      .eq('status', 'published')
      .is('published_at', null);
    
    if (fetchError1) {
      throw new Error(`게시물 조회 실패: ${fetchError1.message}`);
    }
    
    console.log(`✅ ${postsWithoutDate.length}개의 발행일 없는 게시물 발견\n`);
    
    // 모든 published 게시물도 조회 (매칭 범위 확대)
    console.log('🔍 모든 published 게시물 조회 중 (매칭 범위 확대)...');
    const { data: allPublishedPosts, error: fetchError2 } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published_at, created_at')
      .eq('status', 'published')
      .limit(500);
    
    if (fetchError2) {
      throw new Error(`전체 게시물 조회 실패: ${fetchError2.message}`);
    }
    
    console.log(`✅ 총 ${allPublishedPosts.length}개의 published 게시물 발견\n`);
    
    // 발행일이 없는 게시물 목록 출력 (디버깅용)
    if (postsWithoutDate.length > 0) {
      console.log('📋 발행일이 없는 게시물 목록:');
      postsWithoutDate.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title.substring(0, 50)}...`);
        console.log(`     ID: ${post.id}`);
        console.log(`     Slug: ${post.slug}`);
        console.log(`     Created: ${post.created_at}\n`);
      });
    }
    
    // 매칭 대상: 발행일이 없는 게시물 + 모든 published 게시물 (중복 제거)
    const postsToMatch = [...new Map([
      ...postsWithoutDate.map(p => [p.id, p]),
      ...allPublishedPosts.map(p => [p.id, p])
    ]).values()];
    
    console.log(`📊 매칭 대상 게시물: ${postsToMatch.length}개 (발행일 없음: ${postsWithoutDate.length}개 + 전체: ${allPublishedPosts.length}개)\n`);
    
    // 매칭 및 복구
    const matches = [];
    const unmatched = [];
    const usedDbPostIds = new Set(); // 중복 매칭 방지
    
    for (const migrationPost of migrationData) {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const dbPost of postsToMatch) {
        // 이미 매칭된 게시물은 제외
        if (usedDbPostIds.has(dbPost.id)) continue;
        
        const match = matchPost(migrationPost, dbPost);
        if (match.matched && match.score > bestScore) {
          bestScore = match.score;
          bestMatch = { ...dbPost, match, migrationPost };
        }
      }
      
      if (bestMatch && bestScore >= 40) { // 최소 40점 이상만 매칭 (더 관대하게)
        matches.push(bestMatch);
        usedDbPostIds.add(bestMatch.id);
        console.log(`  ✅ 매칭 발견: "${migrationPost.title.substring(0, 40)}..." → "${bestMatch.title.substring(0, 40)}..." (점수: ${bestScore.toFixed(1)}, 방법: ${bestMatch.match.method})`);
      } else {
        unmatched.push(migrationPost);
        console.log(`  ❌ 매칭 실패: "${migrationPost.title.substring(0, 40)}..." (최고 점수: ${bestScore.toFixed(1)})`);
      }
    }
    
    console.log(`\n📊 매칭 결과:`);
    console.log(`  ✅ 매칭 성공: ${matches.length}개`);
    console.log(`  ❌ 매칭 실패: ${unmatched.length}개\n`);
    
    if (matches.length === 0) {
      console.log('⚠️ 매칭된 게시물이 없습니다.');
      if (unmatched.length > 0) {
        console.log('\n매칭 실패한 마이그레이션 데이터:');
        unmatched.forEach((data, index) => {
          console.log(`  ${index + 1}. ${data.title.substring(0, 50)}... (${data.slug})`);
        });
      }
      return;
    }
    
    // published_at이 null인 게시물만 필터링
    const matchesToRestore = matches.filter(match => !match.published_at);
    const matchesWithDate = matches.filter(match => match.published_at);
    
    // 매칭된 게시물 상세 정보 출력
    console.log('📋 매칭된 게시물 목록:');
    matches.forEach((match, index) => {
      console.log(`\n  ${index + 1}. ${match.title.substring(0, 50)}...`);
      console.log(`     DB ID: ${match.id}`);
      console.log(`     Slug: ${match.slug}`);
      console.log(`     매칭 방법: ${match.match.method} (${match.match.confidence})`);
      console.log(`     원본 발행일: ${match.migrationPost.published_at}`);
      console.log(`     현재 발행일: ${match.published_at || 'null'}`);
      if (match.published_at) {
        console.log(`     ⚠️ 이미 발행일이 있음 - 복구 대상 아님`);
      }
    });
    
    console.log(`\n📊 복구 대상 요약:`);
    console.log(`  ✅ 복구 필요: ${matchesToRestore.length}개 (published_at이 null)`);
    console.log(`  ℹ️ 이미 발행일 있음: ${matchesWithDate.length}개 (복구 불필요)`);
    
    // 사용자 확인 (실제 업데이트 전)
    if (matchesToRestore.length > 0) {
      console.log(`\n⚠️ 위 ${matchesToRestore.length}개 게시물의 발행일을 복구하시겠습니까?`);
      console.log('   (실제 업데이트는 주석을 해제하고 실행하세요)\n');
    } else {
      console.log(`\n✅ 마이그레이션 데이터로 복구할 게시물이 없습니다. (모든 매칭된 게시물에 이미 발행일이 있음)\n`);
    }
    
    // 발행일이 없는 게시물들에 대해 created_at을 published_at으로 설정하는 옵션
    if (postsWithoutDate.length > 0 && matchesToRestore.length === 0) {
      console.log(`\n💡 추가 옵션: 발행일이 없는 ${postsWithoutDate.length}개 게시물에 대해`);
      console.log(`   created_at을 published_at으로 설정하여 정렬 문제를 해결할 수 있습니다.`);
      console.log(`   (이 방법은 원본 발행일이 아닌 작성일을 발행일로 사용합니다)\n`);
      
      console.log('📋 created_at을 published_at으로 설정할 게시물 목록:');
      postsWithoutDate.forEach((post, index) => {
        // created_at 우선, 없으면 updated_at, 둘 다 없으면 현재 시간
        const dateToUse = post.created_at || post.updated_at || new Date().toISOString();
        const dateLabel = post.created_at ? 'created_at' : (post.updated_at ? 'updated_at' : '현재 시간');
        console.log(`  ${index + 1}. ${post.title.substring(0, 50)}...`);
        console.log(`     ID: ${post.id}, Slug: ${post.slug}`);
        console.log(`     ${dateLabel} → published_at: ${dateToUse}`);
        console.log(`     created_at: ${post.created_at || 'null'}, updated_at: ${post.updated_at || 'null'}\n`);
      });
      
      console.log(`\n💡 이 ${postsWithoutDate.length}개 게시물의 발행일을 복구하려면:`);
      console.log(`   1. 스크립트의 "created_at을 published_at으로 설정" 부분 주석 해제`);
      console.log(`   2. 스크립트 재실행\n`);
    }
    
    // 실제 업데이트 (주석 해제하여 사용)
    /*
    console.log('🔄 발행일 복구 시작...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const match of matchesToRestore) {
      try {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ 
            published_at: match.migrationPost.published_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`❌ 게시물 ${match.id} 업데이트 실패:`, updateError.message);
          failCount++;
        } else {
          console.log(`✅ 게시물 ${match.id} 발행일 복구 완료: ${match.migrationPost.published_at}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ 게시물 ${match.id} 업데이트 중 오류:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n🎉 발행일 복구 완료!`);
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);
    */
    
    // created_at을 published_at으로 설정하는 옵션 (주석 해제하여 사용)
    if (postsWithoutDate.length > 0 && matchesToRestore.length === 0) {
      console.log(`\n🔄 created_at을 published_at으로 설정 시작...\n`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const post of postsWithoutDate) {
        try {
          // created_at 우선, 없으면 updated_at, 둘 다 없으면 현재 시간
          const dateToUse = post.created_at || post.updated_at || new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              published_at: dateToUse,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          
          if (updateError) {
            console.error(`❌ 게시물 ${post.id} 업데이트 실패:`, updateError.message);
            failCount++;
          } else {
            console.log(`✅ 게시물 ${post.id} 발행일 설정 완료: ${dateToUse}`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ 게시물 ${post.id} 업데이트 중 오류:`, error.message);
          failCount++;
        }
      }
      
      console.log(`\n🎉 발행일 설정 완료!`);
      console.log(`  ✅ 성공: ${successCount}개`);
      console.log(`  ❌ 실패: ${failCount}개`);
    }
    
    // 매칭 결과를 JSON 파일로 저장
    const reportPath = path.join(__dirname, '../backup/wix-publish-date-restore-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      restored_at: new Date().toISOString(),
      total_migration_data: migrationData.length,
      total_posts_without_date: postsWithoutDate.length,
      matches_to_restore: matchesToRestore.map(m => ({
        db_id: m.id,
        db_title: m.title,
        db_slug: m.slug,
        migration_title: m.migrationPost.title,
        migration_slug: m.migrationPost.slug,
        original_published_at: m.migrationPost.published_at,
        match_method: m.match.method,
        match_confidence: m.match.confidence
      })),
      unmatched: unmatched.map(u => ({
        title: u.title,
        slug: u.slug,
        original_url: u.original_url,
        published_at: u.published_at
      }))
    }, null, 2));
    
    console.log(`\n📁 매칭 결과 리포트 저장: ${reportPath}`);
    console.log('\n💡 실제 복구를 진행하려면 스크립트의 업데이트 부분 주석을 해제하세요.');
    
  } catch (error) {
    console.error('❌ 발행일 복구 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  restorePublishDates()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { restorePublishDates };

