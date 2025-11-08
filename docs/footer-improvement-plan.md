# 푸터 개선 최종 계획

## 📋 개선 목표

1. **문의하기 폼 유효성 검사 메시지 개선** - 한글/일본어 사이트 모두에서 로케일에 맞는 메시지 표시
2. **푸터 사이트 전환 버튼 추가** - MASSGOO ↔ MUZIIK 사이트 간 전환
3. **신뢰도 요소 추가** - SSL 보안, 보증, 프리미엄 품질 배지

## 🎯 개선 사항

### 1. 문의하기 폼 유효성 검사 메시지

**문제점:**
- HTML5 `required` 속성의 기본 메시지가 브라우저 언어 설정에 따라 표시됨
- 일본어 사이트에서도 한국어 메시지가 표시될 수 있음

**해결 방안:**
- 커스텀 에러 상태 관리
- 로케일별 유효성 검사 메시지 설정
- 시각적 에러 표시 (빨간색 border + 에러 메시지)

**적용 파일:**
- `pages/muziik/contact.tsx`

### 2. 푸터 사이트 전환 버튼

**위치:**
- 푸터 상단 (저작권 정보 위)
- 반응형 디자인 (모바일: 세로 배치, 데스크톱: 가로 배치)

**디자인:**
- 버튼 스타일 (현재 사이트는 강조 색상, 다른 사이트는 회색)
- 호버 효과 (border 색상 변경)
- 일관된 색상 체계

**적용 파일:**
- `pages/index.js` (MASSGOO 메인)
- `pages/muziik/index.tsx` (MUZIIK 메인)
- `pages/muziik/about.tsx` (MUZIIK About)
- `pages/muziik/technology.tsx` (MUZIIK Technology)
- `pages/muziik/[product].tsx` (MUZIIK Product)
- `pages/muziik/contact.tsx` (MUZIIK Contact)

### 3. 신뢰도 요소 추가

**추가할 요소:**
1. **SSL 보안 인증** - 🔒 아이콘 + "SSL 보안 인증" 텍스트
2. **2년 무제한 보증** - ✓ 아이콘 + "2년 무제한 보증" 텍스트
3. **프리미엄 품질** - ⭐ 아이콘 + "프리미엄 품질" 텍스트

**디자인:**
- 3개 컬럼 그리드 (모바일: 1개 컬럼)
- 아이콘 + 제목 + 설명 구조
- 기존 이미지 활용 (`awards-bookshelf-04.webp`, `service-warranty.webp`)

**적용 파일:**
- `pages/index.js` (MASSGOO 메인)
- `pages/muziik/index.tsx` (MUZIIK 메인)

## 📁 파일 구조

```
public/main/brand/
├── ssl-secure-badge.svg          # SSL 보안 배지 (생성)
├── warranty-badge.svg            # 보증 배지 (생성)
├── premium-quality-badge.svg     # 프리미엄 품질 배지 (생성)
├── japan-quality-badge.svg       # 일본제 품질 배지 (생성)
├── awards-bookshelf-04.webp      # 수상 내역 (기존)
├── service-warranty.webp         # 서비스 보증 (기존)
└── call_center.webp              # 고객 상담 센터 (기존)
```

## 🚀 실행 순서

1. **신뢰도 배지 아이콘 생성**
   ```bash
   node scripts/download-trust-badges.js
   ```

2. **문의하기 폼 유효성 검사 메시지 개선**
   - `pages/muziik/contact.tsx` 수정

3. **푸터 사이트 전환 버튼 추가**
   - `pages/index.js` 수정
   - `pages/muziik/index.tsx` 수정
   - 기타 MUZIIK 페이지들 수정

4. **신뢰도 요소 추가**
   - `pages/index.js` 푸터에 추가
   - `pages/muziik/index.tsx` 푸터에 추가

5. **빌드 및 배포**
   ```bash
   npm run build
   vercel --prod
   ```

## ✅ 체크리스트

- [ ] 신뢰도 배지 아이콘 생성 완료
- [ ] 문의하기 폼 유효성 검사 메시지 개선 완료
- [ ] MASSGOO 메인 푸터 개선 완료
- [ ] MUZIIK 메인 푸터 개선 완료
- [ ] MUZIIK 서브 페이지 푸터 개선 완료
- [ ] 빌드 테스트 완료
- [ ] 배포 완료

## 📝 참고 사항

- 신뢰도 배지는 SVG로 생성하여 파일 크기 최소화
- 기존 이미지(`awards-bookshelf-04.webp`, `service-warranty.webp`)는 썸네일로 활용
- 반응형 디자인 적용 (모바일/태블릿/데스크톱)
- 로케일별 텍스트 지원 (한글/일본어)

