// 연결이 끊어진 블로그 재연결 스크립트
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 제목 정규화 함수
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .replace(/[:\s\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// 문자열 유사도 계산 (Jaccard 유사도)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' ').filter(w => w.length > 1));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 1));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// 블로그 포스트와 허브 콘텐츠 매칭
function matchBlogToHub(blogPost, hubContent) {
  // 1. 제목 완전 일치
  if (normalizeTitle(blogPost.title) === normalizeTitle(hubContent.title)) {
    return { matched: true, method: 'title_exact', confidence: 'high', score: 100 };
  }
  
  // 2. 제목 유사도 (80% 이상)
  const similarity = calculateSimilarity(
    normalizeTitle(blogPost.title),
    normalizeTitle(hubContent.title)
  );
  if (similarity >= 0.8) {
    return { matched: true, method: 'title_similarity', confidence: 'high', similarity, score: similarity * 100 };
  }
  
  // 3. 날짜 매칭 (같은 날짜)
  const blogDate = blogPost.published_at ? new Date(blogPost.published_at).toISOString().split('T')[0] : null;
  const hubDate = hubContent.content_date;
  if (blogDate && hubDate && blogDate === hubDate) {
    // 날짜가 같고 제목 유사도가 60% 이상이면 매칭
    if (similarity >= 0.6) {
      return { matched: true, method: 'date_title', confidence: 'medium', similarity, score: 70 };
    }
  }
  
  // 4. slug 매칭 (허브에 slug 정보가 있는 경우)
  if (hubContent.blog_slug && blogPost.slug) {
    if (hubContent.blog_slug === blogPost.slug) {
      return { matched: true, method: 'slug', confidence: 'high', score: 95 };
    }
  }
  
  return { matched: false, score: 0 };
}

async function reconnectBrokenBlogs() {
  try {
    console.log('🔍 연결이 끊어진 블로그 찾는 중...\n');
    
    // 1. 연결이 끊어진 허브 콘텐츠 찾기
    const { data: hubContentsWithoutBlog, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('is_hub_content', true)
      .or('blog_post_id.is.null,channel_status->blog->post_id.is.null');
    
    if (hubError) {
      console.error('❌ 허브 콘텐츠 조회 오류:', hubError);
      return;
    }
    
    console.log(`✅ 연결이 끊어진 허브 콘텐츠: ${hubContentsWithoutBlog?.length || 0}개\n`);
    
    // 2. 연결이 끊어진 블로그 포스트 찾기
    const { data: blogPostsWithoutHub, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .is('calendar_id', null);
    
    if (blogError) {
      console.error('❌ 블로그 포스트 조회 오류:', blogError);
      return;
    }
    
    console.log(`✅ 연결이 끊어진 블로그 포스트: ${blogPostsWithoutHub?.length || 0}개\n`);
    
    // 3. 매칭 및 재연결
    let reconnectedCount = 0;
    const results = [];
    
    for (const hubContent of hubContentsWithoutBlog || []) {
      let bestMatch = null;
      let bestScore = 0;
      
      // 모든 블로그 포스트와 매칭 시도
      for (const blogPost of blogPostsWithoutHub || []) {
        const match = matchBlogToHub(blogPost, hubContent);
        if (match.matched && match.score > bestScore) {
          bestMatch = { blogPost, match };
          bestScore = match.score;
        }
      }
      
      // 매칭된 경우 재연결
      if (bestMatch && bestScore >= 60) {
        try {
          const { blogPost, match } = bestMatch;
          
          // 허브 콘텐츠 업데이트
          const currentChannels = hubContent.channel_status || {};
          const updatedChannels = {
            ...currentChannels,
            blog: {
              status: '연결됨',
              post_id: blogPost.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
          
          const { error: hubUpdateError } = await supabase
            .from('cc_content_calendar')
            .update({
              blog_post_id: blogPost.id,
              channel_status: updatedChannels,
              updated_at: new Date().toISOString()
            })
            .eq('id', hubContent.id);
          
          if (hubUpdateError) {
            console.error(`❌ 허브 업데이트 실패 (${hubContent.title}):`, hubUpdateError);
            continue;
          }
          
          // 블로그 포스트 업데이트
          const { error: blogUpdateError } = await supabase
            .from('blog_posts')
            .update({
              calendar_id: hubContent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', blogPost.id);
          
          if (blogUpdateError) {
            console.error(`❌ 블로그 업데이트 실패 (${blogPost.title}):`, blogUpdateError);
            continue;
          }
          
          reconnectedCount++;
          results.push({
            hubId: hubContent.id,
            hubTitle: hubContent.title,
            blogId: blogPost.id,
            blogTitle: blogPost.title,
            method: match.method,
            score: bestScore,
            status: 'success'
          });
          
          console.log(`✅ 재연결 완료: ${hubContent.title.substring(0, 50)}... → 블로그 #${blogPost.id} (${match.method}, ${bestScore.toFixed(0)}점)`);
          
        } catch (error) {
          console.error(`❌ 재연결 오류 (${hubContent.title}):`, error);
          results.push({
            hubId: hubContent.id,
            hubTitle: hubContent.title,
            status: 'error',
            error: error.message
          });
        }
      } else {
        results.push({
          hubId: hubContent.id,
          hubTitle: hubContent.title,
          status: 'no_match',
          message: `매칭되는 블로그를 찾을 수 없습니다. (최고 점수: ${bestScore.toFixed(0)})`
        });
      }
    }
    
    console.log(`\n✅ 재연결 완료: ${reconnectedCount}개`);
    console.log(`   성공: ${results.filter(r => r.status === 'success').length}개`);
    console.log(`   실패: ${results.filter(r => r.status === 'error').length}개`);
    console.log(`   매칭 없음: ${results.filter(r => r.status === 'no_match').length}개\n`);
    
    // 결과 저장
    const fs = require('fs');
    const reportPath = path.join(__dirname, '../backup/blog-reconnection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      reconnectedCount,
      results
    }, null, 2));
    
    console.log(`📄 리포트 저장: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ 재연결 스크립트 오류:', error);
  }
}

reconnectBrokenBlogs();

