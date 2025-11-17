import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handleImageUpload(req, res);
    case 'GET':
      return handleImageSearch(req, res);
    case 'PUT':
      return handleImageUpdate(req, res);
    case 'DELETE':
      return handleImageDelete(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// 이미지 업로드 및 자산 등록
async function handleImageUpload(req, res) {
  try {
    const { 
      imageUrl, 
      originalFilename, 
      uploadSource = 'manual',
      uploadedBy = 'admin',
      forceUpload = false 
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    console.log('📤 이미지 자산 등록 시작:', imageUrl);

    // 1. 이미지 다운로드 및 해시 계산
    const imageBuffer = await downloadImage(imageUrl);
    const hashMd5 = crypto.createHash('md5').update(imageBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // 2. 중복 이미지 확인
    const { data: existingImage } = await supabase
      .from('image_assets')
      .select('*')
      .eq('hash_md5', hashMd5)
      .single();

    if (existingImage && !forceUpload) {
      console.log('⚠️ 중복 이미지 발견:', existingImage.id);
      
      // 사용 통계 업데이트
      await updateImageUsage(existingImage.id);
      
      return res.status(200).json({
        success: true,
        image: existingImage,
        isDuplicate: true,
        message: '이미 존재하는 이미지입니다.'
      });
    }

    // 3. 이미지 메타데이터 추출
    const metadata = await extractImageMetadata(imageBuffer);
    
    // 4. 파일명 생성 (SEO 친화적)
    const seoFilename = generateSEOFilename(originalFilename, metadata);
    
    // 5. Supabase Storage에 업로드
    const uploadResult = await uploadToSupabase(imageBuffer, seoFilename);
    
    // 6. 데이터베이스에 메타데이터 저장
    const imageRecord = await saveImageMetadata({
      filename: seoFilename,
      originalFilename,
      filePath: uploadResult.path,
      fileSize: imageBuffer.length,
      mimeType: metadata.mimeType,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hashMd5,
      hashSha256,
      uploadSource,
      uploadedBy,
      cdnUrl: uploadResult.publicUrl
    });

    // 7. AI 분석 트리거 (비동기)
    triggerAIAnalysis(imageRecord.id, uploadResult.publicUrl);

    // 8. 이미지 최적화 버전 생성 (비동기)
    generateOptimizedVersions(imageRecord.id, imageBuffer, seoFilename);

    console.log('✅ 이미지 자산 등록 완료:', imageRecord.id);

    return res.status(200).json({
      success: true,
      image: imageRecord,
      isDuplicate: false,
      message: '이미지가 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 업로드 오류:', error);
    return res.status(500).json({
      error: '이미지 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 검색
async function handleImageSearch(req, res) {
  try {
    const { 
      query, 
      tags, 
      format, 
      minWidth, 
      minHeight, 
      uploadSource,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 24
    } = req.query;

    console.log('🔍 이미지 검색:', { query, tags, format });

    let supabaseQuery = supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active');

    // 텍스트 검색
    if (query) {
      supabaseQuery = supabaseQuery.or(`
        alt_text.ilike.%${query}%,
        title.ilike.%${query}%,
        caption.ilike.%${query}%,
        description.ilike.%${query}%,
        ai_text_extracted.ilike.%${query}%
      `);
    }

    // 태그 필터
    if (tags) {
      const tagArray = tags.split(',');
      supabaseQuery = supabaseQuery.in('image_tags.tag_name', tagArray);
    }

    // 포맷 필터
    if (format) {
      supabaseQuery = supabaseQuery.eq('format', format);
    }

    // 크기 필터
    if (minWidth) {
      supabaseQuery = supabaseQuery.gte('width', parseInt(minWidth));
    }
    if (minHeight) {
      supabaseQuery = supabaseQuery.gte('height', parseInt(minHeight));
    }

    // 업로드 소스 필터
    if (uploadSource) {
      supabaseQuery = supabaseQuery.eq('upload_source', uploadSource);
    }

    // 정렬
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    const offset = (parseInt(page) - 1) * parseInt(limit);
    supabaseQuery = supabaseQuery.range(offset, offset + parseInt(limit) - 1);

    const { data: images, error, count } = await supabaseQuery;

    if (error) {
      throw error;
    }

    // 검색 결과 최적화
    const optimizedImages = images.map(image => ({
      ...image,
      thumbnail: getOptimizedUrl(image.cdn_url, 'thumbnail'),
      medium: getOptimizedUrl(image.cdn_url, 'medium'),
      large: getOptimizedUrl(image.cdn_url, 'large')
    }));

    return res.status(200).json({
      success: true,
      images: optimizedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ 이미지 검색 오류:', error);
    return res.status(500).json({
      error: '이미지 검색 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 업데이트
async function handleImageUpdate(req, res) {
  try {
    const { id, altText, title, caption, description, tags } = req.body;

    if (!id) {
      return res.status(400).json({ error: '이미지 ID가 필요합니다.' });
    }

    console.log('📝 이미지 메타데이터 업데이트:', id);

    // 이미지 자산 업데이트
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({
        alt_text: altText,
        title: title,
        caption: caption,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // 태그 업데이트
    if (tags && Array.isArray(tags)) {
      // 기존 태그 삭제
      await supabase
        .from('image_tags')
        .delete()
        .eq('image_id', id)
        .eq('tag_type', 'manual');

      // 새 태그 삽입
      const tagInserts = tags.map(tag => ({
        image_id: id,
        tag_name: tag,
        tag_type: 'manual',
        confidence_score: 1.0
      }));

      await supabase
        .from('image_tags')
        .insert(tagInserts);
    }

    console.log('✅ 이미지 메타데이터 업데이트 완료');

    return res.status(200).json({
      success: true,
      message: '이미지가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 업데이트 오류:', error);
    return res.status(500).json({
      error: '이미지 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 삭제
async function handleImageDelete(req, res) {
  try {
    const { id, permanent = false } = req.body;

    if (!id) {
      return res.status(400).json({ error: '이미지 ID가 필요합니다.' });
    }

    console.log('🗑️ 이미지 삭제 시작:', { id, permanent });

    if (permanent) {
      // 1. 이미지 조회 (에러 처리 포함)
      const { data: image, error: fetchError } = await supabase
        .from('image_assets')
        .select('file_path, filename')
        .eq('id', id)
        .maybeSingle(); // single() 대신 maybeSingle() 사용 (없으면 null 반환)

      if (fetchError) {
        console.error('❌ 이미지 조회 오류:', fetchError);
        throw new Error(`이미지 조회 실패: ${fetchError.message}`);
      }

      if (!image) {
        console.warn('⚠️ 이미지를 찾을 수 없습니다:', id);
        return res.status(404).json({ 
          error: '이미지를 찾을 수 없습니다.',
          success: false
        });
      }

      console.log('📋 삭제할 이미지 정보:', { id, file_path: image.file_path, filename: image.filename });

      // 2. Supabase Storage에서 파일 삭제
      if (image.file_path) {
        const { data: storageData, error: storageError } = await supabase.storage
          .from('blog-images')
          .remove([image.file_path]);

        if (storageError) {
          console.error('❌ Storage 삭제 오류:', storageError);
          // Storage 삭제 실패해도 DB 삭제는 진행 (파일은 수동으로 삭제 필요)
          console.warn('⚠️ Storage 삭제 실패했지만 DB 삭제는 계속 진행합니다.');
        } else {
          console.log('✅ Storage 삭제 성공:', image.file_path);
        }
      }

      // 3. 데이터베이스에서 완전 삭제 (삭제된 행 수 확인)
      const { data: deleteData, error: deleteError } = await supabase
        .from('image_assets')
        .delete()
        .eq('id', id)
        .select('id, file_path, filename, cdn_url'); // 삭제된 행 반환 (cdn_url 포함)

      if (deleteError) {
        console.error('❌ DB 삭제 오류:', deleteError);
        throw new Error(`DB 삭제 실패: ${deleteError.message}`);
      }

      // 4. 삭제 검증 (실제로 삭제되었는지 확인)
      if (!deleteData || deleteData.length === 0) {
        console.warn('⚠️ 삭제된 행이 없습니다:', id);
        // 이미 삭제되었거나 ID가 잘못된 경우
        const { data: verifyData, error: verifyError } = await supabase
          .from('image_assets')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (verifyError) {
          console.error('❌ 검증 중 오류:', verifyError);
          throw new Error(`삭제 검증 실패: ${verifyError.message}`);
        }

        if (verifyData) {
          // 여전히 존재함 - 삭제 실패
          console.error('❌ 삭제 실패: 이미지가 여전히 존재합니다.');
          throw new Error('이미지 삭제에 실패했습니다. 이미지가 여전히 존재합니다.');
        } else {
          // 이미 삭제됨 - 성공으로 처리
          console.log('✅ 이미지가 이미 삭제되어 있었습니다.');
          return res.status(200).json({
            success: true,
            message: '이미지가 이미 삭제되어 있었습니다.',
            alreadyDeleted: true
          });
        }
      }

      console.log('✅ 이미지 삭제 완료:', { id, deletedRows: deleteData.length });

      // ✅ image_metadata 테이블에서도 삭제 (갤러리 표시 제거)
      let metadataDeleted = false;
      if (deleteData && deleteData.length > 0) {
        const deletedAsset = deleteData[0];
        
        // cdn_url로 image_metadata 찾아서 삭제
        if (deletedAsset.cdn_url) {
          const { error: metadataError, count: metadataCount } = await supabase
            .from('image_metadata')
            .delete()
            .eq('image_url', deletedAsset.cdn_url);
          
          if (metadataError) {
            console.warn('⚠️ image_metadata 삭제 실패 (cdn_url):', metadataError);
          } else {
            metadataDeleted = true;
            console.log(`✅ image_metadata 삭제 성공 (cdn_url): ${metadataCount || 0}개 행 삭제됨`);
          }
        }
        
        // file_path로도 시도 (file_name 매칭)
        if (deletedAsset.file_path) {
          const fileName = deletedAsset.file_path.split('/').pop();
          if (fileName) {
            // 방법 1: file_name 정확 매칭
            const { error: metadataError2, count: metadataCount2 } = await supabase
              .from('image_metadata')
              .delete()
              .eq('file_name', fileName);
            
            if (metadataError2) {
              console.warn('⚠️ image_metadata 삭제 실패 (file_name):', metadataError2);
            } else if (metadataCount2 > 0) {
              metadataDeleted = true;
              console.log(`✅ image_metadata 삭제 성공 (file_name): ${metadataCount2}개 행 삭제됨`);
            }
            
            // 방법 2: LIKE 연산자로 부분 매칭 (방법 1이 실패한 경우)
            if (!metadataDeleted && fileName) {
              const { error: metadataError3, count: metadataCount3 } = await supabase
                .from('image_metadata')
                .delete()
                .like('file_name', `%${fileName}%`);
              
              if (metadataError3) {
                console.warn('⚠️ image_metadata 삭제 실패 (file_name LIKE):', metadataError3);
              } else if (metadataCount3 > 0) {
                metadataDeleted = true;
                console.log(`✅ image_metadata 삭제 성공 (file_name LIKE): ${metadataCount3}개 행 삭제됨`);
              }
            }
          }
        }
        
        // image_url로도 시도 (URL 기반)
        if (!metadataDeleted && deletedAsset.cdn_url) {
          try {
            const { error: metadataError4, count: metadataCount4 } = await supabase
              .from('image_metadata')
              .delete()
              .eq('image_url', deletedAsset.cdn_url);
            
            if (metadataError4) {
              console.warn('⚠️ image_metadata 삭제 실패 (image_url):', metadataError4);
            } else if (metadataCount4 > 0) {
              metadataDeleted = true;
              console.log(`✅ image_metadata 삭제 성공 (image_url): ${metadataCount4}개 행 삭제됨`);
            }
          } catch (urlError) {
            console.warn('⚠️ image_metadata 삭제 시도 중 오류:', urlError);
          }
        }
      }
      
      if (!metadataDeleted) {
        console.warn('⚠️ image_metadata에서 삭제된 행이 없습니다. (이미 삭제되었거나 존재하지 않을 수 있음)');
      }

      // 5. 삭제 후 최종 검증
      const { data: finalVerify, error: finalVerifyError } = await supabase
        .from('image_assets')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (finalVerifyError) {
        console.error('❌ 최종 검증 중 오류:', finalVerifyError);
        // 검증 오류는 무시하고 삭제 성공으로 처리 (이미 삭제되었을 가능성)
      } else if (finalVerify) {
        console.error('❌ 삭제 검증 실패: 이미지가 여전히 존재합니다.');
        throw new Error('삭제 검증 실패: 이미지가 여전히 데이터베이스에 존재합니다.');
      } else {
        console.log('✅ 삭제 검증 성공: 이미지가 완전히 삭제되었습니다.');
      }

      return res.status(200).json({
        success: true,
        message: '이미지가 영구 삭제되었습니다.',
        deletedId: id,
        deletedRows: deleteData.length,
        metadataDeleted: metadataDeleted
      });

    } else {
      // 아카이브: 상태만 변경
      const { data: archiveData, error: archiveError } = await supabase
        .from('image_assets')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (archiveError) {
        console.error('❌ 아카이브 오류:', archiveError);
        throw new Error(`아카이브 실패: ${archiveError.message}`);
      }

      if (!archiveData || archiveData.length === 0) {
        return res.status(404).json({
          error: '이미지를 찾을 수 없습니다.',
          success: false
        });
      }

      console.log('✅ 이미지 아카이브 완료:', { id, archivedRows: archiveData.length });

      return res.status(200).json({
        success: true,
        message: '이미지가 아카이브되었습니다.',
        archivedId: id
      });
    }

  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    return res.status(500).json({
      error: '이미지 삭제 중 오류가 발생했습니다.',
      details: error.message,
      success: false
    });
  }
}

// 헬퍼 함수들
async function downloadImage(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.status}`);
  }
  return await response.buffer();
}

async function extractImageMetadata(imageBuffer) {
  // Sharp 동적 import (Vercel 환경 호환성)
  const sharp = (await import('sharp')).default;
  const metadata = await sharp(imageBuffer).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    mimeType: `image/${metadata.format}`,
    hasAlpha: metadata.hasAlpha,
    density: metadata.density
  };
}

function generateSEOFilename(originalFilename, metadata) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // 파일 확장자
  const extension = metadata.format || 'jpg';
  
  // SEO 친화적 파일명 생성
  const seoName = `img-${timestamp}-${randomString}`;
  
  return `${seoName}.${extension}`;
}

async function uploadToSupabase(imageBuffer, filename) {
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filename);

  return {
    path: data.path,
    publicUrl
  };
}

async function saveImageMetadata(metadata) {
  const { data, error } = await supabase
    .from('image_assets')
    .insert([metadata])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateImageUsage(imageId) {
  await supabase
    .from('image_assets')
    .update({
      usage_count: supabase.raw('usage_count + 1'),
      last_used_at: new Date().toISOString()
    })
    .eq('id', imageId);
}

function getOptimizedUrl(originalUrl, size) {
  if (!originalUrl) return null;
  
  // Supabase Storage URL에서 최적화된 버전 URL 생성
  const baseUrl = originalUrl.split('?')[0];
  return `${baseUrl}?width=${getSizeWidth(size)}&quality=85&format=webp`;
}

function getSizeWidth(size) {
  const sizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200
  };
  return sizes[size] || 600;
}

// 비동기 함수들
async function triggerAIAnalysis(imageId, imageUrl) {
  try {
    // AI 분석 API 호출 (비동기)
    await fetch('/api/admin/image-ai-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, imageId })
    });
  } catch (error) {
    console.error('AI 분석 트리거 오류:', error);
  }
}

async function generateOptimizedVersions(imageId, imageBuffer, filename) {
  try {
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    const baseFilename = filename.split('.')[0];
    
    // 다양한 크기 생성
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 }
    ];

    const optimizedVersions = {};

    for (const size of sizes) {
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const optimizedFilename = `${baseFilename}-${size.name}.webp`;
      
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(optimizedFilename, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (!error) {
        optimizedVersions[size.name] = optimizedFilename;
      }
    }

    // 데이터베이스에 최적화 버전 정보 저장
    await supabase
      .from('image_assets')
      .update({ optimized_versions: optimizedVersions })
      .eq('id', imageId);

    console.log('✅ 이미지 최적화 버전 생성 완료');

  } catch (error) {
    console.error('이미지 최적화 오류:', error);
  }
}
