# TipTap Editor SSR Hydration 에러 해결 가이드

## 🚨 문제 증상

**에러 메시지:**
```
Error: Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false` to avoid hydration mismatches.
```

**발생 위치:**
- `components/admin/TipTapEditor.tsx` (32번 라인)
- 블로그 관리 페이지 (`/admin/blog`)

## 🔍 원인

- TipTap 라이브러리 버전 `^3.6.5` 이상에서는 SSR hydration 에러를 방지하기 위해 `immediatelyRender: false` 옵션이 **필수**입니다.
- 이전 버전에서는 선택사항이었지만, 최신 버전에서는 명시적으로 설정해야 합니다.
- 7a68da6 커밋 시점의 코드에는 이 옵션이 없었지만, 현재 설치된 TipTap 라이브러리 버전에서는 필수입니다.

## ✅ 해결 방법

`components/admin/TipTapEditor.tsx` 파일의 `useEditor` 호출에 `immediatelyRender: false`를 추가합니다:

```typescript
const editor = useEditor({
  immediatelyRender: false, // ✅ TipTap 3.6.5+ SSR hydration 에러 방지 (필수)
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder: '여기에 글을 작성하세요...' }),
    Markdown.configure({ html: false })
  ],
  content: valueMarkdown || '',
  // ... other options
});
```

## 📝 참고사항

- **TipTap 버전**: `@tiptap/react: ^3.6.5`
- **Next.js 버전**: `14.0.3`
- **해결일**: 2025-11-09
- **관련 커밋**: 7a68da6 (이전 버전으로 되돌렸지만 라이브러리 버전 차이로 에러 발생)

## 🔄 앞으로 주의사항

1. **TipTap 에디터를 사용할 때는 항상 `immediatelyRender: false`를 설정하세요.**
2. **SSR을 사용하는 Next.js 프로젝트에서는 이 옵션이 필수입니다.**
3. **새로운 TipTap 에디터 컴포넌트를 만들 때도 이 옵션을 포함하세요.**
4. **이전 커밋으로 되돌렸을 때도 라이브러리 버전이 다르면 이 옵션이 필요할 수 있습니다.**

## 📚 관련 문서

- [TipTap SSR 가이드](https://tiptap.dev/guide/react/ssr)
- [Next.js Hydration 에러](https://nextjs.org/docs/messages/react-hydration-error)
- [TipTap GitHub Issues - SSR](https://github.com/ueberdosis/tiptap/issues?q=ssr+hydration)



