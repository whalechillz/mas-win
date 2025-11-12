/**
 * Phase 8-9-7: 확장자 기반 중복 감지 API
 * 
 * 같은 파일명의 JPG/WebP를 중복으로 감지하고, WebP 우선 정책에 따라 안전하게 제거할 수 있는 파일을 식별합니다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 파일명 정규화 (확장자 제외, UUID 제거)
function normalizeFileNameWithoutExt(fileName) {
  if (!fileName) return '';
  
  // UUID 제거 (UUID-파일명 형식)
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const match = fileName.match(uuidPattern);
  const baseName = match ? match[1] : fileName;
  
  // 확장자 제거
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  
  // 소문자 변환 및 특수문자 제거
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// 이미지 사용 현황 확인
async function checkImageUsage(imageId, filePath, fileName) {
  try {
    // image-usage-tracker API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/image-usage-tracker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        filePath,
        fileName,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ 이미지 사용 현황 확인 실패 (${fileName}):`, response.statusText);
      return { used: false, usageCount: 0, usedIn: [] };
    }

    const data = await response.json();
    return {
      used: (data.usage?.total || 0) > 0,
      usageCount: data.usage?.total || 0,
      usedIn: data.usage?.used_in || [],
    };
  } catch (error) {
    console.error(`❌ 이미지 사용 현황 확인 오류 (${fileName}):`, error.message);
    return { used: false, usageCount: 0, usedIn: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { folderPath, action = 'check' } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath가 필요합니다' });
    }

    console.log(`🔍 확장자 기반 중복 감지 시작: ${folderPath}`);

    // 폴더 내 모든 이미지 조회
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error('❌ Storage 파일 목록 조회 실패:', listError);
      return res.status(500).json({ error: '파일 목록 조회 실패', details: listError.message });
    }

    if (!files || files.length === 0) {
      return res.status(200).json({
        success: true,
        folderPath,
        duplicateGroups: [],
        totalFiles: 0,
        message: '폴더에 이미지가 없습니다',
      });
    }

    // 이미지 파일만 필터링 (확장 형식 지원)
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return [
        'jpg', 'jpeg', 'png', 'webp', 'gif',  // 기본 지원
        'avif', 'heic', 'bmp', 'tiff', 'tif'  // 확장 지원
      ].includes(ext);
    });

    console.log(`📊 총 ${imageFiles.length}개 이미지 파일 발견`);

    // DB에서 메타데이터 조회
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, file_size, format')
      .in('file_path', imageFiles.map(file => `${folderPath}/${file.name}`));

    if (dbError) {
      console.error('❌ DB 이미지 조회 실패:', dbError);
      return res.status(500).json({ error: 'DB 조회 실패', details: dbError.message });
    }

    // 파일명 정규화 후 그룹화
    const fileGroups = new Map();
    
    for (const file of imageFiles) {
      const normalizedName = normalizeFileNameWithoutExt(file.name);
      if (!normalizedName) continue;

      if (!fileGroups.has(normalizedName)) {
        fileGroups.set(normalizedName, []);
      }
      fileGroups.get(normalizedName).push(file);
    }

    // 중복 그룹 찾기 (같은 파일명에 JPG와 WebP가 모두 있는 경우)
    const duplicateGroups = [];

    for (const [normalizedName, files] of fileGroups.entries()) {
      if (files.length < 2) continue; // 중복이 아님

      // 확장자별로 분류
      const jpgFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg'].includes(ext);
      });
      const pngFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ext === 'png';
      });
      const webpFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ext === 'webp';
      });
      const avifFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ext === 'avif';
      });
      const heicFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ['heic', 'heif'].includes(ext);
      });
      const otherFiles = files.filter(f => {
        const ext = f.name.toLowerCase().split('.').pop();
        return ['bmp', 'tiff', 'tif', 'gif'].includes(ext);
      });

      // 중복 그룹 판단: 
      // 1. JPG/PNG와 WebP가 모두 있거나
      // 2. JPG와 PNG가 모두 있거나
      // 3. AVIF/HEIC와 다른 형식이 모두 있는 경우
      const hasJpgOrPng = jpgFiles.length > 0 || pngFiles.length > 0;
      const hasWebp = webpFiles.length > 0;
      const hasJpgAndPng = jpgFiles.length > 0 && pngFiles.length > 0;
      const hasAvif = avifFiles.length > 0;
      const hasHeic = heicFiles.length > 0;
      const hasOther = otherFiles.length > 0;

      if ((hasJpgOrPng && hasWebp) || hasJpgAndPng || 
          (hasAvif && (hasJpgOrPng || hasWebp)) ||
          (hasHeic && (hasJpgOrPng || hasWebp)) ||
          (hasOther && (hasJpgOrPng || hasWebp || hasAvif || hasHeic))) {
        const group = {
          normalizedName,
          jpgFiles: [],
          pngFiles: [],
          webpFiles: [],
          avifFiles: [],
          heicFiles: [],
          otherFiles: [],
        };

        // JPG 파일 정보 추가
        for (const jpgFile of jpgFiles) {
          const dbImage = dbImages.find(img => img.file_path === `${folderPath}/${jpgFile.name}`);
          const usage = await checkImageUsage(
            dbImage?.id,
            `${folderPath}/${jpgFile.name}`,
            jpgFile.name
          );

          // 이미지 URL 생성
          const jpgUrl = dbImage?.cdn_url || 
            `https://${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/${bucketName}/${folderPath}/${jpgFile.name}`;
          
          group.jpgFiles.push({
            name: jpgFile.name,
            path: `${folderPath}/${jpgFile.name}`,
            url: jpgUrl,
            size: jpgFile.metadata?.size || dbImage?.file_size || 0,
            format: 'jpg',
            dbId: dbImage?.id,
            usage: usage.used,
            usageCount: usage.usageCount,
            usedIn: usage.usedIn,
          });
        }

        // WebP 파일 정보 추가
        for (const webpFile of webpFiles) {
          const dbImage = dbImages.find(img => img.file_path === `${folderPath}/${webpFile.name}`);
          const usage = await checkImageUsage(
            dbImage?.id,
            `${folderPath}/${webpFile.name}`,
            webpFile.name
          );

          // 이미지 URL 생성
          const webpUrl = dbImage?.cdn_url || 
            `https://${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/${bucketName}/${folderPath}/${webpFile.name}`;
          
          group.webpFiles.push({
            name: webpFile.name,
            path: `${folderPath}/${webpFile.name}`,
            url: webpUrl,
            size: webpFile.metadata?.size || dbImage?.file_size || 0,
            format: 'webp',
            dbId: dbImage?.id,
            usage: usage.used,
            usageCount: usage.usageCount,
            usedIn: usage.usedIn,
          });
        }

        // PNG 파일 정보 추가
        for (const pngFile of pngFiles) {
          const dbImage = dbImages.find(img => img.file_path === `${folderPath}/${pngFile.name}`);
          const usage = await checkImageUsage(
            dbImage?.id,
            `${folderPath}/${pngFile.name}`,
            pngFile.name
          );

          // 이미지 URL 생성
          const pngUrl = dbImage?.cdn_url || 
            `https://${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/${bucketName}/${folderPath}/${pngFile.name}`;
          
          group.pngFiles.push({
            name: pngFile.name,
            path: `${folderPath}/${pngFile.name}`,
            url: pngUrl,
            size: pngFile.metadata?.size || dbImage?.file_size || 0,
            format: 'png',
            dbId: dbImage?.id,
            usage: usage.used,
            usageCount: usage.usageCount,
            usedIn: usage.usedIn,
          });
        }

        // AVIF 파일 정보 추가 (선택적)
        if (avifFiles.length > 0) {
          for (const avifFile of avifFiles) {
            const dbImage = dbImages.find(img => img.file_path === `${folderPath}/${avifFile.name}`);
            const usage = await checkImageUsage(
              dbImage?.id,
              `${folderPath}/${avifFile.name}`,
              avifFile.name
            );

            const avifUrl = dbImage?.cdn_url || 
              `https://${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/${bucketName}/${folderPath}/${avifFile.name}`;
            
            group.avifFiles.push({
              name: avifFile.name,
              path: `${folderPath}/${avifFile.name}`,
              url: avifUrl,
              size: avifFile.metadata?.size || dbImage?.file_size || 0,
              format: 'avif',
              dbId: dbImage?.id,
              usage: usage.used,
              usageCount: usage.usageCount,
              usedIn: usage.usedIn,
            });
          }
        }

        // HEIC 파일 정보 추가 (선택적)
        if (heicFiles.length > 0) {
          for (const heicFile of heicFiles) {
            const dbImage = dbImages.find(img => img.file_path === `${folderPath}/${heicFile.name}`);
            const usage = await checkImageUsage(
              dbImage?.id,
              `${folderPath}/${heicFile.name}`,
              heicFile.name
            );

            const heicUrl = dbImage?.cdn_url || 
              `https://${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co/storage/v1/object/public/${bucketName}/${folderPath}/${heicFile.name}`;
            
            group.heicFiles.push({
              name: heicFile.name,
              path: `${folderPath}/${heicFile.name}`,
              url: heicUrl,
              size: heicFile.metadata?.size || dbImage?.file_size || 0,
              format: 'heic',
              dbId: dbImage?.id,
              usage: usage.used,
              usageCount: usage.usageCount,
              usedIn: usage.usedIn,
            });
          }
        }

        // 삭제 우선순위 정책:
        // 1. WebP/AVIF 우선: JPG/PNG가 사용 중이 아니면 삭제 가능
        // 2. PNG vs JPG: 둘 다 있으면 사용자가 선택 (기본값: PNG 삭제, JPG 유지)
        // 3. HEIC는 iOS 기기용이므로 보존 권장
        const safeToRemoveJpg = group.jpgFiles.filter(jpg => !jpg.usage);
        const safeToRemovePng = group.pngFiles.filter(png => !png.usage);
        const safeToRemoveWebp = group.webpFiles.filter(webp => !webp.usage);
        const safeToRemoveAvif = group.avifFiles.filter(avif => !avif.usage);
        const safeToRemoveHeic = group.heicFiles.filter(heic => !heic.usage);
        const safeToRemoveOther = group.otherFiles.filter(other => !other.usage);

        group.safeToRemoveJpg = safeToRemoveJpg;
        group.safeToRemovePng = safeToRemovePng;
        group.safeToRemoveWebp = safeToRemoveWebp;
        group.safeToRemoveAvif = safeToRemoveAvif;
        group.safeToRemoveHeic = safeToRemoveHeic;
        group.safeToRemoveOther = safeToRemoveOther;
        
        // 추천 사항 결정
        if (safeToRemoveJpg.length > 0 && (hasWebp || hasAvif)) {
          group.recommendation = 'remove_jpg'; // WebP/AVIF 우선
        } else if (safeToRemovePng.length > 0 && hasJpgAndPng) {
          group.recommendation = 'remove_png_or_jpg'; // 사용자 선택 필요
        } else if (safeToRemoveAvif.length > 0 && (hasJpgOrPng || hasWebp)) {
          group.recommendation = 'remove_avif'; // AVIF는 최신 형식이지만 호환성 고려
        } else {
          group.recommendation = 'keep_both';
        }

        duplicateGroups.push(group);
      }
    }

    console.log(`✅ ${duplicateGroups.length}개 확장자 중복 그룹 발견`);

    // action이 'remove'이고 삭제 요청인 경우
    if (action === 'remove' && (req.body.removeJpgIds || req.body.removePngIds)) {
      const removeJpgIds = req.body.removeJpgIds || [];
      const removePngIds = req.body.removePngIds || [];
      const allRemoveIds = [...removeJpgIds, ...removePngIds];
      
      const removedFiles = [];
      const errors = [];

      for (const fileId of allRemoveIds) {
        // JPG 파일 찾기
        let targetFile = duplicateGroups
          .flatMap(g => g.jpgFiles)
          .find(f => f.dbId === fileId);
        
        // PNG 파일 찾기
        if (!targetFile) {
          targetFile = duplicateGroups
            .flatMap(g => g.pngFiles)
            .find(f => f.dbId === fileId);
        }

        if (!targetFile) {
          errors.push({ id: fileId, error: '파일을 찾을 수 없습니다' });
          continue;
        }

        if (targetFile.usage) {
          errors.push({ id: fileId, error: '사용 중인 파일은 삭제할 수 없습니다' });
          continue;
        }

        try {
          // Storage에서 삭제
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([targetFile.path]);

          if (storageError) {
            errors.push({ id: fileId, error: `Storage 삭제 실패: ${storageError.message}` });
            continue;
          }

          // DB에서 삭제
          const { error: dbDeleteError } = await supabase
            .from('image_assets')
            .delete()
            .eq('id', fileId);

          if (dbDeleteError) {
            errors.push({ id: fileId, error: `DB 삭제 실패: ${dbDeleteError.message}` });
            continue;
          }

          removedFiles.push({
            id: fileId,
            name: targetFile.name,
            path: targetFile.path,
            format: targetFile.format,
          });
        } catch (error) {
          errors.push({ id: fileId, error: error.message });
        }
      }

      const jpgCount = removedFiles.filter(f => f.format === 'jpg').length;
      const pngCount = removedFiles.filter(f => f.format === 'png').length;
      const formatText = jpgCount > 0 && pngCount > 0 
        ? `JPG ${jpgCount}개, PNG ${pngCount}개`
        : jpgCount > 0 
        ? `JPG ${jpgCount}개`
        : `PNG ${pngCount}개`;

      return res.status(200).json({
        success: true,
        action: 'remove',
        removedFiles,
        errors,
        message: `${removedFiles.length}개 파일 삭제 완료 (${formatText})`,
      });
    }

    return res.status(200).json({
      success: true,
      folderPath,
      duplicateGroups,
      totalFiles: imageFiles.length,
      totalDuplicateGroups: duplicateGroups.length,
      message: `${duplicateGroups.length}개 확장자 중복 그룹 발견`,
    });
  } catch (error) {
    console.error('❌ 확장자 기반 중복 감지 오류:', error);
    return res.status(500).json({
      error: '확장자 기반 중복 감지 실패',
      details: error.message,
    });
  }
}








