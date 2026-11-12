/** バーチャルイベント準備室 — 全処理をブラウザ内で実行するVer.0.1 */
(() => {
  'use strict';
  const form = document.getElementById('planner-form');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const results = $('planner-results');
  const scheduleBody = $('schedule-body');
  const checklist = $('checklist');
  const announcement = $('announcement');
  const status = $('planner-status');
  let current = null;

  const typeData = {
    social: {
      name: '交流会',
      phases: ['受付・接続確認', '開会・ルール説明', '自己紹介・交流タイム', '締め・集合写真・解散'],
      tasks: ['交流テーマと参加条件を整理する', '自己紹介や会話のきっかけを2〜3個準備する']
    },
    game: {
      name: 'ゲーム大会',
      phases: ['受付・参加者確認', 'ルール説明・チーム分け', 'ゲーム・対戦・集計', '結果発表・閉会'],
      tasks: ['ルール・勝敗の決め方を文章で共有する', '人数変更時のチーム分けと対戦順を用意する']
    },
    exhibit: {
      name: '展示会・見学会',
      phases: ['受付・集合', '展示案内・注意事項', '見学・解説・質問タイム', 'まとめ・解散'],
      tasks: ['展示物の順番と案内ルートを確認する', '見学者が迷わない集合・誘導方法を決める']
    }
  };
  const minutesFor = {60: [10, 5, 35, 10], 90: [10, 10, 55, 15], 120: [15, 10, 75, 20]};
  const pad = (n) => String(n).padStart(2, '0');
  const fmtTime = (minutes) => `${pad(Math.floor((minutes % 1440) / 60))}:${pad(minutes % 60)}${minutes >= 1440 ? '（翌日）' : ''}`;
  const fmtDate = (str) => {
    if (!str) return '日時未定';
    const [year, month, day] = str.split('-').map(Number);
    return `${year}年${month}月${day}日`;
  };
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };

  function createPlan() {
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const type = typeData[fd.get('type')];
    const people = Number(fd.get('participants'));
    const staff = Number(fd.get('staff'));
    const duration = Number(fd.get('duration'));
    const time = String(fd.get('time') || '');
    const date = String(fd.get('date') || '');
    const world = String(fd.get('world') || '').trim();
    const entry = String(fd.get('entry') || '').trim();

    if (!name || !type || !Number.isInteger(people) || people < 2 || people > 200 ||
        !Number.isInteger(staff) || staff < 1 || staff > 20 || !minutesFor[duration] ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;

    const start = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    let cursor = start;
    const schedule = type.phases.map((label, idx) => {
      const from = cursor;
      cursor += minutesFor[duration][idx];
      return {label, from: fmtTime(from), to: fmtTime(cursor), length: minutesFor[duration][idx]};
    });
    const tasks = [
      '開催日時・参加条件・定員を告知する',
      `会場の動作と${people}人規模での実施可否を確認する`,
      `運営スタッフ${staff}人の担当と連絡方法を決める`,
      ...type.tasks,
      '集合方法と受付担当を決める',
      '開会前に音声・移動・ワールドの動作を確認する',
      '遅刻・回線不調・迷惑行為への対応を共有する',
      '終了後の連絡方法と振り返り項目を用意する'
    ];
    const when = date ? `${fmtDate(date)} ${time}` : `開催日未定 ${time}開始（仮）`;
    const announcementText = `【${name}】\n\n${type.name}を開催します！\n\n📅 日時：${when}（約${duration}分）\n👥 参加予定：${people}人\n📍 会場：${world || '決まり次第お知らせします'}\n📝 参加方法・注意事項：${entry || '決まり次第お知らせします'}\n\n初めての方も安心してご参加ください。\n※集合方法・参加資格・主催者連絡先などは公開前に追記してください。`;
    return {name, typeName:type.name, people, staff, duration, date, time, world, schedule, tasks, announcementText};
  }

  function planText(plan) {
    const lines = [
      `【${plan.name}｜イベント運営プラン】`,
      `形式：${plan.typeName} / ${plan.people}人 / ${plan.duration}分 / スタッフ${plan.staff}人`,
      `開催：${plan.date ? fmtDate(plan.date) : '開催日未定'} ${plan.time}〜`,
      `会場：${plan.world || '未定'}`,
      '', '■ タイムテーブル',
      ...plan.schedule.map(s => `${s.from}〜${s.to} (${s.length}分)　${s.label}`),
      '', '■ 準備チェックリスト',
      ...plan.tasks.map((task, i) => `${checklist.querySelector(`[data-check="${i}"]`)?.checked ? '☑' : '□'} ${task}`),
      '', '■ 告知文', plan.announcementText,
      '', '※参考用の自動生成案です。実際のイベントに合わせて調整してください。'
    ];
    return lines.join('\n');
  }

  function updateCount() {
    const total = checklist.querySelectorAll('input[type="checkbox"]').length;
    const checked = checklist.querySelectorAll('input[type="checkbox"]:checked').length;
    $('check-count').textContent = `${checked} / ${total} 項目を確認済み（チェック状態は保存されません）`;
  }

  function render(plan) {
    current = plan;
    scheduleBody.replaceChildren();
    checklist.replaceChildren();
    $('print-title').textContent = `${plan.name}｜運営プラン`;
    $('print-subtitle').textContent = `${plan.date ? fmtDate(plan.date) : '日付未定'}・${plan.time}開始・${plan.duration}分・${plan.people}人`;
    $('schedule-duration').textContent = `${plan.duration}分 / ${plan.people}人`;
    $('schedule-summary').textContent = `${plan.typeName} · ${plan.date ? fmtDate(plan.date) : '日付未定'} · ${plan.time}開始 · スタッフ${plan.staff}人`;

    plan.schedule.forEach(s => {
      const tr = node('tr');
      tr.append(node('td', `${s.from}–${s.to}`), node('td', `${s.label}（${s.length}分）`));
      scheduleBody.appendChild(tr);
    });
    plan.tasks.forEach((task, i) => {
      const li = node('li');
      const label = node('label');
      const input = node('input');
      input.type = 'checkbox'; input.dataset.check = String(i);
      input.addEventListener('change', updateCount);
      label.append(input, node('span', task));
      li.appendChild(label); checklist.appendChild(li);
    });
    updateCount();
    announcement.textContent = plan.announcementText;
    status.textContent = '';
    results.hidden = false;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const plan = createPlan();
    if (!plan) { status.textContent = '入力内容を確認してください。'; return; }
    render(plan);
    results.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  form.addEventListener('reset', () => {
    current = null;
    results.hidden = true;
    status.textContent = '';
    checklist.replaceChildren();
    scheduleBody.replaceChildren();
  });

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; }
      catch (_) { /* fallback */ }
    }
    const temp = document.createElement('textarea');
    temp.value = text; temp.setAttribute('readonly', '');
    temp.style.position = 'fixed'; temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    let success = false;
    try { success = document.execCommand('copy'); } catch (_) { /* no clipboard permission */ }
    temp.remove();
    return success;
  }

  $('copy-plan').addEventListener('click', async () => {
    if (!current) return;
    status.textContent = await copyText(planText(current)) ? '運営プランをコピーしました。' : 'コピーできませんでした。テキスト保存をご利用ください。';
  });
  $('download-plan').addEventListener('click', () => {
    if (!current) return;
    const blob = new Blob(['\uFEFF' + planText(current)], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'event-plan.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'テキストファイルを保存しました。';
  });
  $('print-plan').addEventListener('click', () => { if (current) window.print(); });
})();
