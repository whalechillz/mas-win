import React, { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Funnel202506() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)
  const [experienceCount, setExperienceCount] = useState(0)
  const [activeFAQ, setActiveFAQ] = useState<number|null>(null)

  // Phone call tracking
  const trackPhoneCall = (location: string) => {
    console.log('Phone call tracked:', location)
    return true
  }

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Experience counter animation
  useEffect(() => {
    const target = 40
    const increment = target / 100
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setExperienceCount(Math.floor(current))
    }, 30)
    return () => clearInterval(timer)
  }, [])

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1 })
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal')
    scrollRevealElements.forEach(element => {
      observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <Head>
        <title>MASGOLF | 6월 프라임타임 퍼널</title>
        <meta name="description" content="MASGOLF 6월 프라임타임 퍼널 - 40년 경력 골퍼를 위한 특별한 경험과 혜택" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
          body { font-family: 'Noto Sans KR', sans-serif; }
          .montserrat { font-family: 'Montserrat', sans-serif; }
          .gold-button { position: relative; overflow: hidden; }
          .gold-button::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); transition: left 0.5s; }
          .gold-button:hover::before { left: 100%; }
          .scroll-reveal { opacity: 0; transform: translateY(50px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
          .scroll-reveal.is-visible { opacity: 1; transform: translateY(0); }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        `}} />
      </Head>
      {/* Top Contact Bar */}
      <div className="bg-black text-white py-2 px-6">
        <div className="container mx-auto flex justify-center md:justify-end items-center space-x-6 text-sm">
          <a 
            href="tel:080-028-8888" 
            onClick={() => trackPhoneCall('top_consultation')} 
            className="flex items-center hover:text-[#FFD700] transition duration-300"
          >
            <i className="fas fa-phone-alt mr-2 text-[#FFD700]"></i> 프라임타임 상담: 080-028-8888 (무료)
          </a>
          <a 
            href="tel:031-215-0013" 
            onClick={() => trackPhoneCall('top_appointment')} 
            className="flex items-center hover:text-[#FFD700] transition duration-300"
          >
            <i className="fas fa-calendar-check mr-2 text-[#FFD700]"></i> 골든아워 시타: 031-215-0013
          </a>
        </div>
      </div>
      {/* 이하 masgolf-june-funnel.tsx 전체 내용 그대로 복사 (JSX, 스타일, 로직 등) */}
      {/* ... (생략: 위 첨부파일의 전체 내용 그대로) ... */}
    </div>
  )
} 