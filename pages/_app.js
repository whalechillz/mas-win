import '../styles/globals.css'
import Script from 'next/script'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isAdminPage = router.pathname === '/admin';
  
  return (
    <>
      <Head>
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            ${!isAdminPage ? 'overflow: hidden;' : ''}
          }
          #__next {
            height: 100%;
          }
        `}</style>
      </Head>
      
      {/* Google Ads 전환 추적 */}
      <Script 
        src="https://www.googletagmanager.com/gtag/js?id=AW-YOUR_CONVERSION_ID"
        strategy="afterInteractive"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-YOUR_CONVERSION_ID');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  )
}