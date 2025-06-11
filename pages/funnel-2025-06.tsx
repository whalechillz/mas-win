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
        <title>MASGOLF | 6월 인생 황금기 캠페인</title>
        <meta name="description" content="MASGOLF 6월 인생 황금기 캠페인 - 40년 경력 골퍼를 위한 특별한 경험과 혜택" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://cdn.tailwindcss.com"></script>
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
            <i className="fas fa-phone-alt mr-2 text-[#FFD700]"></i> 황금기 상담: 080-028-8888 (무료)
          </a>
          <a 
            href="https://www.mas9golf.com/try-a-massgoo" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-[#FFD700] transition duration-300"
          >
            <i className="fas fa-calendar-check mr-2 text-[#FFD700]"></i> 골든아워 시타: 예약하기
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] py-20 px-6 min-h-[600px] flex items-center" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto text-center text-white relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
            당신이 필드의 진짜 주인공인 이유
          </h1>
          <div className="h-1 w-32 bg-[#FFD700] mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl mb-12 text-gray-100 drop-shadow-lg">
            40년의 경험, 축적된 노하우, 그리고 MASGOLF®의 혁신 기술이 만나는 순간
          </p>
          <div className="mt-8">
            <a 
              href="#video-section"
              className="inline-block bg-[#FFD700] text-black px-8 py-4 rounded-full font-bold hover:bg-[#FFC700] transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              인생 황금기 영상 보기 <i className="fas fa-play-circle ml-2"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Video Section - 프라임타임 골퍼의 하루 */}
      <section id="video-section" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12 scroll-reveal">
            인생 황금기 골퍼의 하루
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1a2847] to-[#0f1a2f] p-4">
              <div className="relative group">
                <video 
                  id="primeTimeVideo"
                  className="w-full rounded-xl shadow-lg"
                  controls
                  preload="metadata"
                  onPlay={() => document.getElementById('playButton')?.classList.add('hidden')}
                  onPause={() => document.getElementById('playButton')?.classList.remove('hidden')}
                >
                  <source src="/assets/campaigns/2025-06/primetime-golfer-daily.mp4" type="video/mp4" />
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
                  <span className="text-[#FFD700] font-medium">인생 황금기 골퍼의 하루</span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-400 mt-6 text-lg">
              실제 MASGOLF® 고객의 라운드 영상 - <span className="text-[#FFD700]">40년 경력 골퍼</span>의 완벽한 하루
            </p>
          </div>
        </div>
      </section>

      {/* Experience Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4 scroll-reveal">
            인생 황금기를 완성하는 프리미엄 기술
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

      {/* Product Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4 scroll-reveal">
            프라임타임을 완성하는 프리미엄 기술
          </h2>
          <div className="h-1 w-32 bg-[#FFD700] mx-auto mb-12"></div>
          <p className="text-xl text-center text-gray-300 mb-16 scroll-reveal">
            40년의 경험에 어울리는 최고급 기술력으로 당신의 골프를 한 단계 업그레이드합니다
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 일본 프리미엄 티타늄 골드 에디션 */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-2xl overflow-hidden shadow-2xl hover:transform hover:scale-105 transition-all duration-300 scroll-reveal">
              <div className="relative h-64">
                <img 
                  src="/assets/product/titanium_club_face_1200x800.jpg" 
                  alt="일본 프리미엄 티타늄" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <i className="fas fa-medal text-white text-2xl"></i>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-[#1a1a1a]">
                <h3 className="text-2xl font-bold text-[#FFD700] mb-4">일본 프리미엄 티타늄<br />골드 에디션</h3>
                <p className="text-gray-300">
                  JFE/DAIDO 티타늄으로 제작된 초박형 페이스는 당신의 경험있는 스윙에 최고의 반발력을 선사합니다. 프리미엄 골퍼를 위한 프리미엄 소재입니다.
                </p>
              </div>
            </div>

            {/* 반발계수 0.87 */}
            <div className="bg-gradient-to-br from-[#1a2847] to-[#0f1a2f] rounded-2xl overflow-hidden shadow-2xl hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.2s'}}>
              <div className="relative h-64">
                <img 
                  src="/assets/product/driver_impact_1200x800.jpg" 
                  alt="반발계수 0.87" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl font-bold text-white mb-2">0.87</div>
                    <div className="text-[#FFD700] text-lg font-medium">최대 반발계수</div>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-[#1a1a1a]">
                <h3 className="text-2xl font-bold text-white mb-4">반발계수 0.87<br />경험자를 위한 파워</h3>
                <p className="text-gray-300">
                  규격을 초월한 반발력으로 평균 25m의 추가 비거리를 제공합니다. 당신의 스윙 경험과 만나 시너지를 극대화합니다.
                </p>
              </div>
            </div>

            {/* NGS 프라임 샤프트 */}
            <div className="bg-gradient-to-br from-[#8B4513] to-[#654321] rounded-2xl overflow-hidden shadow-2xl hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.4s'}}>
              <div className="relative h-64">
                <img 
                  src="/assets/product/premium_golf_shaft_detail_1200x800.jpg" 
                  alt="NGS 프라임 샤프트" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <i className="fas fa-cogs text-white text-2xl"></i>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-[#1a1a1a]">
                <h3 className="text-2xl font-bold text-[#FFD700] mb-4">NGS 프라임 샤프트<br />마스터 에디션</h3>
                <p className="text-gray-300">
                  40년 경력 골퍼의 스윙 특성을 완벽 분석하여 개발된 독점 샤프트. 10년 교환 보장으로 평생 파트너가 됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4 scroll-reveal">
            인생 황금기를 경험한 동료들의 이야기
          </h2>
          <div className="h-1 w-32 bg-[#FFD700] mx-auto mb-12"></div>
          <p className="text-xl text-center text-gray-300 mb-16 scroll-reveal">
            40년 이상의 골프 경력을 가진 시니어 골퍼들이 MASGOLF®와 함께한 황금기 경험담
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 후기 1 */}
            <div className="bg-[#1a1a1a] border border-[#FFD700]/20 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 scroll-reveal">
              <div className="flex items-center mb-6">
                <img 
                  src="/assets/review/golfer_avatar_512x512_01.jpg" 
                  alt="최○○님" 
                  className="w-16 h-16 rounded-full mr-4 border-2 border-[#FFD700]"
                />
                <div>
                  <h4 className="text-white font-bold">최○○님</h4>
                  <p className="text-[#FFD700] text-sm">68세, 43년 경력</p>
                </div>
              </div>
              <div className="flex text-[#FFD700] mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-gray-300 italic">
                "43년 골프를 쳤지만, MASGOLF®로 바꾸고 나서야 진짜 인생 황금기가 시작된 것 같습니다. 동반자들이 '정말 잘 치신다'고 인정해주네요."
              </p>
            </div>

            {/* 후기 2 */}
            <div className="bg-[#1a1a1a] border border-[#FFD700]/20 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.2s'}}>
              <div className="flex items-center mb-6">
                <img 
                  src="/assets/review/golfer_avatar_512x512_02.jpg" 
                  alt="정○○님" 
                  className="w-16 h-16 rounded-full mr-4 border-2 border-[#FFD700]"
                />
                <div>
                  <h4 className="text-white font-bold">정○○님</h4>
                  <p className="text-[#FFD700] text-sm">65세, 40년 경력</p>
                </div>
              </div>
              <div className="flex text-[#FFD700] mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-gray-300 italic">
                "회사 임원진 모임에서 제가 가장 멀리 치게 되었습니다. 40년 골프 인생에서 가장 자신감 넘치는 시기입니다. 정말 감사합니다."
              </p>
            </div>

            {/* 후기 3 */}
            <div className="bg-[#1a1a1a] border border-[#FFD700]/20 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 scroll-reveal" style={{transitionDelay: '0.4s'}}>
              <div className="flex items-center mb-6">
                <img 
                  src="/assets/review/golfer_avatar_512x512_03.jpg" 
                  alt="김○○님" 
                  className="w-16 h-16 rounded-full mr-4 border-2 border-[#FFD700]"
                />
                <div>
                  <h4 className="text-white font-bold">김○○님</h4>
                  <p className="text-[#FFD700] text-sm">62세, 38년 경력</p>
                </div>
              </div>
              <div className="flex text-[#FFD700] mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-gray-300 italic">
                "젊은 골퍼들이 부러워하는 일관된 샷을 구사할 수 있게 되었습니다. 경험과 기술이 만나니 이런 결과가 나오는군요."
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-[#FFD700] text-lg font-medium">
              <i className="fas fa-trophy mr-2"></i>
              황금기 고객 만족도 98%
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#1a2847] to-[#0f1a2f]">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 scroll-reveal">
            지금이 당신의 인생 황금기입니다
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
              황금기 상담 신청
            </a>
            <a 
              href="https://www.mas9golf.com/try-a-massgoo" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-[#FFD700] text-[#FFD700] font-bold py-5 px-12 rounded-full text-lg hover:bg-[#FFD700] hover:text-[#1a2847] transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              <i className="fas fa-golf-ball mr-3"></i>
              황금기 시타 예약
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
            <a href="https://www.mas9golf.com/try-a-massgoo" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition">
              <i className="fas fa-calendar-check mr-2"></i>
              시타 예약하기
            </a>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-600">
              © 2025 MASGOLF®. All rights reserved. | 인생 황금기 6월 특별 캠페인
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 