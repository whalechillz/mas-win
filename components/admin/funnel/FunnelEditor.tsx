import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (fileName && !initialContent) {
      loadFunnelContent();
    }
  }, [fileName]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

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
        {editor && (
          <div className="space-y-4">
            {/* 툴바 */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('bold') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  굵게
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('italic') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  기울임
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('strike') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  취소선
                </button>
                <div className="w-px h-8 bg-gray-300"></div>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  H1
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  H2
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  H3
                </button>
                <div className="w-px h-8 bg-gray-300"></div>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('bulletList') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  목록
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive('orderedList') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  번호목록
                </button>
                <div className="w-px h-8 bg-gray-300"></div>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  왼쪽
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  가운데
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  오른쪽
                </button>
                <div className="w-px h-8 bg-gray-300"></div>
                <button
                  onClick={() => {
                    const url = window.prompt('이미지 URL을 입력하세요:');
                    if (url) {
                      editor.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                  className="px-3 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  이미지
                </button>
                <button
                  onClick={() => {
                    const url = window.prompt('링크 URL을 입력하세요:');
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                  className="px-3 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  링크
                </button>
              </div>
            </div>

            {/* 에디터 영역 */}
            <div className="min-h-[600px] border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <EditorContent 
                editor={editor} 
                className="prose prose-sm max-w-none focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelEditor;
