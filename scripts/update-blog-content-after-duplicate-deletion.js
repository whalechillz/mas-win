/**
 * 삭제된 중복 이미지 URL을 보존된 이미지 URL로 교체하는 스크립트
 * 
 * 사용법: node scripts/update-blog-content-after-duplicate-deletion.js [분석결과파일경로]
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBlogContentAfterDeletion(analysisFilePath) {
  console.log('📝 삭제된 이미지 URL 교체 시작\n');
  console.log('='.repeat(60));
  
  try {
    // 1. 분석 결과 파일 읽기
    let analysisData;
    
    if (analysisFilePath && fs.existsSync(analysisFilePath)) {
      console.log(`📂 분석 결과 파일 읽기: ${analysisFilePath}`);
      analysisData = JSON.parse(fs.readFileSync(analysisFilePath, 'utf8'));
    } else {
      // 최신 분석 결과 파일 찾기
      const backupDir = path.join(process.cwd(), 'backup');
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('blog-image-deletion-report-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        throw new Error('분석 결과 파일을 찾을 수 없습니다.');
      }
      
      const latestFile = path.join(backupDir, files[0]);
      console.log(`📂 최신 분석 결과 파일 사용: ${latestFile}`);
      analysisData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    }
    
    if (!analysisData.deletionCandidates || analysisData.deletionCandidates.length === 0) {
      console.log('⚠️ 삭제 후보가 없습니다.');
      return;
    }
    
    // 2. URL 매핑 생성 (삭제된 URL -> 보존된 URL)
    const urlMapping = new Map();
    
    console.log('\n📋 URL 매핑 생성 중...');
    for (const group of analysisData.deletionCandidates) {
      const keepUrl = group.imagesToKeep[0]?.url;
      if (keepUrl) {
        for (const img of group.imagesToRemove) {
          if (img.url) {
            urlMapping.set(img.url, keepUrl);
            console.log(`  매핑: ${img.fileName} → ${group.imagesToKeep[0].fileName}`);
          }
        }
      }
    }
    
    console.log(`\n✅ URL 매핑 완료: ${urlMapping.size}개`);
    
    if (urlMapping.size === 0) {
      console.log('⚠️ 교체할 URL이 없습니다.');
      return;
    }
    
    // 3. 모든 블로그 글 조회
    console.log('\n📚 블로그 글 조회 중...');
    
    let offset = 0;
    const batchSize = 100;
    const allPosts = [];
    
    while (true) {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, featured_image')
        .range(offset, offset + batchSize - 1);
      
      if (error) {
        throw new Error(`블로그 글 조회 오류: ${error.message}`);
      }
      
      if (!posts || posts.length === 0) {
        break;
      }
      
      allPosts.push(...posts);
      offset += batchSize;
      
      if (posts.length < batchSize) {
        break;
      }
    }
    
    console.log(`✅ 블로그 글 조회 완료: ${allPosts.length}개`);
    
    // 4. 각 블로그 글의 content 업데이트
    console.log('\n🔄 블로그 글 content 업데이트 중...\n');
    
    const updateResults = {
      updated: 0,
      failed: 0,
      posts: []
    };
    
    for (const post of allPosts) {
      let updatedContent = post.content || '';
      let updatedFeaturedImage = post.featured_image || '';
      let contentUpdated = false;
      let featuredUpdated = false;
      let replacedUrls = [];
      
      // content 내의 이미지 URL 교체
      for (const [oldUrl, newUrl] of urlMapping.entries()) {
        // HTML img 태그 업데이트
        const htmlImgPattern = new RegExp(
          `(<img[^>]+src=["'])${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'][^>]*>)`, 
          'gi'
        );
        if (htmlImgPattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(htmlImgPattern, `$1${newUrl}$2`);
          contentUpdated = true;
          replacedUrls.push({ old: oldUrl, new: newUrl, type: 'HTML' });
        }
        
        // 마크다운 이미지 업데이트
        const markdownImgPattern = new RegExp(
          `(!\\[[^\\]]*\\]\\()${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\))`, 
          'gi'
        );
        if (markdownImgPattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(markdownImgPattern, `$1${newUrl}$2`);
          contentUpdated = true;
          replacedUrls.push({ old: oldUrl, new: newUrl, type: 'Markdown' });
        }
        
        // featured_image 업데이트
        if (updatedFeaturedImage === oldUrl) {
          updatedFeaturedImage = newUrl;
          featuredUpdated = true;
          replacedUrls.push({ old: oldUrl, new: newUrl, type: 'Featured' });
        }
      }
      
      // 업데이트가 있으면 DB에 저장
      if (contentUpdated || featuredUpdated) {
        try {
          const updateData = {};
          if (contentUpdated) {
            updateData.content = updatedContent;
          }
          if (featuredUpdated) {
            updateData.featured_image = updatedFeaturedImage;
          }
          updateData.updated_at = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', post.id);
          
          if (updateError) {
            throw new Error(updateError.message);
          }
          
          updateResults.updated++;
          updateResults.posts.push({
            id: post.id,
            title: post.title,
            contentUpdated,
            featuredUpdated,
            replacedCount: replacedUrls.length,
            replacedUrls: replacedUrls.map(u => ({
              type: u.type,
              oldFileName: u.old.split('/').pop(),
              newFileName: u.new.split('/').pop()
            }))
          });
          
          console.log(`✅ 업데이트 완료: ${post.id} - ${post.title.substring(0, 40)}...`);
          console.log(`   교체된 URL: ${replacedUrls.length}개`);
        } catch (error) {
          updateResults.failed++;
          console.error(`❌ 업데이트 실패 (${post.id}):`, error.message);
        }
      }
    }
    
    // 5. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 업데이트 결과 요약\n');
    console.log(`총 블로그 글: ${allPosts.length}개`);
    console.log(`업데이트된 글: ${updateResults.updated}개`);
    console.log(`업데이트 실패: ${updateResults.failed}개`);
    console.log(`교체된 URL 매핑: ${urlMapping.size}개`);
    
    // 6. 결과 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(process.cwd(), 'backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const resultFile = path.join(backupDir, `blog-content-update-after-deletion-${timestamp}.json`);
    fs.writeFileSync(resultFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      urlMapping: Array.from(urlMapping.entries()).map(([old, new_]) => ({ old, new: new_ })),
      summary: {
        totalPosts: allPosts.length,
        updated: updateResults.updated,
        failed: updateResults.failed
      },
      updatedPosts: updateResults.posts
    }, null, 2), 'utf8');
    
    console.log(`\n💾 결과 저장: ${resultFile}`);
    console.log('\n' + '='.repeat(60));
    console.log('✅ 블로그 글 content 업데이트 완료!\n');
    
    return updateResults;
    
  } catch (error) {
    console.error('\n❌ 업데이트 실패:', error);
    throw error;
  }
}

// 실행
if (require.main === module) {
  const analysisFilePath = process.argv[2];
  
  updateBlogContentAfterDeletion(analysisFilePath)
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { updateBlogContentAfterDeletion };

