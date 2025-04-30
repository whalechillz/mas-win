import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/versions/funnel-2025-05.html'
  }, [])
  
  return null
}

export async function getStaticProps() {
  return {
    redirect: {
      destination: '/versions/funnel-2025-05.html',
      permanent: false,
    },
  };
} 