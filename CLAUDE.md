# Cổng VHKD — trang cổng

Kho `karofisale/VHKD`. Chạy tại `https://karofisale.github.io/VHKD/`.

Một file `index.html` tĩnh, không build, không dependency. Push lên `main` là
GitHub Pages phục vụ ngay — **không có bước build nào**, nên sửa file là đúng
thứ người dùng sẽ thấy.

Đây **không phải** Karofi ID. Karofi ID là dự án Apps Script cấp token, nằm ở
`D:\Operation\Claude\Projects\Karofi-ID`. Cổng này chỉ gọi vào đó
(`KAROFI_ID_API` trong `index.html`).

## Hai chỗ giữ danh sách của cả hệ — sửa app là phải sửa ở đây

**`APP_SESSION_KEYS` + `OEM_CACHE_DB`** trong `clearAllAppSessions()`. Đây là
nơi DUY NHẤT biết đủ khoá lưu trữ của cả bốn bề mặt. Xoá mỗi `karofi.session` là
**chưa** đăng xuất: cả ba client đều có đường lùi lấy phiên riêng trong
localStorage, và cả ba backend còn chấp nhận token cũ trong CacheService thêm 6
giờ — nên trên máy dùng chung, người sau mở `/OEM/` là vào thẳng phiên người
trước.

Hàm này được gọi ở **cả ba đường ra**: nút Đăng xuất, hết hạn theo đồng hồ, và
token bị server từ chối. Đường thứ ba quan trọng nhất — sau khi xoay
`KAROFI_ID_SECRET`, mọi token cũ bị từ chối, và nếu phiên riêng vẫn sống thì
việc thu hồi không có tác dụng gì.

Cố ý **không** xoá `exportops_theme` và `exportops_showLineImg`: đó là tuỳ chọn
hiển thị của máy, không phải danh tính.

**`APPS`** — danh sách thẻ ứng dụng. Trùng với `CAC_APP_` bên FC/OEM và
`KAROFI_CAC_APP_` bên Export. Thêm app mới phải sửa cả bốn chỗ.

## manifest

`manifest.webmanifest` có `"scope": "/"` chứ không phải `/VHKD/` — cố ý, để khi
cài về màn hình chính thì mở app con vẫn ở chế độ standalone. Ba app đều trỏ về
đúng file manifest này. Đổi `scope` là ba app rơi ra khỏi cửa sổ đã cài.

## Bảng màu

`#00A0E9` (cyan, mảng màu và viền) + `#004E89` (navy, **chữ** màu nhấn trên nền
trắng). Chữ cyan trên nền trắng chỉ đạt 2,91:1 — không đạt. Đây là cặp màu chuẩn
mà FC và Export đã đồng bộ theo.

## Cơ chế thử lại

Khối gọi API chép nguyên cơ chế của OEM: phản hồi không có khoá `result` bị coi
là hỏng và thử lại. Lý do là đường mạng tới `script.google.com` thỉnh thoảng trả
HTML thay vì JSON — đang được đo ở
`D:\Operation\Claude\Projects\Do-Duong-Mang`.
