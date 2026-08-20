# VHKD — Trung Tâm Vận Hành Karofi

Dashboard nội bộ cho Phòng Vận hành Kinh doanh (Karofi): liệt kê các nhóm công việc, kỹ năng Cowork và công cụ tự xây bằng Claude Code. Mỗi thẻ có nút "Sử dụng" để nhập tham số và copy câu lệnh tiếng Việt, sẵn sàng dán vào Cowork.

File duy nhất là [`index.html`](./index.html) — trang dashboard, tự chứa (không gọi API/CDN ngoài), chạy được bằng cách mở trực tiếp trong trình duyệt hoặc host qua GitHub Pages tại `https://karofisale.github.io/VHKD/`.

## Repo này thay cho repo cũ `caotienhai/VHKD`

Hệ thống đã chuyển từ tài khoản Gmail cá nhân sang tài khoản công ty (xem [[project-migrate-workspace]] trong ghi chú nội bộ). Sau khi chuyển:

- **Dashboard** (file này) → `karofisale/VHKD` → https://karofisale.github.io/VHKD/
- **App báo giá PI + Shipment Tracking + Hướng dẫn sử dụng** → repo riêng `karofisale/export` → https://karofisale.github.io/export/
- Repo cũ `caotienhai/VHKD` chỉ còn 3 trang chuyển hướng (meta-refresh) cho ai đã bookmark link cũ.

Vì app không còn nằm cùng thư mục với dashboard nữa, 2 thẻ trỏ sang app đã đổi sang **URL tuyệt đối**:

| Thẻ | Trỏ tới |
|---|---|
| Export Ops Hub — Báo giá PI | `https://karofisale.github.io/export/pi-app.html` |
| Update data lịch trình (Shipment Tracking) | `https://karofisale.github.io/export/shipment-tracking.html` |

Khi đổi 2 đường dẫn này, sửa trong mảng `GROUPS` (xem mục dưới) — không còn đường dẫn tương đối nào giữa 2 repo.

## Lưu ý bảo mật

`index.html` có nhắc tới **đường dẫn nội bộ trên máy** (VD `D:\Operation\Claude\Projects\Cong-cu-Gia-thanh-BOM\...`) cho công cụ tra giá thành BOM — công cụ này chạy cục bộ, không đưa vào repo. Không có API key/OAuth ID nào trong file này (file `shipment-tracking.html` chứa các giá trị đó nằm ở repo `karofisale/export`, không phải repo này).

## Đưa lên GitHub Pages

```bash
git push -u origin main
```

Sau đó vào GitHub → repo **VHKD** → **Settings → Pages** → nguồn **Deploy from a branch**, branch `main`, thư mục `/ (root)`.

## Cập nhật dashboard sau này

Toàn bộ cấu trúc nhóm/tab/kỹ năng/công cụ nằm trong biến `GROUPS` ở đầu thẻ `<script>` trong `index.html` (có comment đánh dấu). Sửa trực tiếp mảng này rồi commit + push là cập nhật xong cho mọi người.

Người dùng cũng có thể tự thêm nhanh một mục ngay trên trang bằng nút **"+ Thêm kỹ năng / công cụ"** — nhưng mục đó chỉ lưu trong `localStorage` của trình duyệt đang dùng, không xuất hiện cho người khác cho tới khi được thêm thủ công vào `GROUPS` và push lại.
