import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Funnel202507() {
  const router = useRouter()

  useEffect(() => {
    // 정적 HTML 파일로 리다이렉트
    router.replace('/versions/funnel-2025-07-summer-final.html')
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>페이지를 불러오는 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}