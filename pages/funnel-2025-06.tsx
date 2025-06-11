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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] py-20 px-6">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            당신이 필드의 진짜 주인공인 이유
          </h1>
          <div className="h-1 w-32 bg-[#FFD700] mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl mb-12 text-gray-300">
            40년의 경험, 축적된 노하우, 그리고 MASGOLF®의 혁신 기술이 만나는 순간
          </p>
        </div>
      </section>

      {/* Video Section - 프라임타임 골퍼의 하루 */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12 scroll-reveal">
            프라임타임 골퍼의 하루
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1a2847] to-[#0f1a2f] p-4">
              <div className="relative group">
                <video 
                  id="primeTimeVideo"
                  className="w-full rounded-xl shadow-lg"
                  controls
                  poster="/assets/hero/golf-course-aerial.jpg"
                  preload="metadata"
                  onPlay={() => document.getElementById('playButton')?.classList.add('hidden')}
                  onPause={() => document.getElementById('playButton')?.classList.remove('hidden')}
                >
                  <source src="/assets/0611.mp4" type="video/mp4" />
                  브라우저가 비디오 재생을 지원하지 않습니다.
                </video>
                <div 
                  id="playButton"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group-hover:scale-110"
                  onClick={() => {
                    const video = document.getElementById('primeTimeVideo') as HTMLVideoElement;
                    if (video) {
                      video.play();
                    }
                  }}
                >
                  <div className="bg-[#FFD700] rounded-full p-8 opacity-80 hover:opacity-100 transition-opacity shadow-2xl">
                    <i className="fas fa-play text-[#1a2847] text-4xl ml-2"></i>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center bg-[#FFD700]/10 rounded-full px-4 py-2">
                  <i className="fas fa-play-circle text-[#FFD700] mr-2"></i>
                  <span className="text-[#FFD700] font-medium">프라임타임 골퍼의 하루</span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-400 mt-6 text-lg">
              실제 MASGOLF® 고객의 라운드 영상 - <span className="text-[#FFD700]">알지 카트</span>에서의 위대한 순간
            </p>
          </div>
        </div>
      </section>

      {/* Experience Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4 scroll-reveal">
            프라임타임을 완성하는 프리미엄 기술
          </h2>
          <div className="h-1 w-32 bg-[#FFD700] mx-auto mb-12"></div>
          <p className="text-xl text-center text-gray-300 mb-16 scroll-reveal">
            40년의 경험에 어울리는 최고급 기술력으로 당신의 골프를 한 단계 업그레이드합니다
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* 경험의 깊이 */}
            <div className="bg-[#1a2847] rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300 scroll-reveal">
              <div className="bg-[#FFD700] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-medal text-[#1a2847] text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">경험의 깊이</h3>
              <p className="text-gray-300">
                수십 년간 쌓은 코스 전략과 상황 판단력은 젊은 골퍼들이 따라올 수 없는 당신만의 무기입니다.
              </p>
            </div>

            {/* 기술의 완성 */}
            <div className="bg-[#1a2847] rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.2s'}}>
              <div className="bg-[#FFD700] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-chart-line text-[#1a2847] text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">기술의 완성</h3>
              <p className="text-gray-300">
                반복과 수 0.87의 MASGOLF® 드라이버가 당신의 경험에 25m의 추가 비거리를 선사합니다.
              </p>
            </div>

            {/* 동반자의 인정 */}
            <div className="bg-[#1a2847] rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.4s'}}>
              <div className="bg-[#FFD700] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-users text-[#1a2847] text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">동반자의 인정</h3>
              <p className="text-gray-300">
                필드에서 보여지는 당신의 실력과 리더십은 모든 동반자들이 인정하는 진정한 골퍼의 모습입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#1a2847] to-[#0f1a2f]">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 scroll-reveal">
            지금이 당신의 프라임타임입니다
          </h2>
          <p className="text-xl text-gray-300 mb-12 scroll-reveal">
            40년의 경험이 MASGOLF®의 기술과 만날 때, 필드의 진정한 주인공이 됩니다
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-12">
            <a 
              href="tel:080-028-8888" 
              onClick={() => trackPhoneCall('cta_consultation')}
              className="gold-button bg-[#FFD700] text-[#1a2847] font-bold py-5 px-12 rounded-full text-lg hover:bg-[#FFE55C] transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center"
            >
              <i className="fas fa-phone-alt mr-3"></i>
              무료 상담 신청하기
            </a>
            <a 
              href="tel:031-215-0013" 
              onClick={() => trackPhoneCall('cta_fitting')}
              className="bg-transparent border-2 border-[#FFD700] text-[#FFD700] font-bold py-5 px-12 rounded-full text-lg hover:bg-[#FFD700] hover:text-[#1a2847] transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              <i className="fas fa-golf-ball mr-3"></i>
              골든아워 시타 예약
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-[#FFD700] text-5xl font-bold mb-2">{experienceCount}년+</div>
              <p className="text-gray-400">평균 골프 경력</p>
            </div>
            <div className="text-center">
              <div className="text-[#FFD700] text-5xl font-bold mb-2">0.87</div>
              <p className="text-gray-400">반발계수</p>
            </div>
            <div className="text-center">
              <div className="text-[#FFD700] text-5xl font-bold mb-2">25m+</div>
              <p className="text-gray-400">추가 비거리</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-[#FFD700] text-2xl font-bold mb-4">MASGOLF® Premium</h3>
            <p className="text-gray-500">
              40년의 경험이 만나는 특별한 순간
            </p>
          </div>
          
          <div className="flex justify-center space-x-8 mb-8">
            <a href="tel:080-028-8888" className="hover:text-[#FFD700] transition">
              <i className="fas fa-phone-alt mr-2"></i>
              080-028-8888
            </a>
            <a href="tel:031-215-0013" className="hover:text-[#FFD700] transition">
              <i className="fas fa-map-marker-alt mr-2"></i>
              031-215-0013
            </a>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-600">
              © 2025 MASGOLF®. All rights reserved. | 프라임타임 6월 특별 캠페인
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 