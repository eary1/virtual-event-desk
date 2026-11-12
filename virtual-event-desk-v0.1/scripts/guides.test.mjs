import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escapeHtml, validateArticle, renderArticle, renderIndex } from './guides.mjs';

const draft = JSON.parse(await readFile(new URL('../content/articles/event-announcement.json', import.meta.url), 'utf8'));

test('initial draft passes structure validation', () => {
  assert.deepEqual(validateArticle(draft), []);
});

test('cannot approve without human review gates', () => {
  const unreviewed = { ...draft, status: 'approved' };
  assert.ok(validateArticle(unreviewed).length > 0);
  const reviewed = {
    ...draft,
    status: 'approved',
    review: { factsChecked: true, rightsChecked: true, editorApproved: true, reviewedOn: '2026-11-13' }
  };
  assert.deepEqual(validateArticle(reviewed), []);
});

test('escapes HTML and keeps untrusted text inert', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  const template = '<title>old</title><meta name="description" content="old"><main id="main">old</main>';
  const article = { ...draft, title: '<img src=x onerror=alert(1)>' };
  const result = renderArticle(article, template);
  assert.ok(result.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!result.includes('<img src=x onerror=alert(1)>'));
});

test('article index generation is idempotent', () => {
  const source = '<div class="guides-grid"><article>既存の3記事</article></div>';
  const first = renderIndex([draft], source);
  const second = renderIndex([draft], first);
  assert.equal(first, second);
  assert.ok(first.includes('/guides/event-announcement/'));
  assert.ok(first.includes('既存の3記事'));
});
