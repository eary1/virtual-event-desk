// AI article publishing helper: no external dependencies or AI API calls.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const articlesDir = path.join(root, 'content', 'articles');
const guidesDir = path.join(root, 'public', 'guides');
const indexPath = path.join(guidesDir, 'index.html');
const templatePath = path.join(guidesDir, 'first-event', 'index.html');
const START = '<!-- AI_GUIDES_START -->';
const END = '<!-- AI_GUIDES_END -->';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

export function validateArticle(article) {
  const errors = [];
  const text = (value, key, max = 300) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max) errors.push(key + ' は1〜' + max + '文字の文字列が必要です');
  };
  if (!article || typeof article !== 'object' || Array.isArray(article)) return ['記事データがオブジェクトではありません'];
  text(article.slug, 'slug', 60);
  if (typeof article.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) errors.push('slug は小文字英数字とハイフンのみ');
  if (['first-event', 'checklist', 'trouble'].includes(article.slug)) errors.push('既存記事と同じslugは使用できません');
  text(article.title, 'title', 100);
  text(article.summary, 'summary', 220);
  text(article.category, 'category', 50);
  if (!['draft', 'approved'].includes(article.status)) errors.push('status は draft または approved');
  if (!Number.isInteger(article.minutes) || article.minutes < 1 || article.minutes > 30) errors.push('minutes は1〜30の整数');
  if (!Array.isArray(article.sections) || article.sections.length < 2 || article.sections.length > 20) {
    errors.push('sections は2〜20節');
  } else article.sections.forEach((s, i) => {
    text(s.heading, 'sections[' + i + '].heading', 120);
    if (!Array.isArray(s.paragraphs) || !s.paragraphs.length) errors.push('sections[' + i + '].paragraphs が必要');
    else s.paragraphs.forEach((p, j) => text(p, 'sections[' + i + '].paragraphs[' + j + ']', 1300));
    if (s.bullets !== undefined) {
      if (!Array.isArray(s.bullets)) errors.push('bullets は配列');
      else s.bullets.forEach((b, j) => text(b, 'sections[' + i + '].bullets[' + j + ']', 350));
    }
  });
  if (!Array.isArray(article.sources)) errors.push('sources は配列');
  else article.sources.forEach((s, i) => {
    text(s.label, 'sources[' + i + '].label', 150);
    try { const u = new URL(s.url); if (u.protocol !== 'https:') throw new Error('https only'); }
    catch { errors.push('sources[' + i + '].url は有効なhttps URLが必要'); }
  });
  if (article.status === 'approved') {
    if (!article.review || article.review.factsChecked !== true || article.review.rightsChecked !== true || article.review.editorApproved !== true)
      errors.push('公開前に review.factsChecked / rightsChecked / editorApproved を全て true にしてください');
    if (!article.review || !/^\d{4}-\d{2}-\d{2}$/.test(article.review.reviewedOn || ''))
      errors.push('review.reviewedOn にレビュー日(YYYY-MM-DD)が必要');
    if (!article.sources?.length) errors.push('承認済み記事には参照元を1件以上指定');
  }
  return errors;
}

function sectionsMarkup(article) {
  return article.sections.map(section =>
    '<h2>' + escapeHtml(section.heading) + '</h2>' +
    section.paragraphs.map(p => '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>').join('') +
    (section.bullets?.length ? '<ul>' + section.bullets.map(b => '<li>' + escapeHtml(b) + '</li>').join('') + '</ul>' : '')
  ).join('');
}

