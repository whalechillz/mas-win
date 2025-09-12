import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useRouter } from 'next/router';

interface FunnelEditorProps {
  fileName: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

const FunnelEditor: React.FC<FunnelEditorProps> = ({
  fileName,
  initialContent = '',
  onSave,
  onCancel
}) => {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (fileName && !initialContent) {
      loadFunnelContent();
    }
  }, [fileName]);

  const loadFunnelContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/funnel-content?file=${fileName}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
      }
    } catch (error) {
      console.error('퍼널 내용 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/funnel-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          content,
          modifiedDate: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('퍼널이 성공적으로 저장되었습니다!');
        if (onSave) {
          onSave(content);
        }
        router.push('/admin?tab=marketing-management');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.open(`/versions/${fileName}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">퍼널 에디터</h1>
            <p className="text-gray-600 mt-1">파일: {fileName}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              미리보기
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={onCancel || (() => router.back())}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* 에디터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Editor
          apiKey="qcdwo60e2nmep110377mmivu2vpjdllhhuw66106rl6l3170"
          value={content}
          onEditorChange={(newContent) => setContent(newContent)}
          init={{
            height: 600,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
              'template', 'codesample', 'hr', 'pagebreak', 'nonbreaking', 'toc',
              'imagetools', 'textpattern', 'noneditable', 'quickbars', 'accordion'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help | image | link | table | code | fullscreen | preview',
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
              }
              .funnel-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
              }
              .funnel-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .hero-section {
                background: linear-gradient(135deg, #ff6b6b, #ffa500);
                color: white;
                padding: 60px 20px;
                text-align: center;
              }
              .hero-title {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              .hero-subtitle {
                font-size: 1.2rem;
                margin-bottom: 30px;
                opacity: 0.9;
              }
              .cta-button {
                background: #ff4757;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
              }
              .cta-button:hover {
                background: #ff3742;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 71, 87, 0.4);
              }
              .product-section {
                padding: 40px 20px;
                background: #f8f9fa;
              }
              .product-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-top: 30px;
              }
              .product-card {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                text-align: center;
                transition: transform 0.3s ease;
              }
              .product-card:hover {
                transform: translateY(-5px);
              }
              .product-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .product-title {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 15px;
                color: #2c3e50;
              }
              .product-price {
                font-size: 1.8rem;
                font-weight: bold;
                color: #e74c3c;
                margin-bottom: 20px;
              }
              .testimonial-section {
                background: #2c3e50;
                color: white;
                padding: 60px 20px;
                text-align: center;
              }
              .testimonial-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-top: 40px;
              }
              .testimonial-card {
                background: rgba(255,255,255,0.1);
                padding: 30px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
              }
              .testimonial-text {
                font-style: italic;
                margin-bottom: 20px;
                font-size: 1.1rem;
                line-height: 1.6;
              }
              .testimonial-author {
                font-weight: bold;
                color: #f39c12;
              }
              .footer-section {
                background: #34495e;
                color: white;
                padding: 40px 20px;
                text-align: center;
              }
              .footer-links {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin-bottom: 20px;
                flex-wrap: wrap;
              }
              .footer-link {
                color: #bdc3c7;
                text-decoration: none;
                transition: color 0.3s ease;
              }
              .footer-link:hover {
                color: white;
              }
              @media (max-width: 768px) {
                .hero-title { font-size: 2rem; }
                .product-grid { grid-template-columns: 1fr; }
                .testimonial-grid { grid-template-columns: 1fr; }
                .footer-links { flex-direction: column; gap: 15px; }
              }
            `,
            templates: [
              {
                title: '퍼널 페이지 템플릿',
                description: '기본 퍼널 페이지 레이아웃',
                content: `
                  <div class="funnel-container">
                    <div class="funnel-content">
                      <div class="hero-section">
                        <h1 class="hero-title">🔥 특별 혜택!</h1>
                        <p class="hero-subtitle">지금 바로 확인하세요</p>
                        <a href="#" class="cta-button">지금 시작하기</a>
                      </div>
                      
                      <div class="product-section">
                        <h2>추천 제품</h2>
                        <div class="product-grid">
                          <div class="product-card">
                            <img src="https://via.placeholder.com/300x200" alt="제품1" class="product-image">
                            <h3 class="product-title">프리미엄 제품</h3>
                            <div class="product-price">₩299,000</div>
                            <p>최고의 품질과 성능을 자랑하는 제품입니다.</p>
                          </div>
                          <div class="product-card">
                            <img src="https://via.placeholder.com/300x200" alt="제품2" class="product-image">
                            <h3 class="product-title">베스트셀러</h3>
                            <div class="product-price">₩199,000</div>
                            <p>많은 고객들이 선택한 인기 제품입니다.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div class="testimonial-section">
                        <h2>고객 후기</h2>
                        <div class="testimonial-grid">
                          <div class="testimonial-card">
                            <p class="testimonial-text">"정말 만족스러운 제품입니다. 강력 추천합니다!"</p>
                            <div class="testimonial-author">- 김고객님</div>
                          </div>
                          <div class="testimonial-card">
                            <p class="testimonial-text">"품질이 뛰어나고 가격도 합리적입니다."</p>
                            <div class="testimonial-author">- 이고객님</div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="footer-section">
                        <div class="footer-links">
                          <a href="#" class="footer-link">이용약관</a>
                          <a href="#" class="footer-link">개인정보처리방침</a>
                          <a href="#" class="footer-link">고객센터</a>
                        </div>
                        <p>&copy; 2025 MASGOLF. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                `
              }
            ],
            image_upload_handler: async (blobInfo, progress) => {
              try {
                const formData = new FormData();
                formData.append('file', blobInfo.blob(), blobInfo.filename());
                
                const response = await fetch('/api/upload-image', {
                  method: 'POST',
                  body: formData,
                });
                
                const data = await response.json();
                if (data.success) {
                  return data.url;
                } else {
                  throw new Error('이미지 업로드 실패');
                }
              } catch (error) {
                console.error('이미지 업로드 오류:', error);
                throw error;
              }
            },
            file_picker_callback: (callback, value, meta) => {
              if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();
                
                input.onchange = async () => {
                  const file = input.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const data = await response.json();
                      if (data.success) {
                        callback(data.url, { title: file.name });
                      }
                    } catch (error) {
                      console.error('파일 업로드 오류:', error);
                    }
                  }
                };
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default FunnelEditor;
