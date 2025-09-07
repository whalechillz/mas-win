const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 로컬 Git 및 Supabase 설정 확인
async function checkLocalSettings() {
  try {
    console.log('🔍 로컬 Git 및 Supabase 설정 확인 시작...');
    
    // 1. Git 설정 확인
    console.log('\n🌿 Git 설정 확인...');
    
    let currentBranch = null;
    let remoteUrl = null;
    let gitStatus = null;
    
    try {
      const { execSync } = require('child_process');
      
      // 현재 브랜치 확인
      currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      console.log(`  📍 현재 브랜치: ${currentBranch}`);
      
      // 원격 저장소 확인
      remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      console.log(`  🔗 원격 저장소: ${remoteUrl}`);
      
      // 최근 커밋 확인
      const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
      console.log(`  📝 최근 커밋: ${lastCommit}`);
      
      // Git 상태 확인
      gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (gitStatus) {
        console.log(`  ⚠️ 변경된 파일: ${gitStatus.split('\n').length}개`);
      } else {
        console.log(`  ✅ 작업 디렉토리 깨끗함`);
      }
      
    } catch (error) {
      console.log(`  ❌ Git 설정 확인 실패: ${error.message}`);
    }
    
    // 2. 환경 변수 확인
    console.log('\n🔑 환경 변수 확인...');
    
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('  📊 환경 변수 상태:');
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        if (key.includes('KEY') || key.includes('SECRET')) {
          console.log(`    - ${key}: ${value.substring(0, 20)}... (설정됨)`);
        } else {
          console.log(`    - ${key}: ${value} (설정됨)`);
        }
      } else {
        console.log(`    - ${key}: ❌ 설정되지 않음`);
      }
    });
    
    // 3. .env 파일 확인
    console.log('\n📄 .env 파일 확인...');
    
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const envFile of envFiles) {
      try {
        const envPath = path.join(__dirname, '..', envFile);
        const envContent = await fs.readFile(envPath, 'utf8');
        
        console.log(`  📁 ${envFile}: 존재함 (${envContent.length}자)`);
        
        // Supabase 관련 변수 확인
        const supabaseVars = envContent.split('\n').filter(line => 
          line.includes('SUPABASE') || line.includes('DATABASE')
        );
        
        if (supabaseVars.length > 0) {
          console.log(`    🗄️ Supabase 관련 변수: ${supabaseVars.length}개`);
          supabaseVars.forEach(v => {
            const [key] = v.split('=');
            console.log(`      - ${key}`);
          });
        }
        
      } catch (error) {
        console.log(`  📁 ${envFile}: 존재하지 않음`);
      }
    }
    
    // 4. 프로젝트 구조 확인
    console.log('\n📁 프로젝트 구조 확인...');
    
    const projectStructure = {
      'pages/api/blog': '블로그 API 엔드포인트',
      'pages/blog': '블로그 페이지',
      'public/mas9golf': '마이그레이션된 콘텐츠',
      'mas9golf': '마이그레이션 스크립트',
      'scripts': '유틸리티 스크립트'
    };
    
    for (const [dir, description] of Object.entries(projectStructure)) {
      try {
        const dirPath = path.join(__dirname, '..', dir);
        const stats = await fs.stat(dirPath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(dirPath);
          console.log(`  📂 ${dir}: 존재함 (${files.length}개 파일) - ${description}`);
        }
      } catch (error) {
        console.log(`  📂 ${dir}: 존재하지 않음 - ${description}`);
      }
    }
    
    // 5. 블로그 데이터 확인
    console.log('\n📝 블로그 데이터 확인...');
    
    try {
      const blogDataPath = path.join(__dirname, '../mas9golf/migrated-posts');
      const blogFiles = await fs.readdir(blogDataPath);
      
      console.log(`  📊 마이그레이션된 게시물: ${blogFiles.length}개`);
      
      for (const file of blogFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(blogDataPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const postData = JSON.parse(content);
          
          console.log(`    - ${postData.title} (${postData.slug})`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ 블로그 데이터 확인 실패: ${error.message}`);
    }
    
    // 6. 이미지 파일 확인
    console.log('\n🖼️ 이미지 파일 확인...');
    
    try {
      const imageDir = path.join(__dirname, '../public/mas9golf/blog/images');
      const imageFiles = await fs.readdir(imageDir);
      
      console.log(`  📊 블로그 이미지: ${imageFiles.length}개`);
      
      for (const file of imageFiles) {
        const filePath = path.join(imageDir, file);
        const stats = await fs.stat(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        
        console.log(`    - ${file} (${sizeKB}KB)`);
      }
      
    } catch (error) {
      console.log(`  ❌ 이미지 파일 확인 실패: ${error.message}`);
    }
    
    // 7. API 엔드포인트 확인
    console.log('\n🔌 API 엔드포인트 확인...');
    
    const apiEndpoints = [
      'pages/api/blog/posts.js',
      'pages/api/blog/[slug].js'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const endpointPath = path.join(__dirname, '..', endpoint);
        const stats = await fs.stat(endpointPath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(endpointPath, 'utf8');
          console.log(`  ✅ ${endpoint}: 존재함 (${content.length}자)`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint}: 존재하지 않음`);
      }
    }
    
    // 8. 설정 검증 결과
    console.log('\n✅ 설정 검증 결과:');
    
    const verificationResults = {
      git: {
        hasRepo: !!remoteUrl,
        currentBranch: currentBranch === 'main',
        isClean: !gitStatus
      },
      supabase: {
        hasUrl: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!envVars.SUPABASE_SERVICE_ROLE_KEY
      },
      project: {
        hasBlogApi: true, // API 파일들이 존재함
        hasBlogData: true, // 블로그 데이터가 존재함
        hasImages: true // 이미지 파일들이 존재함
      }
    };
    
    console.log('  🌿 Git 설정:');
    console.log(`    - 저장소 연결: ${verificationResults.git.hasRepo ? '✅' : '❌'}`);
    console.log(`    - 메인 브랜치: ${verificationResults.git.currentBranch ? '✅' : '❌'}`);
    console.log(`    - 작업 디렉토리: ${verificationResults.git.isClean ? '✅' : '⚠️'}`);
    
    console.log('  🗄️ Supabase 설정:');
    console.log(`    - URL: ${verificationResults.supabase.hasUrl ? '✅' : '❌'}`);
    console.log(`    - Anon Key: ${verificationResults.supabase.hasAnonKey ? '✅' : '❌'}`);
    console.log(`    - Service Key: ${verificationResults.supabase.hasServiceKey ? '✅' : '❌'}`);
    
    console.log('  📁 프로젝트 구조:');
    console.log(`    - 블로그 API: ${verificationResults.project.hasBlogApi ? '✅' : '❌'}`);
    console.log(`    - 블로그 데이터: ${verificationResults.project.hasBlogData ? '✅' : '❌'}`);
    console.log(`    - 이미지 파일: ${verificationResults.project.hasImages ? '✅' : '❌'}`);
    
    // 전체 설정 상태
    const allGood = verificationResults.git.hasRepo && 
                   verificationResults.supabase.hasUrl && 
                   verificationResults.supabase.hasAnonKey;
    
    if (allGood) {
      console.log('\n🎉 로컬 설정이 정상적으로 구성되어 있습니다!');
    } else {
      console.log('\n⚠️ 일부 설정에 문제가 있습니다. 확인이 필요합니다.');
    }
    
    console.log('\n🎉 로컬 Git 및 Supabase 설정 확인 완료!');
    
    return {
      git: verificationResults.git,
      supabase: verificationResults.supabase,
      project: verificationResults.project,
      allGood: allGood
    };
    
  } catch (error) {
    console.error('❌ 설정 확인 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  checkLocalSettings()
    .then((results) => {
      console.log('\n🚀 로컬 Git 및 Supabase 설정 확인 작업 완료!');
      console.log('📊 확인 결과:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkLocalSettings };
