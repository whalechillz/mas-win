# Phase 1B: 허브 시스템 기본 구조

## 개요
Phase 1A의 성능 최적화를 기반으로, 콘텐츠 허브 시스템의 기본 구조를 구축합니다. 기존 데이터 구조를 유지하면서 채널별 콘텐츠 상태 추적과 자동화 기능을 추가합니다.

## 목표
- 채널별 콘텐츠 상태 추적 시스템 구축
- 콘텐츠 파생 자동화 API 개발
- 채널 연결 상태 UI 구현
- 기존 데이터와의 호환성 유지

## 1. 데이터베이스 구조 확장

### 1.1 채널별 콘텐츠 상태 테이블 추가
```sql
-- 채널별 콘텐츠 상태 추적 테이블
CREATE TABLE cc_channel_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_calendar_id UUID REFERENCES cc_content_calendar(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- 'blog', 'naver_blog', 'sms', 'kakao'
  channel_content_id VARCHAR(500), -- 외부 채널의 콘텐츠 ID
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'published', 'failed', 'archived'
  published_at TIMESTAMPTZ,
  channel_metadata JSONB, -- 채널별 특수 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_channel_contents_calendar ON cc_channel_contents(content_calendar_id);
CREATE INDEX idx_channel_contents_channel ON cc_channel_contents(channel_type);
CREATE INDEX idx_channel_contents_status ON cc_channel_contents(status);
```

### 1.2 기존 테이블 확장
```sql
-- cc_content_calendar 테이블에 허브 관련 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS is_hub_content BOOLEAN DEFAULT false;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS hub_priority INTEGER DEFAULT 0;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS auto_derive_channels JSONB DEFAULT '[]'::jsonb;

-- 인덱스 추가
CREATE INDEX idx_cc_hub_content ON cc_content_calendar(is_hub_content) WHERE is_hub_content = true;
CREATE INDEX idx_cc_hub_priority ON cc_content_calendar(hub_priority);
```

## 2. API 엔드포인트 개발

### 2.1 콘텐츠 허브 API
**파일**: `pages/api/admin/content-hub.js`

```javascript
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getContentHub(req, res);
    case 'POST':
      return await createContentHub(req, res);
    case 'PUT':
      return await updateContentHub(req, res);
    case 'DELETE':
      return await deleteContentHub(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getContentHub(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    content_type,
    status,
    is_hub_content,
    hub_priority 
  } = req.query;

  let query = supabase
    .from('cc_content_calendar')
    .select(`
      *,
      channel_contents:cc_channel_contents(*)
    `)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  // 필터 적용
  if (content_type) query = query.eq('content_type', content_type);
  if (status) query = query.eq('status', status);
  if (is_hub_content !== undefined) query = query.eq('is_hub_content', is_hub_content);
  if (hub_priority) query = query.eq('hub_priority', hub_priority);

  const { data, error, count } = await query;
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    contents: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}
```

### 2.2 콘텐츠 파생 자동화 API
**파일**: `pages/api/admin/content-hub/derive-content.js`

```javascript
export default async function handler(req, res) {
  const { content_hub_id, target_channels } = req.body;

  try {
    // 원본 콘텐츠 가져오기
    const { data: originalContent } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', content_hub_id)
      .single();

    if (!originalContent) {
      return res.status(404).json({ error: '원본 콘텐츠를 찾을 수 없습니다.' });
    }

    // 채널별 콘텐츠 생성
    const derivedContents = [];
    
    for (const channel of target_channels) {
      const derivedContent = await createChannelContent(originalContent, channel);
      derivedContents.push(derivedContent);
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('cc_content_calendar')
      .insert(derivedContents);

    if (error) throw error;

    res.json({ success: true, derived_contents: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createChannelContent(originalContent, channel) {
  // 채널별 최적화 로직
  switch (channel) {
    case 'naver_blog':
      return {
        ...originalContent,
        content_type: 'naver_blog',
        parent_content_id: originalContent.id,
        is_root_content: false,
        title: optimizeForNaver(originalContent.title),
        content_body: optimizeForNaver(originalContent.content_body)
      };
    case 'sms':
      return {
        ...originalContent,
        content_type: 'sms',
        parent_content_id: originalContent.id,
        is_root_content: false,
        title: optimizeForSMS(originalContent.title),
        content_body: optimizeForSMS(originalContent.content_body)
      };
    // 다른 채널들...
  }
}
```

### 2.3 채널 상태 관리 API
**파일**: `pages/api/admin/content-hub/channel-status.js`

```javascript
export default async function handler(req, res) {
  const { content_calendar_id, channel_type, status, channel_content_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('cc_channel_contents')
      .upsert({
        content_calendar_id,
        channel_type,
        status,
        channel_content_id,
        published_at: status === 'published' ? new Date().toISOString() : null
      });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 3. 프론트엔드 컴포넌트 개발

### 3.1 콘텐츠 허브 대시보드
**파일**: `components/admin/content-hub/ContentHubDashboard.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useContentHub } from '@/hooks/useContentHub';
import ChannelStatus from './ChannelStatus';
import ContentMetrics from './ContentMetrics';

