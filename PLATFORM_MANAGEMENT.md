# 네이버 블로그 주소 수정 및 플랫폼 관리 기능

## ✅ 완료된 작업

### 1. **네이버 블로그 주소 수정**
- massgoogolf (메인)
- mas9golf (서브)  
- massgoogolfkorea (코리아)

### 2. **플랫폼 관리 UI 추가**
- "플랫폼 설정" 탭 추가
- UI에서 직접 수정/추가/삭제 가능
- 활성화/비활성화 상태 관리

## 🚀 적용 방법

### 방법 1: 기존 데이터베이스 업데이트 (권장)
Supabase SQL Editor에서 실행:
```sql
-- 네이버 블로그 URL 수정
UPDATE blog_platforms 
SET url = CASE name
    WHEN '네이버 블로그 1' THEN 'https://blog.naver.com/massgoogolf'
    WHEN '네이버 블로그 2' THEN 'https://blog.naver.com/mas9golf'
    WHEN '네이버 블로그 3' THEN 'https://blog.naver.com/massgoogolfkorea'
    ELSE url
END,
name = CASE name
    WHEN '네이버 블로그 1' THEN '네이버 블로그 - 메인'
    WHEN '네이버 블로그 2' THEN '네이버 블로그 - 서브'
    WHEN '네이버 블로그 3' THEN '네이버 블로그 - 코리아'
    ELSE name
END
WHERE type = 'naver';
```

### 방법 2: UI에서 직접 수정
1. Admin 페이지 접속
2. "마케팅 콘텐츠" 탭 클릭
3. "플랫폼 설정" 탭 클릭
4. 수정 버튼(연필 아이콘) 클릭
5. URL과 이름 수정 후 저장

## 📋 플랫폼 관리 기능

### 추가 기능
- ➕ 새 플랫폼 추가
- ✏️ 플랫폼 정보 수정 (이름, URL)
- 🗑️ 플랫폼 삭제
- 🟢 활성화 상태 표시

### 지원 플랫폼 타입
- 웹사이트 (🌐)
- 네이버 블로그 (N)
- 구글 광고 (G)
- 네이버 광고 (N)
- 인스타그램 (📷)
- 페이스북 (f)
- 유튜브 (▶️)
- 쇼츠 (📱)

## 🔄 나중에 수정하기

### UI에서 수정
1. 플랫폼 설정 탭에서 언제든지 수정 가능
2. 수정사항은 즉시 반영됨
3. 비활성화된 플랫폼은 콘텐츠 작성 시 목록에서 제외

### API로 수정
```javascript
// 플랫폼 정보 수정
await supabase
  .from('blog_platforms')
  .update({ 
    url: 'https://blog.naver.com/newblogname',
    name: '새로운 블로그 이름'
  })
  .eq('id', platformId);
```

## 💡 참고사항

### 도메인 관련
- 마스골프 웹사이트는 현재 URL 정보만 저장
- 실제 블로그 API 연동 시 추가 설정 필요
- DB 분리는 필요 없음

### 플랫폼 활성화
- 비활성화된 플랫폼은 콘텐츠 작성 시 선택 불가
- 플랫폼별 통계에서도 제외
- 설정 탭에서는 모든 플랫폼 표시

### 향후 확장
- API 키 저장 (api_key, api_secret 필드)
- OAuth 토큰 관리 (access_token, refresh_token 필드)
- 자동 발행 기능 추가 예정
