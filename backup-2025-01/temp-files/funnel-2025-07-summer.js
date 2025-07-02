import { useState } from 'react'
import Head from 'next/head'
import Script from 'next/script'

export default function Funnel202507Summer() {
  const [showBookingPopup, setShowBookingPopup] = useState(false)
  const [showContactPopup, setShowContactPopup] = useState(false)
  const [showDetailPopup, setShowDetailPopup] = useState(false)
  const [quizData, setQuizData] = useState({
    style: '',
    priority: '',
    distance: 0,
    product: null
  })

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const callTimes = []
    formData.getAll('call_times').forEach(time => {
      callTimes.push(time)
    })
    
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      call_times: callTimes.join(', ')
    }
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        alert('문의가 접수되었습니다. 선택하신 시간에 연락드리겠습니다.')
        setShowContactPopup(false)
        e.target.reset()
      } else {
        throw new Error('서버 오류')
      }
    } catch (error) {
      console.error('문의 실패:', error)
      alert('문의 접수 중 오류가 발생했습니다. 전화로 문의해주세요.')
    }
  }

  // 기존 HTML 내용을 React 컴포넌트로 변환
  return (
    <>
      <Head>
        <title>MASGOLF | 뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Script src="https://cdn.tailwindcss.com" />
      
      {/* 나머지 HTML 내용을 JSX로 변환 */}
      <div className="bg-black min-h-screen">
        {/* 기존 HTML 구조를 React 컴포넌트로 변환 */}
        {/* 팝업, 폼 제출 등은 React state와 이벤트 핸들러로 처리 */}
      </div>
    </>
  )
}