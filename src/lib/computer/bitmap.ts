export type Bitmap = { width: number; height: number; pixels: boolean[] };
export function bitmapWords(bitmap: Bitmap, x = 0, y = 0): { address: number; value: number }[] {
  const { width, height, pixels } = bitmap;
  if (
    ![width, height, x, y].every(Number.isInteger) ||
    width < 1 ||
    height < 1 ||
    width > 64 ||
    height > 64 ||
    x < 0 ||
    y < 0 ||
    x + width > 512 ||
    y + height > 256 ||
    pixels.length !== width * height
  )
    throw new Error('Use a 1–64 pixel bitmap positioned within the 512 × 256 screen.');
  const words = new Map<number, number>();
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      const address = 16384 + (y + row) * 32 + ((x + col) >>> 4);
      words.set(
        address,
        (words.get(address) ?? 0) | (pixels[row * width + col] ? 1 << ((x + col) & 15) : 0),
      );
    }
  return [...words].map(([address, value]) => ({ address, value }));
}
export function bitmapJack(bitmap: Bitmap, x = 0, y = 0): string {
  const expression = (word: number) =>
    word === 32768 ? '~32767' : String(word > 32767 ? word - 65536 : word);
  return (
    'class Sprite {\n  function void draw() {\n' +
    bitmapWords(bitmap, x, y)
      .map(({ address, value }) => `    do Memory.poke(${address}, ${expression(value)});`)
      .join('\n') +
    '\n    return;\n  }\n}\n'
  );
}
export function bitmapAssembly(bitmap: Bitmap, x = 0, y = 0): string {
  return (
    '// Draws whole screen words, including blank pixels.\n' +
    bitmapWords(bitmap, x, y)
      .map(
        ({ address, value }) =>
          `@${value > 32767 ? 65535 - value : value}\nD=${value > 32767 ? '!A' : 'A'}\n@${address}\nM=D`,
      )
      .join('\n') +
    '\n'
  );
}
