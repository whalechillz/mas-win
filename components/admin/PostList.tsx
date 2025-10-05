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

interface PostListProps {
  posts: Post[];
  selectedPosts: string[];
  onPostSelect: (postId: string) => void;
  onEdit: (post: Post) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  selectedPosts,
  onPostSelect,
  onEdit
}) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
            selectedPosts.includes(post.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={selectedPosts.includes(post.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onPostSelect(post.id);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1 cursor-pointer"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>카테고리: {post.category}</span>
                  <span>작성자: {post.author}</span>
                  <span>작성일: {new Date(post.published_at).toLocaleDateString('ko-KR')}</span>
                  <span>조회수: {post.view_count || 0}</span>
                  {post.is_featured && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      추천
                    </span>
                  )}
                </div>
              </div>
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
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors flex items-center space-x-1"
              >
                <span>👁️</span>
                <span>보기</span>
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
      ))}
    </div>
  );
};

export default PostList;
