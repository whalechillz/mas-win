import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deletionCandidates, selectedHashes } = req.body;
    
    if (!deletionCandidates || !Array.isArray(deletionCandidates)) {
      return res.status(400).json({ error: 'deletionCandidates 배열이 필요합니다.' });
    }
    
    if (!selectedHashes || !Array.isArray(selectedHashes) || selectedHashes.length === 0) {
      return res.status(400).json({ error: '삭제할 그룹을 선택해주세요.' });
    }
    
    console.log(`🗑️ 블로그 중복 이미지 삭제 시작: ${selectedHashes.length}개 그룹`);
    
    const results = {
      success: [],
      failed: [],
      totalDeleted: 0,
      totalSpaceSaved: 0
    };
    
    // URL 매핑: 삭제된 이미지 URL -> 보존된 이미지 URL
    const urlMapping = new Map();
    
    // 선택된 해시에 해당하는 그룹만 처리
    const groupsToProcess = deletionCandidates.filter(group => 
      selectedHashes.includes(group.hash_md5)
    );
    
    // 1단계: URL 매핑 생성 (삭제 전에 매핑 정보 수집)
    for (const group of groupsToProcess) {
      const keepUrl = group.imagesToKeep[0]?.url;
      if (keepUrl) {
        for (const img of group.imagesToRemove) {
          if (img.url) {
            urlMapping.set(img.url, keepUrl);
          }
        }
      }
    }
    
    // 2단계: Storage에서 파일 삭제
    for (const group of groupsToProcess) {
      for (const img of group.imagesToRemove) {
        try {
          // Storage에서 파일 삭제
          if (img.path) {
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove([img.path]);
            
            if (deleteError) {
              throw new Error(deleteError.message);
            }
            
            results.success.push({
              hash_md5: group.hash_md5,
              path: img.path,
              fileName: img.fileName,
              url: img.url
            });
            
            results.totalDeleted++;
            results.totalSpaceSaved += img.size || 0;
            
            console.log(`✅ 삭제 완료: ${img.fileName}`);
          } else {
            throw new Error('파일 경로가 없습니다.');
          }
        } catch (error) {
          results.failed.push({
            hash_md5: group.hash_md5,
            path: img.path,
            fileName: img.fileName,
            url: img.url,
            error: error.message
          });
          
          console.error(`❌ 삭제 실패: ${img.fileName} - ${error.message}`);
        }
      }
    }
    
    // 3단계: 블로그 글의 content에서 삭제된 이미지 URL을 보존된 이미지 URL로 교체
    const blogUpdateResults = {
      updated: 0,
      failed: 0,
      posts: []
    };
    
    if (urlMapping.size > 0) {
      console.log(`\n📝 블로그 글 URL 업데이트 시작: ${urlMapping.size}개 URL 매핑`);
      
      // 모든 블로그 글 조회
      const { data: allPosts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, title, content, featured_image');
      
      if (postsError) {
        console.error('❌ 블로그 글 조회 실패:', postsError);
      } else {
        for (const post of allPosts || []) {
          let updatedContent = post.content || '';
          let updatedFeaturedImage = post.featured_image || '';
          let contentUpdated = false;
          let featuredUpdated = false;
          
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
            }
            
            // 마크다운 이미지 업데이트
            const markdownImgPattern = new RegExp(
              `(!\\[[^\\]]*\\]\\()${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\))`, 
              'gi'
            );
            if (markdownImgPattern.test(updatedContent)) {
              updatedContent = updatedContent.replace(markdownImgPattern, `$1${newUrl}$2`);
              contentUpdated = true;
            }
            
            // featured_image 업데이트
            if (updatedFeaturedImage === oldUrl) {
              updatedFeaturedImage = newUrl;
              featuredUpdated = true;
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
              
              blogUpdateResults.updated++;
              blogUpdateResults.posts.push({
                id: post.id,
                title: post.title,
                contentUpdated,
                featuredUpdated
              });
              
              console.log(`✅ 블로그 글 업데이트: ${post.id} - ${post.title.substring(0, 30)}...`);
            } catch (error) {
              blogUpdateResults.failed++;
              console.error(`❌ 블로그 글 업데이트 실패 (${post.id}):`, error.message);
            }
          }
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      summary: {
        totalGroups: groupsToProcess.length,
        totalDeleted: results.totalDeleted,
        totalFailed: results.failed.length,
        totalSpaceSaved: results.totalSpaceSaved,
        blogPostsUpdated: blogUpdateResults.updated,
        blogPostsFailed: blogUpdateResults.failed
      },
      results: {
        success: results.success,
        failed: results.failed,
        blogUpdates: blogUpdateResults.posts
      }
    });
    
  } catch (error) {
    console.error('❌ 블로그 중복 이미지 삭제 오류:', error);
    return res.status(500).json({ 
      error: '블로그 중복 이미지 삭제 실패',
      details: error.message 
    });
  }
}

