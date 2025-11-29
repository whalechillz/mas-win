/**
 * 블로그 포스트 완전 최적화 통합 스크립트
 * 모든 최적화 단계를 순차적으로 실행
 * 사용법: node scripts/optimize-blog-post-complete.js <blogPostId>
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { execSync } = require('child_process');
const path = require('path');

const scriptsDir = __dirname;

function runScript(scriptName, blogPostId) {
  const scriptPath = path.join(scriptsDir, scriptName);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 실행: ${scriptName}`);
  console.log('='.repeat(80));
  
  try {
    const output = execSync(`node "${scriptPath}" ${blogPostId}`, {
      encoding: 'utf-8',
      cwd: scriptsDir
    });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function optimizeBlogPostComplete(blogPostId) {
  // async 함수로 변경 (대기 시간을 위해)
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 블로그 포스트 완전 최적화 시작 (ID: ${blogPostId})`);
  console.log('='.repeat(80));
  
  const steps = [
    {
      name: '1. 현황 분석',
      script: 'analyze-blog-gallery-images.js',
      required: true
    },
    {
      name: '2. 하드코딩된 관련 포스트 제거',
      script: 'remove-hardcoded-related-posts.js',
      required: false
    },
    {
      name: '3. 태그 섹션 제거',
      script: 'remove-tags-section-from-content.js',
      required: false
    },
    {
      name: '4. 중복 이미지 제거',
      script: 'remove-duplicate-blog-images.js',
      required: false
    },
    {
      name: '5. 콘텐츠 정제',
      script: 'refine-blog-content.js',
      required: false
    },
    {
      name: '6. 누락된 이미지 복구',
      script: 'restore-missing-images-to-content.js',
      required: true
    },
    {
      name: '7. 텍스트 단락 개선',
      script: 'improve-paragraph-splitting.js',
      required: true
    },
    {
      name: '8. 이미지 배치 최적화',
      script: 'optimize-image-placement.js',
      required: true
    },
    {
      name: '9. 이미지 갤러리 폴더 정리',
      script: 'organize-blog-images.js',
      required: true
    },
    {
      name: '9-1. Storage 안정화 대기',
      wait: 10000, // 10초 대기 (이미지 이동 후 Storage 안정화)
      required: true
    },
    {
      name: '10. 이미지 메타데이터 생성',
      script: 'generate-blog-image-metadata.js',
      required: true
    },
    {
      name: '11. 최종 검증',
      script: 'analyze-blog-gallery-images.js',
      required: true
    }
  ];
  
  const results = [];
  
  for (const step of steps) {
    // 대기 시간이 있는 경우
    if (step.wait) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`⏳ ${step.name} (${step.wait / 1000}초)`);
      console.log('='.repeat(80));
      console.log('💡 이미지 이동 후 Storage 안정화를 위해 대기 중...\n');
      await new Promise(resolve => setTimeout(resolve, step.wait));
      console.log(`✅ ${step.name} 완료\n`);
      results.push({
        step: step.name,
        script: null,
        success: true,
        required: step.required
      });
    } else if (step.script) {
      const success = runScript(step.script, blogPostId);
      results.push({
        step: step.name,
        script: step.script,
        success,
        required: step.required
      });
      
      if (!success && step.required) {
        console.error(`\n❌ 필수 단계 실패: ${step.name}`);
        console.error('최적화를 중단합니다.');
        break;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 최적화 결과 요약');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    const status = result.success ? '✅' : (result.required ? '❌' : '⚠️');
    console.log(`${status} ${result.step}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n완료: ${successCount}/${totalCount} 단계`);
  
  if (successCount === totalCount) {
    console.log('\n✅ 모든 최적화 단계가 성공적으로 완료되었습니다!');
  } else {
    console.log('\n⚠️ 일부 단계에서 오류가 발생했습니다. 위의 결과를 확인하세요.');
  }
  
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2];
  
  if (!blogPostId) {
    console.error('❌ 사용법: node scripts/optimize-blog-post-complete.js <blogPostId>');
    process.exit(1);
  }
  
  optimizeBlogPostComplete(parseInt(blogPostId))
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { optimizeBlogPostComplete };

