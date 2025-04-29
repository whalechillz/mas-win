import Head from 'next/head'

export default function Home() {
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
            background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1618523410579-fa8af193e297?q=80&w=2069&auto=format&fit=crop');
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

        {/* 나머지 HTML 내용을 여기에 계속해서 붙여넣습니다 */}
        {/* class를 className으로 변경하여 붙여넣기 */}
      </div>
    </>
  )
} 