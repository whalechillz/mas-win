# 설문 조사 종료 처리 및 당첨자 명단 페이지 구현 계획

## 📋 문서 정보
- **작성일**: 2026-01-22
- **상태**: 계획 단계
- **우선순위**: 높음

---

## 1. 요구사항

### 1.1 설문 조사 종료 처리
- 설문 조사가 종료되었을 때 `/survey` 페이지의 "설문 조사 시작하기" 버튼 처리
- **옵션 1**: 얼럿창으로 "설문이 종료되었습니다" 메시지와 함께 당첨자 명단 표시
- **옵션 2**: 버튼을 "설문이 종료되었습니다"로 변경하고 비활성화

### 1.2 당첨자 명단 페이지
- 경품 당첨자 또는 선물 수령자 명단을 보여주는 페이지 생성
- "축하 드립니다" 메시지와 함께 표시
- **표시 방식 옵션**:
  - **옵션 A**: 3~5명씩 자동 스크롤 방식 (모바일 친화적)
  - **옵션 B**: 표 형식으로 모두 표시 (데스크톱 친화적)
- **모바일 최적화 필수**

---

## 2. 구현 계획

### 2.1 설문 조사 종료 여부 확인

#### 2.1.1 환경 변수 또는 설정 테이블
**방법 1: 환경 변수 사용 (간단)**
```env
# .env.local
SURVEY_END_DATE=2026-01-31
SURVEY_END_TIME=23:59:59
```

**방법 2: 데이터베이스 설정 테이블 (유연)**
```sql
-- survey_settings 테이블 생성
CREATE TABLE IF NOT EXISTS survey_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 종료 날짜 설정
INSERT INTO survey_settings (setting_key, setting_value) 
VALUES ('survey_end_date', '2026-01-31')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
```

#### 2.1.2 API 엔드포인트 생성
**파일**: `pages/api/survey/status.ts`
```typescript
// GET /api/survey/status
// 응답: { isActive: boolean, endDate?: string, message?: string }
```

### 2.2 설문 조사 랜딩 페이지 수정

**파일**: `pages/survey/index.tsx`

**변경 사항**:
1. 페이지 로드 시 `/api/survey/status` 호출하여 종료 여부 확인
2. 종료된 경우:
   - **옵션 1**: 버튼 클릭 시 얼럿창 표시
     ```tsx
     const handleStartSurvey = () => {
       if (surveyEnded) {
         alert('설문이 종료되었습니다.\n\n당첨자 명단은 아래 링크에서 확인하실 수 있습니다.');
         router.push('/survey/winners');
         return;
       }
       router.push('/survey/form');
     };
     ```
   - **옵션 2**: 버튼을 비활성화하고 텍스트 변경
     ```tsx
     <button
       onClick={handleStartSurvey}
       disabled={surveyEnded}
       className={surveyEnded ? 'opacity-50 cursor-not-allowed' : ''}
     >
       {surveyEnded ? '설문이 종료되었습니다' : '설문 조사 시작하기'}
     </button>
     ```

### 2.3 당첨자 명단 조회 API

**파일**: `pages/api/survey/winners.ts`

**기능**:
- 당첨자 목록 조회 (`is_winner = true` 또는 `event_winner = true`)
- 선물 수령자 목록 조회 (`gift_delivered = true`)
- 필터링 옵션:
  - 당첨자만 (`type=winner`)
  - 선물 수령자만 (`type=gift`)
  - 모두 (`type=all`)

**응답 형식**:
```typescript
{
  success: boolean;
  data: {
    winners: Array<{
      id: string;
      name: string;
      phone: string;
      selected_model: string;
      is_winner: boolean;
      event_winner: boolean;
      gift_delivered: boolean;
      created_at: string;
    }>;
    total: number;
  };
}
```

### 2.4 당첨자 명단 페이지 생성

**파일**: `pages/survey/winners.tsx`

#### 2.4.1 디자인 옵션

**옵션 A: 자동 스크롤 방식 (3~5명씩)**
- 모바일 최적화
- 카드 형식으로 3~5명씩 표시
- 자동 스크롤 애니메이션
- 수동 스크롤도 가능

**옵션 B: 표 형식 (모두 표시)**
- 데스크톱 친화적
- 반응형 테이블 (모바일에서는 카드 형식으로 변환)
- 페이지네이션 또는 무한 스크롤

**권장: 하이브리드 방식**
- 모바일: 자동 스크롤 카드 형식
- 데스크톱: 표 형식

