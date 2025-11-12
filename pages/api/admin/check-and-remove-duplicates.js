/**
 * Phase 8: 폴더별 중복 이미지 감지 및 제거 API
 * 
 * 특정 폴더의 중복 이미지를 감지하고, 사용 현황을 확인한 후 안전하게 제거합니다.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 다운로드 및 해시 계산
async function downloadAndCalculateHash(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`이미지 다운로드 실패: ${error.message}`);
    }
    
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const hashMd5 = crypto.createHash('md5').update(buffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return { hashMd5, hashSha256, size: buffer.length };
  } catch (error) {
    console.error(`❌ 이미지 다운로드 오류 (${filePath}):`, error.message);
    return null;
  }
}

// HTML 파일에서 이미지 경로 추출
function extractImagePathsFromHTML(htmlContent) {
  const imagePaths = [];
  
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  
  return imagePaths;
}

// 블로그 본문에서 이미지 URL 추출
function extractImageUrlsFromMarkdown(markdownContent) {
  const imageUrls = [];
  
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(markdownContent)) !== null) {
    imageUrls.push(match[2]);
  }
  
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(markdownContent)) !== null) {
    imageUrls.push(match[1]);
  }
  
  return imageUrls;
}

// 파일명 정규화 (언더스코어 제거, 소문자 변환, 확장자 제거)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// 이미지 URL이 특정 파일과 일치하는지 확인
function matchesImage(imageUrl, filePath, fileName) {
  if (!imageUrl) return false;
  
  // 1. Supabase Storage URL에서 파일 경로 추출
  // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/originals/campaigns/2025-05/xxx.jpg
  const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (storageUrlMatch) {
    const storagePath = decodeURIComponent(storageUrlMatch[1]);
    if (storagePath === filePath) return true;
    // 파일명만 비교
    const storageFileName = storagePath.split('/').pop();
    if (storageFileName === fileName) return true;
    
    // 정규화된 파일명 비교
    const normalizedStorage = normalizeFileName(storageFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedStorage && normalizedFile && normalizedStorage === normalizedFile) return true;
  }
  
  // 2. 상대 경로 처리 (/campaigns/2025-05/...)
  if (imageUrl.startsWith('/campaigns/') || imageUrl.startsWith('/originals/')) {
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    if (filePath.includes(relativePath) || relativePath.includes(filePath)) return true;
    
    // 파일명만 비교
    const relativeFileName = relativePath.split('/').pop().split('?')[0];
    if (relativeFileName === fileName) return true;
    
    // 정규화된 파일명 비교
    const normalizedRelative = normalizeFileName(relativeFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedRelative && normalizedFile && normalizedRelative === normalizedFile) return true;
  }
  
  // 3. 직접 파일명 비교
  const urlFileName = imageUrl.split('/').pop().split('?')[0];
  if (urlFileName === fileName) return true;
  if (imageUrl.includes(filePath)) return true;
  
  // 정규화된 파일명 비교
  const normalizedUrl = normalizeFileName(urlFileName);
  const normalizedFile = normalizeFileName(fileName);
  if (normalizedUrl && normalizedFile && normalizedUrl === normalizedFile) return true;
  
  // 4. UUID 제거 후 파일명 비교
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const urlMatch = urlFileName.match(uuidPattern);
  const fileMatch = fileName.match(uuidPattern);
  
  if (urlMatch && fileMatch) {
    if (urlMatch[1] === fileMatch[1]) return true;
    // 정규화된 비교
    const normalizedUrlBase = normalizeFileName(urlMatch[1]);
    const normalizedFileBase = normalizeFileName(fileMatch[1]);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  // 5. UUID 제거 후 원본 파일명 비교
  if (urlMatch) {
    const urlBaseName = urlMatch[1];
    // fileName에서 UUID 제거
    const fileBaseName = fileName.replace(uuidPattern, '$1');
    if (urlBaseName === fileBaseName) return true;
    
    // 정규화된 비교
    const normalizedUrlBase = normalizeFileName(urlBaseName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  // 6. fileName에서 UUID 제거 후 비교
  if (fileMatch) {
    const fileBaseName = fileMatch[1];
    const normalizedUrlBase = normalizeFileName(urlFileName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folderPath, action = 'check' } = req.body; // 'check' 또는 'remove'

    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath가 필요합니다.' });
    }

    console.log(`🔍 폴더별 중복 감지 및 제거: ${folderPath} (action: ${action})`);

    // 1. Storage에서 모든 파일 조회
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 1000 });

    if (storageError) {
      return res.status(500).json({ error: `Storage 조회 실패: ${storageError.message}` });
    }

    const imageFiles = storageFiles.filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
             ext.endsWith('.gif') || ext.endsWith('.webp') || ext.endsWith('.mp4');
    }).filter(f => f.name !== '.keep.png');

    // 2. hash_md5 계산
    const fileHashes = [];
    const hashMap = new Map();

    for (const file of imageFiles) {
      const filePath = `${folderPath}/${file.name}`;
      const hashResult = await downloadAndCalculateHash(filePath);
      
      if (hashResult) {
        const fileInfo = {
          name: file.name,
          path: filePath,
          hash_md5: hashResult.hashMd5,
          hash_sha256: hashResult.hashSha256,
          size: hashResult.size,
        };
        
        fileHashes.push(fileInfo);
        
        if (hashMap.has(hashResult.hashMd5)) {
          hashMap.get(hashResult.hashMd5).push(fileInfo);
        } else {
          hashMap.set(hashResult.hashMd5, [fileInfo]);
        }
      }
    }

    // 3. 중복 그룹 찾기
    const duplicateGroups = [];
    hashMap.forEach((group, hash) => {
      if (group.length > 1) {
        duplicateGroups.push({ hash_md5: hash, count: group.length, files: group });
      }
    });

    // 4. 사용 현황 확인 (action이 'check'인 경우만)
    let usageResults = [];
    let safeToRemove = [];

    if (action === 'check' || action === 'remove') {
      // HTML 파일 확인
      const versionsDir = path.join(process.cwd(), 'public', 'versions');
      let htmlFiles = [];
      try {
        if (fs.existsSync(versionsDir)) {
          htmlFiles = fs.readdirSync(versionsDir).filter(f => f.endsWith('.html'));
        }
      } catch (error) {
        console.warn('⚠️ HTML 파일 디렉토리 읽기 실패:', error.message);
      }

      const htmlUsage = {};
      for (const htmlFile of htmlFiles) {
        const htmlPath = path.join(versionsDir, htmlFile);
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const imagePaths = extractImagePathsFromHTML(htmlContent);
        htmlUsage[htmlFile] = imagePaths;
      }

      // 블로그 본문 확인
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('id, title, content')
        .not('content', 'is', null);

      // 각 중복 그룹의 사용 현황 확인
      for (const group of duplicateGroups) {
        const groupUsage = {
          hash_md5: group.hash_md5,
          files: [],
        };

        for (const file of group.files) {
          const fileUsage = {
            name: file.name,
            path: file.path,
            usedIn: {
              htmlFiles: [],
              blogPosts: [],
              totalCount: 0,
            },
          };

          // HTML 파일에서 사용 확인
          for (const [htmlFile, imagePaths] of Object.entries(htmlUsage)) {
            for (const imagePath of imagePaths) {
              if (matchesImage(imagePath, file.path, file.name)) {
                fileUsage.usedIn.htmlFiles.push(htmlFile);
                fileUsage.usedIn.totalCount++;
              }
            }
          }

          // 블로그 본문에서 사용 확인
          if (blogPosts) {
            for (const post of blogPosts) {
              if (!post.content) continue;
              
              const imageUrls = extractImageUrlsFromMarkdown(post.content);
              for (const imageUrl of imageUrls) {
                if (matchesImage(imageUrl, file.path, file.name)) {
                  fileUsage.usedIn.blogPosts.push({
                    id: post.id,
                    title: post.title,
                  });
                  fileUsage.usedIn.totalCount++;
                }
              }
            }
          }

          groupUsage.files.push(fileUsage);
        }

        usageResults.push(groupUsage);

        // 안전하게 제거 가능한 파일 식별
        const usedFiles = groupUsage.files.filter(f => f.usedIn.totalCount > 0);
        const unusedFiles = groupUsage.files.filter(f => f.usedIn.totalCount === 0);
        
        if (usedFiles.length > 0 && unusedFiles.length > 0) {
          unusedFiles.forEach(file => {
            safeToRemove.push({
              ...file,
              keepFile: usedFiles[0].name,
            });
          });
        } else if (usedFiles.length === 0 && unusedFiles.length > 0) {
          unusedFiles.slice(1).forEach(file => {
            safeToRemove.push({
              ...file,
              keepFile: unusedFiles[0].name,
            });
          });
        }
      }
    }

    // 5. 중복 제거 실행 (action이 'remove'인 경우)
    let removeResults = null;
    if (action === 'remove' && safeToRemove.length > 0) {
      const deleted = [];
      const failed = [];

      for (const file of safeToRemove) {
        try {
          // Storage에서 파일 삭제
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([file.path]);

          if (storageError) {
            failed.push({
              name: file.name,
              path: file.path,
              error: storageError.message,
            });
            continue;
          }

          // DB에서 메타데이터 삭제
          await supabase
            .from('image_assets')
            .delete()
            .eq('file_path', file.path);

          deleted.push({
            name: file.name,
            path: file.path,
            status: 'deleted',
          });
        } catch (error) {
          failed.push({
            name: file.name,
            path: file.path,
            error: error.message,
          });
        }
      }

      removeResults = {
        deleted: deleted.length,
        failed: failed.length,
        details: { deleted, failed },
      };
    }

    return res.status(200).json({
      success: true,
      folderPath,
      action,
      summary: {
        totalFiles: imageFiles.length,
        filesWithHash: fileHashes.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, dup) => sum + dup.count, 0),
        safeToRemove: safeToRemove.length,
      },
      duplicateGroups: duplicateGroups.map(dup => ({
        hash_md5: dup.hash_md5,
        count: dup.count,
        files: dup.files.map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
        })),
      })),
      usageResults: action !== 'remove' ? usageResults : undefined,
      safeToRemove: action !== 'remove' ? safeToRemove.map(f => ({
        name: f.name,
        path: f.path,
        keepFile: f.keepFile,
      })) : undefined,
      removeResults,
    });

  } catch (error) {
    console.error('❌ 폴더별 중복 감지 및 제거 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}








