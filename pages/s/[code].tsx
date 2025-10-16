import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const code = String(params?.code || '').trim();
  if (!code) return { notFound: true };

  const { data, error } = await supabase
    .from('short_links')
    .select('target_url, expires_at, click_count')
    .eq('code', code)
    .single();

  if (error || !data) return { notFound: true };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { notFound: true };

  // 클릭 카운트 증가(실패해도 무시)
  await supabase.rpc('increment_click_count', { p_code: code }).catch(() => {});

  res.writeHead(302, { Location: data.target_url });
  res.end();
  return { props: {} } as any;
};

export default function RedirectPage() {
  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content="3;url=/" />
      </Head>
      <div className="min-h-screen flex items-center justify-center">
        <p>이동 중입니다...</p>
      </div>
    </>
  );
}



