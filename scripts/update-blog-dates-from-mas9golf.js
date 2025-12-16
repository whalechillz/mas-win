require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * mas9golf.com에서 스크래핑한 발행일 데이터로 Supabase 업데이트
 */
async function updateBlogDatesFromMas9golf() {
  try {
    console.log('🔍 mas9golf.com 스크래핑 데이터 로드 중...\n');
    
    // 가장 최근 스크래핑 결과 파일 찾기
    const backupDir = path.join(__dirname, '../backup');
    const files = await fs.readdir(backupDir);
    const dateFiles = files
      .filter(f => f.startsWith('mas9golf-blog-dates-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (dateFiles.length === 0) {
      throw new Error('스크래핑 결과 파일을 찾을 수 없습니다. 먼저 scrape-mas9golf-blog-dates.js를 실행하세요.');
    }
    
    const latestFile = path.join(backupDir, dateFiles[0]);
    console.log(`📁 파일 로드: ${dateFiles[0]}\n`);
    
    const scrapedData = JSON.parse(await fs.readFile(latestFile, 'utf-8'));
    console.log(`✅ ${scrapedData.posts.length}개의 스크래핑 데이터 로드 완료\n`);
    
    // Supabase에서 모든 published 게시물 조회
    console.log('🔍 Supabase에서 게시물 조회 중...');
    const { data: dbPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published_at')
      .eq('status', 'published')
      .limit(500);
    
    if (fetchError) {
      throw new Error(`게시물 조회 실패: ${fetchError.message}`);
    }
    
    console.log(`✅ ${dbPosts.length}개의 게시물 조회 완료\n`);
    
    // 매칭 및 업데이트
    const matches = [];
    const unmatched = [];
    
    for (const scrapedPost of scrapedData.posts) {
      // 2025년 날짜는 제외 (잘못된 날짜일 가능성)
      if (scrapedPost.publishedDate && scrapedPost.publishedDate.startsWith('2025-')) {
        console.log(`⚠️ 2025년 날짜 제외: ${scrapedPost.title.substring(0, 50)}... (${scrapedPost.publishedDate})`);
        continue;
      }
      
      if (!scrapedPost.publishedDate) {
        console.log(`⚠️ 발행일 없음 제외: ${scrapedPost.title.substring(0, 50)}...`);
        continue;
      }
      
      let bestMatch = null;
      let bestScore = 0;
      
      for (const dbPost of dbPosts) {
        let score = 0;
        
        // 1. URL에서 slug 추출하여 매칭
        if (scrapedPost.url) {
          const scrapedSlug = scrapedPost.url.split('/post/')[1] || scrapedPost.url.split('/blog/')[1];
          if (scrapedSlug && dbPost.slug) {
            // URL 인코딩된 slug 처리
            const decodedScrapedSlug = decodeURIComponent(scrapedSlug);
            if (decodedScrapedSlug === dbPost.slug || scrapedSlug === dbPost.slug) {
              score = 100;
            }
          }
        }
        
        // 2. slug로 매칭
        if (scrapedPost.slug && dbPost.slug) {
          if (scrapedPost.slug === dbPost.slug) {
            score = Math.max(score, 90);
          } else if (scrapedPost.slug.replace(/-/g, '') === dbPost.slug.replace(/-/g, '')) {
            score = Math.max(score, 85);
          }
        }
        
        // 3. 제목으로 매칭
        if (scrapedPost.title && dbPost.title) {
          const normalizedScraped = normalizeTitle(scrapedPost.title);
          const normalizedDb = normalizeTitle(dbPost.title);
          
          if (normalizedScraped === normalizedDb) {
            score = Math.max(score, 80);
          } else {
            const similarity = calculateSimilarity(normalizedScraped, normalizedDb);
            if (similarity >= 0.8) {
              score = Math.max(score, similarity * 100);
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { ...dbPost, score, scrapedPost };
        }
      }
      
      if (bestMatch && bestScore >= 70) {
        matches.push(bestMatch);
      } else {
        unmatched.push(scrapedPost);
      }
    }
    
    console.log(`\n📊 매칭 결과:`);
    console.log(`  ✅ 매칭 성공: ${matches.length}개`);
    console.log(`  ❌ 매칭 실패: ${unmatched.length}개\n`);
    
    // 매칭된 게시물 목록 출력
    console.log('📋 매칭된 게시물 목록:\n');
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.title.substring(0, 50)}...`);
      console.log(`   DB ID: ${match.id}`);
      console.log(`   현재 발행일: ${match.published_at || 'null'}`);
      console.log(`   새 발행일: ${match.scrapedPost.publishedDate}`);
      console.log(`   매칭 점수: ${match.score.toFixed(1)}`);
      console.log(`   URL: ${match.scrapedPost.url}\n`);
    });
    
    // 실제 업데이트
    console.log(`\n🔄 발행일 업데이트 시작...\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const match of matches) {
      try {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ 
            published_at: match.scrapedPost.publishedDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`❌ 게시물 ${match.id} 업데이트 실패:`, updateError.message);
          failCount++;
        } else {
          console.log(`✅ 게시물 ${match.id} 발행일 업데이트 완료: ${match.scrapedPost.publishedDate}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ 게시물 ${match.id} 업데이트 중 오류:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n🎉 발행일 업데이트 완료!`);
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);
    
    // 결과 리포트 저장
    const reportPath = path.join(backupDir, `mas9golf-date-update-report-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
    await fs.writeFile(reportPath, JSON.stringify({
      updated_at: new Date().toISOString(),
      source_file: dateFiles[0],
      total_scraped: scrapedData.posts.length,
      total_matched: matches.length,
      total_unmatched: unmatched.length,
      matches: matches.map(m => ({
        db_id: m.id,
        db_title: m.title,
        db_slug: m.slug,
        current_published_at: m.published_at,
        new_published_at: m.scrapedPost.publishedDate,
        match_score: m.score,
        scraped_url: m.scrapedPost.url
      })),
      unmatched: unmatched.map(u => ({
        title: u.title,
        url: u.url,
        publishedDate: u.publishedDate
      }))
    }, null, 2));
    
    console.log(`\n📁 매칭 결과 리포트 저장: ${reportPath}`);
    console.log('\n💡 실제 업데이트를 진행하려면 스크립트의 업데이트 부분 주석을 해제하세요.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

/**
 * 제목 정규화
 */
function normalizeTitle(title) {
  return title
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * 문자열 유사도 계산
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' ').filter(w => w.length > 1));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 1));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// 스크립트 실행
if (require.main === module) {
  updateBlogDatesFromMas9golf()
    .then(() => {
      console.log('\n✅ 모든 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { updateBlogDatesFromMas9golf };

