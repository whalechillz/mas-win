import React from 'react';
import PostCard from './PostCard';

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

interface PostGridProps {
  posts: Post[];
  selectedPosts: string[];
  onPostSelect: (postId: string) => void;
  onEdit: (post: Post) => void;
}

const PostGrid: React.FC<PostGridProps> = ({
  posts,
  selectedPosts,
  onPostSelect,
  onEdit
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isSelected={selectedPosts.includes(post.id)}
          onSelect={onPostSelect}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default PostGrid;