#### 2.4.2 UI 구성

```tsx
// 페이지 구조
<div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
  {/* 헤더 */}
  <section className="py-12 px-4">
    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
      <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
        축하 드립니다! 🎉
      </span>
    </h1>
    <p className="text-center text-gray-300 mb-8">
      MASSGOO X MUZIIK 설문 조사 당첨자 명단
    </p>
  </section>

  {/* 필터 탭 */}
  <div className="flex justify-center gap-4 mb-8">
    <button onClick={() => setFilter('all')}>전체</button>
    <button onClick={() => setFilter('winner')}>경품 당첨자</button>
    <button onClick={() => setFilter('gift')}>선물 수령자</button>
  </div>

  {/* 명단 표시 영역 */}
  {/* 모바일: 자동 스크롤 카드 */}
  {/* 데스크톱: 표 형식 */}
</div>
```

#### 2.4.3 자동 스크롤 구현 (모바일)

```tsx
// 3~5명씩 그룹으로 나누어 표시
const groupSize = 5;
const groups = useMemo(() => {
  const result = [];
  for (let i = 0; i < winners.length; i += groupSize) {
    result.push(winners.slice(i, i + groupSize));
  }
  return result;
}, [winners]);

// 자동 스크롤 (5초마다 다음 그룹으로)
useEffect(() => {
  if (groups.length <= 1) return;
  
  const interval = setInterval(() => {
    setCurrentGroupIndex((prev) => (prev + 1) % groups.length);
  }, 5000);
  
  return () => clearInterval(interval);
}, [groups.length]);
```

---

## 3. 구현 단계

### Phase 1: 설문 종료 확인 기능
1. ✅ 환경 변수 또는 설정 테이블 생성
2. ✅ `/api/survey/status` API 생성
3. ✅ `/survey` 페이지에 종료 처리 추가

### Phase 2: 당첨자 명단 API
1. ✅ `/api/survey/winners` API 생성
2. ✅ 필터링 기능 구현

### Phase 3: 당첨자 명단 페이지
1. ✅ `/survey/winners` 페이지 생성
2. ✅ 반응형 디자인 (모바일/데스크톱)
3. ✅ 자동 스크롤 또는 표 형식 구현

---

## 4. 파일 목록

### 신규 파일
- `pages/api/survey/status.ts` - 설문 종료 여부 확인 API
- `pages/api/survey/winners.ts` - 당첨자 명단 조회 API
- `pages/survey/winners.tsx` - 당첨자 명단 페이지

### 수정 파일
- `pages/survey/index.tsx` - 설문 종료 처리 추가

### 데이터베이스 (옵션)
- `database/create-survey-settings-table.sql` - 설정 테이블 생성 (방법 2 선택 시)

---

## 5. 사용자 경험 시나리오

### 시나리오 1: 설문 종료 전
1. 사용자가 `/survey` 페이지 접속
2. "설문 조사 시작하기" 버튼 클릭
3. 설문 폼 페이지로 이동

### 시나리오 2: 설문 종료 후
1. 사용자가 `/survey` 페이지 접속
2. "설문 조사 시작하기" 버튼 클릭 (또는 비활성화된 버튼 표시)
3. 얼럿창 표시: "설문이 종료되었습니다"
4. 당첨자 명단 페이지로 이동 제안

### 시나리오 3: 당첨자 명단 확인
1. 사용자가 `/survey/winners` 페이지 접속
2. "축하 드립니다! 🎉" 메시지 표시
3. 필터 선택 (전체/경품 당첨자/선물 수령자)
4. 명단 확인 (모바일: 자동 스크롤, 데스크톱: 표 형식)

---

## 6. 결정 사항

### 6.1 설문 종료 처리 방식
**권장**: **옵션 1 (얼럿창 + 명단 페이지 링크)**
- 사용자에게 명확한 안내
- 당첨자 명단 페이지로 자연스럽게 유도

### 6.2 당첨자 명단 표시 방식
**권장**: **하이브리드 방식**
- 모바일: 자동 스크롤 카드 형식 (3~5명씩)
- 데스크톱: 표 형식 (페이지네이션)

### 6.3 설문 종료 날짜 관리
**권장**: **환경 변수 사용 (방법 1)**
- 간단하고 빠른 구현
- 필요 시 데이터베이스로 마이그레이션 가능

---

## 7. 다음 단계

1. 사용자 확인 및 승인
2. 구현 시작
3. 테스트 및 배포
