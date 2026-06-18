import { generateOrderNumber, slugify, uniqueSlug } from './slug.util';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Fruits & Vegetables')).toBe('fruits-vegetables');
  });

  it('trims and collapses separators', () => {
    expect(slugify('  Dairy   and  Eggs  ')).toBe('dairy-and-eggs');
  });
});

describe('uniqueSlug', () => {
  it('appends a random suffix to the base slug', () => {
    const s = uniqueSlug('Medicines');
    expect(s).toMatch(/^medicines-[0-9a-f]{6}$/);
  });
});

describe('generateOrderNumber', () => {
  it('uses the given prefix and is unique-ish', () => {
    const a = generateOrderNumber('KK-G');
    const b = generateOrderNumber('KK-G');
    expect(a.startsWith('KK-G-')).toBe(true);
    expect(a).not.toBe(b);
  });
});
