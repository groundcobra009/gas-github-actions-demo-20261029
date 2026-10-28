/**
 * GitHub Actions + clasp デプロイ確認用のサンプル。
 * 中身はダミーの売上データ。
 */

const SAMPLE_SALES = [
  { date: '2026-10-01', item: 'りんご', qty: 12, price: 150 },
  { date: '2026-10-01', item: 'みかん', qty: 30, price: 80 },
  { date: '2026-10-02', item: 'バナナ', qty: 18, price: 100 },
  { date: '2026-10-03', item: 'りんご', qty: 9, price: 150 },
  { date: '2026-10-03', item: 'ぶどう', qty: 4, price: 600 },
  { date: '2026-10-04', item: 'みかん', qty: 25, price: 80 },
];

/** 品目ごとの数量・売上合計を返す */
function summarizeSales(rows) {
  const byItem = {};
  rows.forEach(function (r) {
    if (!byItem[r.item]) byItem[r.item] = { item: r.item, qty: 0, amount: 0 };
    byItem[r.item].qty += r.qty;
    byItem[r.item].amount += r.qty * r.price;
  });
  return Object.keys(byItem).map(function (k) { return byItem[k]; });
}

/** エディタから実行してログで確認する用 */
function helloFromGitHubActions() {
  const summary = summarizeSales(SAMPLE_SALES);
  Logger.log('Deployed via GitHub Actions + clasp');
  Logger.log(JSON.stringify(summary, null, 2));
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
    return ContentService.createTextOutput(JSON.stringify({ deployedAt: BUILD_INFO.deployedAt, summary: summary }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const t = HtmlService.createTemplateFromFile('index');
  t.summary = summary;
  t.buildInfo = BUILD_INFO;
  return t.evaluate().setTitle('GAS sample');
}
