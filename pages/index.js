import { useEffect } from 'react'

export default function Home() {
  return <div>리다이렉트 중...</div>;
}

export async function getStaticProps() {
  return {
    redirect: {
      destination: '/versions/funnel-2025-05.html',
      permanent: false,
    },
  };
} 