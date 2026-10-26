/**
 * App "Bồ Câu & Sóc Nâu" – nhận điểm thử thách, lượt truy cập, đánh giá sao (ẩn danh).
 * Cách dùng: xem HUONG-DAN.md (mục 3). Sau khi dán mã mới nhớ: Triển khai → Quản lý bản triển khai → ✏️ → Phiên bản mới → Triển khai.
 */
const SCORE = 'KetQua', VISIT = 'LuotTruyCap', RATE = 'DanhGia';
const SCORE_H = ['Thời gian', 'Mã thiết bị (ẩn danh)', 'Lượt chơi', 'Điểm /10', 'Giây làm bài', 'C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];
const VISIT_H = ['Thời gian', 'Mã thiết bị (ẩn danh)'];
const RATE_H = ['Cập nhật lúc', 'Mã thiết bị (ẩn danh)', 'Số sao'];

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}

/** Chạy một lần để tạo các trang tính và trang thống kê. */
function setup() {
  sheet_(SCORE, SCORE_H); sheet_(VISIT, VISIT_H); sheet_(RATE, RATE_H);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const st = ss.getSheetByName('ThongKe') || ss.insertSheet('ThongKe');
  st.clear();
  st.getRange('A1:B1').setValues([['Chỉ số', 'Giá trị']]).setFontWeight('bold');
  st.getRange('A2:B9').setFormulas([
    ['Tổng lượt truy cập', '=COUNTA(LuotTruyCap!A2:A)'],
    ['Số thiết bị truy cập', '=IFERROR(COUNTA(UNIQUE(LuotTruyCap!B2:B)),0)'],
    ['Số lượt đánh giá', '=COUNTA(DanhGia!C2:C)'],
    ['Điểm đánh giá trung bình (sao)', '=IFERROR(ROUND(AVERAGE(DanhGia!C2:C),2),0)'],
    ['Tổng số lượt chơi thử thách', '=COUNTA(KetQua!A2:A)'],
    ['Điểm thử thách trung bình', '=IFERROR(ROUND(AVERAGE(KetQua!D2:D),2),0)'],
    ['Số lượt đạt 8–10 điểm', '=COUNTIF(KetQua!D2:D,">=8")'],
    ['Số lượt dưới 5 điểm', '=COUNTIF(KetQua!D2:D,"<5")'],
  ]);
  st.getRange('A11:C11').setValues([['Câu', 'Chương', '% trả lời đúng']]).setFontWeight('bold');
  const chap = [1,1,2,2,3,3,4,4,5,5], cols = ['F','G','H','I','J','K','L','M','N','O'];
  for (let i = 0; i < 10; i++) {
    st.getRange(12 + i, 1, 1, 3).setFormulas([[
      'Câu ' + (i + 1), chap[i],
      '=IFERROR(ROUND(100*SUM(KetQua!' + cols[i] + '2:' + cols[i] + ')/COUNT(KetQua!' + cols[i] + '2:' + cols[i] + '),0)&"%","")'
    ]]);
  }
  st.autoResizeColumns(1, 3);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents);
    if (d.app !== 'bcsn') return out_({ ok: false });
    const dev = String(d.dev || '').slice(0, 12);

    if (d.type === 'visit') {
      sheet_(VISIT, VISIT_H).appendRow([new Date(), dev]);
    } else if (d.type === 'rating') {
      const stars = Math.min(5, Math.max(1, Number(d.stars) || 0));
      if (!stars) return out_({ ok: false });
      const sh = sheet_(RATE, RATE_H);
      const n = sh.getLastRow();
      let row = 0;
      if (n > 1) { const ids = sh.getRange(2, 2, n - 1, 1).getValues(); for (let i = 0; i < ids.length; i++) if (ids[i][0] === dev) { row = i + 2; break; } }
      if (row) sh.getRange(row, 1, 1, 3).setValues([[new Date(), dev, stars]]); else sh.appendRow([new Date(), dev, stars]);
    } else { // điểm thử thách
      const ans = (d.ans || []).slice(0, 10); while (ans.length < 10) ans.push('');
      sheet_(SCORE, SCORE_H).appendRow([new Date(), dev, Number(d.attempt) || '', Number(d.score) || 0, Number(d.sec) || ''].concat(ans));
    }
    CacheService.getScriptCache().remove('stats');
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally { try { lock.releaseLock(); } catch (x) {} }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'stats') {
    const cache = CacheService.getScriptCache();
    const hit = cache.get('stats');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const v = sheet_(VISIT, VISIT_H), r = sheet_(RATE, RATE_H);
    const vn = Math.max(0, v.getLastRow() - 1), rn = Math.max(0, r.getLastRow() - 1);
    let sum = 0;
    if (rn) r.getRange(2, 3, rn, 1).getValues().forEach(function (x) { sum += Number(x[0]) || 0; });
    const res = JSON.stringify({ ok: true, visits: vn, ratingCount: rn, ratingAvg: rn ? Math.round((sum / rn) * 10) / 10 : 0 });
    cache.put('stats', res, 30);
    return ContentService.createTextOutput(res).setMimeType(ContentService.MimeType.JSON);
  }
  return out_({ ok: true, app: 'bcsn' });
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
