// ===== 変更メモ =====
// 2026年10月29日 10時09分、TBS内で書いた。
// v3: バージョン表記を更新し、サンプルに「今日のおすすめ」（売上トップの品目）を追加。
// ====================

// ===== GitHub Actions + clasp デプロイ：うまくいったときのメモ（2026-10-29） =====
// ・流れ: src/ を push → Actions「Deploy GAS with clasp」→ clasp push --force → clasp deploy
// ・認証: ローカルで clasp login → ~/.clasprc.json を base64 にしてシークレット CLASPRC_JSON_BASE64 に登録
//     コピーは `base64 -i ~/.clasprc.json | tr -d '\n' | pbcopy` が確実（画面から手で選ぶと余計な行が混ざって失敗した）
//     値は ewog... で始まる長い1行。名前やコマンドの文字は入れない
// ・つまずき1: ジョブが起動しない → GitHub の Billing（支払い/Spending limit）が原因。直したら動いた
// ・つまずき2: "base64 で使わない文字" エラー → シークレットに余計な文字が混ざっていた。上のコマンドで入れ直して解決
// ・事前準備: https://script.google.com/home/usersettings で Apps Script API をオン
// ・Web アプリの URL を固定したいときはシークレット DEPLOYMENT_ID に既存デプロイ ID を入れる（無ければ毎回新規デプロイ）
// ・.clasprc.json の中身（リフレッシュトークン）は絶対にコミット・共有しない
// ===================================================================================

/**
 * GitHub Actions + clasp デプロイ確認用のサンプル。
 * 中身はダミーの売上データ。
 */

// 画面と JSON に出すので、デプロイで差し替わったかひと目でわかる
const APP_VERSION = 'v3（10/29 10:09 TBS内で書いた版）';

const SAMPLE_SALES = [
  { date: '2026-10-01', item: 'りんご', qty: 12, price: 150 },
  { date: '2026-10-01', item: 'みかん', qty: 30, price: 80 },
  { date: '2026-10-02', item: 'バナナ', qty: 18, price: 100 },
  { date: '2026-10-03', item: 'りんご', qty: 9, price: 150 },
  { date: '2026-10-03', item: 'ぶどう', qty: 4, price: 600 },
  { date: '2026-10-04', item: 'みかん', qty: 25, price: 80 },
  { date: '2026-10-05', item: '柿', qty: 15, price: 120 },
  { date: '2026-10-05', item: 'ぶどう', qty: 3, price: 600 },
  { date: '2026-10-06', item: '梨', qty: 10, price: 250 },
];

/** 品目ごとの数量・売上合計を返す */
function summarizeSales(rows) {
  const byItem = {};
  rows.forEach(function (r) {
    if (!byItem[r.item]) byItem[r.item] = { item: r.item, qty: 0, amount: 0 };
    byItem[r.item].qty += r.qty;
    byItem[r.item].amount += r.qty * r.price;
  });
  return Object.keys(byItem).map(function (k) { return byItem[k]; })
    .sort(function (a, b) { return b.amount - a.amount; });
}

/** 売上トップの品目を「今日のおすすめ」として返す */
function todaysPick(summary) {
  const top = summary[0];
  return top ? top.item + '（売上 ' + top.amount.toLocaleString() + ' 円）' : 'なし';
}

/** 全体の売上合計 */
function totalAmount(summary) {
  return summary.reduce(function (sum, r) { return sum + r.amount; }, 0);
}

/** エディタから実行してログで確認する用 */
function helloFromGitHubActions() {
  const summary = summarizeSales(SAMPLE_SALES);
  Logger.log('Deployed via GitHub Actions + clasp: ' + APP_VERSION + ' / commit ' + BUILD_INFO.commit);
  Logger.log(JSON.stringify(summary, null, 2));
  Logger.log('合計: ' + totalAmount(summary) + ' 円');
  Logger.log('今日のおすすめ: ' + todaysPick(summary));
  return summary;
}

/** サンプルデータを新しいスプレッドシートに書き出す（初回は権限承認が必要） */
function writeSampleToSpreadsheet() {
  const ss = SpreadsheetApp.create('GAS sample data ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'));
  const sheet = ss.getActiveSheet();
  const values = [['日付', '品目', '数量', '単価', '金額']].concat(
    SAMPLE_SALES.map(function (r) { return [r.date, r.item, r.qty, r.price, r.qty * r.price]; })
  );
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  Logger.log(ss.getUrl());
  return ss.getUrl();
}

/** Web アプリとして開いたときの表示。?format=json で JSON を返す */
function doGet(e) {
  const summary = summarizeSales(SAMPLE_SALES);
  if (e && e.parameter && e.parameter.format === 'json') {
    return ContentService.createTextOutput(JSON.stringify({
      version: APP_VERSION,
      commit: BUILD_INFO.commit,
      deployedAt: BUILD_INFO.deployedAt,
      total: totalAmount(summary),
      pick: todaysPick(summary),
      summary: summary,
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const t = HtmlService.createTemplateFromFile('index');
  t.summary = summary;
  t.total = totalAmount(summary);
  t.pick = todaysPick(summary);
  t.version = APP_VERSION;
  t.buildInfo = BUILD_INFO;
  return t.evaluate().setTitle('GAS sample');
}
