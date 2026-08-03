# CLAUDE.md

## プロジェクト概要

Claude Code 研修用の TODO 管理アプリ。
Express + PostgreSQL で API を提供し、`public/index.html` の静的 UI から操作する。
一覧は `GET /todos?q=キーワード` でタイトル部分一致検索（`ILIKE`・大文字小文字非区別）に対応する。

- エントリポイント: `src/index.js`
- 起動: `npm start`（開発時は `npm run dev`）
- テスト: `npm test`（Jest + supertest）
- 詳細設計: `docs/architecture.md`

## ファイル構成

```
inherited-todo/
├── .env.example
├── package.json
├── jest.config.js
├── __tests__/todo-handler.test.js
├── db/migrations/001_create_todos.sql
├── docs/architecture.md
├── docs/tasklog.md
├── public/index.html
└── src/
    ├── index.js                 # Express 起動・ミドルウェア・ルートマウント
    ├── api/todo-handler.js      # /todos CRUD・検索（q）
    └── database/connection.js   # pg.Pool
```

## コーディング規約

- CommonJS（`require` / `module.exports`）。ESM は使わない
- ルートは `express.Router` に定義し、`src/index.js` でマウントする
- DB アクセスは `src/database/connection.js` のプール経由。ハンドラ内で直接 `Pool` を作らない
- SQL はパラメータバインド（`$1`, `$2`…）を使い、文字列連結しない
- 一覧のクエリ `q` は変数名衝突を避けるため、コード内では `keyword` 等の別名で扱う
- タイトル検索は `ILIKE`（または同等の大文字小文字非区別な部分一致）
- API レスポンスは JSON。エラーは `{ error: string }`
- HTTP ステータス: 成功 200 / 作成 201 / 削除 204 / バリデーション 400 / 未検出 404 / 例外 500
- 環境変数は `.env`（雛形は `.env.example`）。接続情報をコードにハードコードしない
- テストは `**/__tests__/**/*.test.js`。カバレッジ閾値は `jest.config.js` に従う
