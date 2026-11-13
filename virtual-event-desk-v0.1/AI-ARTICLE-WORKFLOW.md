# AI記事制作・レビュー運用ガイド（Ver.0.2）

これは追加費用0円で試す第一段階です。AIの「調査・執筆・審査・修正」はChatGPTとの会話で行い、記事JSONの形式検査と公開HTMLの生成をNode.jsで自動処理します。**AI APIによる24時間の自動投稿は未実装**です。

## ファイルの場所

- content/articles/：原稿JSON。初期状態は draft（未承認）
- scripts/guides.mjs：形式検査・HTML生成・差分チェック
- scripts/guides.test.mjs：自動テスト
- public/guides/：実際に公開されるHTML
- リポジトリ直下の .github/workflows/guides-ci.yml：プルリクエストのチェック

最初の記事 `event-announcement.json` はすでに承認・公開済みです。Ver.0.7では `event-staff-roles.json` と `event-mc-script.json` を新規作成し、いずれも `draft`（未承認・未公開）のままにしています。

## AIを4役に分ける指示文

### ① 調査担当
VRChatのイベント告知について、読者の悩みと公式資料を調べてください。公式の出典URLを示し、確認済みの事実と未確認の内容を区別してください。仕様を想像で埋めないでください。

### ② 執筆担当
調査結果をもとに、初心者向けの実用記事を書いてください。既存3記事との重複を減らし、具体例と無料プランナーへの案内を含めてください。架空の体験談や誇大な表現は使わないでください。

### ③ 審査担当
執筆担当とは独立した視点で、事実・出典・権利・広告表記・読みやすさを確認してください。根拠がない主張は不合格とし、修正点を列挙してください。AI自身の審査結果だけで事実確認済みとは扱わないでください。

### ④ 修正担当
不合格部分を修正し、根拠がない内容は削除してください。最終原稿を既存のJSON形式へ変換し、変更点と人間が確認すべき事項を提示してください。

## ブラウザのレビュー画面（Ver.0.3以降）

サイトの `/editor/` では、`main` ブランチに取り込まれた原稿JSONを閲覧できます。ここでのチェック操作だけでは公開されません。人間が本文・最新の公式資料・利用条件を確認し、GitHub Actionsの `Approve article (prepare PR branch)` を手動実行したあと、生成された公開用PRの内容を再確認してからマージしてください。

## 承認して公開する手順

1. 人間が原稿、参考URL、表現、著作権、当日の参加ルールを確認する。
2. 原稿JSONのstatusをdraftからapprovedへ変更する。
3. review の factsChecked、rightsChecked、editorApproved を全てtrueにし、reviewedOnへ実際の確認日をYYYY-MM-DD形式で入力する。
4. PCのターミナルでリポジトリ内の virtual-event-desk-v0.1 に移動して以下を実行する。

    node scripts/guides.mjs validate
    node scripts/guides.mjs build
    node scripts/guides.mjs verify
    node --test scripts/guides.test.mjs scripts/draft-review.test.mjs

5. 生成された記事HTMLと一覧HTMLを一緒にGitHubへコミットする。
6. プルリクエストで内容を確認してmainへマージすると、Cloudflareの本番サイトへ反映される。

**重要：draftの記事は上記のbuildでも公開されません。approvedに変更するだけでも公開されず、buildでHTML生成が必要です。**

## 自動テストの範囲

GitHub Actionsは、原稿JSONの形式、未承認記事の扱い、生成ファイルの整合性、HTMLエスケープを確認します。ただし本文の正確性、引用の適法性、VRChatの最新ルール、広告表示の適切さは人間が確認してください。

## Cloudflareと公開の注意

公開中の本番ブランチはmainです。作業ブランチはそのままでは本番反映されません。プレビュービルドはCloudflareの設定によって有効・無効が異なります。Cloudflareへ秘密鍵・APIトークンをWebサイトのHTMLに記載しないでください。

将来は予算と利用規約を確認して、AI APIや定期実行を追加できます。今回の段階ではAPI課金、無断公開、大量自動投稿は行いません。
