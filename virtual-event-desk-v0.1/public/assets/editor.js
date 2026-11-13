(() => {
  'use strict';
  // Public, read-only GitHub API. No keys, login, or writes in this website.
  const REPO = 'eary1/virtual-event-desk';
  const DIRECTORY = 'virtual-event-desk-v0.1/content/articles';
  const RUN_URL = 'https://github.com/' + REPO + '/actions/workflows/approve-article.yml';
  const listNode = document.getElementById('article-list');
  const statusNode = document.getElementById('load-status');
  const reviewPanel = document.getElementById('review-panel');
  const emptyState = document.getElementById('empty-state');
  const approvalStatus = document.getElementById('approval-status');
  const approveLink = document.getElementById('approve-link');
  const checks = ['facts-check', 'rights-check', 'approve-check'].map(id => document.getElementById(id));
  const $ = id => document.getElementById(id);
  let selected = null;

  function appendText(tag, text, parent) {
    const node = document.createElement(tag);
    node.textContent = String(text || '');
    parent.appendChild(node);
    return node;
  }

  function clearChecks() {
    checks.forEach(check => { check.checked = false; });
    updateApproval();
  }

  function updateApproval() {
    const enabled = Boolean(selected && selected.status === 'draft' && checks.every(check => check.checked));
    approveLink.classList.toggle('editor-action-disabled', !enabled);
    approveLink.setAttribute('aria-disabled', String(!enabled));
    approveLink.tabIndex = enabled ? 0 : -1;
    approveLink.href = enabled ? RUN_URL : '#';
    approvalStatus.textContent = !selected ? '記事を選択してください。'
      : selected.status !== 'draft' ? 'この記事はすでに承認済みです。GitHubで状態を確認してください。'
      : enabled ? '確認済み。GitHubのRun workflowで記事IDと3つの承認項目を再入力してください。'
      : '3つのチェックを完了すると、GitHubで公開準備を開始できます。';
  }

  function render(article) {
    selected = article;
    emptyState.hidden = true;
    reviewPanel.hidden = false;
    $('article-status').textContent = article.status === 'approved' ? '承認済み' : '下書き・未公開';
    $('article-title').textContent = article.title;
    $('article-summary').textContent = article.summary;
    $('article-category').textContent = article.category;
    $('article-minutes').textContent = '読み目安 ' + article.minutes + '分';
    $('article-slug').textContent = article.slug;
    const body = $('article-body');
    body.replaceChildren();
    for (const section of article.sections || []) {
      appendText('h3', section.heading, body);
      for (const paragraph of section.paragraphs || []) appendText('p', paragraph, body);
      if (Array.isArray(section.bullets) && section.bullets.length) {
        const ul = document.createElement('ul');
        section.bullets.forEach(bullet => appendText('li', bullet, ul));
        body.appendChild(ul);
      }
    }
    const sources = $('article-sources');
    sources.replaceChildren();
    for (const source of article.sources || []) {
      const item = document.createElement('li');
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:') throw new Error('not https');
        const link = document.createElement('a');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = source.label;
        item.appendChild(link);
      } catch { item.textContent = '不正な参考資料リンク（編集が必要）'; }
      sources.appendChild(item);
    }
    $('article-notes').textContent = article.review?.notes || '記事全文・参考情報を確認してください。';
    clearChecks();
    listNode.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.slug === article.slug));
    });
  }

  async function load() {
    selected = null;
    reviewPanel.hidden = true;
    emptyState.hidden = false;
    listNode.replaceChildren();
    statusNode.textContent = 'GitHubの公開リポジトリを確認しています…';
    try {
      const listResponse = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + DIRECTORY + '?ref=main', {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
      if (!listResponse.ok) throw new Error('GitHubの一覧取得に失敗しました（HTTP ' + listResponse.status + '）');
      const files = await listResponse.json();
      if (!Array.isArray(files)) throw new Error('記事一覧の形式が正しくありません');
      const targets = files.filter(f => f.type === 'file' && /^[a-z0-9-]+\.json$/.test(f.name)).slice(0, 30);
      if (!targets.length) {
        statusNode.textContent = '記事データはありません。';
        return;
      }
      const articles = await Promise.all(targets.map(async file => {
        const url = 'https://raw.githubusercontent.com/' + REPO + '/main/' + DIRECTORY + '/' + encodeURIComponent(file.name);
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(file.name + ' の取得に失敗（HTTP ' + response.status + '）');
        return response.json();
      }));
      const valid = articles.filter(a => a && typeof a.slug === 'string' && /^[a-z0-9-]+$/.test(a.slug) && Array.isArray(a.sections));
      statusNode.textContent = valid.length + '件の記事が見つかりました。';
      valid.forEach(article => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'editor-article-select';
        button.dataset.slug = article.slug;
        button.setAttribute('aria-pressed', 'false');
        appendText('strong', article.title, button);
        appendText('span', (article.status === 'approved' ? '承認済み' : '未公開の下書き') + ' · ' + (article.category || ''), button);
        button.addEventListener('click', () => render(article));
        listNode.appendChild(button);
      });
      if (valid.length) render(valid[0]);
    } catch (error) {
      statusNode.textContent = error.message + '。しばらくしてから再読み込みしてください。';
    }
  }

  checks.forEach(check => check.addEventListener('change', updateApproval));
  $('refresh').addEventListener('click', load);
  $('copy-slug').addEventListener('click', async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.slug);
      $('copy-slug').textContent = 'コピーしました';
    } catch {
      $('copy-slug').textContent = '記事ID: ' + selected.slug;
    }
  });
  approveLink.addEventListener('click', event => {
    if (approveLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  load();
})();
