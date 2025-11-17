# MUZIIK 링크 문제 분석 및 해결 방안

## 🔍 Playwright 테스트 결과

### ✅ 정상 작동하는 경로
- `https://muziik.masgolf.co.kr/muziik/sapphire` - 200 OK
- `https://muziik.masgolf.co.kr/muziik/beryl` - 200 OK

### ❌ 실패하는 경로
- `https://muziik.masgolf.co.kr/sapphire` - 404 (vercel.json 리라이트 미작동)
- `https://muziik.masgolf.co.kr/beryl` - 404 (vercel.json 리라이트 미작동)
- `https://muziik.masgolf.co.kr/ja/muziik/sapphire` - 404 (Next.js i18n 로케일 경로 미지원)
- `https://muziik.masgolf.co.kr/ja/muziik/beryl` - 404 (Next.js i18n 로케일 경로 미지원)
- `https://muziik.masgolf.co.kr/ja/sapphire` - 404
- `https://muziik.masgolf.co.kr/ja/beryl` - 404

## 🔎 원인 분석

### 1. Vercel Rewrites 미작동 문제

**현재 설정 (`vercel.json`):**
```json
{
  "source": "/sapphire",
  "has": [{"type": "host", "value": "muziik.masgolf.co.kr"}],
  "destination": "/muziik/sapphire"
}
```

**문제점:**
- Vercel rewrites는 Next.js i18n과 함께 사용할 때 로케일 경로를 자동으로 처리하지 않음
- Next.js i18n이 활성화되어 있으면 (`next.config.js`에 `i18n` 설정), 모든 경로가 로케일 프리픽스를 가짐
- `/sapphire`는 Next.js가 `/ko/sapphire` 또는 `/ja/sapphire`로 해석하려고 시도하지만, 해당 페이지가 존재하지 않음

### 2. Next.js i18n 로케일 경로 미지원

**현재 `getStaticPaths` 구현:**
```typescript
export const getStaticPaths: GetStaticPaths = async () => {
  const paths = products.map((product) => ({
    params: { product: product.id },
  }));

  return {
    paths,
    fallback: false,
  };
};
```

**문제점:**
- Next.js i18n을 사용할 때 `getStaticPaths`는 각 로케일에 대해 경로를 생성해야 함
- 현재 코드는 로케일을 고려하지 않아 `/ja/muziik/sapphire` 경로가 생성되지 않음
- Next.js는 기본 로케일(`ko`)에 대해서만 경로를 생성하고, 다른 로케일(`ja`)에 대해서는 404를 반환

### 3. Next.js i18n과 Vercel Rewrites 충돌

**Next.js i18n 동작 방식:**
- 기본 로케일(`ko`): `/muziik/sapphire` (로케일 프리픽스 없음)
- 다른 로케일(`ja`): `/ja/muziik/sapphire` (로케일 프리픽스 포함)

**Vercel Rewrites 동작 방식:**
- Rewrites는 Next.js 라우팅 이전에 실행됨
- 하지만 Next.js i18n이 활성화되어 있으면, rewrites된 경로도 로케일 프리픽스를 가져야 함
- `/sapphire` → `/muziik/sapphire`로 리라이트되지만, Next.js는 이를 `/ko/muziik/sapphire`로 해석하려고 시도

## 💡 해결 방안

### 방안 1: `getStaticPaths`에서 로케일 경로 생성 (권장)

**수정 필요 파일:** `pages/muziik/[product].tsx`

```typescript
export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths = [];
  
  // 각 로케일과 제품 조합으로 경로 생성
  for (const locale of locales || []) {
    for (const product of products) {
      paths.push({
        params: { product: product.id },
        locale,
      });
    }
  }

  return {
    paths,
    fallback: false,
  };
};
```

**장점:**
- Next.js i18n 표준 방식
- 모든 로케일 경로가 정적으로 생성됨
- SEO에 유리

**단점:**
- 빌드 시간 증가 (로케일 수 × 제품 수)

### 방안 2: `vercel.json`에 로케일 경로 리라이트 추가

**수정 필요 파일:** `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/sapphire",
      "has": [{"type": "host", "value": "muziik.masgolf.co.kr"}],
      "destination": "/muziik/sapphire"
    },
    {
      "source": "/ja/sapphire",
      "has": [{"type": "host", "value": "muziik.masgolf.co.kr"}],
      "destination": "/ja/muziik/sapphire"
    },
    {
      "source": "/beryl",
      "has": [{"type": "host", "value": "muziik.masgolf.co.kr"}],
      "destination": "/muziik/beryl"
    },
    {
      "source": "/ja/beryl",
      "has": [{"type": "host", "value": "muziik.masgolf.co.kr"}],
      "destination": "/ja/muziik/beryl"
    }
  ]
}
```

**장점:**
- 간단한 수정
- 즉시 적용 가능

**단점:**
- `getStaticPaths`가 로케일 경로를 생성하지 않으면 여전히 404 발생
- 로케일이 추가될 때마다 수동으로 추가해야 함

### 방안 3: Next.js i18n 비활성화 및 수동 로케일 처리

**수정 필요 파일:** `next.config.js`, `pages/muziik/[product].tsx`

**장점:**
- 완전한 제어 가능
- Vercel rewrites와 충돌 없음

**단점:**
- 기존 로케일 처리 로직 수정 필요
- Next.js i18n 기능 포기

## 🎯 권장 해결책

**방안 1 + 방안 2 조합:**

1. `getStaticPaths`에서 로케일 경로 생성 (방안 1)
2. `vercel.json`에 로케일 경로 리라이트 추가 (방안 2)

이렇게 하면:
- ✅ `/muziik/sapphire` - 정상 작동 (기본 로케일)
- ✅ `/ja/muziik/sapphire` - 정상 작동 (일본어 로케일)
- ✅ `/sapphire` → `/muziik/sapphire` - 리라이트 작동
- ✅ `/ja/sapphire` → `/ja/muziik/sapphire` - 리라이트 작동

## 📝 기존 해결 사례

프로젝트 계획서(`docs/project_plan.md`)에 따르면:
- `vercel.json`에 리라이트 설정이 존재하지만 실제로 작동하지 않음
- `middleware.ts`는 `/admin/*`만 처리하므로 muziik 페이지에는 영향 없음
- `pages/index.js`의 `getServerSideProps`는 `muziik.masgolf.co.kr` 루트만 `/muziik`로 리다이렉트

**결론:** Next.js i18n과 Vercel rewrites의 충돌 문제이며, `getStaticPaths`에서 로케일 경로를 생성하지 않아 발생한 문제입니다.


















