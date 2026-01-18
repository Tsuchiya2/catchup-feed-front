# Catchup Feed Web

<p align="center">
  <strong>AIによる記事要約機能を備えたモダンなRSS/Atomフィードリーダー</strong>
</p>

<p align="center">
  <a href="#機能">機能</a> •
  <a href="#技術スタック">技術スタック</a> •
  <a href="#アーキテクチャ">アーキテクチャ</a> •
  <a href="#セットアップ">セットアップ</a> •
  <a href="#テスト">テスト</a> •
  <a href="#プロジェクト構成">プロジェクト構成</a>
</p>

---

## 概要

**Catchup Feed Frontend** は、[Catchup Feed Backend](https://github.com/Tsuchiya2/catchup-feed-backend) と連携する Next.js フロントエンドアプリケーションです。RSS/Atom フィードの自動収集と AI による記事要約機能を提供します。

本プロジェクトは、クリーンなマイクロサービスアーキテクチャ、包括的なテスト、型安全な API 連携を通じて、モダンなフルスタック開発のベストプラクティスを実践しています。

### 主な特徴

- **マイクロサービスアーキテクチャ**: フロントエンドとバックエンドを分離し、独立したスケーリングとデプロイを実現
- **型安全な開発**: OpenAPI 仕様から生成された API 型による End-to-End の TypeScript 活用
- **モダンな React パターン**: Server Components、TanStack Query、カスタムフック
- **本番環境対応**: 認証、エラーハンドリング、アクセシビリティ対応

---

## 機能

### 認証・セキュリティ
- セキュアなトークン管理による JWT ベースの認証
- ミドルウェアレベルのアクセス制御による保護されたルート
- 自動セッション管理とリダイレクトフロー

### コンテンツ管理
- **ダッシュボード**: 統計概要と最新記事フィード
- **記事一覧**: レスポンシブなカードレイアウトによるページネーション付きリスト
- **記事詳細**: AI 生成要約付きの全文表示
- **ソースカタログ**: 登録済み RSS/Atom フィードソースの閲覧

### ユーザーエクスペリエンス
- レスポンシブデザイン（モバイルファーストアプローチ）
- スケルトンプレースホルダーによるローディング状態
- リトライ機能付きエラーバウンダリ
- 全シナリオに対応した空状態のハンドリング

---

## 技術スタック

| カテゴリ | 技術 | 目的 |
|----------|------|------|
| **フレームワーク** | [Next.js 16](https://nextjs.org/) (App Router) | サーバーサイドレンダリング・ルーティング |
| **言語** | [TypeScript](https://www.typescriptlang.org/) (Strict) | 型安全性 |
| **スタイリング** | [Tailwind CSS 4](https://tailwindcss.com/) | ユーティリティファーストなスタイリング |
| **UIコンポーネント** | [shadcn/ui](https://ui.shadcn.com/) | アクセシブルでカスタマイズ可能なコンポーネント |
| **データ取得** | [TanStack Query 5](https://tanstack.com/query) | サーバー状態管理・キャッシング |
| **フォーム** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | 型安全なバリデーション |
| **テスト** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) | ユニット・統合・E2E テスト |
| **API型** | [openapi-typescript](https://openapi-ts.pages.dev/) | OpenAPI 仕様からの自動生成 |
| **監視** | [Sentry](https://sentry.io/) | エラートラッキング・パフォーマンス監視 |
| **PWA** | [Serwist](https://serwist.pages.dev/) | Service Worker・オフライン対応 |
| **UIカタログ** | [Storybook](https://storybook.js.org/) | コンポーネント開発・ドキュメント |
| **リンティング** | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | コード品質 |

---

## アーキテクチャ

本プロジェクトは**マイクロサービスアーキテクチャ**を採用し、フロントエンドとバックエンドの関心を分離しています。

```
┌─────────────────────────────────────────────────────────────┐
│                 フロントエンド（本リポジトリ）                  │
│                   catchup-feed-frontend                      │
│                        (Next.js)                             │
│                                                              │
│   • サーバーサイドレンダリング (SSR)                           │
│   • JWT 認証                                                 │
│   • 型安全な API クライアント                                  │
│   • デプロイ: Vercel / Cloudflare Pages                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API (OpenAPI)
                            │ JWT Bearer Token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        バックエンド                           │
│            github.com/Tsuchiya2/catchup-feed-backend         │
│                        (Go API)                              │
│                                                              │
│   • 記事・ソース管理                                          │
│   • AI 要約 (Claude / OpenAI)                                │
│   • RSS/Atom フィードクローリング                              │
│   • 通知システム (Discord, Slack)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   └─────────────────┘
```

### API 連携

以下の方法で型安全な API 通信を実現しています：

1. **型の自動生成**: バックエンドの OpenAPI 仕様から API 型を自動生成
2. **カスタム HTTP クライアント**: 自動トークン注入とエラーハンドリングを備えた統一クライアント
3. **ドメイン別エンドポイント**: 認証・記事・ソース用に整理されたエンドポイント関数

---

## セットアップ

### 前提条件

- Docker / Docker Compose
- [Catchup Feed Backend](https://github.com/Tsuchiya2/catchup-feed-backend) が起動済みであること
  - バックエンドの Docker ネットワーク `catchup-feed_backend` が必要

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Tsuchiya2/catchup-feed-frontend.git
cd catchup-feed-frontend

# 環境変数ファイルを作成
cp .env.example .env
```

### 環境変数

主要な環境変数（詳細は `.env.example` を参照）：

```bash
# .env
NEXT_PUBLIC_API_URL=http://app:8080  # Docker ネットワーク経由のバックエンド API URL
```

### 開発サーバーの起動

```bash
# Docker Compose で開発環境を起動
docker compose up -d

# ログを確認
docker compose logs -f web
```

ブラウザで [http://localhost:3001](http://localhost:3001) を開いてください。

> **Note**: ポート 3001 を使用しています（Grafana との競合回避のため）

### その他のコマンド

```bash
# コンテナを停止
docker compose down

# コンテナを再ビルド（依存関係更新時など）
docker compose up -d --build
```

---

## テスト

本プロジェクトは Vitest と Testing Library を使用して包括的なテストカバレッジを維持しています。

```bash
# 全テストを実行
docker compose exec web npm test

# カバレッジレポートを生成
docker compose exec web npm run test:coverage

# E2E テストを実行（Playwright）
docker compose exec web npm run test:e2e
```

### テストカバレッジ

| 領域 | テスト種別 | 内容 |
|------|------------|------|
| コンポーネント | ユニット | UI コンポーネント、フォーム、カード |
| フック | ユニット | カスタム React フック |
| API クライアント | 統合 | HTTP クライアントとエラーハンドリング |
| ユーティリティ | ユニット | 日付フォーマット、トークン管理 |
| ユーザーフロー | E2E | ログイン、記事閲覧、検索 |

---

## プロジェクト構成

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証ルート（ログイン）
│   ├── (legal)/                # 法的ページ（利用規約、プライバシー）
│   ├── (protected)/            # 保護されたルート
│   │   ├── articles/           # 記事ページ
│   │   ├── dashboard/          # ダッシュボード
│   │   └── sources/            # ソースページ
│   └── api/                    # API ルート
├── components/
│   ├── ui/                     # shadcn/ui ベースコンポーネント
│   ├── articles/               # 記事コンポーネント
│   ├── auth/                   # 認証コンポーネント
│   ├── common/                 # 共有コンポーネント
│   ├── dashboard/              # ダッシュボードコンポーネント
│   ├── errors/                 # エラー表示コンポーネント
│   ├── layout/                 # レイアウトコンポーネント
│   ├── search/                 # 検索関連コンポーネント
│   └── sources/                # ソース関連コンポーネント
├── config/                     # アプリケーション設定
├── constants/                  # 定数定義
├── hooks/                      # カスタム React フック
├── lib/
│   ├── api/                    # API クライアント・エンドポイント
│   ├── auth/                   # 認証ユーティリティ
│   ├── observability/          # 監視・ロギング
│   └── security/               # セキュリティ関連
├── providers/                  # コンテキストプロバイダー
├── types/                      # TypeScript 型定義
└── utils/                      # ユーティリティ関数
```

---

## コード品質

### 基準・プラクティス

- **TypeScript Strict Mode**: 暗黙的 any を許容しない完全な型カバレッジ
- **コンポーネントドキュメント**: パブリック API への JSDoc コメント
- **アクセシビリティ**: WCAG 2.1 AA 準拠を目標
- **エラーハンドリング**: 包括的なエラーバウンダリとユーザーフィードバック

### リンティング・フォーマット

```bash
# コード品質をチェック
docker compose exec web npm run lint

# コードをフォーマット
docker compose exec web npm run format
```

### コミット規約

本プロジェクトは自動バージョニングと変更履歴生成のため [Conventional Commits](https://www.conventionalcommits.org/) を使用しています。

| タイプ | 説明 | バージョン影響 |
|--------|------|----------------|
| `feat:` | 新機能 | マイナー (0.x.0) |
| `fix:` | バグ修正 | パッチ (0.0.x) |
| `docs:` | ドキュメントのみ | パッチ |
| `style:` | コードスタイル（フォーマット） | リリースなし |
| `refactor:` | コードリファクタリング | パッチ |
| `perf:` | パフォーマンス改善 | パッチ |
| `test:` | テスト追加 | リリースなし |
| `chore:` | メンテナンスタスク | リリースなし |
| `ci:` | CI/CD 変更 | リリースなし |

**破壊的変更**: メジャーバージョンアップには、コミット本文に `BREAKING CHANGE:` を追加するか、タイプの後に `!` を付けます（例：`feat!:`）。

**例**:
```bash
feat: add article bookmarking
fix: resolve authentication redirect loop
feat!: redesign API response format
```

---

## API エンドポイント

| エンドポイント | メソッド | 認証 | 説明 |
|----------------|----------|------|------|
| `/auth/token` | POST | 不要 | JWT トークンの取得 |
| `/articles` | GET | 必要 | 記事一覧（ページネーション） |
| `/articles/{id}` | GET | 必要 | AI 要約付き記事詳細 |
| `/sources` | GET | 必要 | フィードソース一覧 |
| `/sources/{id}` | GET | 必要 | ソース詳細 |
| `/health` | GET | 不要 | ヘルスチェック |

---

## ロードマップ

### 実装済み機能

- [x] ダークモード切り替え（next-themes）
- [x] PWA 対応（Serwist）
- [x] トークンリフレッシュ機構
- [x] Playwright による E2E テスト
- [x] 記事・ソース検索機能

### 予定している機能

- [ ] 記事ブックマーク
- [ ] ユーザー設定画面
- [ ] RSS フィード購読管理
- [ ] カスタム通知設定

---

## 本番環境

### デモサイト

本プロジェクトは実際に稼働しているサービスです。

| 環境 | URL |
|------|-----|
| **フロントエンド** | [pulse.catchup-feed.com](https://pulse.catchup-feed.com) |
| **バックエンド API** | [catchup.catchup-feed.com](https://catchup.catchup-feed.com) |

### インフラ構成

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         catchup-feed.com                                 │
│                      (Cloudflare DNS Zone)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────┐         ┌───────────────────────┐            │
│  │pulse.catchup-feed.com │         │catchup.catchup-feed.com│            │
│  │       (CNAME)         │         │       (CNAME)          │            │
│  │          ↓            │         │          ↓             │            │
│  │    Vercel Edge        │         │   Cloudflare Tunnel    │            │
│  │    (Next.js SSR)      │         │          ↓             │            │
│  │                       │         │    Raspberry Pi 5      │            │
│  │ catchup-feed-frontend │←───────→│ catchup-feed-backend   │            │
│  │      (Frontend)       │   API   │   (Go API + Claude)    │            │
│  └───────────────────────┘         └───────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 技術的なポイント

| 項目 | 内容 |
|------|------|
| **フロントエンド** | Vercel Edge Network によるグローバル CDN 配信 |
| **バックエンド** | Cloudflare Tunnel による Raspberry Pi 5 のセキュアな公開 |
| **CI/CD** | GitHub Actions + Vercel による自動デプロイ |
| **SSL/TLS** | 自動証明書管理（Vercel / Cloudflare） |

### サブドメイン命名について

`pulse.catchup-feed.com` という名前は、「情報の鼓動（Pulse）」をコンセプトに選定しました。RSS フィードから収集される最新情報のリアルタイムな流れを表現しています。

---

## 関連プロジェクト

- **[Catchup Feed Backend](https://github.com/Tsuchiya2/catchup-feed-backend)** - フィード収集と AI 要約のための Go バックエンド API

---

## ドキュメント

| ドキュメント | 説明 |
|--------------|------|
| [製品要件](./docs/product-requirements.md) | プロジェクトの要件と仕様 |
| [機能設計](./docs/functional-design.md) | 機能の詳細設計 |
| [アーキテクチャ](./docs/architecture.md) | システム構成と設計思想 |
| [開発ガイドライン](./docs/development-guidelines.md) | コーディング規約とベストプラクティス |
| [リポジトリ構造](./docs/repository-structure.md) | ディレクトリ構成の説明 |
| [用語集](./docs/glossary.md) | プロジェクト固有の用語定義 |

---

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照してください。

---

<p align="center">
  Next.js、TypeScript、Tailwind CSS で構築
</p>
