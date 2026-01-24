import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import { initTouchScrollLogger } from '../lib/touch-scroll-logger'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // 터치 스크롤 로거 초기화 (기본적으로 비활성화, 필요시 수동 활성화)
  // window.touchScrollLogger.enable() - 수동 활성화
  if (typeof window !== 'undefined') {
    initTouchScrollLogger();
  }

  return (
    <SessionProvider 
      session={session}
      refetchOnWindowFocus={false} // 리다이렉트 루프 방지
      refetchInterval={0} // 자동 갱신 비활성화 (리다이렉트 루프 방지)
    >
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </SessionProvider>
  )
}