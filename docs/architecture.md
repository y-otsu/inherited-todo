

# Architecture(AI生成)

## 1. システム概要

本プロジェクトは、Express + PostgreSQL で構成された TODO 管理アプリである。

- バックエンド: Node.js / Express（`src/index.js` で起動）
- データストア: PostgreSQL（`pg` の接続プール経由）
- フロントエンド: 静的 HTML（`public/index.html`）を Express の `express.static` で配信
- API: `/todos` 配下に CRUD エンドポイントを提供（一覧は `q` によるタイトル検索に対応）

フロントはブラウザから `/todos` API を呼び出し、TODO の一覧表示・検索・追加・完了更新・削除を行う。

## 2. ディレクトリ構成と各ファイルの役割

```
inherited-todo/
├── .env.example                 # 環境変数のサンプル
├── CLAUDE.md                    # プロジェクト概要・規約（Claude Code 向け）
├── package.json                 # 依存関係・起動スクリプト（main: src/index.js）
├── jest.config.js               # Jest のテスト設定
├── __tests__/
│   └── todo-handler.test.js     # API テスト（検索・CRUD）
├── db/
│   └── migrations/
│       └── 001_create_todos.sql # todos テーブル作成・updated_at トリガー定義
├── docs/
│   ├── architecture.md          # 本ドキュメント
│   └── tasklog.md               # 課題メモ・タスク設計
├── public/
│   └── index.html               # フロントエンド UI（追加・検索・一覧）
└── src/
    ├── index.js                 # エントリポイント（Express 起動・ミドルウェア・ルートマウント）
    ├── api/
    │   └── todo-handler.js      # /todos のルート定義（CRUD・検索）
    └── database/
        └── connection.js        # PostgreSQL 接続プール
```

| ファイル | 役割 |
|---|---|
| `src/index.js` | アプリ起動。JSON ボディ解析、静的ファイル配信、`/todos` へのハンドラマウント、`PORT` で listen |
| `src/api/todo-handler.js` | TODO の一覧（`completed` / `q` フィルタ）・取得・作成・更新・削除のルート定義 |
| `src/database/connection.js` | `pg.Pool` による DB 接続。環境変数から接続情報を読み込む |
| `public/index.html` | TODO 操作 UI（追加・タイトル検索・一覧・完了切替・削除） |
| `db/migrations/001_create_todos.sql` | `todos` テーブルと `updated_at` 自動更新トリガーの定義 |
| `__tests__/todo-handler.test.js` | `supertest` + DB モックによる API テスト |
| `.env.example` | 必要な環境変数の一覧サンプル |
| `jest.config.js` | テスト環境・カバレッジ閾値などの Jest 設定 |

## 3. APIエンドポイント一覧

`src/index.js` で `app.use('/todos', todoHandler)` によりマウントされている。

| Method | Path | 説明 | リクエスト | 成功時レスポンス |
|---|---|---|---|---|
| `GET` | `/todos` | TODO 一覧取得。`created_at` 降順。タイトル検索可 | クエリ（任意）: `completed=true\|false`、`q=キーワード` | `200` TODO 配列 |
| `GET` | `/todos/:id` | 単一 TODO 取得 | パス: `id` | `200` TODO オブジェクト / `404` |
| `POST` | `/todos` | TODO 作成 | Body: `{ "title": string }`（必須・空不可） | `201` 作成された TODO / `400` |
| `PATCH` | `/todos/:id` | TODO 更新 | Body: `{ "title"?: string, "completed"?: boolean }`（いずれか必須） | `200` 更新後 TODO / `400` / `404` |
| `DELETE` | `/todos/:id` | TODO 削除 | パス: `id` | `204` / `404` |

補足:

- `q` 未指定（または空文字）のときは検索条件なし。`completed` も未指定なら全件取得
- `q` 指定時は `title ILIKE '%キーワード%'` で部分一致（大文字小文字を区別しない）
- `completed` と `q` は併用可能（`AND`）
- エラー時は概ね `{ "error": "..." }` を返し、想定外例外は `500 Internal server error`
- 静的フロント（`/`）は `public/index.html` が配信される。検索フォームから `GET /todos?q=...` を呼び出す

## 4. DBスキーマ

定義元: `db/migrations/001_create_todos.sql`

### テーブル: `todos`

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `BIGSERIAL` | PRIMARY KEY | TODO ID |
| `title` | `TEXT` | NOT NULL | タイトル |
| `completed` | `BOOLEAN` | NOT NULL, DEFAULT `false` | 完了フラグ |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | 作成日時 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | 更新日時 |

### トリガー

- 関数 `update_updated_at()`: `UPDATE` 時に `NEW.updated_at = NOW()` を設定
- トリガー `todos_updated_at`: `todos` の `BEFORE UPDATE` で上記関数を実行

## 5. 環境変数一覧

定義元: `.env.example`（実運用は `.env` に設定）

| 変数名 | 例 | 用途 | コード上のデフォルト |
|---|---|---|---|
| `DB_HOST` | `localhost` | DB ホスト | `localhost` |
| `DB_PORT` | `5432` | DB ポート | `5432` |
| `DB_NAME` | `todo_db` | データベース名 | `todo_db` |
| `DB_USER` | `todo_user` | DB ユーザー | `todo_user` |
| `DB_PASSWORD` | `todo_password` | DB パスワード | `''`（空文字） |
| `PORT` | `3000` | HTTP サーバの待受ポート | `3000` |

`DB_*` は `src/database/connection.js`、`PORT` は `src/index.js` で参照される。
------------------
