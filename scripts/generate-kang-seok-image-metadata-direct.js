/**
 * 강석 글 이미지 메타 태그 직접 생성
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

async function generateKangSeokImageMetadataDirect() {
  try {
    console.log('🏷️ 강석 글 이미지 메타 태그 생성 시작...\n');
    console.log('='.repeat(80));
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    const publishDate = post.published_at ? new Date(post.published_at) : (post.created_at ? new Date(post.created_at) : new Date());
    const year = publishDate.getFullYear();
    const month = String(publishDate.getMonth() + 1).padStart(2, '0');
    const dateFolder = `${year}-${month}`;
    const targetFolder = `originals/blog/${dateFolder}/${post.id}`;
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📁 폴더: ${targetFolder}\n`);
    
    // 2. 폴더의 이미지 파일 조회
    const { data: folderFiles, error: folderError } = await supabase.storage
      .from('blog-images')
      .list(targetFolder);
    
    if (folderError) {
      console.error(`❌ 폴더 조회 실패: ${folderError.message}`);
      return;
    }
    
    const imageFiles = (folderFiles || []).filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
             ext.endsWith('.gif') || ext.endsWith('.webp');
    });
    
    console.log(`📸 발견된 이미지: ${imageFiles.length}개\n`);
    
    // 3. 각 이미지의 메타 태그 확인 및 생성
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (const file of imageFiles) {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`${targetFolder}/${file.name}`);
      
      const imageUrl = urlData.publicUrl;
      
      console.log(`\n📸 처리 중: ${file.name}`);
      console.log(`   URL: ${imageUrl}`);
      
      // image_assets 테이블에서 확인
      const { data: existingImage, error: checkError } = await supabase
        .from('image_assets')
        .select('*')
        .eq('cdn_url', imageUrl)
        .single();
      
      if (existingImage && existingImage.alt_text && existingImage.title) {
        console.log(`   ✅ 메타 태그 이미 존재`);
        console.log(`   Alt: ${existingImage.alt_text}`);
        console.log(`   Title: ${existingImage.title}`);
        continue;
      }
      
      // 메타 태그 생성
      try {
        const isGolf = true; // 골프 관련 이미지
        const apiEndpoint = isGolf ? '/api/analyze-image-prompt' : '/api/analyze-image-general';
        
        const response = await fetch(`${baseUrl}${apiEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            excerpt: '강석과 함께한 마쓰구골프 시타 체험 이미지'
          })
        });
        
        if (!response.ok) {
          throw new Error(`이미지 분석 실패: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 키워드 처리
        let keywords = [];
        if (data.keywords) {
          if (typeof data.keywords === 'string') {
            keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
          } else if (Array.isArray(data.keywords)) {
            keywords = data.keywords;
          }
        }
        
        const metadata = {
          alt_text: data.alt_text || data.alt || '',
          title: data.title || file.name.replace(/\.[^/.]+$/, ''),
          description: data.description || '',
          keywords: keywords
        };
        
        console.log(`   ✅ 메타 태그 생성 완료`);
        console.log(`   Alt: ${metadata.alt_text}`);
        console.log(`   Title: ${metadata.title}`);
        
        // image_assets 테이블에 저장 또는 업데이트
        if (existingImage) {
          // 업데이트
          const { error: updateError } = await supabase
            .from('image_assets')
            .update({
              alt_text: metadata.alt_text,
              title: metadata.title,
              description: metadata.description,
              keywords: keywords.join(', ')
            })
            .eq('id', existingImage.id);
          
          if (updateError) {
            console.log(`   ⚠️ 업데이트 실패: ${updateError.message}`);
            failCount++;
          } else {
            successCount++;
          }
        } else {
          // 새로 생성
          const { error: insertError } = await supabase
            .from('image_assets')
            .insert({
              filename: file.name,
              cdn_url: imageUrl,
              storage_path: `${targetFolder}/${file.name}`,
              alt_text: metadata.alt_text,
              title: metadata.title,
              description: metadata.description,
              keywords: keywords.join(', '),
              category: 'blog',
              folder_path: targetFolder
            });
          
          if (insertError) {
            console.log(`   ⚠️ 저장 실패: ${insertError.message}`);
            failCount++;
          } else {
            successCount++;
          }
        }
        
        processedCount++;
        
      } catch (error) {
        console.log(`   ❌ 메타 태그 생성 실패: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 최종 결과:');
    console.log(`   처리된 이미지: ${processedCount}개`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   실패: ${failCount}개`);
    console.log('='.repeat(80));
    console.log('✅ 작업 완료!\n');
    
    return {
      processedCount,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  generateKangSeokImageMetadataDirect()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { generateKangSeokImageMetadataDirect };

