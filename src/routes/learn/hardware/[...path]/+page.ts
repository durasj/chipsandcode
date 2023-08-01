import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Content } from 'src/lib/content/types';
import type { Tag } from '@markdoc/markdoc';

const FIRST_CHAPTER = 'boolean-logic';
const FIRST_SECTION = 'intro';

export const load = (async ({ params }) => {
  const modules = import.meta.glob('../**/*.md');
  let [pathChapter, pathSection] = params.path.split('/');
  pathChapter = pathChapter || FIRST_CHAPTER;
  pathSection = pathSection || FIRST_SECTION;

  const chapters = Object.entries(modules).reduce((acc, [path, moduleImport]) => {
    const [, chapter, sectionFile] = path.split('/');
    const section = sectionFile.replace(/\.md$/, '');

    if (!(chapter in acc)) acc[chapter] = {};

    acc[chapter][section] = moduleImport;

    return acc;
  }, {} as { [chapter: string]: { [section: string]: () => Promise<unknown> } });

  if (!(pathChapter in chapters) || !(pathSection in chapters[pathChapter])) {
    throw error(404, 'Not found');
  }

  const markdownModule = (await chapters[pathChapter][pathSection]()) as { default: Content };

  // TODO: We can load all modules upfront and then we can provide the list of pages here as well

  return {
    meta: markdownModule.default.meta,
    content: (markdownModule.default.content as Tag).children,
  };
}) satisfies PageLoad;
