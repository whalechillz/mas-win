# 마케팅 대시보드 전문 고도화 계획서

## 1. 현재 시스템 분석

### 탭별 현황
| 탭 | 컴포넌트 | DB 테이블 | 상태 | 주요 이슈 |
|---|---|---|---|---|
| ✨ 통합 멀티채널 | UnifiedMultiChannelManager | content_ideas, monthly_themes | ✅ 작동 | AI 유료화 표시 제거 필요 |
| 📊 통합 캠페인 | IntegratedCampaignManager | marketing_campaigns, content_ideas | ⚠️ 작동 | AI 유료화, 복잡한 UI |
| 🟢 블로그 관리 | SimpleBlogManager | simple_blog_contents | ✅ 작동 | SEO 검증 시스템 없음 |
| 📱 멀티채널 관리 | MultiChannelManager | content_ideas | ✅ 작동 | - |
| 📅 콘텐츠 캘린더 | BlogCalendar | blog_contents | ❌ 에러 | Props 불일치 |
| 📊 퍼널 계획 | MarketingFunnelPlan | marketing_funnel_stages, annual_marketing_plans | ❌ 에러 | Props 불일치 |
| 🗑️ 휴지통 | TrashManager | content_ideas (status='deleted') | ✅ 작동 | - |
| 🔧 시스템 설정 | PlatformManager | blog_platforms, content_categories, team_members | ✅ 작동 | - |

## 2. 전문 고도화 로드맵

### Phase 1: 긴급 버그 수정 (즉시)
1. **BlogCalendar 컴포넌트 수정**
   - Props 타입 불일치 해결
   - `blog_contents` → `simple_blog_contents` 테이블 연결

2. **MarketingFunnelPlan 컴포넌트 수정**
   - Props 타입 정의 수정
   - 데이터 로딩 로직 개선

### Phase 2: AI 시스템 개선 (30분)
1. **AI 유료화 제거**
   - 모든 유료화 관련 UI 제거
   - 실시간 AI 모델 표시 기능 추가
   - AIGenerationSettings 컴포넌트 간소화

2. **AI 지원 방식 변경**
   - 팝업/새창 방식으로 전환
   - 실시간 콘텐츠 기획 지원

### Phase 3: 네이버 블로그 SEO 검증 시스템 (1시간)
1. **SEO 검증 컴포넌트 개발**
   ```typescript
   - 제목 키워드 밀도 검사 (2-3회)
   - 본문 키워드 분포 검사 (5-7회)
   - 이미지 개수 검사 (최소 3개)
   - 이미지 파일명 SEO 검사
   - 해시태그 적정성 검사 (5-10개)
   - 글자 수 검사 (최소 1,500자)
   ```

2. **최신 네이버 로직 반영**
   - C-Rank 알고리즘 대응
   - 체류시간 최적화 가이드
   - 모바일 최적화 체크

### Phase 4: UX/UI 전면 개선 (2시간)
1. **대시보드 통합**
   - 실시간 현황 위젯
   - 드래그 앤 드롭 캘린더
   - 통합 검색 기능

2. **반응형 디자인**
   - 모바일 최적화
   - 다크모드 지원

### Phase 5: 성능 최적화 (30분)
1. **데이터베이스 최적화**
   - 인덱스 추가
   - 뷰 테이블 활용

2. **프론트엔드 최적화**
   - 지연 로딩
   - 캐싱 전략

## 3. 구현 상세

### 3.1 네이버 블로그 SEO 검증 시스템

#### 검증 항목
1. **제목 최적화**
   - 길이: 25-40자
   - 키워드 포함: 1-2회
   - 감성 키워드 포함

2. **본문 최적화**
   - 길이: 1,500-3,000자
   - 키워드 밀도: 2-3%
   - 단락 구성: 3-5줄
   - 소제목 활용: 3-5개

3. **이미지 최적화**
   - 개수: 3-7개
   - 파일명: SEO 키워드 포함
   - 대체 텍스트 설정
   - 용량: 200KB 이하

4. **해시태그 최적화**
   - 개수: 5-10개
   - 관련성 높은 태그
   - 브랜드 태그 포함

### 3.2 AI 모델 실시간 표시
```javascript
const aiModels = {
  'gpt-4': 'GPT-4 (고급)',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo (표준)',
  'claude-3': 'Claude 3 (창의적)',
  'perplexity': 'Perplexity (검색 강화)'
};
```

## 4. 예상 결과

### 개선 효과
- 작업 효율성 40% 향상
- 네이버 블로그 상위 노출률 60% 증가
- 콘텐츠 품질 점수 평균 85점 이상
- 사용자 만족도 90% 이상

### 측정 지표
- 콘텐츠 제작 시간
- SEO 점수
- 네이버 검색 순위
- 사용자 체류 시간

## 5. 실행 계획

### 즉시 시작
1. Phase 1: 긴급 버그 수정
2. Phase 2: AI 시스템 개선
3. Phase 3: SEO 검증 시스템 구축
4. Phase 4: UX/UI 개선
5. Phase 5: 성능 최적화

---

**작성일**: 2025년 7월 19일  
**버전**: 1.0  
**상태**: 실행 준비 완료