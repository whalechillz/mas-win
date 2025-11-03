import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    // 1. 블로그 포스트 정보 가져오기 (최신 저장된 내용)
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // 2. 블로그 포스트 내용에서 이미지 URL 추출 (최신 저장된 content 사용)
    const imageUrls = [];
    
    // 2-1. featured_image 추가
    if (post.featured_image) {
      imageUrls.push(post.featured_image);
    }
    
    // 2-2. content에서 이미지 URL 추출
    const contentImageUrls = extractImageUrls(post.content);
    for (const url of contentImageUrls) {
      if (!imageUrls.includes(url)) {
        imageUrls.push(url);
      }
    }
    
    // ✅ 2-3. 이미지 URL을 최신 Storage URL로 변환 (네이버 원본 URL 매핑)
    const resolvedImageUrls = [];
    const imageUrlMapping = new Map(); // 원본 URL -> 최신 Storage URL 매핑
    
    console.log(`🔍 이미지 URL 변환 시작: ${imageUrls.length}개 URL`);
    
    for (let idx = 0; idx < imageUrls.length; idx++) {
      const imageUrl = imageUrls[idx];
      try {
        console.log(`\n📸 이미지 ${idx + 1}/${imageUrls.length} 처리: ${imageUrl.substring(0, 100)}...`);
        
        // 네이버 원본 URL인지 확인
        const isNaverUrl = imageUrl.includes('blog.naver.com') || 
                          imageUrl.includes('postfiles.naver.net') ||
                          imageUrl.includes('naverblog') ||
                          (!imageUrl.includes('supabase.co') && 
                           !imageUrl.startsWith('http://localhost') &&
                           !imageUrl.startsWith('https://www.masgolf.co.kr'));
        
        if (isNaverUrl) {
          // ✅ image_metadata에서 최신 Storage URL 찾기
          const normalizedUrl = imageUrl.split('?')[0].split('#')[0];
          console.log(`  🔍 네이버 URL 감지, 메타데이터 검색: ${normalizedUrl.substring(0, 80)}...`);
          
          const { data: metadataList, error: metadataError } = await supabase
            .from('image_metadata')
            .select('image_url, original_url')
            .or(`original_url.eq.${normalizedUrl},image_url.eq.${normalizedUrl}`)
            .limit(5);
          
          if (!metadataError && metadataList && metadataList.length > 0) {
            // ✅ 최신 Storage URL 사용 (첫 번째 매칭 결과)
            const metadata = metadataList[0];
            const latestUrl = metadata.image_url;
            imageUrlMapping.set(imageUrl, latestUrl);
            imageUrlMapping.set(normalizedUrl, latestUrl);
            
            if (!resolvedImageUrls.includes(latestUrl)) {
              resolvedImageUrls.push(latestUrl);
              console.log(`  ✅ 네이버 URL 매핑 성공: ${latestUrl.substring(0, 80)}...`);
            } else {
              console.log(`  ⏭️ 이미 매핑된 URL 스킵: ${latestUrl.substring(0, 80)}...`);
            }
          } else {
            // 매핑을 찾지 못한 경우 원본 URL 사용 (fallback)
            if (!resolvedImageUrls.includes(imageUrl)) {
              resolvedImageUrls.push(imageUrl);
              console.log(`  ⚠️ 네이버 URL 매핑 실패, 원본 URL 사용: ${imageUrl.substring(0, 80)}...`);
            }
          }
        } else {
          // 이미 Storage URL인 경우 그대로 사용
          if (!resolvedImageUrls.includes(imageUrl)) {
            resolvedImageUrls.push(imageUrl);
            console.log(`  ✅ Storage URL 그대로 사용: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.log(`  ⏭️ 중복 URL 스킵: ${imageUrl.substring(0, 80)}...`);
          }
        }
      } catch (error) {
        console.error(`  ❌ 이미지 URL 변환 오류 (${imageUrl}):`, error.message);
        // 오류 발생 시 원본 URL 사용 (fallback)
        if (!resolvedImageUrls.includes(imageUrl)) {
          resolvedImageUrls.push(imageUrl);
        }
      }
    }
    
    console.log(`\n📊 이미지 URL 변환 완료:`);
    console.log(`  - 원본 URL 개수: ${imageUrls.length}`);
    console.log(`  - 변환된 URL 개수: ${resolvedImageUrls.length}`);
    console.log(`  - URL 매핑 개수: ${imageUrlMapping.size}`);
    console.log('  - 최종 이미지 URL들:', resolvedImageUrls.map((url, i) => `${i + 1}. ${url.substring(0, 80)}...`));

    // 3. ZIP 파일 생성
    const zip = new JSZip();

    // 4. HTML 파일 생성 (이미지 경로를 로컬로 변경) - 매핑된 URL 사용
    const htmlContent = generateHTML(post, resolvedImageUrls, imageUrlMapping);
    zip.file(`${post.slug || post.id}.html`, htmlContent);

    // 5. 이미지들 ZIP에 추가
    if (resolvedImageUrls.length > 0) {
      const imagesFolder = zip.folder('images');
      
      for (let i = 0; i < resolvedImageUrls.length; i++) {
        const imageUrl = resolvedImageUrls[i];
        try {
          console.log(`이미지 다운로드 시도: ${imageUrl}`);
          
          // ✅ 최신 저장된 이미지 경로 확인 (Storage에서 직접 가져오기)
          let actualImageUrl = imageUrl;
          let imageBuffer = null;
          
          // Storage URL인지 확인 (Supabase Storage URL 패턴)
          const storageMatch = imageUrl.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)$/);
          if (storageMatch) {
            // ✅ Storage에 있는 이미지 직접 다운로드
            const imagePath = storageMatch[1];
            try {
              const { data: downloadData, error: downloadError } = await supabase.storage
                .from('blog-images')
                .download(imagePath);
              
              if (!downloadError && downloadData) {
                imageBuffer = await downloadData.arrayBuffer();
                console.log(`✅ Storage에서 이미지 다운로드 성공: ${imagePath}`);
              } else {
                console.warn(`⚠️ Storage에서 이미지 찾기 실패, URL로 시도: ${imagePath}`);
              }
            } catch (storageError) {
              console.warn(`⚠️ Storage 다운로드 오류, URL로 시도:`, storageError.message);
            }
          }
          
          // Storage에서 가져오지 못했으면 URL로 다운로드 시도
          if (!imageBuffer) {
            const imageResponse = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (imageResponse.ok) {
              imageBuffer = await imageResponse.arrayBuffer();
              console.log(`✅ URL에서 이미지 다운로드 성공: ${imageUrl}`);
            } else {
              console.error(`❌ 이미지 다운로드 실패: ${imageUrl} (상태: ${imageResponse.status})`);
              continue; // 다음 이미지로
            }
          }
          
          // 이미지 파일명 생성 (순서대로)
          const fileExtension = getFileExtension(imageUrl);
          const fileName = `image_${i + 1}${fileExtension}`;
          
          // ZIP에 이미지 추가
          if (imageBuffer) {
            imagesFolder.file(fileName, imageBuffer);
            console.log(`✅ 이미지 ZIP 추가 성공: ${fileName} (${imageBuffer.byteLength} bytes)`);
          } else {
            console.error(`❌ 이미지 버퍼 없음: ${imageUrl} -> ${fileName} 다운로드 실패`);
          }
        } catch (error) {
          console.error(`❌ 이미지 다운로드 오류 (${imageUrl}):`, error);
          // 오류 발생해도 계속 진행 (다른 이미지는 다운로드)
        }
      }
    } else {
      console.log('포스트에 이미지가 없습니다.');
    }

    // 6. ZIP 파일 생성
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 7. 응답 헤더 설정
    const filename = `${post.slug || post.id}_download.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    // 8. ZIP 파일 전송
    res.send(zipBuffer);

  } catch (error) {
    console.error('다운로드 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '다운로드 생성 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}

// 이미지 URL 추출 함수
function extractImageUrls(content) {
  if (!content) return [];
  
  const imageUrls = [];
  
  // <img> 태그에서 src 추출
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    let url = imgMatch[1];
    // URL 정규화
    url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0].trim();
    
    // 로컬 경로 (images/image_2.png)는 스킵 (이미 변환된 것)
    if (url && !url.startsWith('images/') && !imageUrls.includes(url)) {
      imageUrls.push(url);
      console.log(`📸 HTML 이미지 URL 추출: ${url.substring(0, 100)}...`);
    } else if (url && url.startsWith('images/')) {
      console.log(`⏭️ 로컬 경로 이미지 스킵: ${url}`);
    }
  }
  
  // 마크다운 이미지 문법 ![alt](url) 추출
  const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
  let markdownMatch;
  while ((markdownMatch = markdownImgRegex.exec(content)) !== null) {
    let url = markdownMatch[1];
    // URL에서 쿼리 파라미터나 잘못된 인코딩 제거 (예: %22)
    url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0].trim();
    
    // 로컬 경로 (images/image_2.png)는 스킵 (이미 변환된 것)
    if (url && !url.startsWith('images/') && !imageUrls.includes(url)) {
      imageUrls.push(url);
      console.log(`📸 마크다운 이미지 URL 추출: ${url.substring(0, 100)}...`);
    } else if (url && url.startsWith('images/')) {
      console.log(`⏭️ 로컬 경로 이미지 스킵: ${url}`);
    }
  }
  
  // 일반 URL 패턴도 추출 (golf-driver-male-massgoo-207.png.png 같은 파일명)
  const urlPattern = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg))/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(content)) !== null) {
    let url = urlMatch[1];
    url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0];
    if (url && !imageUrls.includes(url) && !imageUrls.some(existing => url.includes(existing) || existing.includes(url))) {
      imageUrls.push(url);
      console.log(`📸 URL 패턴 이미지 추출: ${url.substring(0, 100)}...`);
    }
  }
  
  console.log(`📸 총 ${imageUrls.length}개 이미지 URL 추출됨`);
  return imageUrls;
}

