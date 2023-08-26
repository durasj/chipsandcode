import { describe, expect, it } from 'vitest';
import parse from './parse';

describe('Markdown Content Parser', () => {
  it('Supports basic CommonMark', () => {
    const output = parse(
      `Plaintext *Italic* _Italic_ **Bold** __Bold__ [Link](http://a.com) ![Image](http://url/a.png)

> Blockquote

* List Item 1
* List Item 2

- List Item 1
- List Item 2

1. One
2. Two

1) One
2) Two

---

\`Inline code\` with backticks

\`\`\`
# code block
print '3 backticks or'
print 'indent 4 spaces'
\`\`\`
`,
    );

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    const firstLine = output.content.children[0];
    expect(firstLine).toMatchObject({
      name: 'p',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const firstLineChildren = firstLine.children;
    expect(firstLineChildren[0]).toBe('Plaintext ');
    expect(firstLineChildren[1]).toMatchObject({ name: 'em', children: ['Italic'] });
    expect(firstLineChildren[2]).toBe(' ');
    expect(firstLineChildren[3]).toMatchObject({ name: 'em', children: ['Italic'] });
    expect(firstLineChildren[4]).toBe(' ');
    expect(firstLineChildren[5]).toMatchObject({ name: 'strong', children: ['Bold'] });
    expect(firstLineChildren[6]).toBe(' ');
    expect(firstLineChildren[7]).toMatchObject({ name: 'strong', children: ['Bold'] });
    expect(firstLineChildren[8]).toBe(' ');
    expect(firstLineChildren[9]).toMatchObject({
      name: 'a',
      attributes: { href: 'http://a.com' },
      children: ['Link'],
    });
    expect(firstLineChildren[10]).toBe(' ');
    expect(firstLineChildren[11]).toMatchObject({
      name: 'img',
      attributes: { src: 'http://url/a.png', alt: 'Image' },
      children: [],
    });

    // @ts-ignore Asserted above
    const secondLine = output.content.children[1];
    expect(secondLine).toMatchObject({
      name: 'blockquote',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const secondLineChildren = secondLine.children;
    expect(secondLineChildren[0]).toMatchObject({ name: 'p', children: ['Blockquote'] });

    // @ts-ignore Asserted above
    const thirdLine = output.content.children[2];
    expect(thirdLine).toMatchObject({
      name: 'ul',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const thirdLineChildren = thirdLine.children;
    expect(thirdLineChildren[0]).toMatchObject({ name: 'li', children: ['List Item 1'] });
    expect(thirdLineChildren[1]).toMatchObject({ name: 'li', children: ['List Item 2'] });

    // @ts-ignore Asserted above
    const fourthLine = output.content.children[3];
    expect(fourthLine).toMatchObject({
      name: 'ul',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const fourthLineChildren = fourthLine.children;
    expect(fourthLineChildren[0]).toMatchObject({ name: 'li', children: ['List Item 1'] });
    expect(fourthLineChildren[1]).toMatchObject({ name: 'li', children: ['List Item 2'] });

    // @ts-ignore Asserted above
    const fifthLine = output.content.children[4];
    expect(fifthLine).toMatchObject({
      name: 'ol',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const fifthLineChildren = fifthLine.children;
    expect(fifthLineChildren[0]).toMatchObject({ name: 'li', children: ['One'] });
    expect(fifthLineChildren[1]).toMatchObject({ name: 'li', children: ['Two'] });

    // @ts-ignore Asserted above
    const sixthLine = output.content.children[5];
    expect(sixthLine).toMatchObject({
      name: 'ol',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const sixthLineChildren = sixthLine.children;
    expect(sixthLineChildren[0]).toMatchObject({ name: 'li', children: ['One'] });
    expect(sixthLineChildren[1]).toMatchObject({ name: 'li', children: ['Two'] });

    // @ts-ignore Asserted above
    const seventhLine = output.content.children[6];
    expect(seventhLine).toMatchObject({
      name: 'hr',
      children: expect.any(Array),
    });

    // @ts-ignore Asserted above
    const eightLine = output.content.children[7];
    expect(eightLine).toMatchObject({
      name: 'p',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const eightLineChildren = eightLine.children;
    expect(eightLineChildren[0]).toMatchObject({ name: 'code', children: ['Inline code'] });
    expect(eightLineChildren[1]).toBe(' with backticks');

    // @ts-ignore Asserted above
    const ninthLine = output.content.children[8];
    expect(ninthLine).toMatchObject({
      name: 'pre',
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    const ninthLineChildren = ninthLine.children;
    expect(ninthLineChildren[0]).toBe(`# code block
print '3 backticks or'
print 'indent 4 spaces'
`);
  });

  it('Supports and shifts headings', () => {
    const output = parse(
      `# Level 1

## Level 2

### Level 3

#### Level 4

##### Level 5

###### Level 6`,
    );

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    output.content.children.forEach((child, index) => {
      expect(child).toMatchObject({ name: `h${index + 2}`, children: [`Level ${index + 1}`] });
    });
  });

  it('Does not recognize Setext headings', () => {
    const output = parse(
      `
Level 1
=======

Level 2
-------
`,
    );

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Level 1', ' ', '======='],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `p`,
      children: ['Level 2'],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[2]).toMatchObject({
      name: `hr`,
    });
  });

  it('Does not recognize indented code blocks', () => {
    const output = parse(
      `
Plaintext

        This
        Is
        Not
        Code
        Either

Plaintext
        `,
    );

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Plaintext'],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `p`,
      children: ['This', ' ', 'Is', ' ', 'Not', ' ', 'Code', ' ', 'Either'],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[2]).toMatchObject({
      name: `p`,
      children: ['Plaintext'],
    });
  });

  it('Supports comments', () => {
    const output = parse(
      `Text

        <!-- Standalone -->

        Foo <!-- Inline --> Bar`,
    );

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Text'],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `p`,
      children: ['Foo ', ' Bar'],
    });
  });

  it('Automatically recognizes links', () => {
    const output = parse(`Inline https://a.com link`);

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    expect(output.content.children[0].children[0]).toBe('Inline ');
    // @ts-ignore Asserted above
    expect(output.content.children[0].children[1]).toMatchObject({
      name: `a`,
      attributes: { href: 'https://a.com' },
      children: ['https://a.com'],
    });
    // @ts-ignore Asserted above
    expect(output.content.children[0].children[2]).toBe(' link');
  });

  it('Does typographic replacements', () => {
    const output = parse(`(c) (C) (tm) (TM) (r) (R) +- ... -- "" ''`);

    expect(output.content).toMatchObject({ children: expect.any(Array) });

    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['© © ™ ™ ® ® ± … – “” ‘’'],
    });
  });

  it('Supports frontmatter', () => {
    const output = parse(`---
title: foo
author: bar
---

Content`);

    expect(output.meta).toMatchObject({ title: 'foo', author: 'bar' });

    expect(output.content).toMatchObject({ children: expect.any(Array) });
    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Content'],
    });
  });

  it('Supports Math KaTeX expressions', () => {
    const output = parse(`
Text

{% Math expr="E=mc^2" /%}

And also inline $E=mc^2$
`);

    expect(output.content).toMatchObject({ children: expect.any(Array) });
    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Text'],
    });

    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `Math`,
      attributes: { expr: 'E=mc^2' },
    });

    // @ts-ignore Asserted above
    expect(output.content.children[2]).toMatchObject({
      name: `p`,
      children: expect.any(Array),
    });
    // @ts-ignore Asserted above
    expect(output.content.children[2].children[0]).toBe('And also inline ');
    // @ts-ignore Asserted above
    expect(output.content.children[2].children[1]).toMatchObject({
      name: `Math`,
      attributes: { expr: 'E=mc^2' },
    });
  });

  it('Supports embedded hardware IDE', () => {
    const output = parse(`
    Text

    {% EmbeddedHardwareIDE id="123" /%}`);

    expect(output.content).toMatchObject({ children: expect.any(Array) });
    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Text'],
    });

    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `EmbeddedHardwareIDE`,
      attributes: { id: '123' },
    });
  });

  it('Supports embedded videos', () => {
    const output = parse(`
    Text

    {% EmbeddedVideo id="123" /%}`);

    expect(output.content).toMatchObject({ children: expect.any(Array) });
    // @ts-ignore Asserted above
    expect(output.content.children[0]).toMatchObject({
      name: `p`,
      children: ['Text'],
    });

    // @ts-ignore Asserted above
    expect(output.content.children[1]).toMatchObject({
      name: `EmbeddedVideo`,
      attributes: { id: '123' },
    });
  });
});
