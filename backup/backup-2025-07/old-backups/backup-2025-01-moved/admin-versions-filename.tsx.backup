import { GetServerSideProps } from 'next';
import fs from 'fs';
import path from 'path';
import { parse } from 'cookie';

interface Props {
  html: string | null;
  notFound?: boolean;
}

const AdminFunnelPage = ({ html, notFound }: Props) => {
  if (notFound) {
    return <div className="p-8 text-center text-red-500">존재하지 않는 퍼널 파일입니다.</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto my-8 bg-white shadow p-4 rounded">
        <div dangerouslySetInnerHTML={{ __html: html || '' }} />
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params } = ctx;
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (cookies.admin_auth !== '1') {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
  const filename = params?.filename as string;
  const filePath = path.join(process.cwd(), 'public/versions', filename);
  if (!fs.existsSync(filePath)) {
    return { props: { html: null, notFound: true } };
  }
  const html = fs.readFileSync(filePath, 'utf-8');
  return { props: { html } };
};

export default AdminFunnelPage; 