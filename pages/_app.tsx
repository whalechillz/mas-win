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
      refetchOnWindowFocus={false}
      refetchInterval={0} // 세션 자동 갱신 비활성화
    >
      <Component {...pageProps} />
    </SessionProvider>
  )
}