export function renderArticle(article, template) {
  const title = escapeHtml(article.title);
  const sources = (article.sources || []).map(s =>
    '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.label) + '</a></li>'
  ).join('');
  const main =
    '<main id="main">' +
    '<section class="page-heading"><div class="wrap"><div class="breadcrumbs"><a href="/">ホーム</a>' +
    '<span aria-hidden="true">/</span><a href="/guides/">ガイド</a><span aria-hidden="true">/</span><span>記事</span></div>' +
    '<span class="label-pill">' + escapeHtml(article.category) + '</span><h1>' + title + '</h1>' +
    '<p>' + escapeHtml(article.summary) + '</p></div></section>' +
    '<section class="wrap content-end"><div class="article-layout"><article class="article">' +
    '<p class="article-intro">' + escapeHtml(article.summary) + '</p>' +
    sectionsMarkup(article) +
    '<h2>参考情報</h2><ul>' + sources + '</ul>' +
    '<hr class="divider"><p class="small-muted">公式とは無関係の編集記事です。各サービスの仕様・ルールは変更されるため、利用前に公式情報をご確認ください。広告掲載時はPR表記を追加します。</p>' +
    '<a class="text-link" href="/guides/">← 記事一覧へ戻る</a>' +
    '</article><aside class="aside-card"><h3>イベント準備を始める</h3><p class="muted">無料で進行表・チェックリストを作れます。</p>' +
    '<a class="btn" href="/planner/">プランナーを使う →</a><hr class="divider">' +
    '<a href="/guides/">→ ガイド一覧</a></aside></div></section></main>';
  if (!template.includes('<main id="main">') || !template.includes('<title>')) throw new Error('既存テンプレートが見つかりません');
  return template
    .replace(/<title>[^<]*<\/title>/, '<title>' + title + ' | バーチャルイベント準備室</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escapeHtml(article.summary) + '">')
    .replace(/<main id="main">[\s\S]*?<\/main>/, main);
}

function renderCard(a) {
  return '<article class="card guide-card"><span class="badge">' + escapeHtml(a.category) + '</span>' +
    '<h2>' + escapeHtml(a.title) + '</h2><p>' + escapeHtml(a.summary) + '</p>' +
    '<div class="meta">読み目安：約' + a.minutes + '分</div>' +
    '<a class="text-link" href="/guides/' + a.slug + '/">記事を読む →</a></article>';
}

export function renderIndex(approved, source) {
  const block = START + approved.map(renderCard).join('') + END;
  if (source.includes(START) && source.includes(END)) {
    return source.replace(/<!-- AI_GUIDES_START -->[\s\S]*?<!-- AI_GUIDES_END -->/, block);
  }
  const anchor = '<div class="guides-grid">';
  if (!source.includes(anchor)) throw new Error('一覧の挿入場所が見つかりません');
  return source.replace(anchor, anchor + block);
}

async function loadArticles() {
  const names = (await readdir(articlesDir)).filter(n => n.endsWith('.json')).sort();
  const result = [];
  const seen = new Set();
  for (const name of names) {
    const article = JSON.parse(await readFile(path.join(articlesDir, name), 'utf8'));
    const errors = validateArticle(article);
    if (article.slug !== name.slice(0, -5)) errors.push('ファイル名とslugを一致させてください');
    if (seen.has(article.slug)) errors.push('slugが重複');
    seen.add(article.slug);
    if (errors.length) throw new Error(name + ':\n- ' + errors.join('\n- '));
    result.push(article);
  }
  return result;
}

async function run(mode) {
  if (!['validate', 'build', 'verify'].includes(mode)) throw new Error('使い方: node scripts/guides.mjs validate|build|verify');
  const articles = await loadArticles();
  const approved = articles.filter(a => a.status === 'approved');
  if (mode === 'validate') {
    console.log('記事データOK: ' + articles.length + '件（承認済み ' + approved.length + '件）');
    return;
  }
  if (approved.length === 0) {
    console.log('承認済み記事は0件。公開ファイルを変更しません。');
    return;
  }
  const template = await readFile(templatePath, 'utf8');
  const indexSource = await readFile(indexPath, 'utf8');
  const indexExpected = renderIndex(approved, indexSource);
  for (const article of approved) {
    const output = path.join(guidesDir, article.slug, 'index.html');
    const expected = renderArticle(article, template);
    if (mode === 'build') {
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, expected);
    } else {
      const current = await readFile(output, 'utf8').catch(() => '');
      if (current !== expected) throw new Error(article.slug + ' の公開HTMLが未生成・古い状態です。node scripts/guides.mjs build を実行してください');
    }
  }
  if (mode === 'build') await writeFile(indexPath, indexExpected);
  else if (indexSource !== indexExpected) throw new Error('記事一覧が未更新です。node scripts/guides.mjs build を実行してください');
  console.log(mode + ' OK: 公開承認済み ' + approved.length + '件');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv[2] || 'validate').catch(err => { console.error(err.message); process.exitCode = 1; });
}
