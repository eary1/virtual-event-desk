# Ver.0.3 記事レビュー・承認画面

## 何ができる？

- サイトの /editor/ で、GitHubに置いた公開記事原稿の一覧、本文、参考リンクを閲覧する。
- 3つの確認チェック後、GitHub Actionsの手動実行画面へ進む。
- GitHubにログインできる管理者が記事IDと確認事項を入力して実行すると、承認済みのJSONと公開HTMLを**別ブランチ**に生成する。
- 実行完了後に出る「Compare」リンクからPull Requestを作成し、レビュー後にmainへマージするとCloudflareに公開される。

**注意**：このページは本物のログイン付きCMSではありません。閲覧は公開で、操作・承認はGitHub側の権限で守っています。非公開の下書きや秘密情報はpublicリポジトリに置かないでください。

## 初回の操作

1. mainにVer.0.3のPRをマージし、CloudflareのデプロイがReadyになるのを確認する。
2. https://（あなたの公開URL）/editor/ にアクセスして「event-announcement」の記事内容を読む。
3. 公式資料・文章表現・引用・著作権等を人が確認する。
4. 画面の3項目にチェックを入れ「GitHubで承認・公開準備」をクリック。
5. GitHubのActions画面で「Approve article (prepare PR branch)」→「Run workflow」をクリック。
6. ブランチは **main** 、article_slugに **event-announcement** を入れる。
7. 3つの確認項目を選択し、Run workflowを実行する。権限不足ならGitHubのリポジトリ設定・Actions権限を確認。
8. 実行結果（Summary）に表示されるCompareリンクを開き、公開用PRを作成する。
9. PRのChangesとChecksを確認し、マージして初めて本番の記事一覧へ掲載される。

**管理画面のチェック自体では記事は公開されません。** GitHubの手動操作と最終PRマージという二重確認を設けています。

## ファイル構成

- public/editor/index.html — 編集者画面（閲覧専用）
- public/assets/editor.js — GitHub公開APIから原稿を読み込む
- public/assets/editor.css — スマホ対応デザイン
- scripts/approve-article.mjs — GitHub Actionsによる手動承認時だけステータス更新
- .github/workflows/approve-article.yml — 記事生成と公開用ブランチ作成
- scripts/guides.mjs — Ver.0.2の記事HTML生成処理

## 新しい原稿を追加する方法

最初はChatGPTに記事JSONを作成させて、content/articlesへ専用PRで追加してください。原稿JSONのstatusはdraftにします。この記事の内容はGitHubリポジトリ上で公開されるため、非公開情報は含めないでください。

## 制限・注意事項

- AIが完全自動で24時間執筆する機能、ログイン付きの編集CMS、記事原稿を管理画面上で直接編集する機能はありません。
- GitHubのAPI取得数制限に達すると一覧の読み込みに失敗することがあります。
- GitHubの標準GITHUB_TOKENがブランチをpushできる設定が必要です。組織のポリシーにより禁止される場合があります。
- GitHub Actionsの手動実行権限が必要です。手動ワークフローはmainにファイルが入ってから表示されます。
- 公開ブランチ生成は自動ですが、PR作成とマージは人間が行います。誤情報チェックまで自動で保証されるわけではありません。
- 人が承認した記録はGitHub Actionsの実行履歴と記事JSONに残りますが、暗号署名付きの法的な承認証明ではありません。
