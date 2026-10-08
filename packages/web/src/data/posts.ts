import type { Post } from '../models/post';

// Where the build copies `content/posts/`.
const POSTS_PATH = '/data/posts/';

/**
 * The post with the text of its `source` file, when the site has it in `content/posts/`, so the
 * server renders the same text the browser loads. Other sources stay for the browser to load.
 */
export const withPostSource = (post: Post, posts: Record<string, string>): Post => {
  if (!post.source?.startsWith(POSTS_PATH)) return post;
  const content = posts[post.source.slice(POSTS_PATH.length)];
  return content === undefined ? post : { ...post, content };
};