// 파일 확장자 추출 함수
function getFileExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension ? `.${extension}` : '.jpg';
  } catch {
    return '.jpg';
  }
}

// HTML 생성 함수 (이미지 경로를 로컬로 변경)
function generateHTML(post, imageUrls, imageUrlMapping = new Map()) {
  // ✅ 최신 저장된 content 사용 (네이버 스크래핑이 아닌 현재 수정된 내용)
  let content = post.content || '';
  
  // ✅ 단락 구분 처리 (마크다운 줄바꿈을 HTML 단락으로 변환)
  // 마크다운의 연속된 줄바꿈(2개 이상)을 단락 구분으로 처리
  content = content.replace(/\n\n+/g, '</p><p>');
  
  // 이미지 앞뒤의 줄바꿈을 단락 구분으로 처리
  content = content.replace(/(\n)(!\[[^\]]*\]\([^)]+\))/g, '</p><p>$2');
  content = content.replace(/(<img[^>]*>)(\n)/g, '$1</p><p>');
  
  // HTML 이미지 태그 앞뒤 단락 구분
  content = content.replace(/([^>])(<img[^>]*>)/g, '$1</p><p>$2');
  content = content.replace(/(<img[^>]*>)([^<])/g, '$1</p><p>$2');
  
  // 제목 앞뒤 단락 구분 (마크다운 헤더)
  content = content.replace(/(\n)(#{1,6}\s+[^\n]+)/g, '</p><p>$2');
  
  // 단락 시작과 끝에 <p> 태그 추가
  if (!content.trim().startsWith('<p>') && !content.trim().startsWith('<h')) {
    content = '<p>' + content;
  }
  if (!content.trim().endsWith('</p>') && !content.trim().endsWith('>')) {
    content = content + '</p>';
  }
  
  // 연속된 </p><p> 정리
  content = content.replace(/<\/p>\s*<p>\s*<\/p>\s*<p>/g, '</p><p>');
  
  // 이미지 경로를 로컬 경로로 변경
  for (let i = 0; i < imageUrls.length; i++) {
    const originalUrl = imageUrls[i];
    const fileExtension = getFileExtension(originalUrl);
    const localPath = `images/image_${i + 1}${fileExtension}`;
    
    // ✅ 매핑된 URL도 함께 변경 (네이버 원본 URL -> 최신 Storage URL -> 로컬 경로)
    for (const [oldUrl, newUrl] of imageUrlMapping.entries()) {
      // HTML img 태그의 src 변경 (원본 URL과 매핑된 URL 모두)
      content = content.replace(
        new RegExp(`src=["']${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
        `src="${localPath}"`
      );
      
      // 마크다운 이미지 문법 변경 (원본 URL과 매핑된 URL 모두)
      content = content.replace(
        new RegExp(`!\\[[^\\]]*\\]\\(${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'gi'),
        `![이미지 ${i + 1}](${localPath})`
      );
    }
    
    // HTML img 태그의 src 변경 (최신 Storage URL)
    content = content.replace(
      new RegExp(`src=["']${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
      `src="${localPath}"`
    );
    
    // 마크다운 이미지 문법 변경 (최신 Storage URL)
    content = content.replace(
      new RegExp(`!\\[[^\\]]*\\]\\(${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'gi'),
      `![이미지 ${i + 1}](${localPath})`
    );
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${post.title}</title>
      <style>
        body {
          font-family: 'Malgun Gothic', Arial, sans-serif;
          line-height: 1.6;
          margin: 40px;
          color: #333;
          max-width: 800px;
          margin: 40px auto;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .meta-item {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .meta-item strong {
          color: #1e40af;
          margin-right: 8px;
        }
        .meta-item a {
          color: #2563eb;
          text-decoration: none;
        }
        .meta-item a:hover {
          text-decoration: underline;
        }
        .content {
          font-size: 16px;
          line-height: 1.8;
        }
        .content h1, .content h2, .content h3 {
          color: #1e40af;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .content h1 { font-size: 24px; }
        .content h2 { font-size: 20px; }
        .content h3 { font-size: 18px; }
        .content p {
          margin-bottom: 15px;
          text-align: justify;
          word-wrap: break-word;
        }
        .content p:empty {
          display: none;
        }
        .content ul, .content ol {
          margin-bottom: 15px;
          padding-left: 30px;
        }
        .content li {
          margin-bottom: 5px;
        }
        .content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 20px auto;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 12px;
          text-align: center;
        }
        .print-notice {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          color: #0c4a6e;
        }
        @media print {
          .print-notice { display: none; }
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="print-notice">
        <strong>📄 인쇄 안내:</strong> 이 HTML 파일을 브라우저에서 열고 Ctrl+P (또는 Cmd+P)를 눌러 PDF로 저장할 수 있습니다.
      </div>
      
      <div class="header">
        <div class="title">${post.title || '제목 없음'}</div>
        <div class="meta">
          <div class="meta-item">
            <strong>작성자:</strong> ${post.author || '마쓰구골프'}
          </div>
          <div class="meta-item">
            <strong>작성일:</strong> ${post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '날짜 없음'}
          </div>
          <div class="meta-item">
            <strong>발행일:</strong> ${post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '미발행'}
          </div>
          <div class="meta-item">
            <strong>요약:</strong> ${post.excerpt || post.meta_description || '요약 없음'}
          </div>
          <div class="meta-item">
            <strong>슬러그 (원문주소):</strong> <a href="https://www.masgolf.co.kr/blog/${post.slug || post.id}" target="_blank">https://www.masgolf.co.kr/blog/${post.slug || post.id}</a>
          </div>
          <div class="meta-item">
            <strong>카테고리:</strong> ${post.category || '일반'}
          </div>
          ${post.meta_title ? `<div class="meta-item"><strong>메타 제목:</strong> ${post.meta_title}</div>` : ''}
          ${post.meta_description ? `<div class="meta-item"><strong>메타 설명:</strong> ${post.meta_description}</div>` : ''}
          ${post.meta_keywords ? `<div class="meta-item"><strong>메타 키워드:</strong> ${post.meta_keywords}</div>` : ''}
          ${post.tags && post.tags.length > 0 ? `<div class="meta-item"><strong>태그:</strong> ${Array.isArray(post.tags) ? post.tags.join(', ') : post.tags}</div>` : ''}
          <div class="meta-item">
            <strong>상태:</strong> ${post.status === 'published' ? '발행됨' : post.status === 'draft' ? '초안' : post.status || '미정'}
          </div>
          ${post.view_count ? `<div class="meta-item"><strong>조회수:</strong> ${post.view_count}</div>` : ''}
        </div>
      </div>
      
      <div class="content">
        ${content}
      </div>
      
      <div class="footer">
        <p>마쓰구골프 블로그 | ${new Date().toLocaleDateString('ko-KR')} 생성</p>
      </div>
    </body>
    </html>
  `;
}
