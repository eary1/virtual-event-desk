# Ver.0.6 — 検索流入とアクセス解析のセットアップ

サイトURL：
https://virtual-event-desk.virtual-event-deskfox-labworkersdev.workers.dev/

## 今回追加した仕組み

- `public/sitemap.xml`：ホーム、無料プランナー、運営ガイド一覧、公開済み記事、商品案内、プライバシーのURLを掲載。編集用 `/editor/` は含めません。
- `public/robots.txt`：検索エンジンへサイトマップの場所を案内します。
- 公開ページの `rel=canonical` と `og:title` 等：優先するURLと共有時の表示情報を設定。これらは検索結果の表示を保証するものではありません。
- Cloudflare Web Analytics：公開ページに手動ビーコンを1回ずつ設置。編集用ページは計測対象外です。
- `scripts/seo.mjs`：新しく公開する記事を含め、URLの一覧・SEOタグ・アクセス解析タグの整合性を保つための無料スクリプト。
- GitHub Actions：PRでSEOファイルをチェックし、承認済み記事を追加するときはサイトマップも生成します。

## Google Search Console に登録する（サイト管理者が実施）

1. https://search.google.com/search-console/welcome へGoogleアカウントでアクセスします。
2. 「**URLプレフィックス**」を選び、下記のURLを末尾のスラッシュまで入力します。

   https://virtual-event-desk.virtual-event-deskfox-labworkersdev.workers.dev/

3. 「続行」を押し、提示された所有権確認方法を選びます。
4. おすすめは **HTMLタグ** 確認です。提示された `<meta name="google-site-verification" content="...">` を省略せずコピーし、このリポジトリの `public/index.html` の `<head>` に追加します。追加には別のPRを利用してください。**Googleが発行した値を推測で作成しないでください。**
5. `main` にマージし、Cloudflare Workersへのデプロイが Ready となったら、通常のブラウザでトップページのソースにタグがあることを確かめます。
6. Search Console に戻り「確認」を押します。
7. 所有権確認に成功したら、サイドメニューの **サイトマップ** で `sitemap.xml` を送信します。
8. 数日たってから「ページ」と「検索パフォーマンス」を確認します。新規サイトでは初期データがないことも普通です。

公式説明：
https://support.google.com/webmasters/answer/9008080?hl=ja
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

**注意**：URLプレフィックス（https://〜）とドメインプロパティは異なります。Workers.devを使ったこのサイトでは、まずURLプレフィックス方式で設定してください。

## 変更したページのチェック

```sh
cd virtual-event-desk-v0.1
node scripts/seo.mjs verify
node scripts/guides.mjs verify
node --test scripts/guides.test.mjs
node scripts/check-ui.mjs
```

新しい記事のHTMLをGitHubで生成した場合、サイトマップを更新するため `node scripts/seo.mjs build` を実行してください。既存の「Approve article」ワークフローはこの処理を組み込んでいます。

## SEOと販売計測の注意

- Search Consoleへの登録とサイトマップ送信は**検索上位表示や即時掲載を保証しません**。
- 記事数を増やす前に、事実確認、実際の運営に役立つ具体例、内部リンク、見やすさを重視します。
- Cloudflare Web Analyticsではページごとの閲覧数などを確認できます。ただしBOOTHでの**購入件数や売上は、Cloudflareの閲覧数だけではわかりません**。販売状況はBOOTHの管理画面を参照してください。
- 正式な独自ドメインを後から導入した場合、canonical・サイトマップ・Search Consoleの登録先を新しいドメインへ変更する必要があります。
- Cloudflareの「自動設置」と「手動ビーコン」を重複させないよう、Web Analyticsの設定を確認してください。
- 編集者向け `/editor/` は `noindex` ですが**非公開化やアクセス制限ではありません**。原稿データも公開GitHubに置いているため、機密情報を入力しないでください。

## 初期の測定指標

- Search Console：検索からのクリック数、表示回数、CTR、流入キーワード、インデックスされたページ数
- Cloudflare Web Analytics：ページ閲覧、ユニーク訪問者、よく見られたページ
- BOOTH：ショップ内の商品閲覧・販売履歴（利用可能な指標のみ）

開始後2〜4週間は表示数が少ない場合もあるため、まず記事と商品説明の品質、問題なくページが見られることを優先してください。