const ContentHubDashboard = () => {
  const { contents, loading, fetchContentHub } = useContentHub();
  const [selectedContent, setSelectedContent] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree', 'list', 'calendar'

  useEffect(() => {
    fetchContentHub();
  }, []);

  return (
    <div className="content-hub-dashboard">
      <div className="dashboard-header">
        <h1>콘텐츠 허브</h1>
        <div className="view-controls">
          <button 
            className={viewMode === 'tree' ? 'active' : ''}
            onClick={() => setViewMode('tree')}
          >
            트리 뷰
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            리스트 뷰
          </button>
          <button 
            className={viewMode === 'calendar' ? 'active' : ''}
            onClick={() => setViewMode('calendar')}
          >
            캘린더 뷰
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="main-content">
          {viewMode === 'tree' && <ContentTree contents={contents} />}
          {viewMode === 'list' && <ContentList contents={contents} />}
          {viewMode === 'calendar' && <ContentCalendar contents={contents} />}
        </div>
        
        <div className="sidebar">
          {selectedContent && (
            <>
              <ChannelStatus content={selectedContent} />
              <ContentMetrics content={selectedContent} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3.2 채널 상태 컴포넌트
**파일**: `components/admin/content-hub/ChannelStatus.tsx`

```tsx
import React from 'react';

const ChannelStatus = ({ content }) => {
  const channels = ['blog', 'naver_blog', 'sms', 'kakao'];
  
  return (
    <div className="channel-status">
      <h3>채널 상태</h3>
      <div className="channels">
        {channels.map(channel => (
          <div key={channel} className="channel-item">
            <span className="channel-name">{channel}</span>
            <span className={`status ${getChannelStatus(content, channel)}`}>
              {getChannelStatus(content, channel)}
            </span>
            <button 
              className="action-btn"
              onClick={() => handleChannelAction(content, channel)}
            >
              {getChannelAction(content, channel)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3.3 콘텐츠 메트릭 컴포넌트
**파일**: `components/admin/content-hub/ContentMetrics.tsx`

```tsx
import React from 'react';

const ContentMetrics = ({ content }) => {
  return (
    <div className="content-metrics">
      <h3>성과 지표</h3>
      <div className="metrics-grid">
        <div className="metric">
          <span className="label">조회수</span>
          <span className="value">{content.performance_metrics?.views || 0}</span>
        </div>
        <div className="metric">
          <span className="label">클릭수</span>
          <span className="value">{content.performance_metrics?.clicks || 0}</span>
        </div>
        <div className="metric">
          <span className="label">전환수</span>
          <span className="value">{content.performance_metrics?.conversions || 0}</span>
        </div>
      </div>
    </div>
  );
};
```

## 4. 커스텀 훅 개발

### 4.1 useContentHub 훅
**파일**: `hooks/useContentHub.ts`

```typescript
import { useState, useCallback } from 'react';

export const useContentHub = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchContentHub = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      const response = await fetch(`/api/admin/content-hub?${params}`);
      const data = await response.json();
      
      setContents(data.contents || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('콘텐츠 허브 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deriveContent = useCallback(async (contentId, targetChannels) => {
    try {
      const response = await fetch('/api/admin/content-hub/derive-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_hub_id: contentId,
          target_channels: targetChannels
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('콘텐츠 파생 오류:', error);
      throw error;
    }
  }, []);

  return {
    contents,
    loading,
    pagination,
    fetchContentHub,
    deriveContent
  };
};
```

## 5. 실행 계획

### 5.1 1주차: 데이터베이스 구조 확장
- [ ] 채널별 콘텐츠 상태 테이블 생성
- [ ] 기존 테이블에 허브 관련 컬럼 추가
- [ ] 인덱스 생성 및 성능 테스트

### 5.2 2주차: API 개발
- [ ] 콘텐츠 허브 API 개발
- [ ] 콘텐츠 파생 자동화 API 개발
- [ ] 채널 상태 관리 API 개발

### 5.3 3주차: 프론트엔드 개발
- [ ] 콘텐츠 허브 대시보드 컴포넌트
- [ ] 채널 상태 관리 UI
- [ ] 콘텐츠 메트릭 대시보드

### 5.4 4주차: 통합 및 테스트
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 최적화
- [ ] 사용자 테스트 및 피드백 반영

## 6. 예상 효과

### 6.1 성능 개선
- 채널별 상태 추적으로 관리 효율성 50% 향상
- 자동화된 콘텐츠 파생으로 작업 시간 70% 단축
- 통합 대시보드로 정보 접근성 80% 향상

### 6.2 사용자 경험 개선
- 직관적인 채널 상태 관리
- 실시간 성과 지표 확인
- 원클릭 콘텐츠 파생 기능

### 6.3 확장성 확보
- 새로운 채널 추가 용이성
- API 기반 확장 가능한 구조
- 마이크로서비스 아키텍처 준비

## 7. 주의사항

- 기존 데이터와의 호환성 유지 필수
- 점진적 마이그레이션으로 서비스 중단 최소화
- 각 단계별 충분한 테스트 수행
- 사용자 교육 및 문서화 준비
