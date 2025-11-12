import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import dynamic from 'next/dynamic';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
// @ts-ignore - tiptap-markdown has no types
import { Markdown } from 'tiptap-markdown';

type TipTapEditorProps = {
  valueMarkdown: string;
  onChangeMarkdown: (markdown: string) => void;
};

const ToolbarButton: React.FC<{ onClick: () => void; active?: boolean; label: string }> = ({ onClick, active, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1 text-sm rounded border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} hover:bg-blue-50`}
  >
    {label}
  </button>
);

type ViewMode = 'wysiwyg' | 'markdown' | 'source';

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ valueMarkdown, onChangeMarkdown }) => {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  useEffect(() => { setMounted(true); }, []);


  if (typeof window === 'undefined') return null;

  const editor = useEditor({
    immediatelyRender: false, // ✅ TipTap 3.6.5+ SSR hydration 에러 방지 (필수)
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: '여기에 글을 작성하세요...' }),
      Markdown.configure({ html: false })
    ],
    content: valueMarkdown || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[240px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      try {
        // @ts-ignore - storage provided by Markdown extension
        const md = editor.storage.markdown.getMarkdown();
        onChangeMarkdown(md as string);
      } catch {
        onChangeMarkdown(editor.getText());
      }
    },
  });

  // 외부 갤러리로부터 커스텀 이벤트로 삽입을 지원
  useEffect(() => {
    if (!editor) return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ url: string; alt?: string; title?: string }>;
      const url = ev.detail?.url;
      if (!url) return;
      editor.chain().focus().setImage({ src: url, alt: ev.detail?.alt }).run();
    };
    window.addEventListener('tiptap:insert-image', handler as EventListener);
    return () => window.removeEventListener('tiptap:insert-image', handler as EventListener);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    // 외부에서 값이 바뀐 경우 동기화
    // @ts-ignore
    const currentMd = editor.storage?.markdown?.getMarkdown?.();
    if (currentMd !== valueMarkdown) {
      editor.commands.setContent(valueMarkdown || '');
    }
  }, [valueMarkdown, editor]);

  const handleUploadImage = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/upload-image-supabase', { method: 'POST', body: form });
        if (!res.ok) throw new Error('업로드 실패');
        const data = await res.json();
        const url = data.url || data.publicUrl || data.storedUrl;
        if (url) {
          editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        }
      } catch (e) {
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    };
    input.click();
  }, [editor]);


  // 현재 마크다운 가져오기
  const getCurrentMarkdown = useCallback(() => {
    if (!editor) return valueMarkdown || '';
    try {
      // @ts-ignore - storage provided by Markdown extension
      const md = editor.storage.markdown.getMarkdown();
      return md || valueMarkdown || '';
    } catch {
      return valueMarkdown || '';
    }
  }, [editor, valueMarkdown]);

  // 현재 HTML 가져오기
  const getCurrentHTML = useCallback(() => {
    if (!editor) return '';
    return editor.getHTML();
  }, [editor]);

  // 뷰 모드별 현재 값 상태
  const [markdownValue, setMarkdownValue] = useState(valueMarkdown || '');
  const [htmlValue, setHtmlValue] = useState('');

  // 뷰 모드 변경 시 최신 값 가져오기
  useEffect(() => {
    if (!editor) return;
    
    if (viewMode === 'markdown') {
      const md = getCurrentMarkdown();
      setMarkdownValue(md);
    } else if (viewMode === 'source') {
      const html = getCurrentHTML();
      setHtmlValue(html);
    }
  }, [viewMode, editor, getCurrentMarkdown, getCurrentHTML]);

  // 마크다운에서 에디터로 동기화
  const syncMarkdownToEditor = useCallback((md: string) => {
    if (!editor) return;
    try {
      editor.commands.setContent(md || '');
    } catch (error) {
      console.error('마크다운 동기화 오류:', error);
    }
  }, [editor]);

  // HTML에서 에디터로 동기화
  const syncHTMLToEditor = useCallback((html: string) => {
    if (!editor) return;
    try {
      editor.commands.setContent(html || '');
    } catch (error) {
      console.error('HTML 동기화 오류:', error);
    }
  }, [editor]);

  if (!mounted || !editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        {/* 뷰 모드 전환 버튼 */}
        <div className="flex items-center gap-1 mr-2">
          <ToolbarButton 
            label="이지윅" 
            active={viewMode === 'wysiwyg'}
            onClick={() => {
              // 마크다운이나 HTML에서 변경사항이 있으면 에디터에 반영
              if (viewMode === 'markdown') {
                syncMarkdownToEditor(valueMarkdown);
              } else if (viewMode === 'source') {
                syncHTMLToEditor(valueMarkdown);
              }
              setViewMode('wysiwyg');
            }} 
          />
          <ToolbarButton 
            label="MD" 
            active={viewMode === 'markdown'}
            onClick={() => {
              // WYSIWYG에서 MD로 전환 시 현재 마크다운 가져오기
              if (viewMode === 'wysiwyg' && editor) {
                try {
                  // @ts-ignore
                  const md = editor.storage.markdown.getMarkdown();
                  if (md) {
                    onChangeMarkdown(md);
                  }
                } catch {}
              }
              setViewMode('markdown');
            }} 
          />
          <ToolbarButton 
            label="소스" 
            active={viewMode === 'source'}
            onClick={() => {
              // WYSIWYG에서 소스로 전환 시 현재 HTML 가져오기
              if (viewMode === 'wysiwyg' && editor) {
                const html = editor.getHTML();
                // HTML 변경사항을 마크다운으로 변환하여 저장
                try {
                  // @ts-ignore
                  const md = editor.storage.markdown.getMarkdown();
                  if (md) {
                    onChangeMarkdown(md);
                  }
                } catch {}
              }
              setViewMode('source');
            }} 
          />
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* WYSIWYG 모드에서만 표시되는 툴바 */}
        {viewMode === 'wysiwyg' && (
          <>
        <ToolbarButton 
          label="↶" 
          onClick={() => editor.chain().focus().undo().run()} 
        />
        <ToolbarButton 
          label="↷" 
          onClick={() => editor.chain().focus().redo().run()} 
        />
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <ToolbarButton label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        {/* 안정화 단계: 링크/테이블 등은 후속 브랜치에서 재도입 */}
        <ToolbarButton
          label="대표로"
          active={editor.isActive('image')}
          onClick={() => {
            if (!editor.isActive('image')) {
              alert('이미지를 선택한 후 사용하세요.');
              return;
            }
            try {
              const attrs: any = editor.getAttributes('image') || {};
              const url = attrs?.src;
              if (url && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tiptap:set-featured-image', { detail: { url } }));
              }
            } catch {}
          }}
        />
        <ToolbarButton
          label="🖼️"
          onClick={() => {
            // 현재 커서 위치를 저장하고 갤러리 모달 열기
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tiptap:open-gallery', { 
                detail: { 
                  cursorPosition: editor.state.selection.from,
                  editor: editor 
                } 
              }));
            }
          }}
        />
          </>
        )}
      </div>
      
      {/* 뷰 모드에 따른 컨텐츠 표시 */}
      <div className="p-3">
        {viewMode === 'wysiwyg' && (
        <EditorContent editor={editor} />
        )}
        
        {viewMode === 'markdown' && (
          <textarea
            value={markdownValue}
            onChange={(e) => {
              const newMarkdown = e.target.value;
              setMarkdownValue(newMarkdown);
              syncMarkdownToEditor(newMarkdown);
              onChangeMarkdown(newMarkdown);
            }}
            className="w-full min-h-[240px] p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="마크다운 형식으로 작성하세요..."
          />
        )}
        
        {viewMode === 'source' && (
          <textarea
            value={htmlValue}
            onChange={(e) => {
              const newHTML = e.target.value;
              setHtmlValue(newHTML);
              syncHTMLToEditor(newHTML);
              // HTML을 마크다운으로 변환하여 저장
              try {
                // @ts-ignore
                const md = editor.storage.markdown.getMarkdown();
                onChangeMarkdown(md || '');
              } catch {
                onChangeMarkdown(newHTML);
              }
            }}
            className="w-full min-h-[240px] p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="HTML 소스 코드를 작성하세요..."
          />
        )}
      </div>
    </div>
  );
};

export default TipTapEditor;


