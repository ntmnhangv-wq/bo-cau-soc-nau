# App Bồ Câu & Sóc Nâu – Hướng dẫn

## 1. Cấu trúc
- `public/` – toàn bộ app (HTML/CSS/JS thuần, không cần build). Đây là thư mục đưa lên Vercel.
- `public/audio/` – audio. Đã có `en-1.mp3 … en-5.mp3`. **Cần thêm `vi-1.mp3 … vi-5.mp3`** (tiếng Việt, theo thứ tự chương 1→5).
- `public/config.js` – dán địa chỉ Google Apps Script vào `SHEETS_URL` để gom điểm.
- `apps-script/Code.gs` – mã nhận điểm ẩn danh.
- `vercel.json` – cấu hình cache.

## 2. Đưa lên Vercel
1. Đẩy thư mục này lên GitHub (hoặc kéo thả vào Vercel).
2. Vercel → Add New Project → chọn repo. **Framework: Other. Output Directory: `public`. Build Command: để trống.**
3. Deploy xong gửi link/QR cho học sinh. Mở bằng điện thoại → “Thêm vào Màn hình chính” để dùng như app.
> Khi sửa nội dung, đổi `VERSION` trong `public/sw.js` (ví dụ `v2`) để máy học sinh nhận bản mới.

## 3. Gom điểm ẩn danh về Google Sheets (tùy chọn)
1. Tạo Google Sheet mới → Tiện ích mở rộng → Apps Script → dán `apps-script/Code.gs`.
2. Chạy hàm `setup` một lần (cấp quyền) → sinh sheet `KetQua` và `ThongKe`.
3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web → *Thực thi với tư cách: Tôi; Người có quyền truy cập: Bất kỳ ai* → sao chép URL `/exec`.
4. Dán URL vào `public/config.js` (`SHEETS_URL`) → deploy lại.
5. Chỉ ghi: mã thiết bị ngẫu nhiên, lượt chơi, điểm, đúng/sai từng câu, số giây, lượt truy cập, số sao đánh giá (mỗi máy 1 đánh giá, được đổi). **Không có tên học sinh.**
6. Sheet có thêm trang `LuotTruyCap`, `DanhGia`; trang `ThongKe` tổng hợp. Footer app hiện số lượt truy cập và điểm sao trung bình.
7. **Khi sửa mã Apps Script:** Triển khai → Quản lý bản triển khai → ✏️ → Phiên bản: *Phiên bản mới* → Triển khai (link `/exec` giữ nguyên).

## 4. Thêm audio tiếng Việt sau
Chép 5 file vào `public/audio/` đặt tên `vi-1.mp3` … `vi-5.mp3` rồi deploy lại. Chưa có file thì nút “Việt” báo chưa tải được và gợi ý nghe trên Drive.
