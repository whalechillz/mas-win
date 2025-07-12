import React from 'react';
import Head from 'next/head';
import MainLayout from '../../components/main/layout/MainLayout';
import Hero from '../../components/main/sections/Hero';
import Features from '../../components/main/sections/Features';
import TechSection from '../../components/main/sections/TechSection';
import CorExplain from '../../components/main/sections/CorExplain';
import Products from '../../components/main/sections/Products';
import FamilyStory from '../../components/main/sections/FamilyStory';
import Reviews from '../../components/main/sections/Reviews';
import Contact from '../../components/main/sections/Contact';

export default function MainHome() {
  return (
    <>
      <Head>
        <title>MASGOLF - 프리미엄 골프 클럽의 새로운 기준</title>
        <meta name="description" content="최고의 기술과 장인정신으로 만든 프리미엄 골프 클럽. MASGOLF와 함께 완벽한 스윙을 경험하세요." />
        <meta property="og:title" content="MASGOLF - 프리미엄 골프 클럽" />
        <meta property="og:description" content="최고의 기술과 장인정신으로 만든 프리미엄 골프 클럽" />
        <meta property="og:image" content="https://www.masgolf.co.kr/og-image.jpg" />
        <meta property="og:url" content="https://www.masgolf.co.kr" />
        <link rel="canonical" href="https://www.masgolf.co.kr" />
      </Head>
      
      <MainLayout>
        <Hero />
        <Features />
        <TechSection />
        <CorExplain />
        <Products />
        <FamilyStory />
        <Reviews />
        <Contact />
      </MainLayout>
    </>
  );
}

// 정적 생성
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 3600, // 1시간마다 재생성
  };
}