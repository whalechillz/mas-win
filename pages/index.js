import Head from 'next/head'

export default function Home() {
  if (typeof window !== 'undefined') {
    window.location.href = '/versions/funnel-2025-05.html';
  }
  
  return null;
}

export async function getStaticProps() {
  return {
    redirect: {
      destination: '/versions/funnel-2025-05.html',
      permanent: false,
    },
  };
} 