import React from 'react'
import Head from 'next/head'

export default function Funnel202505() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>MASGOLF | 5월, 가족과 함께하는 특별한 골프</title>
        <meta name="description" content="MASGOLF 5월 가정의 달 특별 캠페인 - 가족과 함께하는 골프의 즐거움" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      
      {/* 5월 퍼널 내용 - 정적 HTML에서 가져온 내용 */}
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          5월 가정의 달 특별 캠페인
        </h1>
        <p className="text-xl text-gray-600">
          이 페이지는 백업용입니다. 새로운 6월 캠페인을 확인해주세요.
        </p>
        <a href="/funnel-2025-06" className="mt-8 inline-block bg-[#FFD700] text-black px-8 py-4 rounded-full font-bold hover:bg-[#FFC700] transition">
          6월 캠페인 보기
        </a>
      </div>
    </div>
  )
}
