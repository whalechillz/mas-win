import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminNav from '@/components/admin/AdminNav';

const BaseChannelEditor = dynamic(() => import('@/components/shared/BaseChannelEditor'), { ssr: false });

export default function NaverBlogEditor() {
  const router = useRouter();
  const { calendarId } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    messageType: 'BLOG',
    characterCount: 0,
    seoKeywords: [],
    estimatedReadTime: 0
  });

  // 네이버 블로그 특화 컴포넌트
  const NaverSpecificComponents = () => (
    <div className="space-y-6">
      {/* SEO 키워드 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO 키워드
        </label>
        <input
          type="text"
          value={formData.seoKeywords.join(', ')}
          onChange={(e) => {
            const keywords = e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
            setFormData(prev => ({ ...prev, seoKeywords: keywords }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="SEO 키워드를 쉼표로 구분하여 입력하세요"
        />
      </div>

      {/* 예상 읽기 시간 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          예상 읽기 시간
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            약 {formData.estimatedReadTime}분
          </span>
          <span className="text-xs text-gray-500">
            (분당 200자 기준)
          </span>
        </div>
      </div>

      {/* 네이버 블로그 미리보기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          네이버 블로그 미리보기
        </label>
        <div className="bg-green-100 p-4 rounded-lg max-w-2xl">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="text-sm font-medium">네이버 블로그</span>
            </div>
            <div className="space-y-2">
              {formData.title && (
                <h2 className="text-lg font-bold text-gray-900">
                  {formData.title}
                </h2>
              )}
              {formData.messageText && (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {formData.messageText}
                </div>
              )}
              {formData.seoKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">키워드:</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.seoKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 수동 복사 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          📋 수동 복사 안내
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          네이버 블로그는 API 제한으로 인해 자동 발송이 불가능합니다. 
          아래 내용을 복사하여 네이버 블로그에 직접 붙여넣기 해주세요.
        </p>
        <button
          onClick={() => {
            const content = `${formData.title}\n\n${formData.messageText}`;
            navigator.clipboard.writeText(content);
            alert('내용이 클립보드에 복사되었습니다!');
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
        >
          내용 복사하기
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-8">
        <BaseChannelEditor
          channelType="naver"
          channelName="네이버 블로그"
          calendarId={calendarId as string}
          initialData={formData}
          onSave={(data) => {
            console.log('Naver blog saved:', data);
            // 성공 메시지 표시
          }}
          onSend={(data) => {
            console.log('Naver blog sent:', data);
            // 성공 메시지 표시
          }}
        >
          <NaverSpecificComponents />
        </BaseChannelEditor>
      </div>
    </div>
  );
}
