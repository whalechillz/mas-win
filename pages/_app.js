import '../styles/globals.css'
import Script from 'next/script'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
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