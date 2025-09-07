# Wix 게시물 수동 마이그레이션 가이드

## 🎯 현재 상황
- ✅ 2개 게시물 자동 마이그레이션 완료
- ❌ 3개 게시물 (한글 URL) 자동화 실패
- 📊 총 21개 게시물 (기존 19개 + 새로 추가된 2개)

## 📋 수동 마이그레이션할 게시물 목록

### 1. 뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사
- **원본 URL**: https://www.mas9golf.com/post/뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사
- **새 슬러그**: `hot-summer-perfect-swing-royal-salute-golf-event`
- **우선순위**: 3

### 2. 롱기스트 드라이버 찾는다면? MASGOLF(구.마쓰구골프) 고반발 드라이버로 인생 황금기를 완성하세요
- **원본 URL**: https://www.mas9golf.com/post/롱기스트-드라이버-찾는다면-masgolf구-마쓰구골프-고반발-드라이버로-인생-황금기를-완성하세요
- **새 슬러그**: `longest-driver-masgolf-high-rebound-golden-age-complete`
- **우선순위**: 4

### 3. 시니어 골퍼의 인생 드라이버, 마쓰구 고반발로 골프가 즐거워진다! 라운딩 리얼후기
- **원본 URL**: https://www.mas9golf.com/post/시니어-골퍼의-인생-드라이버-마쓰구-고반발로-골프가-즐거워진다-라운딩-리얼후기
- **새 슬러그**: `senior-golfer-life-driver-masgolf-high-rebound-golf-fun-review`
- **우선순위**: 5

## 🔧 수동 마이그레이션 방법

### 방법 1: Wix 대시보드에서 직접 복사
1. **Wix 대시보드 접속**: https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/blog/posts
2. **게시물 편집**: 각 게시물의 "편집" 버튼 클릭
3. **내용 복사**: 제목, 내용, 이미지 등을 복사
4. **새 게시물 생성**: 새로운 게시물로 생성

### 방법 2: 직접 JSON 데이터 생성
각 게시물의 정보를 수집하여 JSON 파일로 생성:

```json
{
  "id": 3,
  "title": "뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사",
  "slug": "hot-summer-perfect-swing-royal-salute-golf-event",
  "content": "게시물 내용...",
  "excerpt": "게시물 요약...",
  "featured_image": "/images/post-3-image-1.jpg",
  "meta_title": "뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사 | MASGOLF High-Rebound Driver",
  "meta_description": "MASGOLF hot summer perfect swing Royal Salute gift event...",
  "keywords": ["고반발 드라이버", "골프 드라이버", "MASGOLF"],
  "category": "golf-driver",
  "tags": ["고반발드라이버", "골프드라이버", "MASGOLF"],
  "author": "마쓰구골프",
  "published_at": "2025-07-09T00:00:00.000Z",
  "created_at": "2025-09-07T01:30:00.000Z",
  "updated_at": "2025-09-07T01:30:00.000Z",
  "status": "published",
  "images": [],
  "original_url": "https://www.mas9golf.com/post/뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사",
  "migration_source": "manual"
}
```

## 🚀 다음 단계

1. **수동으로 게시물 내용 수집**
2. **JSON 파일 생성**
3. **통합 스크립트 실행**
4. **새 블로그 시스템에서 확인**

## 📊 진행 상황

- [x] 2개 게시물 자동 마이그레이션 완료
- [ ] 3개 게시물 수동 마이그레이션
- [ ] 전체 162개 게시물 마이그레이션 계획 수립
- [ ] SEO 최적화 완료
- [ ] URL 리다이렉트 설정
