import React, { useState } from 'react';

export default function TestSMS() {
  const [phoneNumber, setPhoneNumber] = useState('010-6669-9000');
  const [message, setMessage] = useState('테스트 메시지입니다.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, message: '클라이언트 오류 발생', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span role="img" aria-label="mobile phone" className="mr-2">📱</span> SMS 테스트
        </h1>

        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
            전화번호
          </label>
          <input
            type="text"
            id="phoneNumber"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
            메시지
          </label>
          <textarea
            id="message"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="테스트 메시지를 입력하세요."
          ></textarea>
        </div>

        <button
          onClick={handleSendSMS}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? '발송 중...' : 'SMS 발송'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-2">결과:</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
