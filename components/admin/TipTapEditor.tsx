import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
// @ts-ignore - BubbleMenu type may cause warnings; safe to import
import { BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
// @ts-ignore - tiptap-markdown has no types
import { Markdown } from 'tiptap-markdown';

type TipTapEditorProps = {
  valueMarkdown: string;
  onChangeMarkdown: (markdown: string) => void;
  onRequestImageFromGallery?: (insert: (url: string, options?: { alt?: string; title?: string }) => void) => void;
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

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ valueMarkdown, onChangeMarkdown, onRequestImageFromGallery }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (typeof window === 'undefined') return null;

  const editor = useEditor({
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

  const handleInsertFromGallery = useCallback(() => {
    if (!editor) return;
    if (!onRequestImageFromGallery) return handleUploadImage();
    onRequestImageFromGallery((url: string, options?: { alt?: string; title?: string }) => {
      editor.chain().focus().setImage({ src: url, alt: options?.alt }).run();
    });
  }, [editor, onRequestImageFromGallery, handleUploadImage]);

  if (!mounted || !editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        <ToolbarButton label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        {/* 안정화 단계: 링크/테이블 등은 후속 브랜치에서 재도입 */}
        <ToolbarButton label="이미지 업로드" onClick={handleUploadImage} />
        <ToolbarButton label="갤러리" onClick={handleInsertFromGallery} />
      </div>
      <div className="p-3">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} pluginKey="image-bubble">
            {editor.isActive('image') && (
              <div className="flex items-center gap-2 bg-white border rounded shadow px-2 py-1">
                <button
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={() => {
                    try {
                      const attrs: any = editor.getAttributes('image') || {};
                      const url = attrs?.src;
                      if (url && typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('tiptap:set-featured-image', { detail: { url } }));
                      }
                    } catch {}
                  }}
                >대표로 설정</button>
              </div>
            )}
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapEditor;


