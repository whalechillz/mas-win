import React from 'react';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string;
  view_count: number;
  is_featured: boolean;
  status: 'published' | 'draft';
  slug: string;
  featured_image?: string;
}

interface PostCardProps {
  post: Post;
  isSelected: boolean;
  onSelect: (postId: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2 ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200/50'
    }`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(post.id);
          }}
          className="absolute top-4 left-4 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 z-50 cursor-pointer"
        />
        <div className="relative h-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
          <img
            loading="lazy"
            src={post.featured_image || '/placeholder-image.jpg'}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {post.status === 'published' ? '📢 발행됨' : '📝 초안'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
            {post.title}
          </h3>
          <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <time className="font-medium">
                {new Date(post.published_at).toLocaleDateString('ko-KR')}
              </time>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {post.status === 'published' ? '📢 발행됨' : '📝 초안'}
              </span>
              <button
                onClick={() => {
                  const url = `/blog/${post.slug}?admin=true`;
                  window.open(url, '_blank');
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  post.status === 'published'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
                title={post.status === 'published' ? '발행된 게시물 보기' : '초안 게시물 보기 (관리자 전용)'}
              >
                {post.status === 'published' ? '보기' : '미리보기'}
              </button>
              <button
                onClick={() => onEdit(post)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
