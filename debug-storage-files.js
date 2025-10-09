import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStorageFiles() {
  try {
    console.log('🔍 Supabase Storage 파일 목록 조회 중...');
    
    // 모든 파일 조회
    let allFiles = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data: batchFiles, error: batchError } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (batchError) {
        console.error('❌ 배치 조회 에러:', batchError);
        break;
      }

      if (!batchFiles || batchFiles.length === 0) {
        break;
      }

      allFiles = allFiles.concat(batchFiles);
      offset += batchSize;

      if (batchFiles.length < batchSize) {
        break;
      }
    }
    
    console.log(`📊 총 파일 개수: ${allFiles.length}개`);
    
    // 파일명별 그룹화
    const nameGroups = {};
    allFiles.forEach(file => {
      const name = file.name;
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(file);
    });
    
    // 중복 파일명 찾기
    const duplicateNames = Object.entries(nameGroups)
      .filter(([name, files]) => files.length > 1)
      .map(([name, files]) => ({ name, count: files.length, files }));
    
    console.log(`🔄 중복 파일명 그룹: ${duplicateNames.length}개`);
    
    if (duplicateNames.length > 0) {
      console.log('\n📋 중복 파일명 상세:');
      duplicateNames.slice(0, 10).forEach(group => {
        console.log(`\n📁 ${group.name} (${group.count}개):`);
        group.files.forEach((file, index) => {
          console.log(`  ${index + 1}. ID: ${file.id}, 생성일: ${file.created_at}, 크기: ${file.metadata?.size || 0}bytes`);
        });
      });
    }
    
    // 유사한 파일명 패턴 찾기
    console.log('\n🔍 유사한 파일명 패턴 분석:');
    const patterns = {};
    
    allFiles.forEach(file => {
      const name = file.name;
      // 숫자 제거한 기본 패턴 추출
      const basePattern = name.replace(/[-_]?\d+\.(jpg|jpeg|png|webp|gif)$/i, '').replace(/[-_]?\d+$/, '');
      if (!patterns[basePattern]) {
        patterns[basePattern] = [];
      }
      patterns[basePattern].push(file);
    });
    
    const similarPatterns = Object.entries(patterns)
      .filter(([pattern, files]) => files.length > 1)
      .map(([pattern, files]) => ({ pattern, count: files.length, files }))
      .sort((a, b) => b.count - a.count);
    
    console.log(`📊 유사한 패턴 그룹: ${similarPatterns.length}개`);
    
    if (similarPatterns.length > 0) {
      console.log('\n📋 상위 유사 패턴:');
      similarPatterns.slice(0, 5).forEach(group => {
        console.log(`\n🎯 "${group.pattern}" (${group.count}개):`);
        group.files.slice(0, 5).forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name}`);
        });
        if (group.files.length > 5) {
          console.log(`  ... 외 ${group.files.length - 5}개 더`);
        }
      });
    }
    
    // 메타데이터 테이블과 비교
    console.log('\n🔍 메타데이터 테이블 조회 중...');
    const { data: metadata, error: metaError } = await supabase
      .from('image_metadata')
      .select('id, image_url, title, created_at')
      .order('created_at', { ascending: false });
    
    if (metaError) {
      console.error('❌ 메타데이터 조회 오류:', metaError);
    } else {
      console.log(`📊 메타데이터 레코드: ${metadata.length}개`);
      
      // URL별 그룹화
      const urlGroups = {};
      metadata.forEach(record => {
        const url = record.image_url;
        if (!urlGroups[url]) {
          urlGroups[url] = [];
        }
        urlGroups[url].push(record);
      });
      
      const duplicateUrls = Object.entries(urlGroups)
        .filter(([url, records]) => records.length > 1);
      
      console.log(`🔄 중복 URL 그룹: ${duplicateUrls.length}개`);
      
      if (duplicateUrls.length > 0) {
        console.log('\n📋 중복 URL 상세:');
        duplicateUrls.slice(0, 5).forEach(([url, records]) => {
          console.log(`\n🔗 ${url} (${records.length}개):`);
          records.forEach((record, index) => {
            console.log(`  ${index + 1}. ID: ${record.id}, 제목: ${record.title}, 생성일: ${record.created_at}`);
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugStorageFiles();
