import { normalizeWhitespace } from './normalize-whitespace';

describe('normalizeWhitespace', () => {
  it('colapsa espacios sin usar el DOM', () => {
    expect(normalizeWhitespace('  áéí  ñ  ')).toBe('áéí ñ');
  });
});
