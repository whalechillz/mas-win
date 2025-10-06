import type { AppProps } from 'next/app';
import { DefaultSeo } from 'next-seo';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo
        titleTemplate="%s | MAS Golf"
        defaultTitle="MAS Golf 관리자"
        description="MAS Golf 관리자 대시보드"
        openGraph={{
          type: 'website',
          locale: 'ko_KR',
          site_name: 'MAS Golf',
        }}
        twitter={{
          cardType: 'summary_large_image',
        }}
      />
      <Component {...pageProps} />
    </>
  );
}


