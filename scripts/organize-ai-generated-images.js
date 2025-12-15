/**
 * AI 생성 이미지를 ai-generated 폴더로 날짜별 정리 스크립트
 * golf-driver, golf-swing, paragraph-image 등 AI 생성 이미지들을 날짜별로 정리
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BACKUP_DIR = path.join(process.cwd(), 'backup');

// 상태 확인 (dryRun)
async function checkAIGeneratedImages() {
  const response = await fetch(`${API_BASE_URL}/api/admin/organize-ai-generated-images?dryRun=true`);
  if (!response.ok) {
    throw new Error('상태 확인 실패');
  }
  const data = await response.json();
  return data.results;
}

// 실제 이동 실행
async function organizeAIGeneratedImages() {
  const response = await fetch(`${API_BASE_URL}/api/admin/organize-ai-generated-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun: false, moveImages: true })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || '이미지 정리 실패');
  }
  
  const data = await response.json();
  return data.results;
}

// 메인 실행
async function main() {
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  if (API_BASE_URL.includes('localhost')) {
    console.log('💡 로컬 서버를 사용합니다.\n');
  }
  
  try {
    // 1. 상태 확인
    console.log('📊 1단계: AI 생성 이미지 상태 확인...\n');
    const checkResults = await checkAIGeneratedImages();
    
    console.log(`\n📊 발견된 AI 생성 이미지:`);
    console.log(`  총 개수: ${checkResults.total}개`);
    console.log(`  날짜별 그룹: ${Object.keys(checkResults.byDate).length}개\n`);
    
    // 날짜별 상세 정보
    for (const [dateStr, dateData] of Object.entries(checkResults.byDate)) {
      console.log(`📅 ${dateStr}:`);
      console.log(`  폴더: ${dateData.folder}`);
      console.log(`  이미지: ${dateData.total}개`);
      
      // 이미 ai-generated 폴더에 있는지 확인
      const alreadyInFolder = dateData.images.filter(img => 
        img.currentPath.startsWith('originals/ai-generated/')
      ).length;
      
      if (alreadyInFolder > 0) {
        console.log(`  이미 정리됨: ${alreadyInFolder}개`);
      }
      
      const needsMove = dateData.total - alreadyInFolder;
      if (needsMove > 0) {
        console.log(`  이동 필요: ${needsMove}개`);
        
        // 이동할 이미지 목록 (처음 5개만)
        const toMove = dateData.images
          .filter(img => !img.currentPath.startsWith('originals/ai-generated/'))
          .slice(0, 5);
        
        toMove.forEach(img => {
          console.log(`    - ${img.name}`);
        });
        
        if (needsMove > 5) {
          console.log(`    ... 외 ${needsMove - 5}개`);
        }
      }
      console.log('');
    }
    
    // 2. 실제 이동 실행
    if (checkResults.total > 0) {
      const totalNeedsMove = Object.values(checkResults.byDate).reduce((sum, dateData) => {
        const alreadyInFolder = dateData.images.filter(img => 
          img.currentPath.startsWith('originals/ai-generated/')
        ).length;
        return sum + (dateData.total - alreadyInFolder);
      }, 0);
      
      if (totalNeedsMove > 0) {
        console.log(`\n🚀 2단계: AI 생성 이미지 이동 시작...\n`);
        console.log(`이동할 이미지: ${totalNeedsMove}개\n`);
        
        const moveResults = await organizeAIGeneratedImages();
        
        // 보고서 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const reportFile = path.join(BACKUP_DIR, `ai-generated-images-organization-${timestamp}.json`);
        const report = {
          timestamp,
          checkResults,
          moveResults,
          summary: {
            total: moveResults.total,
            moved: moveResults.moved,
            skipped: moveResults.skipped,
            errors: moveResults.errors
          }
        };
        
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // 요약 출력
        console.log('\n' + '='.repeat(80));
        console.log('📊 이동 결과 요약');
        console.log('='.repeat(80));
        console.log(`총 AI 생성 이미지: ${moveResults.total}개`);
        console.log(`이동 완료: ${moveResults.moved}개`);
        console.log(`스킵 (이미 정리됨): ${moveResults.skipped}개`);
        console.log(`오류: ${moveResults.errors}개`);
        console.log(`\n📁 보고서: ${reportFile}`);
        console.log('='.repeat(80));
        
        // 날짜별 상세 결과
        console.log('\n📅 날짜별 이동 결과:\n');
        for (const [dateStr, dateData] of Object.entries(moveResults.byDate)) {
          if (dateData.moved > 0 || dateData.errors > 0) {
            console.log(`  ${dateStr}: 이동 ${dateData.moved}개, 오류 ${dateData.errors}개`);
          }
        }
      } else {
        console.log('\n✅ 모든 AI 생성 이미지가 이미 정리되어 있습니다!');
      }
    } else {
      console.log('\nℹ️ AI 생성 이미지를 찾을 수 없습니다.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 실행 실패:', error.message);
    process.exit(1);
  }
}

main();



