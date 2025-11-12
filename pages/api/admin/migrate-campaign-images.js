/**
 * Phase 8: 퍼널 이미지 마이그레이션 API
 * 
 * 로컬 /public/campaigns/ 폴더의 이미지를 Supabase Storage로 업로드
 * - UUID + SEO 파일명으로 정리
 * - 메타데이터 자동 생성
 * - 진행 상황 추적
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// UUID 생성
function generateUUID() {
  return crypto.randomUUID();
}

// SEO 친화적 파일명 생성
function generateSEOFilename(originalName, metadata = {}) {
  // 파일 확장자 추출
  const ext = path.extname(originalName).toLowerCase();
  const nameWithoutExt = path.basename(originalName, ext);
  
  // 파일명 정리 (특수문자 제거, 공백을 하이픈으로)
  let seoName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // 메타데이터에서 키워드 추출하여 파일명에 포함 (선택)
  if (metadata.keywords && metadata.keywords.length > 0) {
    const keyword = metadata.keywords[0].toLowerCase().replace(/\s+/g, '-');
    if (keyword.length > 0 && !seoName.includes(keyword)) {
      seoName = `${keyword}-${seoName}`;
    }
  }
  
  return seoName;
}

// 파일 해시 계산
function calculateFileHash(fileBuffer) {
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// 골프 이미지인지 판단
function isGolfImage(fileName, folderPath = '') {
  const nameLower = fileName.toLowerCase();
  const folderLower = folderPath.toLowerCase();
  
  return nameLower.includes('golf') ||
         nameLower.includes('골프') ||
         nameLower.includes('driver') ||
         nameLower.includes('club') ||
         nameLower.includes('swing') ||
         folderLower.includes('golf') ||
         folderLower.includes('골프');
}

// 이미지 메타데이터 생성 (골프 AI 생성 일괄 기능 활용)
async function generateMetadata(imageUrl, fileName, folderPath) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isGolf = isGolfImage(fileName, folderPath);
    const apiEndpoint = isGolf ? '/api/analyze-image-prompt' : '/api/analyze-image-general';
    
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        title: fileName.replace(/\.[^/.]+$/, ''),
        excerpt: '퍼널 이미지',
      }),
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
    
    return {
      alt_text: data.alt_text || data.alt || '',
      title: data.title || fileName.replace(/\.[^/.]+$/, ''),
      description: data.description || '',
      keywords: keywords,
      age_estimation: data.age_estimation || null,
    };
  } catch (error) {
    console.error('❌ 메타데이터 생성 오류:', error);
    return null;
  }
}

// 로컬 이미지 파일 읽기
function readLocalImage(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`❌ 파일 읽기 오류 (${filePath}):`, error);
    return null;
  }
}

// 이미지 업로드 및 메타데이터 저장
async function uploadAndSaveMetadata(
  fileBuffer,
  originalPath,
  storagePath,
  fileName,
  month
) {
  try {
    // 1. Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: `image/${path.extname(fileName).slice(1)}`,
        upsert: false,
      });

    if (uploadError) {
      // 이미 존재하는 경우 무시
      if (uploadError.message.includes('already exists') || uploadError.statusCode === '409') {
        return {
          success: true,
          uploaded: false,
          message: '이미 존재하는 파일입니다.',
          storagePath,
        };
      }
      throw uploadError;
    }

    // 2. 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    // 3. 메타데이터 생성 (비동기, 타임아웃 8초)
    const metadataPromise = generateMetadata(imageUrl, fileName, month);
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), 8000);
    });
    
    const metadata = await Promise.race([metadataPromise, timeoutPromise]);

    // 4. 해시 계산
    const hashMd5 = calculateFileHash(fileBuffer);
    const hashSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 5. 데이터베이스에 메타데이터 저장 (image_assets 테이블 스키마에 맞게 수정)
    const imageRecord = {
      filename: path.basename(storagePath), // UUID-파일명 형식
      original_filename: fileName, // 원본 파일명
      file_path: storagePath, // Storage 경로
      file_size: fileBuffer.length,
      mime_type: `image/${path.extname(fileName).slice(1)}`,
      format: path.extname(fileName).slice(1).toLowerCase(),
      hash_md5: hashMd5,
      hash_sha256: hashSha256,
      alt_text: metadata?.alt_text || '',
      title: metadata?.title || fileName.replace(/\.[^/.]+$/, ''),
      description: metadata?.description || '',
      cdn_url: imageUrl, // 공개 URL을 cdn_url에 저장
      upload_source: 'campaign_migration',
      status: 'active',
    };

    // keywords는 ai_tags JSONB 필드에 저장
    if (metadata?.keywords && metadata.keywords.length > 0) {
      imageRecord.ai_tags = metadata.keywords;
    }

    const { data: dbData, error: dbError } = await supabase
      .from('image_assets')
      .insert(imageRecord)
      .select()
      .single();

    if (dbError) {
      console.error('❌ 데이터베이스 저장 오류:', dbError);
      console.error('저장 시도한 데이터:', imageRecord);
      // 업로드는 성공했으므로 계속 진행
      return {
        success: true,
        uploaded: true,
        storagePath,
        imageUrl,
        metadata: metadata || {},
        dbRecord: null,
        dbError: dbError.message,
      };
    }

    return {
      success: true,
      uploaded: true,
      storagePath,
      imageUrl,
      metadata: metadata || {},
      dbRecord: dbData,
    };
  } catch (error) {
    console.error('❌ 업로드 오류:', error);
    return {
      success: false,
      error: error.message,
      storagePath,
    };
  }
}

// 메인 핸들러
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, forceUpload = false } = req.body;
    
    if (!month) {
      return res.status(400).json({ error: 'month 파라미터가 필요합니다.' });
    }

    // 로컬 이미지 경로
    const campaignsDir = path.join(process.cwd(), 'public', 'campaigns');
    const monthDir = path.join(campaignsDir, month);

    if (!fs.existsSync(monthDir)) {
      return res.status(404).json({ error: `폴더를 찾을 수 없습니다: ${month}` });
    }

    // 이미지 파일 목록 수집
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4'];
    const imageFiles = [];

    function scanDirectory(dir, relativePath = '') {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativeFilePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.isDirectory()) {
          scanDirectory(fullPath, relativeFilePath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (imageExtensions.includes(ext)) {
            imageFiles.push({
              fullPath,
              relativePath: relativeFilePath,
              fileName: item.name,
              month,
            });
          }
        }
      }
    }

    scanDirectory(monthDir);

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: '이미지 파일을 찾을 수 없습니다.' });
    }

    // 업로드 결과
    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 배치 업로드 (한 번에 5개씩)
    const batchSize = 5;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (file) => {
        // 파일 읽기
        const fileBuffer = readLocalImage(file.fullPath);
        if (!fileBuffer) {
          return {
            fileName: file.fileName,
            success: false,
            error: '파일 읽기 실패',
          };
        }

        // UUID 생성
        const uuid = generateUUID();
        
        // SEO 파일명 생성
        const seoName = generateSEOFilename(file.fileName);
        
        // Storage 경로 생성
        const storagePath = `originals/campaigns/${month}/${uuid}-${seoName}${path.extname(file.fileName)}`;

        // 중복 확인 (해시 기반)
        const hashMd5 = calculateFileHash(fileBuffer);
        const { data: existing } = await supabase
          .from('image_assets')
          .select('id, original_path, storage_url')
          .eq('hash_md5', hashMd5)
          .single();

        if (existing && !forceUpload) {
          return {
            fileName: file.fileName,
            success: true,
            uploaded: false,
            message: '중복 이미지 (이미 존재)',
            existingPath: existing.original_path,
            existingUrl: existing.storage_url,
          };
        }

        // 업로드 및 메타데이터 저장
        const result = await uploadAndSaveMetadata(
          fileBuffer,
          file.relativePath,
          storagePath,
          file.fileName,
          month
        );

        return {
          fileName: file.fileName,
          ...result,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 통계 업데이트
      batchResults.forEach((result) => {
        if (result.success) {
          if (result.uploaded) {
            successCount++;
          } else {
            skipCount++;
          }
        } else {
          errorCount++;
        }
      });

      // 진행 상황 로그
      console.log(`진행 상황: ${Math.min(i + batchSize, imageFiles.length)}/${imageFiles.length} 완료`);
    }

    return res.status(200).json({
      success: true,
      message: '퍼널 이미지 마이그레이션 완료',
      month,
      summary: {
        total: imageFiles.length,
        uploaded: successCount,
        skipped: skipCount,
        errors: errorCount,
      },
      results,
    });
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    return res.status(500).json({
      error: '마이그레이션 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
}








