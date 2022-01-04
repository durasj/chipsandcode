import remarkOembed from 'remark-oembed';
import remarkHint from 'remark-hint';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeAccessibleEmojis from 'rehype-accessible-emojis';

// Temporary setup with older versions till math is properly supported
// https://github.com/pngwn/MDsveX/issues/302
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config = {
  extensions: ['.svelte.md', '.md', '.svx'],

  remarkPlugins: [remarkOembed, remarkHint, remarkGfm, remarkMath],
  rehypePlugins: [rehypeKatex, rehypeSlug, rehypeAutolinkHeadings, rehypeAccessibleEmojis],
};

export default config;
