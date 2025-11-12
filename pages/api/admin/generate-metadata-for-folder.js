/**
 * Phase 8: 폴더별 메타데이터 생성 API
 * 
 * 특정 폴더의 메타데이터 없는 이미지에 대해 AI 메타데이터를 생성합니다.
 * hash_md5, hash_sha256도 함께 계산하여 저장합니다.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 골프 이미지인지 일반 이미지인지 판단
function isGolfImage(fileName, folderPath = '') {
  const urlLower = (fileName || '').toLowerCase();
  const folderLower = (folderPath || '').toLowerCase();
  
  return urlLower.includes('golf') || 
         urlLower.includes('골프') ||
         urlLower.includes('driver') ||
         urlLower.includes('club') ||
         urlLower.includes('swing') ||
         folderLower.includes('golf') ||
         folderLower.includes('골프');
}

// 이미지 다운로드 및 해시 계산
async function downloadImageAndCalculateHash(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    const hashMd5 = crypto.createHash('md5').update(buffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return { buffer, hashMd5, hashSha256 };
  } catch (error) {
    console.error('❌ 이미지 다운로드/해시 계산 오류:', error);
    return null;
  }
}

// AI 메타데이터 생성
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
    };
  } catch (error) {
    console.error('❌ 메타데이터 생성 오류:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folderPath, limit = 50 } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath가 필요합니다.' });
    }

    console.log(`📝 폴더별 메타데이터 생성 시작: ${folderPath}`);

    // 1. Storage에서 폴더의 모든 파일 조회
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 1000 });

    if (storageError) {
      return res.status(500).json({ error: `Storage 조회 실패: ${storageError.message}` });
    }

    // 이미지 파일만 필터링
    const imageFiles = storageFiles.filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
             ext.endsWith('.gif') || ext.endsWith('.webp') || ext.endsWith('.mp4');
    }).filter(f => f.name !== '.keep.png');

    console.log(`📦 발견된 이미지 파일: ${imageFiles.length}개`);

    // 2. DB에서 메타데이터가 없는 이미지 찾기
    const missingMetadata = [];
    const imageUrls = imageFiles.map(f => {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}/${f.name}`);
      return data.publicUrl;
    });

    // image_assets 테이블에서 확인
    const { data: existingImages, error: dbError } = await supabase
      .from('image_assets')
      .select('cdn_url, hash_md5')
      .in('cdn_url', imageUrls);

    if (dbError) {
      console.warn('⚠️ DB 조회 오류:', dbError.message);
    }

    const existingUrls = new Set((existingImages || []).map(img => img.cdn_url));
    const existingHashes = new Set((existingImages || []).map(img => img.hash_md5).filter(Boolean));

    for (const file of imageFiles) {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}/${file.name}`);
      const imageUrl = data.publicUrl;

      // 메타데이터가 없거나 hash_md5가 없는 경우
      if (!existingUrls.has(imageUrl)) {
        missingMetadata.push({
          name: file.name,
          url: imageUrl,
          path: `${folderPath}/${file.name}`,
          size: file.metadata?.size || 0,
        });
      }
    }

    console.log(`🔍 메타데이터 없는 이미지: ${missingMetadata.length}개`);

    if (missingMetadata.length === 0) {
      return res.status(200).json({
        success: true,
        message: '모든 이미지에 메타데이터가 있습니다.',
        processed: 0,
        skipped: imageFiles.length,
      });
    }

    // 3. 메타데이터 생성 (제한 적용)
    const processLimit = Math.min(limit, missingMetadata.length);
    const results = [];
    let successCount = 0;
    let failCount = 0;
    let golfCount = 0;
    let generalCount = 0;

    console.log(`📝 메타데이터 생성 시작 (${processLimit}개)...`);

    for (let i = 0; i < processLimit; i++) {
      const image = missingMetadata[i];

      try {
        // 이미지 다운로드 및 해시 계산
        const hashResult = await downloadImageAndCalculateHash(image.url);
        if (!hashResult) {
          failCount++;
          results.push({
            name: image.name,
            status: 'error',
            error: '이미지 다운로드 실패',
          });
          continue;
        }

        // 중복 확인 (hash_md5 기반) - 다른 폴더에 이미 존재하는 경우
        if (existingHashes.has(hashResult.hashMd5)) {
          console.log(`⚠️ 중복 이미지 발견 (hash_md5): ${image.name}`);
          // DB에서 기존 이미지 조회하여 메타데이터 연결
          const { data: existingImage } = await supabase
            .from('image_assets')
            .select('id, filename, file_path, cdn_url, alt_text, title, description, ai_tags')
            .eq('hash_md5', hashResult.hashMd5)
            .limit(1)
            .single();
          
          if (existingImage) {
            // 기존 메타데이터를 현재 파일에도 연결 (새 레코드 생성)
            const imageRecord = {
              filename: image.name,
              original_filename: originalFilename,
              file_path: image.path,
              file_size: image.size,
              mime_type: `image/${image.name.split('.').pop()?.toLowerCase() || 'jpeg'}`,
              format: image.name.split('.').pop()?.toLowerCase() || 'jpeg',
              hash_md5: hashResult.hashMd5,
              hash_sha256: hashResult.hashSha256,
              alt_text: existingImage.alt_text || '',
              title: existingImage.title || originalFilename.replace(/\.[^/.]+$/, ''),
              description: existingImage.description || '',
              cdn_url: image.url,
              upload_source: 'campaign_migration',
              status: 'active',
            };
            
            if (existingImage.ai_tags && Array.isArray(existingImage.ai_tags)) {
              imageRecord.ai_tags = existingImage.ai_tags;
            }
            
            const { error: insertError } = await supabase
              .from('image_assets')
              .insert(imageRecord);
            
            if (insertError) {
              // hash_md5 unique constraint 오류는 무시 (이미 다른 파일에 존재)
              if (insertError.message.includes('hash_md5_key')) {
                console.log(`  ℹ️  hash_md5가 이미 다른 파일에 존재: ${image.name}`);
                results.push({
                  name: image.name,
                  status: 'skipped',
                  reason: 'hash_md5가 이미 다른 파일에 존재',
                });
                continue;
              }
              failCount++;
              results.push({
                name: image.name,
                status: 'error',
                error: insertError.message,
              });
            } else {
              successCount++;
              results.push({
                name: image.name,
                status: 'success',
                hash_md5: hashResult.hashMd5,
                metadata: '기존 메타데이터 재사용',
              });
            }
          } else {
            results.push({
              name: image.name,
              status: 'skipped',
              reason: '중복 이미지 (hash_md5) - 기존 메타데이터 없음',
            });
          }
          continue;
        }

        // 골프 이미지인지 판단
        const isGolf = isGolfImage(image.name, folderPath);
        if (isGolf) golfCount++;
        else generalCount++;

        // AI 메타데이터 생성
        let metadata = await generateMetadata(image.url, image.name, folderPath);
        
        if (!metadata) {
          // AI 분석 실패 시 파일명 기반 기본 메타데이터
          const filenameKeywords = image.name
            .replace(/\.[^/.]+$/, '')
            .split(/[-_]/)
            .filter(part => part.length > 2);

          metadata = {
            alt_text: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 3).join(' ')} 이미지 - 마스골프` 
              : `${image.name.replace(/\.[^/.]+$/, '')} 이미지`,
            title: image.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 5).join(', ')} 관련 이미지입니다.` 
              : (isGolf ? '골프 관련 이미지' : '일반 이미지'),
            keywords: filenameKeywords,
          };
        }

        // UUID 추출 (파일명에서)
        const uuidMatch = image.name.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})-/);
        const uuid = uuidMatch ? uuidMatch[1] : null;

        // 원본 파일명 추출 (UUID 제거)
        const originalFilename = uuid 
          ? image.name.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, '')
          : image.name;

        // image_assets 테이블에 저장
        const imageRecord = {
          filename: image.name,
          original_filename: originalFilename,
          file_path: image.path,
          file_size: image.size,
          mime_type: `image/${image.name.split('.').pop()?.toLowerCase() || 'jpeg'}`,
          format: image.name.split('.').pop()?.toLowerCase() || 'jpeg',
          hash_md5: hashResult.hashMd5,
          hash_sha256: hashResult.hashSha256,
          alt_text: metadata.alt_text || '',
          title: metadata.title || originalFilename.replace(/\.[^/.]+$/, ''),
          description: metadata.description || '',
          cdn_url: image.url,
          upload_source: 'campaign_migration',
          status: 'active',
        };

        if (metadata.keywords && metadata.keywords.length > 0) {
          imageRecord.ai_tags = metadata.keywords;
        }

        const { error: insertError } = await supabase
          .from('image_assets')
          .insert(imageRecord);

        if (insertError) {
          console.error(`❌ DB 저장 실패 (${image.name}):`, insertError.message);
          failCount++;
          results.push({
            name: image.name,
            status: 'error',
            error: insertError.message,
          });
        } else {
          successCount++;
          existingHashes.add(hashResult.hashMd5); // 중복 체크용
          results.push({
            name: image.name,
            status: 'success',
            hash_md5: hashResult.hashMd5,
            metadata: {
              alt_text: metadata.alt_text,
              title: metadata.title,
              keywords: metadata.keywords,
            },
          });
          console.log(`✅ 메타데이터 생성 완료 (${successCount}/${processLimit}): ${image.name}`);
        }

        // API 호출 제한 방지
        await new Promise(resolve => setTimeout(resolve, 400));

      } catch (error) {
        console.error(`❌ 이미지 처리 오류 (${image.name}):`, error);
        failCount++;
        results.push({
          name: image.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        total: imageFiles.length,
        missing: missingMetadata.length,
        processed: processLimit,
        success: successCount,
        failed: failCount,
        golfCount,
        generalCount,
      },
      results,
    });

  } catch (error) {
    console.error('❌ 폴더별 메타데이터 생성 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}








