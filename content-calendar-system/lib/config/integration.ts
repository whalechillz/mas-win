// Integration Configuration
// /lib/config/integration.ts

/**
 * 기존 masgolf.co.kr 시스템과의 통합 설정
 * 네이버 블로그 스크래퍼 및 기존 블로그 관리 시스템과 호환
 */

export const IntegrationConfig = {
  // 기존 시스템 엔드포인트
  existing: {
    blogAdmin: '/admin/blog',
    naverScraper: '/api/blog/naver-scraper',
    blogApi: '/api/blog',
    mediaUpload: '/api/upload'
  },

  // 콘텐츠 캘린더 엔드포인트 (충돌 방지를 위해 별도 prefix 사용)
  contentCalendar: {
    admin: '/admin/content-calendar',
    api: '/api/content-calendar',
    generate: '/api/content-calendar/generate',
    publish: '/api/content-calendar/publish'
  },

  // 공유 데이터베이스 테이블
  sharedTables: {
    users: 'users',
    media: 'media_files',
    categories: 'categories',
    tags: 'tags'
  },

  // 콘텐츠 캘린더 전용 테이블 (prefix로 구분)
  calendarTables: {
    main: 'cc_content_calendar',  // cc_ prefix 사용
    versions: 'cc_content_versions',
    performance: 'cc_content_performance',
    campaigns: 'cc_campaigns',
    templates: 'cc_content_templates',
    publishingLogs: 'cc_publishing_logs'
  },

  // 기존 블로그 테이블과의 연동
  blogIntegration: {
    postsTable: 'blog_posts',
    scraperTable: 'naver_scraped_posts',
    // 콘텐츠 캘린더에서 블로그로 발행 시 연동
    syncEnabled: true,
    autoPublishToBlog: true
  },

  // UI 통합 설정
  ui: {
    // 기존 디자인 시스템 사용
    useExistingTheme: true,
    themeColors: {
      primary: '#1e3a8a',  // 네이비
      secondary: '#f59e0b', // 골드
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    // 기존 컴포넌트 라이브러리 경로
    componentLibrary: '@/components/shared',
    // 레이아웃 통합
    adminLayout: '@/layouts/AdminLayout'
  },

  // 권한 및 인증
  auth: {
    // 기존 인증 시스템 사용
    useExistingAuth: true,
    sessionTable: 'user_sessions',
    rolesTable: 'user_roles',
    permissionsTable: 'user_permissions',
    // 콘텐츠 캘린더 전용 권한
    calendarPermissions: [
      'content_calendar_view',
      'content_calendar_create',
      'content_calendar_edit',
      'content_calendar_delete',
      'content_calendar_publish',
      'content_calendar_analytics'
    ]
  },

  // API 통합
  api: {
    // 기존 API 미들웨어 사용
    useExistingMiddleware: true,
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1분
    },
    cors: {
      enabled: true,
      origin: process.env.NEXT_PUBLIC_BASE_URL
    }
  },

  // 네이버 블로그 스크래퍼 연동
  naverScraper: {
    enabled: true,
    // 스크랩한 콘텐츠를 캘린더로 가져오기
    importToCalendar: true,
    // 자동 분류 및 태깅
    autoClassify: true,
    // 스크랩 데이터 저장 경로
    scrapedContentTable: 'naver_scraped_posts',
    // 연동 필드 매핑
    fieldMapping: {
      title: 'title',
      content: 'content',
      publishDate: 'published_at',
      author: 'author',
      tags: 'tags',
      images: 'image_urls',
      url: 'original_url'
    }
  },

  // 파일 업로드 통합
  fileUpload: {
    // 기존 업로드 시스템 사용
    useExistingUploader: true,
    uploadPath: '/uploads/content-calendar',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024, // 10MB
    // Supabase Storage 버킷
    storageBucket: 'content-calendar'
  },

  // 알림 시스템 통합
  notifications: {
    enabled: true,
    channels: ['email', 'slack', 'dashboard'],
    // 기존 알림 테이블 사용
    notificationsTable: 'notifications',
    // 콘텐츠 캘린더 전용 알림 타입
    calendarNotificationTypes: [
      'content_deadline_approaching',
      'content_published',
      'content_review_required',
      'content_performance_alert'
    ]
  },

  // 캐싱 설정
  cache: {
    enabled: true,
    // Redis 또는 메모리 캐시
    type: 'redis', // 또는 'memory'
    ttl: 3600, // 1시간
    keyPrefix: 'cc_' // 콘텐츠 캘린더 전용 prefix
  },

  // 로깅 설정
  logging: {
    enabled: true,
    level: 'info',
    // 기존 로그 테이블 사용
    logsTable: 'system_logs',
    // 콘텐츠 캘린더 전용 로그 카테고리
    calendarLogCategory: 'content_calendar'
  }
};

/**
 * 기존 시스템과의 호환성 체크
 */
export function checkCompatibility(): {
  isCompatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 데이터베이스 연결 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('Supabase URL이 설정되지 않았습니다.');
  }

  // API 엔드포인트 충돌 체크
  // 실제 구현에서는 라우트 파일을 스캔하여 확인
  
  // 테이블 충돌 체크
  // 실제 구현에서는 데이터베이스 스키마를 확인

  return {
    isCompatible: issues.length === 0,
    issues
  };
}

/**
 * 기존 블로그 시스템과 데이터 동기화
 */
export async function syncWithBlogSystem(
  contentId: string,
  action: 'create' | 'update' | 'delete'
): Promise<boolean> {
  try {
    // 기존 블로그 API 호출
    const response = await fetch(`${IntegrationConfig.existing.blogApi}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'content_calendar',
        contentId,
        action
      })
    });

    return response.ok;
  } catch (error) {
    console.error('블로그 시스템 동기화 실패:', error);
    return false;
  }
}

/**
 * 네이버 블로그 스크래퍼에서 콘텐츠 가져오기
 */
export async function importFromNaverScraper(
  scrapedPostId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${IntegrationConfig.existing.naverScraper}/import/${scrapedPostId}`
    );

    if (!response.ok) {
      throw new Error('Failed to import from Naver scraper');
    }

    const scrapedData = await response.json();
    
    // 콘텐츠 캘린더 형식으로 변환
    return {
      title: scrapedData.title,
      contentBody: scrapedData.content,
      contentType: 'blog',
      source: 'naver_scraper',
      originalUrl: scrapedData.url,
      keywords: scrapedData.tags,
      thumbnailUrl: scrapedData.images?.[0]
    };
  } catch (error) {
    console.error('네이버 스크래퍼 가져오기 실패:', error);
    throw error;
  }
}

export default IntegrationConfig;
