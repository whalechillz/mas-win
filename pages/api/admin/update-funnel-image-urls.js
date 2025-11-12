/**
 * Phase 8: HTML 파일 이미지 URL 업데이트 API
 * 
 * 퍼널 HTML 파일의 이미지 경로를 Supabase Storage URL로 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage 공개 URL 생성
function getStoragePublicUrl(storagePath) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// 이미지 경로를 Storage URL로 변환
async function convertImagePathToStorageUrl(imagePath, month) {
  // `/campaigns/YYYY-MM/...` 형식의 경로 처리
  const campaignPathRegex = /\/campaigns\/(\d{4}-\d{2})\/(.+)/;
  const match = imagePath.match(campaignPathRegex);
  
  if (!match) {
    return null; // 퍼널 이미지 경로가 아님
  }
  
  const pathMonth = match[1];
  const fileName = match[2];
  
  // 요청한 월과 경로의 월이 일치하는지 확인
  if (pathMonth !== month) {
    return null;
  }
  
  // Storage에서 이미지 찾기 (파일명으로 검색)
  const storageFolder = `originals/campaigns/${month}`;
  
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(storageFolder, {
        limit: 1000,
        search: fileName,
      });
    
    if (error || !files || files.length === 0) {
      console.warn(`⚠️ Storage에서 이미지를 찾을 수 없음: ${fileName}`);
      return null;
    }
    
    // 파일명이 정확히 일치하는 파일 찾기
    const exactMatch = files.find((file) => {
      // UUID-파일명 형식에서 파일명 부분만 추출
      const storageFileName = file.name;
      const storageNameWithoutExt = storageFileName.replace(/\.[^/.]+$/, '');
      const originalNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      // UUID-파일명 형식이거나 정확히 일치하는 경우
      return storageFileName === fileName || 
             storageNameWithoutExt.endsWith(`-${originalNameWithoutExt}`) ||
             storageNameWithoutExt.includes(originalNameWithoutExt);
    });
    
    if (exactMatch) {
      const storagePath = `${storageFolder}/${exactMatch.name}`;
      return getStoragePublicUrl(storagePath);
    }
    
    // 정확히 일치하지 않으면 첫 번째 결과 사용
    const storagePath = `${storageFolder}/${files[0].name}`;
    return getStoragePublicUrl(storagePath);
  } catch (error) {
    console.error(`❌ 이미지 경로 변환 오류 (${imagePath}):`, error);
    return null;
  }
}

// HTML 파일의 이미지 URL 업데이트
async function updateHTMLFile(htmlFilePath, month) {
  try {
    // HTML 파일 읽기
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    let updatedContent = htmlContent;
    let updateCount = 0;
    
    // 백업 파일 생성
    const backupPath = `${htmlFilePath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, htmlContent);
    console.log(`✅ 백업 파일 생성: ${backupPath}`);
    
    // 1. <img src="..."> 태그 업데이트
    const imgTagRegex = /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
    const imgMatches = [];
    let match;
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      if (match[2].includes('/campaigns/')) {
        imgMatches.push({
          fullMatch: match[0],
          before: match[1],
          src: match[2],
          after: match[3],
        });
      }
    }
    
    for (const imgMatch of imgMatches) {
      const storageUrl = await convertImagePathToStorageUrl(imgMatch.src, month);
      if (storageUrl) {
        updatedContent = updatedContent.replace(
          imgMatch.fullMatch,
          `<img${imgMatch.before}src="${storageUrl}"${imgMatch.after}>`
        );
        updateCount++;
      }
    }
    
    // 2. CSS background-image 업데이트
    const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    const bgMatches = [];
    while ((match = bgImageRegex.exec(htmlContent)) !== null) {
      if (match[1].includes('/campaigns/')) {
        bgMatches.push({
          fullMatch: match[0],
          url: match[1],
        });
      }
    }
    
    for (const bgMatch of bgMatches) {
      const storageUrl = await convertImagePathToStorageUrl(bgMatch.url, month);
      if (storageUrl) {
        updatedContent = updatedContent.replace(
          bgMatch.fullMatch,
          `background-image: url("${storageUrl}")`
        );
        updateCount++;
      }
    }
    
    // 3. <source src="..."> 태그 업데이트 (비디오)
    const sourceTagRegex = /<source([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
    const sourceMatches = [];
    while ((match = sourceTagRegex.exec(htmlContent)) !== null) {
      if (match[2].includes('/campaigns/')) {
        sourceMatches.push({
          fullMatch: match[0],
          before: match[1],
          src: match[2],
          after: match[3],
        });
      }
    }
    
    for (const sourceMatch of sourceMatches) {
      const storageUrl = await convertImagePathToStorageUrl(sourceMatch.src, month);
      if (storageUrl) {
        updatedContent = updatedContent.replace(
          sourceMatch.fullMatch,
          `<source${sourceMatch.before}src="${storageUrl}"${sourceMatch.after}>`
        );
        updateCount++;
      }
    }
    
    // 4. meta property="og:image" 업데이트
    const ogImageRegex = /<meta([^>]+)property=["']og:image["']([^>]+)content=["']([^"']+)["']([^>]*)>/gi;
    const ogMatches = [];
    while ((match = ogImageRegex.exec(htmlContent)) !== null) {
      if (match[3].includes('/campaigns/')) {
        ogMatches.push({
          fullMatch: match[0],
          before1: match[1],
          before2: match[2],
          content: match[3],
          after: match[4],
        });
      }
    }
    
    for (const ogMatch of ogMatches) {
      const storageUrl = await convertImagePathToStorageUrl(ogMatch.content, month);
      if (storageUrl) {
        updatedContent = updatedContent.replace(
          ogMatch.fullMatch,
          `<meta${ogMatch.before1}property="og:image"${ogMatch.before2}content="${storageUrl}"${ogMatch.after}>`
        );
        updateCount++;
      }
    }
    
    // 5. meta name="twitter:image" 업데이트
    const twitterImageRegex = /<meta([^>]+)name=["']twitter:image["']([^>]+)content=["']([^"']+)["']([^>]*)>/gi;
    const twitterMatches = [];
    while ((match = twitterImageRegex.exec(htmlContent)) !== null) {
      if (match[3].includes('/campaigns/')) {
        twitterMatches.push({
          fullMatch: match[0],
          before1: match[1],
          before2: match[2],
          content: match[3],
          after: match[4],
        });
      }
    }
    
    for (const twitterMatch of twitterMatches) {
      const storageUrl = await convertImagePathToStorageUrl(twitterMatch.content, month);
      if (storageUrl) {
        updatedContent = updatedContent.replace(
          twitterMatch.fullMatch,
          `<meta${twitterMatch.before1}name="twitter:image"${twitterMatch.before2}content="${storageUrl}"${twitterMatch.after}>`
        );
        updateCount++;
      }
    }
    
    // 업데이트된 내용이 있으면 파일 저장
    if (updateCount > 0) {
      fs.writeFileSync(htmlFilePath, updatedContent);
      console.log(`✅ HTML 파일 업데이트 완료: ${updateCount}개 URL 업데이트`);
    }
    
    return {
      success: true,
      updateCount,
      backupPath,
    };
  } catch (error) {
    console.error(`❌ HTML 파일 업데이트 오류 (${htmlFilePath}):`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 메인 핸들러
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, htmlFile } = req.body;
    
    if (!month) {
      return res.status(400).json({ error: 'month 파라미터가 필요합니다.' });
    }

    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    
    // 특정 HTML 파일만 업데이트하는 경우
    if (htmlFile) {
      const htmlFilePath = path.join(versionsDir, htmlFile);
      
      if (!fs.existsSync(htmlFilePath)) {
        return res.status(404).json({ error: `HTML 파일을 찾을 수 없습니다: ${htmlFile}` });
      }
      
      const result = await updateHTMLFile(htmlFilePath, month);
      
      return res.status(200).json({
        success: true,
        message: 'HTML 파일 업데이트 완료',
        month,
        htmlFile,
        result,
      });
    }
    
    // 해당 월의 모든 HTML 파일 업데이트
    const htmlFiles = [
      `funnel-${month}-live.html`,
      `funnel-${month}-live-a.html`,
      `funnel-${month}-live-b.html`,
    ];
    
    const results = [];
    
    for (const htmlFile of htmlFiles) {
      const htmlFilePath = path.join(versionsDir, htmlFile);
      
      if (fs.existsSync(htmlFilePath)) {
        const result = await updateHTMLFile(htmlFilePath, month);
        results.push({
          htmlFile,
          ...result,
        });
      }
    }
    
    const totalUpdates = results.reduce((sum, r) => sum + (r.updateCount || 0), 0);
    
    return res.status(200).json({
      success: true,
      message: 'HTML 파일 업데이트 완료',
      month,
      summary: {
        totalFiles: results.length,
        totalUpdates,
      },
      results,
    });
  } catch (error) {
    console.error('❌ HTML 파일 업데이트 오류:', error);
    return res.status(500).json({
      error: 'HTML 파일 업데이트 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
}








