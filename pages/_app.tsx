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
      refetchOnWindowFocus={true} // true로 변경하여 세션 갱신
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      basePath="/api/auth" // 명시적으로 basePath 설정
    >
      <Component {...pageProps} />
    </SessionProvider>
  )
}