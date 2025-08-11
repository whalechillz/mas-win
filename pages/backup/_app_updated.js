import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WPBX97JG');
          `,
        }}
      />
      
      {/* GTM noscript fallback */}
      <noscript>
        <iframe 
          src="https://www.googletagmanager.com/ns.html?id=GTM-WPBX97JG"
          height="0" 
          width="0" 
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>

      {/* GA4 Direct (백업용) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-SMJWL2TRM7`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          gtag('config', 'G-SMJWL2TRM7', {
            page_path: window.location.pathname,
            // 교차 도메인 추적
            linker: {
              domains: ['win.masgolf.co.kr', 'www.masgolf.co.kr']
            }
          });
        `}
      </Script>
      
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
