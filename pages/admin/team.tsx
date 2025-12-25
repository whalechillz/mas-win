import React from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import AdminNav from '../../components/admin/AdminNav';
import AccountManagement from '../../components/admin/AccountManagement';

export default function Team() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>계정 관리 - 관리자 대시보드</title>
        <meta name="description" content="관리자 계정 관리" />
      </Head>
      <AdminNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">👨‍💼 계정 관리</h1>
          <p className="mt-2 text-gray-600">관리자 계정 및 팀원 관리</p>
        </div>
        <AccountManagement session={session} />
      </main>
    </div>
  );
}

