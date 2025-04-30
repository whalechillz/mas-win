import Head from 'next/head'

export default function Home() {
  return (
    <Head>
      <meta httpEquiv="refresh" content="0;url=/versions/funnel-2025-05.html" />
    </Head>
  )
}

export async function getStaticProps() {
  return {
    redirect: {
      destination: '/versions/funnel-2025-05.html',
      permanent: false,
    },
  };
} 