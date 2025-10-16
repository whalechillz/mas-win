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

    // 1. 블로그 포스트 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // 2. 블로그 포스트 내용에서 이미지 URL 추출
    const imageUrls = extractImageUrls(post.content);
    console.log(`포스트 ${postId}에서 발견된 이미지 URL 개수: ${imageUrls.length}`);
    console.log('이미지 URL들:', imageUrls);

    // 3. ZIP 파일 생성
    const zip = new JSZip();

    // 4. HTML 파일 생성 (이미지 경로를 로컬로 변경)
    const htmlContent = generateHTML(post, imageUrls);
    zip.file(`${post.slug || post.id}.html`, htmlContent);

    // 5. 이미지들 ZIP에 추가
    if (imageUrls.length > 0) {
      const imagesFolder = zip.folder('images');
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        try {
          console.log(`이미지 다운로드 시도: ${imageUrl}`);
          
          // 이미지 파일명 생성 (순서대로)
          const fileExtension = getFileExtension(imageUrl);
          const fileName = `image_${i + 1}${fileExtension}`;
          
          // 이미지 다운로드
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            imagesFolder.file(fileName, imageBuffer);
            console.log(`✅ 이미지 다운로드 성공: ${fileName} (${imageBuffer.byteLength} bytes)`);
          } else {
            console.error(`❌ 이미지 다운로드 실패: ${imageUrl} (상태: ${imageResponse.status})`);
          }
        } catch (error) {
          console.error(`❌ 이미지 다운로드 오류 (${imageUrl}):`, error);
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
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[1];
    if (url && !imageUrls.includes(url)) {
      imageUrls.push(url);
    }
  }
  
  // 마크다운 이미지 문법 ![alt](url) 추출
  const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
  while ((match = markdownImgRegex.exec(content)) !== null) {
    const url = match[1];
    if (url && !imageUrls.includes(url)) {
      imageUrls.push(url);
    }
  }
  
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
function generateHTML(post, imageUrls) {
  let content = post.content || '';
  
  // 이미지 경로를 로컬 경로로 변경
  for (let i = 0; i < imageUrls.length; i++) {
    const originalUrl = imageUrls[i];
    const fileExtension = getFileExtension(originalUrl);
    const localPath = `images/image_${i + 1}${fileExtension}`;
    
    // HTML img 태그의 src 변경
    content = content.replace(
      new RegExp(`src=["']${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
      `src="${localPath}"`
    );
    
    // 마크다운 이미지 문법 변경
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
        <div class="title">${post.title}</div>
        <div class="meta">
          작성자: ${post.author || '마쓰구골프'} | 
          작성일: ${new Date(post.created_at).toLocaleDateString('ko-KR')} | 
          카테고리: ${post.category || '일반'}
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
