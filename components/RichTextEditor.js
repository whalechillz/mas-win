import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const RichTextEditor = ({ content, onChange, placeholder = "내용을 입력하세요..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 border border-gray-300 rounded-lg',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('링크 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg">
      {/* 툴바 */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <s>S</s>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          • 목록
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          1. 목록
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={addLink}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('link') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          🔗 링크
        </button>
        <button
          type="button"
          onClick={addImage}
          className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          🖼️ 이미지
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          인용
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          구분선
        </button>
      </div>
      
      {/* 에디터 영역 */}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px]"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
