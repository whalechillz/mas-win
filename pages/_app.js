import '../styles/globals.css'
import '../styles/admin-modern.css'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  // 전역 postMessage 오류 처리 (Google/YouTube CORS 오류 방지)
  useEffect(() => {
    const handleMessage = (event) => {
      // Google/YouTube에서 오는 postMessage 오류를 조용히 무시
      if (event.origin.includes('google.com') || 
          event.origin.includes('youtube.com') || 
          event.origin.includes('googletagmanager.com') ||
          event.origin.includes('googleapis.com')) {
        // CORS 오류를 조용히 무시
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Google Analytics 4 설정 - 비용 절약을 위해 임시 비활성화
  // useEffect(() => {
  //   const handleRouteChange = (url) => {
  //     if (typeof window !== 'undefined' && window.gtag) {
  //       window.gtag('config', 'G-SMJWL2TRM7', {
  //         page_path: url,
  //       })
  //     }
  //   }

  //   router.events.on('routeChangeComplete', handleRouteChange)
  //   return () => {
  //     router.events.off('routeChangeComplete', handleRouteChange)
  //   }
  // }, [router.events])

  return (
    <>
      {/* Google Analytics 4 - 비용 절약을 위해 임시 비활성화 */}
      {/* <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-SMJWL2TRM7"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SMJWL2TRM7', {
            page_path: window.location.pathname,
          });
        `}
      </Script> */}

      {/* Google Tag Manager - 비용 절약을 위해 임시 비활성화 */}
      {/* <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WPBX97JG');
        `}
      </Script> */}

      <Component {...pageProps} />
    </>
  )
}