# 블로그 플랫폼 통합 전략

## 1. 글감 풀(Content Pool) - 공통 관리

### 글감 단계
1. **아이디어** → 2. **초안** → 3. **편집** → 4. **발행 준비**

### 테이블 구조
```sql
-- 글감 풀 (모든 콘텐츠의 원천)
CREATE TABLE content_pool (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    topic TEXT,           -- 주제/아이디어
    keywords TEXT[],      -- SEO 키워드
    target_audience TEXT, -- 타겟 고객
    content_draft TEXT,   -- 초안
    status VARCHAR(50),   -- idea, draft, edited, ready
    created_at TIMESTAMP
);

-- 플랫폼별 발행 정보
CREATE TABLE content_publishing (
    id UUID PRIMARY KEY,
    content_pool_id UUID REFERENCES content_pool(id),
    platform_id UUID REFERENCES blog_platforms(id),
    
    -- 플랫폼별 최적화 콘텐츠
    optimized_title VARCHAR(255),     -- 플랫폼별 제목
    optimized_content TEXT,           -- 플랫폼별 본문
    
    -- 발행 정보
    scheduled_date DATE,
    published_date TIMESTAMP,
    published_url TEXT,
    
    -- 자동화 설정
    auto_publish BOOLEAN DEFAULT false,  -- 자사몰만 true
    publish_status VARCHAR(50)           -- draft, scheduled, published
);
```

## 2. 플랫폼별 운영 전략

### 네이버 블로그 (수동 + 반자동)
- **글감 → 네이버 최적화 → 수동 발행**
- 네이버 에디터 형식으로 변환
- 이미지 다운로드 링크 제공
- 복사/붙여넣기 가이드 제공

### 자사몰 블로그 (완전 자동화)
- **글감 → SEO 최적화 → 자동 발행**
- 구글 SEO 최적화 (메타태그, 구조화 데이터)
- 자동 이미지 업로드
- 자동 내부 링크 생성
- XML 사이트맵 자동 업데이트

## 3. 워크플로우

```
[글감 작성] 
    ↓
[플랫폼 선택] → 네이버용 / 자사몰용 / 둘 다
    ↓
[플랫폼별 최적화]
    ├─ 네이버: 감성적 제목, 이미지 중심
    └─ 자사몰: SEO 제목, 구조화된 콘텐츠
    ↓
[발행]
    ├─ 네이버: 수동 (가이드 제공)
    └─ 자사몰: 자동 (API/CMS 연동)
```

## 4. UI/UX 설계

### 통합 대시보드
- 전체 글감 풀 보기
- 플랫폼별 발행 상태
- 성과 통합 분석

### 글감 작성 화면
- 공통 필드 (제목, 주제, 키워드)
- 플랫폼 선택 체크박스
- 플랫폼별 미리보기

### 발행 관리
- 네이버: 발행 가이드 + 체크리스트
- 자사몰: 발행 스케줄러 + 자동화 설정
