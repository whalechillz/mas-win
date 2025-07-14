# 네이버 블로그 엑셀 데이터 임포트 가이드 (간단 버전)

## 1. 엑셀 형식
| 제목 | 주제 | 작성자 |
|-----|-----|-------|
| 시니어 골퍼를 위한 드라이버 선택 가이드 | 드라이버 선택 팁 | J |
| 비거리 늘리는 골프 스윙 비법 | 스윙 교정 방법 | S |

## 2. CSV로 저장
- 파일 > 다른 이름으로 저장 > CSV (UTF-8)

## 3. Supabase에서 임포트
1. Table Editor → naver_content_master
2. Insert → Import from CSV
3. 컬럼 매핑:
   - title → 제목
   - topic → 주제
   - created_by → 작성자

## 4. 자동으로 3개 계정 생성
시스템이 자동으로 mas9golf, massgoogolf, massgoogolfkorea에 대한 발행 계획을 생성합니다.

## 5. 발행 시 체크리스트
□ 제목 변형 (각 계정별로 살짝 다르게)
□ 2시간 간격 유지
□ 이미지 변경 (가능하면)
□ 태그 5-10개
