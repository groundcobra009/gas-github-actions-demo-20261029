# gas-github-actions-demo

Google Apps Script のサンプルを GitHub Actions + clasp でデプロイするデモ。

- スクリプト ID: `1eIFguU9yeOIXYxoRRaQkDHeabnAuUXmb2YVlhrgiL8AhnxJ5-XLIB6hc`（`.clasp.json`）
- GAS のソース: `src/`
- ワークフロー: `.github/workflows/deploy-gas.yml`

## 中身

| ファイル | 内容 |
|---|---|
| `src/Code.js` | ダミーの売上データと集計関数。`helloFromGitHubActions()` はログ出力、`writeSampleToSpreadsheet()` はスプレッドシートに書き出し、`doGet()` は Web アプリ |
| `src/BuildInfo.js` | デプロイ時に Actions がコミット SHA と日時を書き込む |
| `src/index.html` | Web アプリの画面 |
| `src/appsscript.json` | マニフェスト（Asia/Tokyo・V8・Web アプリは自分だけアクセス可） |

## デプロイの流れ

`main` か `claude/**` ブランチに `src/` などの変更が push されると、または Actions 画面から手動実行（workflow_dispatch）すると:

1. シークレットから `~/.clasprc.json` を復元
2. `src/BuildInfo.js` にコミットと日時を書き込む
3. `clasp push --force`
4. `clasp deploy`（`DEPLOYMENT_ID` シークレットがあればそのデプロイを更新、なければ新規作成）

## 必要なシークレット

| 名前 | 必須 | 中身 |
|---|---|---|
| `CLASPRC_JSON` | ○ | ローカルで `clasp login` した後の `~/.clasprc.json` の中身全体 |
| `DEPLOYMENT_ID` | 任意 | 更新し続けたい既存デプロイの ID（`AKfycb...`）。Web アプリの URL を固定したいとき |

`CLASPRC_JSON` が無い場合は `CLASPRC` / `CLASP_CREDENTIALS` / `CLASP_TOKEN` の名前も順に見る。

Google アカウント側で Apps Script API をオンにしておくこと: <https://script.google.com/home/usersettings>
