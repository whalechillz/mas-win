import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider 
      session={session}
      refetchOnWindowFocus={false} // 리다이렉트 루프 방지
      refetchInterval={0} // 자동 갱신 비활성화 (리다이렉트 루프 방지)
    >
      <Component {...pageProps} />
    </SessionProvider>
  )
}