import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function TestAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/admin/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div>로딩 중...</div>
  }

  if (!session) {
    return <div>인증되지 않음</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">인증 테스트</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold">사용자 정보:</h2>
        <p>이름: {session.user?.name}</p>
        <p>역할: {session.user?.role}</p>
        <p>전화번호: {session.user?.phone}</p>
      </div>
      <button 
        onClick={() => router.push('/admin')}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        관리자 페이지로 이동
      </button>
    </div>
  )
}
