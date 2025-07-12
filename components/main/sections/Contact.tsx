import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API 호출 로직
    console.log('문의 제출:', formData);
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">문의하기</h2>
          <p className="text-xl text-gray-600">MASGOLF 전문가가 답변해 드립니다</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">이름</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">이메일</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">연락처</label>
            <input 
              type="tel"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">문의내용</label>
            <textarea 
              rows={5}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>
          
          <button 
            type="submit"
            className="mt-8 w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 transition"
          >
            문의 전송
          </button>
        </form>
      </div>
    </section>
  );
}
