/**
 * Nhận điểm ẩn danh từ app "Bồ Câu & Sóc Nâu" và ghi vào Google Sheets.
 * Cách dùng: xem HUONG-DAN.md (mục 3).
 */
const SHEET_NAME = 'KetQua';
const HEADERS = ['Thời gian', 'Mã thiết bị (ẩn danh)', 'Lượt chơi', 'Điểm /10', 'Giây làm bài',
  'C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }

  // Trang thống kê tự cập nhật
  let st = ss.getSheetByName('ThongKe') || ss.insertSheet('ThongKe');
  st.clear();
  st.getRange('A1:B1').setValues([['Chỉ số', 'Giá trị']]).setFontWeight('bold');
  st.getRange('A2:B6').setFormulas([
    ['Tổng số lượt chơi', "=COUNTA(KetQua!A2:A)"],
    ['Số thiết bị tham gia', "=IFERROR(COUNTA(UNIQUE(KetQua!B2:B)),0)"],
    ['Điểm trung bình', "=IFERROR(ROUND(AVERAGE(KetQua!D2:D),2),0)"],
    ['Số lượt đạt 8–10 điểm', "=COUNTIF(KetQua!D2:D,\">=8\")"],
    ['Số lượt dưới 5 điểm', "=COUNTIF(KetQua!D2:D,\"<5\")"],
  ]);
  st.getRange('A8:C8').setValues([['Câu', 'Chương', '% trả lời đúng']]).setFontWeight('bold');
  const chap = [1,1,2,2,3,3,4,4,5,5];
  const cols = ['F','G','H','I','J','K','L','M','N','O'];
  for (let i = 0; i < 10; i++) {
    st.getRange(9 + i, 1, 1, 3).setFormulas([[
      'Câu ' + (i + 1), chap[i],
      '=IFERROR(ROUND(100*SUM(KetQua!' + cols[i] + '2:' + cols[i] + ')/COUNT(KetQua!' + cols[i] + '2:' + cols[i] + '),0)&"%","")'
    ]]);
  }
  st.autoResizeColumns(1, 3);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.app !== 'bcsn') return out({ ok: false });
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const ans = (d.ans || []).slice(0, 10);
    while (ans.length < 10) ans.push('');
    sh.appendRow([new Date(), String(d.dev || '').slice(0, 12), Number(d.attempt) || '', Number(d.score) || 0, Number(d.sec) || ''].concat(ans));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, app: 'bcsn' }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
