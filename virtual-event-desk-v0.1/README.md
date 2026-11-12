# バーチャルイベント準備室 Ver.0.1

**VRChatなどのイベントを企画する人向けの、非公式・無料・ログイン不要の静的Webサイト試作品です。**

- `/` トップページ
- `/planner/` イベント準備ツール（種類、人数、日時、時間、会場、スタッフ数の入力）
- `/guides/` 運営ガイド3記事
- `/kit/` 有料テンプレート集の紹介（**販売準備中**。購入はできません）
- `/privacy/` 運営情報・プライバシー

## すぐ動かす（パソコンで確認）

### 方法A：Pythonが入っている場合

プロジェクトフォルダー（このREADMEがある場所）を開き、ターミナルで次を実行します。

```bash
cd public
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。Windowsで `python` が使えない場合は `py -m http.server 8000` でも構いません。

**重要：** HTMLをダブルクリックするだけの `file://` では、`/planner/` などのルート相対リンクが正しく動作しないことがあります。サーバー経由で開いてください。

### 方法B：VS Codeの場合

1. VS Codeでこのプロジェクトフォルダーを開く。
2. 拡張機能「Live Server」等を使う場合、公開ディレクトリを `public` に指定する。
3. ブラウザで `/` と `/planner/` の両方を確認する。

## GitHubにアップロードする（初心者向け）

**推奨：** GitHub Desktop を使用すると、コマンド操作を減らせます。

1. [GitHub](https://github.com/) のアカウントを作る。
2. [GitHub Desktop](https://desktop.github.com/) をインストールし、GitHubにサインイン。
3. `File > Add local repository` では既存のGitリポジトリか確認されるため、まだGit管理していないときは `File > New repository` を選び、別途作成したリポジトリ内へ **`public` フォルダー、README.md、.gitignore をそのままコピー**する。
4. GitHub Desktopの画面で変更ファイルを確認し、コミットメッセージ `Initial prototype` を入力して `Commit to main`。
5. `Publish repository` を押してGitHubへアップロード。最初は **Private** を推奨（公開する準備ができたら変更可能）。

Gitコマンドを使う場合は、このREADMEがあるフォルダーを開いて：

```bash
git init
git add .
git commit -m "Initial prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/virtual-event-desk.git
git push -u origin main
```

※ あらかじめGitHubで空の `virtual-event-desk` リポジトリを作成し、`YOUR_USERNAME` を自分のユーザー名に置き換えてください。Gitが未設定の環境ではユーザー名・メールアドレスの設定が必要な場合があります。

## Cloudflare Pagesに公開する（GitHub連携）

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にサインイン。
2. `Workers & Pages` → `Create application` → **Pages** → `Connect to Git`（画面の名称は変更される場合があります）。
3. GitHubへの連携を許可し、アップロードした `virtual-event-desk` リポジトリを選択。
4. 次の設定を行います。

| 項目 | 設定 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None`（選択肢がある場合） |
| Build command | `exit 0` または空欄 |
| Build output directory | **`public`** |
| Root directory | 空欄（リポジトリのルート） |

5. `Save and Deploy` 等のボタンを押すと、発行された `https://...pages.dev` のURLでサイトを確認できます。
6. 以降、`main` ブランチのファイルを更新すると、通常はCloudflare Pagesが自動で再デプロイします。

**注意：** Git連携で作ったPagesプロジェクトは、同じプロジェクトのままDirect Upload方式に切り替えられません。最初からGit連携を選んでください。

公式資料：
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/git-integration/

## かんたんな動作チェック

- [ ] トップの「無料ツールを試す」から `/planner/` に移動できる
- [ ] 60・90・120分それぞれでタイムテーブルの合計時間が一致する
- [ ] 23:30開始など日付をまたぐと、翌日表示になる
- [ ] 参加人数を変更すると準備項目に反映される
- [ ] 準備チェックボックスの進捗表示が変わる
- [ ] コピー・テキスト保存・印刷（PDF保存）が動作する
- [ ] 記事一覧→3記事→無料ツールへの導線が動く
- [ ] 商品ページで「販売準備中」が表示され、購入を誤誘導しない
- [ ] スマートフォン幅でも表示が崩れない

## 販売とアクセス分析を開始する前に

現状は**サイト試作品のみ**です。次の項目は意図的に未接続です。

### BOOTH商品販売

1. 先に商品ファイルを実際に完成させる。
2. 権利関係、利用規約、販売者情報、価格などを確認する。
3. BOOTHの販売ページを作り、URLを控える。
4. `public/kit/index.html` の販売準備中表示を実際の商品リンクに置き換える。購入可能になる前に、価格・内容・リンクが一致していることを確認する。

### アフィリエイト

1. 取り扱いたい商品やサービスの広告案件へ申請する。
2. 承認された広告だけを掲載する。クリックだけで報酬が発生するとは限らない。
3. 広告であることが分かる **「PR」「広告」** 表示を該当ページに設ける。
4. 規約・景品表示等の法令を確認する。AIで作成した記事の事実確認は人間が行う。

### アクセス分析

- Cloudflare Web Analytics：訪問・ページ閲覧の全体像（利用条件に応じて設定）。
- Google Search Console：検索からの表示・流入を確認。
- Google Analytics 4：ツールの生成回数や商品紹介リンクのクリック等を計測したい場合に検討。
- BOOTH：販売数や売上をサイト内のアクセス指標とは**別管理**で確認する。

**このVer.0.1には外部のアクセス解析タグ、広告タグ、AI API、Cookie、ログイン、サーバー保存を実装していません。** 上記サービスを使い始める場合は、プライバシー案内を正しく更新してから導入してください。

## ファイル構成

```text
virtual-event-desk-v0.1/
├── README.md
├── .gitignore
└── public/                    ← Cloudflare Pagesの公開フォルダー
    ├── index.html             ホーム
    ├── _headers               基本的なセキュリティヘッダー
    ├── assets/
    │   ├── style.css          全ページ共通デザイン
    │   ├── site.js            スマホ用メニュー
    │   ├── planner.js         イベント準備ツール本体
    │   └── favicon.svg
    ├── planner/index.html
    ├── guides/
    │   ├── index.html
    │   ├── first-event/index.html
    │   ├── checklist/index.html
    │   └── trouble/index.html
    ├── kit/index.html
    └── privacy/index.html
```

## セキュリティ・データ

- 入力データはWebブラウザ内で処理し、サーバーへ送信しません。
- ブラウザ保存（localStorage、Cookie）は使用しません。
- フォーム入力をHTMLとして挿入せず、`textContent` により安全に表示しています。
- ファイル保存は利用者が明示的にクリックした場合のみです。
- 将来的に外部APIや広告サービスを追加するときは設計・表記を改めて確認してください。

## 権利と注意

このサイトは自主制作の非公式ツールです。VRChatは各権利者の商標であり、本サイトは公式サービスではありません。デモ記事は一般的な運営ノウハウを中心とした原稿であり、特定の公式機能の最新仕様を保証しません。
