-- Add scheduling fields to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- Create index for scheduled posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at ON blog_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_scheduled ON blog_posts(is_scheduled);

-- Update existing posts to have is_scheduled = false
UPDATE blog_posts SET is_scheduled = FALSE WHERE is_scheduled IS NULL;
