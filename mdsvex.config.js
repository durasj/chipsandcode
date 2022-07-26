import yaml from 'js-yaml';
import Message from 'vfile-message';
import remarkOembed from 'remark-oembed';
import remarkHint from 'remark-hint';
import remarkGfm from 'remark-gfm';
import remarkExtendedTable from 'remark-extended-table';
import remarkBehead from 'remark-behead';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeAccessibleEmojis from 'rehype-accessible-emojis';

// Temporary setup with older versions till math is properly supported
// https://github.com/pngwn/MDsveX/issues/302
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config = {
  extensions: ['.md'],

  layout: './src/components/MarkdownLayout.svelte',

  frontmatter: {
    marker: '-',
    type: 'yaml',
    parse: (frontmatter, messages) => {
      try {
        const fm = yaml.load(frontmatter);

        return fm;
      } catch (e) {
        messages.push(new Message('YAML failed to parse'));
      }
    },
  },

  remarkPlugins: [
    [remarkBehead, { minDepth: 2 }],
    remarkOembed,
    remarkHint,
    remarkGfm,
    remarkExtendedTable,
    remarkMath,
  ],
  rehypePlugins: [rehypeKatex, rehypeSlug, rehypeAutolinkHeadings, rehypeAccessibleEmojis],
};

export default config;
