import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  placeholder = "게시물 내용을 입력하세요",
  className = ""
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 이미지 삽입 함수
  const insertImage = (imageUrl: string, altText: string = "이미지") => {
    const imageMarkdown = `\n\n![${altText}](${imageUrl})\n\n`;
    const newValue = value + imageMarkdown;
    onChange(newValue);
    
    // 포커스를 textarea로 이동
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newValue.length, newValue.length);
      }
    }, 100);
  };

  // 파일 업로드 함수
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          insertImage(imageUrl, "업로드 이미지");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // URL 삽입 함수
  const handleUrlInsert = () => {
    const imageUrl = prompt('이미지 URL을 입력하세요:');
    if (imageUrl) {
      const altText = prompt('이미지 설명을 입력하세요 (선택사항):') || "이미지";
      insertImage(imageUrl, altText);
    }
  };

  return (
    <div className={`wysiwyg-editor ${className}`}>
      {/* 툴바 */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
        <button
          type="button"
          onClick={handleFileUpload}
          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
        >
          📁 이미지 업로드
        </button>
        <button
          type="button"
          onClick={handleUrlInsert}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          🔗 URL 삽입
        </button>
        <div className="flex-1"></div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-xs rounded ${
            isPreview 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isPreview ? '✏️ 편집' : '👁️ 미리보기'}
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="border border-gray-300 rounded-b-lg">
        {isPreview ? (
          // 미리보기 모드
          <div className="p-4 min-h-[400px] bg-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose prose-sm max-w-none"
              components={{
                img: ({ src, alt, ...props }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg shadow-sm border"
                    {...props}
                  />
                ),
                p: ({ children, ...props }) => (
                  <p className="mb-4 leading-relaxed" {...props}>
                    {children}
                  </p>
                ),
                h1: ({ children, ...props }) => (
                  <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-xl font-bold mb-3 text-gray-900" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-lg font-bold mb-2 text-gray-900" {...props}>
                    {children}
                  </h3>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4" {...props}>
                    {children}
                  </blockquote>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="text-gray-700" {...props}>
                    {children}
                  </li>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-bold text-gray-900" {...props}>
                    {children}
                  </strong>
                ),
                em: ({ children, ...props }) => (
                  <em className="italic text-gray-700" {...props}>
                    {children}
                  </em>
                ),
                code: ({ children, ...props }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ),
                pre: ({ children, ...props }) => (
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4" {...props}>
                    {children}
                  </pre>
                ),
              }}
            >
              {value || '*내용이 없습니다. 편집 모드에서 내용을 입력하세요.*'}
            </ReactMarkdown>
          </div>
        ) : (
          // 편집 모드
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 min-h-[400px] border-0 focus:ring-0 focus:outline-none resize-none"
            style={{ fontFamily: 'monospace' }}
          />
        )}
      </div>

      {/* 도움말 */}
      <div className="mt-2 text-xs text-gray-500">
        💡 <strong>마크다운 문법:</strong> 
        이미지: <code>![설명](URL)</code> | 
        제목: <code># 제목</code> | 
        굵게: <code>**굵은 글씨**</code> | 
        기울임: <code>*기울임*</code>
      </div>
    </div>
  );
};

export default WysiwygEditor;
