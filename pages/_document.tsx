import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <script src="https://unpkg.com/feather-icons"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{
          __html: `
            feather.replace();
          `
        }} />
      </body>
    </Html>
  )
}
