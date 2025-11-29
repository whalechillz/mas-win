/**
 * 블로그 글 콘텐츠 정제 (과도한 키워드 제거, 자연스러운 문장으로 수정)
 * 사용법: node scripts/refine-blog-content.js <blogPostId>
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refineBlogContent(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 콘텐츠 정제 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  if (!post.content) {
    console.log('⚠️ content가 비어있습니다.');
    return;
  }
  
  let newContent = post.content;
  let changesCount = 0;
  
  // 2. 과도한 키워드 반복 제거
  // 예: "고반발드라이버 추천 - 드라이버추천 추천 - 골프드라이버 추천 - 비거리향상 추천"
  // → "고반발 드라이버 추천"
  
  console.log('🔍 과도한 키워드 패턴 검색 중...\n');
  
  // 패턴 1: "키워드1 추천 - 키워드2 추천 - 키워드3 추천 - 키워드4 추천" 형식
  const pattern1 = /([가-힣\w]+)\s*추천\s*[-–—]\s*([가-힣\w]+)\s*추천\s*[-–—]\s*([가-힣\w]+)\s*추천\s*[-–—]\s*([가-힣\w]+)\s*추천/gi;
  const matches1 = [...newContent.matchAll(pattern1)];
  
  matches1.forEach(match => {
    const fullMatch = match[0];
    const keywords = [
      match[1],
      match[2],
      match[3],
      match[4]
    ];
    
    console.log(`🔍 과도한 키워드 패턴 발견: "${fullMatch}"`);
    
    // 첫 번째와 마지막 키워드만 남기고 자연스러운 문장으로 수정
    const refined = `${keywords[0]} ${keywords[keywords.length - 1]} 추천`;
    newContent = newContent.replace(fullMatch, refined);
    console.log(`   ✅ 수정: "${refined}"`);
    changesCount++;
  });
  
  // 패턴 2: "키워드1 - 키워드2 - 키워드3 - 키워드4 - 키워드5" 형식 (과도한 반복, 4개 이상)
  // ⚠️ 이미지 URL은 제외 (http:// 또는 https://로 시작하는 경우)
  const pattern2 = /(?<!https?:\/\/[^\s]*)([가-힣\w]+)\s*[-–—]\s*([가-힣\w]+)\s*[-–—]\s*([가-힣\w]+)\s*[-–—]\s*([가-힣\w]+)\s*[-–—]\s*([가-힣\w]+)(?![^\s]*\.(jpg|jpeg|png|gif|webp))/gi;
  const matches2 = [...newContent.matchAll(pattern2)];
  
  matches2.forEach(match => {
    const fullMatch = match[0];
    // 이미지 URL인지 확인 (http:// 또는 https:// 포함)
    if (fullMatch.includes('http://') || fullMatch.includes('https://')) {
      return; // 이미지 URL은 건드리지 않음
    }
    
    const keywords = [
      match[1],
      match[2],
      match[3],
      match[4],
      match[5]
    ];
    
    console.log(`🔍 과도한 키워드 패턴 발견: "${fullMatch}"`);
    
    // 첫 번째와 마지막 키워드만 남기고 자연스러운 문장으로 수정
    const refined = `${keywords[0]} ${keywords[keywords.length - 1]}`;
    newContent = newContent.replace(fullMatch, refined);
    console.log(`   ✅ 수정: "${refined}"`);
    changesCount++;
  });
  
  // 패턴 3: "키워드1 추천 - 키워드2 추천 - 키워드3 추천" 형식 (3개)
  const pattern3 = /([가-힣\w]+)\s*추천\s*[-–—]\s*([가-힣\w]+)\s*추천\s*[-–—]\s*([가-힣\w]+)\s*추천/gi;
  const matches3 = [...newContent.matchAll(pattern3)];
  
  matches3.forEach(match => {
    const fullMatch = match[0];
    const keywords = [
      match[1],
      match[2],
      match[3]
    ];
    
    console.log(`🔍 과도한 키워드 패턴 발견: "${fullMatch}"`);
    
    // 첫 번째와 마지막 키워드만 남기고 자연스러운 문장으로 수정
    const refined = `${keywords[0]} ${keywords[keywords.length - 1]} 추천`;
    newContent = newContent.replace(fullMatch, refined);
    console.log(`   ✅ 수정: "${refined}"`);
    changesCount++;
  });
  
  // 3. 중복 제목 제거 (원본 제목과 유사한 제목 및 내용 상단 타이틀)
  console.log('\n🔍 중복 제목 검색 중...\n');
  
  const titleKeywords = (post.title || '')
    .split(/[\s,]+/)
    .filter(word => word.length > 2)
    .map(word => word.toLowerCase());
  
  // 한글 조사 제거 함수
  function removeKoreanParticles(word) {
    // 한글 조사 제거 (을/를, 이/가, 은/는, 와/과, 에/에서 등)
    return word.replace(/[을를이가은는와과에에서도부터까지]$/, '');
  }
  
  // 제목과 유사도 계산 함수
  function calculateSimilarity(text1, text2) {
    const keywords1 = (text1 || '')
      .split(/[\s,]+/)
      .filter(word => word.length > 2)
      .map(word => {
        const cleaned = removeKoreanParticles(word.toLowerCase());
        return cleaned.length > 2 ? cleaned : word.toLowerCase();
      });
    
    const keywords2 = (text2 || '')
      .split(/[\s,]+/)
      .filter(word => word.length > 2)
      .map(word => {
        const cleaned = removeKoreanParticles(word.toLowerCase());
        return cleaned.length > 2 ? cleaned : word.toLowerCase();
      });
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const commonKeywords = keywords1.filter(keyword =>
      keywords2.some(kw =>
        kw.includes(keyword) || keyword.includes(kw) ||
        removeKoreanParticles(kw) === removeKoreanParticles(keyword)
      )
    );
    
    return commonKeywords.length / Math.max(keywords1.length, keywords2.length);
  }
  
  const lines = newContent.split('\n');
  const cleanedLines = [];
  let isFirstContentLine = true; // 내용의 첫 줄인지 확인
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 빈 줄은 건너뛰기
    if (!line) {
      cleanedLines.push(lines[i]);
      continue;
    }
    
    // 마크다운 제목 패턴 (# ## ###)
    const titlePattern = /^(#{1,3})\s+(.+)$/;
    const titleMatch = line.match(titlePattern);
    
      if (titleMatch && titleMatch[2]) {
      const titleText = titleMatch[2];
      const similarity = calculateSimilarity(post.title, titleText);
      
      if (similarity >= 0.4) {
        console.log(`🔍 중복 마크다운 제목 제거: "${titleText}" (유사도: ${(similarity * 100).toFixed(1)}%)`);
        changesCount++;
        continue; // 이 라인은 건너뛰기
      }
    }
    
    // 내용 상단의 일반 텍스트 타이틀 확인 (첫 10줄 내에서만)
    // 이미지, 링크, 빈 줄이 아닌 첫 번째 텍스트 라인
    if (isFirstContentLine && i < 10) {
      // 이미지나 링크가 아닌 일반 텍스트인지 확인
      const isImageOrLink = /^!?\[.*\]\(.*\)|^https?:\/\//.test(line);
      const isHeading = /^#{1,6}\s+/.test(line);
      
      if (!isImageOrLink && !isHeading && line.length > 10) {
        const similarity = calculateSimilarity(post.title, line);
        
        // 유사도가 0.4 이상이고, 제목의 핵심 키워드가 포함되어 있으면 제거
        if (similarity > 0.4) {
          // 제목의 핵심 키워드가 3개 이상 포함되어 있으면 중복으로 판단
          const titleCoreKeywords = titleKeywords.filter(kw => kw.length > 3);
          const lineKeywords = line
            .split(/[\s,]+/)
            .filter(word => word.length > 2)
            .map(word => word.toLowerCase());
          
          const matchedKeywords = titleCoreKeywords.filter(titleKw =>
            lineKeywords.some(lineKw =>
              lineKw.includes(titleKw) || titleKw.includes(lineKw)
            )
          );
          
          if (matchedKeywords.length >= 3) {
            console.log(`🔍 중복 내용 상단 타이틀 제거: "${line.substring(0, 50)}..." (유사도: ${(similarity * 100).toFixed(1)}%, 매칭 키워드: ${matchedKeywords.length}개)`);
            changesCount++;
            isFirstContentLine = false; // 첫 줄 처리 완료
            continue; // 이 라인은 건너뛰기
          }
        }
      }
    }
    
    // 일반 텍스트 라인이면 isFirstContentLine을 false로 설정
    if (isFirstContentLine && !/^!?\[.*\]\(.*\)|^https?:\/\/|^#{1,6}\s+/.test(line) && line.length > 0) {
      isFirstContentLine = false;
    }
    
    cleanedLines.push(lines[i]);
  }
  
  newContent = cleanedLines.join('\n');
  
  // 4. 연속된 빈 줄 정리 (3개 이상 → 2개)
  newContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  // 5. 데이터베이스 업데이트
  if (changesCount > 0) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        content: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 콘텐츠 정제 완료');
    console.log('='.repeat(80));
    console.log(`   수정된 항목: ${changesCount}개`);
    console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
    console.log('='.repeat(80));
  } else {
    console.log('\n✅ 수정할 항목이 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  refineBlogContent(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { refineBlogContent };

