import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeHttpsUrl, toCssImageUrl } from '../src/lib/sanitize';

test('normalizeHttpsUrl accepts https links and empty values only', () => {
  assert.equal(normalizeHttpsUrl(''), '');
  assert.equal(normalizeHttpsUrl('   '), '');
  assert.equal(normalizeHttpsUrl(undefined), '');
  assert.equal(normalizeHttpsUrl(' https://example.com/a.jpg '), 'https://example.com/a.jpg');
  assert.equal(normalizeHttpsUrl('http://example.com/a.jpg'), null);
  assert.equal(normalizeHttpsUrl('javascript:alert(1)'), null);
  assert.equal(normalizeHttpsUrl('data:image/png;base64,AAAA'), null);
  assert.equal(normalizeHttpsUrl('not a url'), null);
  assert.equal(normalizeHttpsUrl('https://user:pass@example.com/a.jpg'), null);
  assert.equal(normalizeHttpsUrl('https://example.com/' + 'a'.repeat(2100)), null);
});

test('toCssImageUrl quotes the link and neutralises characters that break url()', () => {
  assert.equal(toCssImageUrl('https://example.com/a.jpg'), 'url("https://example.com/a.jpg")');
  const css = toCssImageUrl('https://example.com/a).jpg?x=("b")') as string;
  assert.ok(css.startsWith('url("https://') && css.endsWith('")'));
  const inner = css.slice(5, -2);
  assert.ok(!/["'\\()\s]/.test(inner));
  assert.equal(toCssImageUrl('http://example.com/a.jpg'), undefined);
  assert.equal(toCssImageUrl(''), undefined);
});
