# tasklog.md
------------------
## 自分のメモ
- エントリポイント：src/index.js
- ルート定義ファイル：src/api/todo-handler.js
- DB接続ファイル：src/database/connection.js
- フロントエンドファイル：src/index.html　　←訂正：public/index.html
- 気になった箇所：jest.config.js　※でも名前の通りtest関連のはず

## API一覧（自分で読んで書く）
- GET    /todos (all)   ：パラメータcompleted指定があるならcompleted指定値のみ、SELECTする、
                          なければcompleted指定なしで全件をSELECTする
- GET    /todos (single)：指定idをSELECTする
- POST   /todos    ：指定のtitleのTODOをINSERTする
- PATCH  /todos/:id：指定のtitle、completedで指定のTODOをUPDATEする
- DELETE /todos/:id：指定のidのTODOをDELETEする
- 上記以外（自分で探してみてください）：GET(all/singleの2行のことだと考える)

## わからない箇所をClaudeに質問する
以下のコードを読みましたが、〇〇の部分が理解できていません。
[コードを貼り付ける]
何をしているか教えてください。
コードの修正はしないでください。
→　特になし

------------------
### ゴール
`GET /todos?q=キーワード` でタイトルの部分一致検索（大文字小文字を区別しない）を追加し、フロントに検索フォームを置く。`q` 未指定時は従来どおり全件（＋既存の `completed` フィルタ）を返す。テストを追加しカバレッジ 70% 以上を維持する。

### 分解
STEP1 → STEP2 → STEP3 → STEP4 → STEP5 → STEP6

| STEP | 内容 | 対象 |
|------|------|------|
| STEP1 | 現状確認：一覧 API・`completed` クエリ・フロントの取得処理を把握する。変数名 `q`（SQL文字列）とクエリ `q` の衝突に注意する | `todo-handler.js` / `index.html` |
| STEP2 | API：`req.query.q` を受け取り、タイトルを `ILIKE`（または `LOWER` + `LIKE`）で部分一致。`q` なしは既存動作を維持。`completed` との併用も考慮する | `src/api/todo-handler.js` |
| STEP3 | フロント：検索フォーム（入力＋検索ボタン等）を追加し、`GET /todos?q=...` で一覧を再取得・描画する | `public/index.html` |
| STEP4 | テスト追加：`q` あり／なし、大文字小文字、部分一致、（必要なら `completed` 併用）、既存 CRUD の回帰 | `**/__tests__/**/*.test.js` |
| STEP5 | `npm test` / `npm run test:coverage` でカバレッジ 70% 以上を確認する | Jest |
| STEP6 | ドキュメント更新：`docs/architecture.md`（および必要なら `CLAUDE.md`）に `q` パラメータを追記する | docs |

### 検証
- [ ] `GET /todos`（`q` なし）→ 全件（既存どおり）。`completed` のみ指定も従来どおり動く
- [ ] `GET /todos?q=buy` → タイトルに `buy` を含むものだけ返る
- [ ] `GET /todos?q=BUY` と `q=buy` で同じ結果（大文字小文字を区別しない）
- [ ] ブラウザで検索フォームから検索し、一覧が絞り込まれる
- [ ] 検索欄を空にして再取得すると全件に戻る
- [ ] `npm run test:coverage` で lines / functions ≥ 70%（branches は設定どおり ≥ 60%）

### 失敗予測
| 予測 | なぜ起きそうか | 回避・対処 |
|------|----------------|------------|
| 変数名衝突 | 一覧ハンドラで SQL 文字列が既に `q`。クエリ `q` を同じ名で受けると上書き・誤用しやすい | クエリは `search` / `keyword` など別名で受け、SQL 組み立て用と分ける（レスポンスのクエリ名は要件どおり `q`） |
| `completed` と `q` の組み合わせ漏れ | 片方しか WHERE に入れず、併用時に意図しない全件や絞り込み不足 | 条件を配列で積み、両方あるときは `AND` で結合する |
| LIKE のワイルドカード注入 | `%` `_` を含む入力で想定外に広くマッチする | 必要ならエスケープ。研修範囲ならまず要件どおり部分一致を優先し、テストで挙動を固定 |
| テストが無い／モック不足 | 現状 `__tests__` が無く、DB 実接続だと CI・ローカルで落ちやすい | `supertest` + DB モック（またはテスト用 DB）で一覧の `q` 分岐を中心にカバー |
| カバレッジ不足 | 新規分岐（`q` あり／なし、`completed` 併用）や未テストの CRUD が閾値を下回る | 一覧・作成・更新・削除・404/400 を最低限のケースで押さえる |
| フロントだけクライアントフィルタ | API を変えず画面だけで絞ると要件1を満たさない | 必ず `?q=` 付きでサーバに問い合わせる |

### Claude への依頼メモ（このあと）
タスク設計（本ファイル）に沿って STEP2〜6 を実装してください。要件は課題どおり。コード修正前に衝突する変数名と SQL 方針だけ短く確認してから着手してください。

### STEP6 実施メモ
- `docs/architecture.md` に `GET /todos?q=`（`ILIKE`・`completed` 併用）と検索 UI・テスト配置を追記した
- `CLAUDE.md` にも検索仕様と規約（`keyword` 別名 / `ILIKE`）を追記した
