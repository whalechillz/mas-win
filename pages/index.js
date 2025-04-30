import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content="0;url=/versions/funnel-2025-05.html" />
      </Head>
    </>
  )
}

// 정적 생성을 위한 설정
export async function getStaticProps() {
  return {
    props: {},
  };
}

export function Home() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MASGOLF® | 5월, 가족과 함께하는 특별한 골프</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        body {
            font-family: 'Noto Sans KR', sans-serif;
            color: #333333;
            background-color: #FFFFFF;
        }
        
        .montserrat {
            font-family: 'Montserrat', sans-serif;
        }
        
        .hero-section {
            background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/images/hero/hero_father_son_golf_1080x1920.jpg');
            background-position: center;
            background-size: cover;
        }
        
        .gold-button {
            background: linear-gradient(135deg, #FFD700 0%, #DAA520 100%);
            transition: all 0.3s ease;
        }
        
        .gold-button:hover {
            background: linear-gradient(135deg, #e5c100 0%, #c69500 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(218, 165, 32, 0.2);
        }
        
        .section-divider {
            height: 3px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
        }
        
        .bg-navy {
            background-color: #002147;
        }
      `}</style>

      <div>
        {/* HTML 내용을 그대로 복사하여 여기에 붙여넣습니다 */}
        <nav className="bg-black bg-opacity-90 text-white py-4 px-6 md:px-12">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-semibold montserrat tracking-wider">MASGOLF<sup>®</sup></div>
                <div className="hidden md:flex space-x-6 text-sm">
                    <a href="#" className="hover:text-[#FFD700] transition duration-300">브랜드 스토리</a>
                    <a href="#" className="hover:text-[#FFD700] transition duration-300">제품 라인업</a>
                    <a href="#" className="hover:text-[#FFD700] transition duration-300">시타 센터</a>
                    <a href="#" className="hover:text-[#FFD700] transition duration-300">고객 이야기</a>
                    <a href="#" className="hover:text-[#FFD700] transition duration-300">문의</a>
                </div>
                <div className="md:hidden">
                    <button className="text-white">
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </div>
        </nav>

        {/* 시니어 골퍼 이야기 섹션 */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
                    <div className="w-full md:w-1/2 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                        <Image 
                            src="/images/story/senior_golfer_smiling_1080x1350.jpg"
                            alt="골프를 치는 중년 남성"
                            width={1080}
                            height={1350}
                            className="w-full h-80 object-cover"
                        />
                        <div className="p-6 text-center">
                            <p className="text-gray-600 italic">한때는 가족들의 박수를 받던 드라이버 샷</p>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                        <Image 
                            src="/images/story/senior_golfer_swinging_1080x1350.jpg"
                            alt="즐겁게 골프 치는 시니어"
                            width={1080}
                            height={1350}
                            className="w-full h-80 object-cover"
                        />
                        <div className="p-6 text-center">
                            <p className="text-gray-600 italic">그 자부심을 다시 느껴보세요</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 기술 소개 섹션 */}
        <section className="py-24 bg-[#F1F1F5]">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-8 shadow-lg transition-transform duration-300 hover:scale-105">
                    <div className="h-48 flex items-center justify-center mb-6">
                        <Image 
                            src="/images/tech/titanium_club_face_closeup_1200x800.jpg"
                            alt="골프 클럽 디테일"
                            width={1200}
                            height={800}
                            className="h-full object-contain"
                        />
                    </div>
                    <h3 className="montserrat text-xl mb-4 text-[#111111]">일본 JFE 티타늄으로 완성된<br />초박형 페이스</h3>
                </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg transition-transform duration-300 hover:scale-105">
                    <div className="h-48 flex items-center justify-center mb-6">
                        <Image 
                            src="/images/tech/driver_impact_moment_1200x800.jpg"
                            alt="골프 클럽 스윙"
                            width={1200}
                            height={800}
                            className="h-full object-contain"
                        />
                    </div>
                    <h3 className="montserrat text-xl mb-4 text-[#111111]">반발계수 0.87의<br />시간을 되돌린 듯한 반발력</h3>
                </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg transition-transform duration-300 hover:scale-105">
                    <div className="h-48 flex items-center justify-center mb-6">
                        <Image 
                            src="/images/tech/premium_golf_shaft_detail_1200x800.jpg"
                            alt="골프 피팅"
                            width={1200}
                            height={800}
                            className="h-full object-contain"
                        />
                    </div>
                    <h3 className="montserrat text-xl mb-4 text-[#111111]">MASGOLF<sup>®</sup> 독점 개발<br />NGS 샤프트 시스템</h3>
                </div>
            </div>
        </section>

        {/* 패키지 섹션 */}
        <section id="special-offer" className="py-24 bg-white">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="rounded-xl overflow-hidden shadow-lg h-full">
                    <div className="h-56">
                        <Image 
                            src="/images/packages/father_son_teeoff_package_1080x1350.jpg"
                            alt="아버지와 아들"
                            width={1080}
                            height={1350}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-8 bg-[#F1F1F5] h-full">
                        <h3 className="montserrat text-xl mb-4 text-[#111111]">아버지와 아들의 추억 패키지</h3>
                    </div>
                </div>
                
                <div className="rounded-xl overflow-hidden shadow-lg h-full">
                    <div className="h-56">
                        <Image 
                            src="/images/packages/family_golf_playing_1080x1350.jpg"
                            alt="가족 골프"
                            width={1080}
                            height={1350}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-8 bg-[#F1F1F5] h-full">
                        <h3 className="montserrat text-xl mb-4 text-[#111111]">가족 행복 라운드 패키지</h3>
                    </div>
                </div>
                
                <div className="rounded-xl overflow-hidden shadow-lg h-full">
                    <div className="h-56">
                        <Image 
                            src="/images/packages/couple_golf_round_1080x1350.jpg"
                            alt="부부 골프"
                            width={1080}
                            height={1350}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-8 bg-[#F1F1F5] h-full">
                        <h3 className="montserrat text-xl mb-4 text-[#111111]">평생의 동반자 패키지</h3>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </>
  )
} 