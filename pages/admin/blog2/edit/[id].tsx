import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import AdminNav from '../../../../components/admin/AdminNav';
import { useRouter } from 'next/router';

export default function BlogEdit2() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>게시물 편집 v2 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">게시물 편집 v2</h1>
                <p className="mt-2 text-gray-600">분리된 블로그 편집 시스템</p>
                <p className="text-sm text-gray-500">게시물 ID: {id}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin/blog2"
                  className="text-sm text-gray-600 hover:underline"
                >
                  ← 목록으로 돌아가기
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🚧 개발 중
              </h2>
              <p className="text-gray-600 mb-6">
                게시물 편집 기능은 현재 개발 중입니다.
              </p>
              <div className="space-x-4">
                <Link 
                  href="/admin/blog"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  기존 블로그 관리 사용
                </Link>
                <Link 
                  href="/admin/blog2"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  목록으로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}