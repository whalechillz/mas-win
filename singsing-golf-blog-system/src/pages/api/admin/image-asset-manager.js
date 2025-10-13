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

    console.log('🗑️ 이미지 삭제:', id, permanent ? '(영구)' : '(아카이브)');

    if (permanent) {
      // 영구 삭제: Storage에서도 제거
      const { data: image } = await supabase
        .from('image_assets')
        .select('file_path')
        .eq('id', id)
        .single();

      if (image) {
        // Supabase Storage에서 파일 삭제
        const { error: storageError } = await supabase.storage
          .from('blog-images')
          .remove([image.file_path]);

        if (storageError) {
          console.error('Storage 삭제 오류:', storageError);
        }
      }

      // 데이터베이스에서 완전 삭제
      const { error: deleteError } = await supabase
        .from('image_assets')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      // 아카이브: 상태만 변경
      const { error: archiveError } = await supabase
        .from('image_assets')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (archiveError) {
        throw archiveError;
      }
    }

    console.log('✅ 이미지 삭제 완료');

    return res.status(200).json({
      success: true,
      message: permanent ? '이미지가 영구 삭제되었습니다.' : '이미지가 아카이브되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    return res.status(500).json({
      error: '이미지 삭제 중 오류가 발생했습니다.',
      details: error.message
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
  const sharp = await import('sharp');
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
    const sharp = await import('sharp');
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
