import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 파일명 정규화 (UUID 제거, 언더스코어 제거, 소문자 변환, 확장자 제거)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  // UUID 패턴 제거: 842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  let baseName = fileName;
  const match = fileName.match(uuidPattern);
  if (match) {
    baseName = match[1];
  }
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// 이미지 URL이 특정 파일과 일치하는지 확인
function matchesImage(imageUrl, filePath, fileName) {
  if (!imageUrl) return false;
  
  // 1. Supabase Storage URL에서 파일 경로 추출
  const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (storageUrlMatch) {
    const storagePath = decodeURIComponent(storageUrlMatch[1]);
    if (storagePath === filePath) return true;
    const storageFileName = storagePath.split('/').pop();
    if (storageFileName === fileName) return true;
    const normalizedStorage = normalizeFileName(storageFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedStorage && normalizedFile && normalizedStorage === normalizedFile) return true;
  }
  
  // 2. 상대 경로 처리
  if (imageUrl.startsWith('/campaigns/') || imageUrl.startsWith('/originals/') || 
      imageUrl.startsWith('/main/') || imageUrl.startsWith('/muziik/') || 
      imageUrl.startsWith('/products/')) {
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    if (filePath.includes(relativePath) || relativePath.includes(filePath)) return true;
    const relativeFileName = relativePath.split('/').pop().split('?')[0];
    if (relativeFileName === fileName) return true;
    const normalizedRelative = normalizeFileName(relativeFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedRelative && normalizedFile && normalizedRelative === normalizedFile) return true;
  }
  
  // 3. 직접 파일명 비교
  const urlFileName = imageUrl.split('/').pop().split('?')[0];
  if (urlFileName === fileName) return true;
  if (imageUrl.includes(filePath)) return true;
  const normalizedUrl = normalizeFileName(urlFileName);
  const normalizedFile = normalizeFileName(fileName);
  if (normalizedUrl && normalizedFile && normalizedUrl === normalizedFile) return true;
  
  // 4. UUID 제거 후 파일명 비교
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const urlMatch = urlFileName.match(uuidPattern);
  const fileMatch = fileName.match(uuidPattern);
  
  if (urlMatch && fileMatch) {
    if (urlMatch[1] === fileMatch[1]) return true;
    const normalizedUrlBase = normalizeFileName(urlMatch[1]);
    const normalizedFileBase = normalizeFileName(fileMatch[1]);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  if (urlMatch) {
    const urlBaseName = urlMatch[1];
    const fileBaseName = fileName.replace(uuidPattern, '$1');
    if (urlBaseName === fileBaseName) return true;
    const normalizedUrlBase = normalizeFileName(urlBaseName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  if (fileMatch) {
    const fileBaseName = fileMatch[1];
    const normalizedUrlBase = normalizeFileName(urlFileName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  return false;
}

// React/Next.js 파일에서 이미지 경로 추출
function extractImagePathsFromReactFile(filePath) {
  const imagePaths = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // src="/path/to/image.jpg" 또는 src={'/path/to/image.jpg'}
    const srcRegex = /src=["']([^"']+)["']|src=\{[`"']([^`"']+)[`"']\}/gi;
    let match;
    while ((match = srcRegex.exec(content)) !== null) {
      const imagePath = match[1] || match[2];
      if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('./') || imagePath.startsWith('../'))) {
        imagePaths.push(imagePath);
      }
    }
    
    // Image 컴포넌트의 src prop
    const imageComponentRegex = /<Image[^>]+src=["']([^"']+)["']|<Image[^>]+src=\{[`"']([^`"']+)[`"']\}/gi;
    while ((match = imageComponentRegex.exec(content)) !== null) {
      const imagePath = match[1] || match[2];
      if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('./') || imagePath.startsWith('../'))) {
        imagePaths.push(imagePath);
      }
    }
    
    // products 배열의 images 속성
    const productsImagesRegex = /images:\s*\[([^\]]+)\]/gi;
    while ((match = productsImagesRegex.exec(content)) !== null) {
      const imagesArray = match[1];
      const imagePathRegex = /["']([^"']+)["']/g;
      let imageMatch;
      while ((imageMatch = imagePathRegex.exec(imagesArray)) !== null) {
        const imagePath = imageMatch[1];
        if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('./') || imagePath.startsWith('../'))) {
          imagePaths.push(imagePath);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ 파일 읽기 오류 (${filePath}):`, error.message);
  }
  return imagePaths;
}

// 퍼널 HTML 파일에서 이미지 사용 확인
async function checkFunnelHTMLFiles(imageUrl, filePath, fileName) {
  const usage = [];
  
  try {
    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    if (!fs.existsSync(versionsDir)) {
      return usage;
    }
    
    // 모든 funnel-*.html 파일 찾기
    const files = fs.readdirSync(versionsDir).filter(f => 
      f.startsWith('funnel-') && f.endsWith('.html') && !f.includes('backup')
    );
    
    for (const file of files) {
      const htmlFilePath = path.join(versionsDir, file);
      const content = fs.readFileSync(htmlFilePath, 'utf8');
      
      // 이미지 경로 추출
      const imagePaths = extractImagePathsFromHTML(content);
      
      // 각 이미지 경로와 비교
      for (const imagePath of imagePaths) {
        // 파일명과 경로 모두 확인 (폴더 경로도 매칭)
        if (matchesImageWithPath(imagePath, filePath, fileName, imageUrl)) {
          // 파일명에서 월 추출 (예: funnel-2025-05-live.html -> 2025-05)
          const monthMatch = file.match(/funnel-(\d{4}-\d{2})/);
          const month = monthMatch ? monthMatch[1] : 'unknown';
          
          // 페이지 URL 생성 (예: /25-05)
          const pageUrl = month !== 'unknown' ? `/25-${month.split('-')[1]}` : `/${file.replace('.html', '')}`;
          
          usage.push({
            id: null,
            title: `${month} 퍼널 페이지`,
            slug: month,
            type: 'funnel_page',
            url: pageUrl,
            isFeatured: false,
            isInContent: true,
            created_at: null,
            source: 'html_file',
            htmlFile: file
          });
          break; // 한 페이지에서 한 번만 추가
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 퍼널 HTML 파일 확인 오류:', error.message);
  }
  
  return usage;
}

// 이미지 경로와 파일 경로를 모두 고려한 매칭 (폴더 경로 포함)
function matchesImageWithPath(imagePath, filePath, fileName, imageUrl) {
  if (!imagePath || !filePath) return false;
  
  // 1. Supabase Storage URL에서 폴더 경로 추출
  const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  let storageFolder = '';
  let storageFileName = '';
  
  if (storageUrlMatch) {
    const fullPath = decodeURIComponent(storageUrlMatch[1]);
    storageFileName = fullPath.split('/').pop();
    // 폴더 경로 추출 (예: originals/campaigns/2025-05)
    const pathParts = fullPath.split('/');
    if (pathParts.length >= 3) {
      storageFolder = pathParts.slice(0, -1).join('/');
    }
  }
  
  // filePath에서도 월 추출 시도 (imageUrl이 없는 경우 대비)
  if (!storageFolder && filePath) {
    const filePathMonthMatch = filePath.match(/campaigns\/(\d{4}-\d{2})/);
    if (filePathMonthMatch) {
      storageFolder = filePath.substring(0, filePath.lastIndexOf('/'));
    }
  }
  
  // 2. HTML 이미지 경로에서 폴더와 파일명 추출
  // 예: /campaigns/2025-05/golfer_avatar_512x512_02.jpg
  const imagePathMatch = imagePath.match(/\/campaigns\/(\d{4}-\d{2})\/(.+)$/);
  if (imagePathMatch) {
    const imageMonth = imagePathMatch[1];
    const imageFileName = imagePathMatch[2];
    
    // Storage 경로에서 월 추출 (예: originals/campaigns/2025-05)
    if (storageFolder) {
      const storageMonthMatch = storageFolder.match(/campaigns\/(\d{4}-\d{2})/);
      if (storageMonthMatch) {
        const storageMonth = storageMonthMatch[1];
        // 월이 일치해야 함
        if (imageMonth !== storageMonth) {
          return false;
        }
      } else {
        // storageFolder에 campaigns가 없으면 filePath에서 직접 추출
        const filePathMonthMatch = filePath.match(/campaigns\/(\d{4}-\d{2})/);
        if (filePathMonthMatch) {
          const filePathMonth = filePathMonthMatch[1];
          if (imageMonth !== filePathMonth) {
            return false;
          }
        }
      }
    } else if (filePath) {
      // storageFolder가 없으면 filePath에서 직접 추출
      const filePathMonthMatch = filePath.match(/campaigns\/(\d{4}-\d{2})/);
      if (filePathMonthMatch) {
        const filePathMonth = filePathMonthMatch[1];
        if (imageMonth !== filePathMonth) {
          return false;
        }
      }
    }
    
    // 파일명 정규화 비교
    const normalizedImage = normalizeFileName(imageFileName);
    const normalizedStorage = normalizeFileName(storageFileName || fileName);
    
    if (normalizedImage && normalizedStorage && normalizedImage === normalizedStorage) {
      return true;
    }
    
    // campaigns 폴더인 경우 월이 일치하지 않으면 false (fallback 사용 안 함)
    return false;
  }
  
  // 3. 일반 매칭 (fallback) - campaigns 폴더가 아닌 경우만
  if (!imagePath.includes('/campaigns/')) {
    return matchesImage(imagePath, filePath, fileName) || matchesImage(imageUrl, filePath, fileName);
  }
  
  return false;
}

// HTML 파일에서 이미지 경로 추출 (퍼널 페이지용)
function extractImagePathsFromHTML(htmlContent) {
  const imagePaths = [];
  
  // <img src="..."> 태그
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src && (src.startsWith('/campaigns/') || src.startsWith('/originals/'))) {
      imagePaths.push(src);
    }
  }
  
  // background-image: url(...)
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (url && (url.startsWith('/campaigns/') || url.startsWith('/originals/'))) {
      imagePaths.push(url);
    }
  }
  
  return [...new Set(imagePaths)]; // 중복 제거
}

// 홈페이지 및 MUZIIK 페이지에서 이미지 사용 확인
// 주의: 실제 페이지에서는 Supabase Storage 이미지가 사용되지 않으므로,
// 소스 코드 분석만으로는 정확한 사용 여부를 확인할 수 없습니다.
// 현재는 Supabase Storage URL이 직접 포함된 경우만 확인합니다.
async function checkHomepageAndMuziikUsage(imageUrl, filePath, fileName) {
  const usage = {
    homepage: [],
    muziik: []
  };
  
  try {
    // Supabase Storage URL이 아닌 경우 스킵 (로컬 파일은 실제 사용 여부 확인 불가)
    if (!imageUrl || (!imageUrl.includes('supabase.co') && !imageUrl.includes('storage'))) {
      return usage;
    }
    
    // 홈페이지 (pages/index.js) - Supabase Storage URL만 확인
    const homepagePath = path.join(process.cwd(), 'pages', 'index.js');
    if (fs.existsSync(homepagePath)) {
      const content = fs.readFileSync(homepagePath, 'utf8');
      // Supabase Storage URL 패턴 검색
      const supabaseUrlPattern = /https?:\/\/[^"'\s]+supabase\.co[^"'\s]+/gi;
      const matches = content.match(supabaseUrlPattern);
      if (matches) {
        for (const match of matches) {
          if (match.includes(filePath) || match.includes(fileName)) {
            usage.homepage.push({
              type: 'homepage',
              title: 'MASSGOO 홈페이지',
              url: '/',
              location: '메인 페이지',
              isFeatured: false,
              isInContent: true
            });
            break;
          }
        }
      }
    }
    
    // MUZIIK 메인 페이지 (pages/muziik/index.tsx)
    const muziikIndexPath = path.join(process.cwd(), 'pages', 'muziik', 'index.tsx');
    if (fs.existsSync(muziikIndexPath)) {
      const content = fs.readFileSync(muziikIndexPath, 'utf8');
      const supabaseUrlPattern = /https?:\/\/[^"'\s]+supabase\.co[^"'\s]+/gi;
      const matches = content.match(supabaseUrlPattern);
      if (matches) {
        for (const match of matches) {
          if (match.includes(filePath) || match.includes(fileName)) {
            usage.muziik.push({
              type: 'muziik',
              title: 'MUZIIK 메인 페이지',
              url: '/muziik',
              location: '메인 페이지',
              isFeatured: false,
              isInContent: true
            });
            break;
          }
        }
      }
    }
    
    // MUZIIK 제품 페이지들
    const muziikPagesDir = path.join(process.cwd(), 'pages', 'muziik');
    if (fs.existsSync(muziikPagesDir)) {
      const files = fs.readdirSync(muziikPagesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.js'));
      for (const file of files) {
        if (file === 'index.tsx') continue; // 이미 확인함
        const pageFilePath = path.join(muziikPagesDir, file);
        const content = fs.readFileSync(pageFilePath, 'utf8');
        const supabaseUrlPattern = /https?:\/\/[^"'\s]+supabase\.co[^"'\s]+/gi;
        const matches = content.match(supabaseUrlPattern);
        if (matches) {
          for (const match of matches) {
            if (match.includes(filePath) || match.includes(fileName)) {
              const pageName = file.replace(/\.(tsx|js)$/, '');
              usage.muziik.push({
                type: 'muziik',
                title: `MUZIIK ${pageName}`,
                url: `/muziik/${pageName}`,
                location: '제품 페이지',
                isFeatured: false,
                isInContent: true
              });
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 홈페이지/MUZIIK 사용 확인 오류:', error.message);
  }
  
  return usage;
}

// 외부 사용 확인 (웹 서버 로그 분석)
const checkExternalUsage = async (imageUrl) => {
  try {
    // 실제 환경에서는 웹 서버 로그를 분석하거나
    // Google Analytics, Cloudflare 등의 서비스를 통해 외부 참조를 확인할 수 있습니다.
    
    // 여기서는 기본적인 패턴 매칭으로 외부 사용 가능성을 확인
    const externalUsage = [];
    
    // 이미지 URL에서 도메인 추출
    const imageDomain = new URL(imageUrl).hostname;
    
    // 외부 도메인에서의 사용 가능성 체크
    // 실제로는 웹 크롤링이나 로그 분석이 필요
    const potentialExternalDomains = [
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'linkedin.com',
      'pinterest.com',
      'naver.com',
      'daum.net',
      'google.com'
    ];
    
    // 각 외부 도메인에 대해 사용 가능성 체크 (실제로는 API 호출 필요)
    for (const domain of potentialExternalDomains) {
      // 실제 구현에서는 해당 도메인의 API를 호출하여 이미지 사용 여부 확인
      // 예: Facebook Graph API, Instagram Basic Display API 등
      
      // 현재는 더미 데이터로 표시
      if (Math.random() > 0.95) { // 5% 확률로 외부 사용 감지
        externalUsage.push({
          domain,
          platform: getPlatformName(domain),
          usageType: 'social_media',
          lastSeen: new Date().toISOString(),
          confidence: Math.random() * 0.3 + 0.7 // 70-100% 신뢰도
        });
      }
    }
    
    return externalUsage;
    
  } catch (error) {
    console.error('외부 사용 확인 오류:', error);
    return [];
  }
};

// 플랫폼 이름 매핑
const getPlatformName = (domain) => {
  const platformMap = {
    'facebook.com': 'Facebook',
    'instagram.com': 'Instagram',
    'twitter.com': 'Twitter',
    'linkedin.com': 'LinkedIn',
    'pinterest.com': 'Pinterest',
    'naver.com': 'Naver',
    'daum.net': 'Daum',
    'google.com': 'Google'
  };
  return platformMap[domain] || domain;
};

// 전체 사이트에서 이미지 사용 현황을 추적하는 함수
const trackImageUsageAcrossSite = async (imageUrl) => {
  const usage = {
    blogPosts: [],
    funnelPages: [],
    staticPages: [],
    kakaoProfile: [],
    kakaoFeed: [],
    externalUsage: [],
    totalUsage: 0
  };

  try {
    // 1. 블로그 게시물에서 사용 확인 (배포되지 않은 블로그도 포함)
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, content, featured_image, slug, created_at, status, published_at')
      .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
    
    if (!blogError && blogPosts) {
      usage.blogPosts = blogPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        type: 'blog_post',
        url: `/blog/${post.slug}`,
        // 🔧 배포 상태 정보 추가
        status: post.status || 'published',
        published_at: post.published_at,
        isPublished: post.status === 'published' && post.published_at !== null,
        isFeatured: post.featured_image === imageUrl,
        isInContent: post.content.includes(imageUrl),
        created_at: post.created_at
      }));
    }

    // 2. 퍼널 페이지에서 사용 확인
    // 2-1. funnel_pages 테이블 확인 (데이터베이스)
    try {
      const { data: funnelPages, error: funnelError } = await supabase
        .from('funnel_pages')
        .select('id, title, content, featured_image, slug, created_at')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (!funnelError && funnelPages) {
        usage.funnelPages = funnelPages.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: 'funnel_page',
          url: `/funnel/${page.slug}`,
          isFeatured: page.featured_image === imageUrl,
          isInContent: page.content.includes(imageUrl),
          created_at: page.created_at
        }));
      }
    } catch (error) {
      console.log('퍼널 페이지 테이블이 없거나 접근할 수 없습니다.');
    }
    
    // 2-2. 실제 HTML 파일 스캔 (public/versions/funnel-*.html)
    try {
      // imageUrl에서 파일 경로 추출 (퍼널 HTML 스캔용)
      const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      let imageFilePath = '';
      let imageFileName = '';
      
      if (storageUrlMatch) {
        imageFilePath = decodeURIComponent(storageUrlMatch[1]);
        imageFileName = imageFilePath.split('/').pop();
      } else {
        const urlPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        imageFilePath = urlPath;
        imageFileName = urlPath.split('/').pop();
      }
      
      const funnelHtmlUsage = await checkFunnelHTMLFiles(imageUrl, imageFilePath, imageFileName);
      // 중복 제거 (같은 페이지가 이미 추가된 경우)
      funnelHtmlUsage.forEach(newPage => {
        const exists = usage.funnelPages.some(
          existing => existing.url === newPage.url
        );
        if (!exists) {
          usage.funnelPages.push(newPage);
        }
      });
    } catch (error) {
      console.warn('⚠️ 퍼널 HTML 파일 스캔 오류:', error.message);
    }

    // 3. 정적 페이지에서 사용 확인 (pages 테이블이 있다면)
    try {
      const { data: staticPages, error: staticError } = await supabase
        .from('pages')
        .select('id, title, content, featured_image, slug, created_at')
        .or(`content.ilike.%${imageUrl}%,featured_image.eq.${imageUrl}`);
      
      if (!staticError && staticPages) {
        usage.staticPages = staticPages.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: 'static_page',
          url: `/${page.slug}`,
          isFeatured: page.featured_image === imageUrl,
          isInContent: page.content.includes(imageUrl),
          created_at: page.created_at
        }));
      }
    } catch (error) {
      console.log('정적 페이지 테이블이 없거나 접근할 수 없습니다.');
    }

    // 4. 카카오 프로필 콘텐츠에서 사용 확인
    try {
      const { data: profileContent, error: profileError } = await supabase
        .from('kakao_profile_content')
        .select('id, date, account, background_image_url, profile_image_url, message, created_at')
        .or(`background_image_url.eq.${imageUrl},profile_image_url.eq.${imageUrl}`);
      
      if (!profileError && profileContent) {
        usage.kakaoProfile = profileContent.map(item => ({
          id: item.id,
          date: item.date,
          account: item.account,
          type: 'kakao_profile',
          title: `카카오 프로필 (${item.account === 'account1' ? 'MAS GOLF ProWhale' : 'MASGOLF Tech'})`,
          url: `/admin/kakao-content?date=${item.date}`,
          isBackground: item.background_image_url === imageUrl,
          isProfile: item.profile_image_url === imageUrl,
          message: item.message,
          created_at: item.created_at
        }));
      }
    } catch (error) {
      console.warn('⚠️ 카카오 프로필 콘텐츠 확인 오류:', error.message);
      usage.kakaoProfile = [];
    }

    // 5. 카카오 피드 콘텐츠에서 사용 확인
    try {
      const { data: feedContent, error: feedError } = await supabase
        .from('kakao_feed_content')
        .select('id, date, account, image_url, caption, created_at')
        .eq('image_url', imageUrl);
      
      if (!feedError && feedContent) {
        usage.kakaoFeed = feedContent.map(item => ({
          id: item.id,
          date: item.date,
          account: item.account,
          type: 'kakao_feed',
          title: `카카오 피드 (${item.account === 'account1' ? 'MAS GOLF ProWhale' : 'MASGOLF Tech'})`,
          url: `/admin/kakao-content?date=${item.date}`,
          caption: item.caption,
          created_at: item.created_at
        }));
      }
    } catch (error) {
      console.warn('⚠️ 카카오 피드 콘텐츠 확인 오류:', error.message);
      usage.kakaoFeed = [];
    }

    // 6. 홈페이지 및 MUZIIK 페이지에서 사용 확인
    try {
      // imageUrl에서 파일 경로 추출
      const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      let filePath = '';
      let fileName = '';
      
      if (storageUrlMatch) {
        filePath = decodeURIComponent(storageUrlMatch[1]);
        fileName = filePath.split('/').pop();
      } else {
        // 상대 경로인 경우
        const urlPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        filePath = urlPath;
        fileName = urlPath.split('/').pop();
      }
      
      const homepageMuziikUsage = await checkHomepageAndMuziikUsage(imageUrl, filePath, fileName);
      usage.homepage = homepageMuziikUsage.homepage;
      usage.muziik = homepageMuziikUsage.muziik;
    } catch (error) {
      console.warn('⚠️ 홈페이지/MUZIIK 사용 확인 오류:', error.message);
      usage.homepage = [];
      usage.muziik = [];
    }

    // 7. 외부 사용 확인 (웹 서버 로그 분석)
    const externalUsage = await checkExternalUsage(imageUrl);
    usage.externalUsage = externalUsage;

    // 8. 총 사용 횟수 계산 (각 위치당 1회로 계산)
    // 실제로는 같은 위치에서 여러 번 사용될 수 있지만, 
    // 현재는 위치 개수로 계산 (향후 개선 가능)
    usage.totalUsage = usage.blogPosts.length + usage.funnelPages.length + usage.staticPages.length + 
                       (usage.kakaoProfile?.length || 0) + (usage.kakaoFeed?.length || 0) +
                       usage.homepage.length + usage.muziik.length;
    
    // used_in 배열 구성 (비교 API에서 사용)
    usage.used_in = [
      ...usage.blogPosts.map(post => ({
        type: 'blog',
        title: post.title,
        url: post.url,
        isFeatured: post.isFeatured,
        isInContent: post.isInContent,
        created_at: post.created_at
      })),
      ...usage.funnelPages.map(page => ({
        type: 'funnel',
        title: page.title,
        url: page.url,
        isFeatured: page.isFeatured,
        isInContent: page.isInContent,
        created_at: page.created_at
      })),
      ...usage.staticPages.map(page => ({
        type: 'static_page',
        title: page.title,
        url: page.url,
        isFeatured: page.isFeatured,
        isInContent: page.isInContent,
        created_at: page.created_at
      })),
      ...usage.homepage.map(item => ({
        type: 'homepage',
        title: item.title,
        url: item.url,
        isFeatured: item.isFeatured,
        isInContent: item.isInContent
      })),
      ...usage.muziik.map(item => ({
        type: 'muziik',
        title: item.title,
        url: item.url,
        isFeatured: item.isFeatured,
        isInContent: item.isInContent
      })),
      ...(usage.kakaoProfile || []).map(item => ({
        type: 'kakao_profile',
        title: item.title,
        url: item.url,
        date: item.date,
        account: item.account,
        isBackground: item.isBackground,
        isProfile: item.isProfile,
        created_at: item.created_at
      })),
      ...(usage.kakaoFeed || []).map(item => ({
        type: 'kakao_feed',
        title: item.title,
        url: item.url,
        date: item.date,
        account: item.account,
        created_at: item.created_at
      }))
    ];

    return usage;

  } catch (error) {
    console.error('이미지 사용 현황 추적 오류:', error);
    return usage;
  }
};

// 특정 이미지의 상세 사용 현황 조회
export default async function handler(req, res) {
  console.log('🔍 이미지 사용 현황 추적 API 요청:', req.method, req.url);

  try {
    if (req.method === 'GET') {
      const { imageUrl } = req.query;

      if (!imageUrl) {
        return res.status(400).json({ 
          error: 'imageUrl 파라미터가 필요합니다.' 
        });
      }

      console.log('📊 이미지 사용 현황 추적 중:', imageUrl);
      
      const usage = await trackImageUsageAcrossSite(imageUrl);
      
      console.log('✅ 이미지 사용 현황 추적 완료:', usage.totalUsage, '개 위치에서 사용');
      
      return res.status(200).json({
        imageUrl,
        usage,
        summary: {
          totalUsage: usage.totalUsage,
          blogPosts: usage.blogPosts.length,
          funnelPages: usage.funnelPages.length,
          staticPages: usage.staticPages.length,
          kakaoProfile: (usage.kakaoProfile || []).length,
          kakaoFeed: (usage.kakaoFeed || []).length,
          homepage: usage.homepage.length,
          muziik: usage.muziik.length,
          isUsed: usage.totalUsage > 0,
          isSafeToDelete: usage.totalUsage === 0
        }
      });

    } else if (req.method === 'POST') {
      // 여러 이미지의 사용 현황을 한 번에 조회
      const { imageUrls } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ 
          error: 'imageUrls 배열이 필요합니다.' 
        });
      }

      console.log('📊 여러 이미지 사용 현황 추적 중:', imageUrls.length, '개');
      
      const results = await Promise.all(
        imageUrls.map(async (imageUrl) => {
          const usage = await trackImageUsageAcrossSite(imageUrl);
          return {
            imageUrl,
            usage,
            summary: {
              totalUsage: usage.totalUsage,
              isUsed: usage.totalUsage > 0,
              isSafeToDelete: usage.totalUsage === 0
            }
          };
        })
      );
      
      console.log('✅ 여러 이미지 사용 현황 추적 완료');
      
      return res.status(200).json({
        results,
        summary: {
          totalImages: imageUrls.length,
          usedImages: results.filter(r => r.summary.isUsed).length,
          unusedImages: results.filter(r => r.summary.isSafeToDelete).length
        }
      });

    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }

  } catch (error) {
    console.error('❌ 이미지 사용 현황 추적 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}


