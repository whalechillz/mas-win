import React from 'react';
import { useRouter } from 'next/router';
import FunnelEditor from '../../components/admin/funnel/FunnelEditor';

const FunnelEditorPage: React.FC = () => {
  const router = useRouter();
  const { file } = router.query;

  if (!file || typeof file !== 'string') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">파일을 찾을 수 없습니다</h1>
          <button
            onClick={() => router.push('/admin?tab=marketing-management')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            관리자 패널로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <FunnelEditor
          fileName={file}
          onCancel={() => router.push('/admin?tab=marketing-management')}
        />
      </div>
    </div>
  );
};

export default FunnelEditorPage;
