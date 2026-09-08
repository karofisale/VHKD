# Cổng VHKD — trang cổng

Kho `karofisale/VHKD`. Chạy tại `https://karofisale.github.io/VHKD/`.

Một file `index.html` tĩnh, không build, không dependency. Push lên `main` là
GitHub Pages phục vụ ngay — **không có bước build nào**, nên sửa file là đúng
thứ người dùng sẽ thấy.

Đây **không phải** Karofi ID. Karofi ID là dự án Apps Script cấp token, nằm ở
`D:\Operation\Claude\Projects\Karofi-ID`. Cổng này chỉ gọi vào đó
(`KAROFI_ID_API` trong `index.html`).

## Khối SINH TỰ ĐỘNG — đừng sửa tay

Đoạn giữa hai mốc `/* ===== LỚP PHIÊN DÙNG CHUNG — SINH TỰ ĐỘNG ... */` do
`Karofi-ID/tools/dong-bo-lop-phien.mjs` ghi ra. Nó chứa `KAROFI_APPS` (danh
sách thẻ app, kèm trường `api` = URL `/exec` của backend từng app),
`KAROFI_APP_SESSION_KEYS` và `KAROFI_OEM_CACHE_DB`.

**Sửa ba danh sách đó ở `Karofi-ID/web/karofi-apps.js`** rồi chạy:

```bash
cd "D:/Operation/Claude/Projects/Karofi-ID" && node tools/dong-bo-lop-phien.mjs --ghi
```

Sửa trực tiếp ở đây thì lần đồng bộ sau ghi đè, và `test/lop-phien.test.js`
bên Karofi ID đỏ trước đó.

## Vì sao danh sách khoá phiên quan trọng

`KAROFI_APP_SESSION_KEYS` + `KAROFI_OEM_CACHE_DB` trong `clearAllAppSessions()`
là nơi DUY NHẤT biết đủ khoá lưu trữ của cả bốn bề mặt. Xoá mỗi
`karofi.session` là **chưa** đăng xuất: cả ba client đều có đường lùi lấy phiên
riêng trong localStorage, và cả ba backend còn chấp nhận token cũ trong
CacheService thêm 6 giờ — nên trên máy dùng chung, người sau mở `/OEM/` là vào
thẳng phiên người trước.

Hàm này được gọi ở **cả ba đường ra**: nút Đăng xuất, hết hạn theo đồng hồ, và
token bị server từ chối. Đường thứ ba quan trọng nhất — sau khi xoay
`KAROFI_ID_SECRET`, mọi token cũ bị từ chối, và nếu phiên riêng vẫn sống thì
việc thu hồi không có tác dụng gì.

Cố ý **không** xoá `exportops_theme` và `exportops_showLineImg`: đó là tuỳ chọn
hiển thị của máy, không phải danh tính.

## Hai trang trong một

Mặc định mở cổng là **trang tổng quan** (thẻ app + số liệu). Cột danh mục là
**ngăn kéo** — nút ba gạch ở thanh trên cùng mới mở. Chọn một nhóm công việc
trong ngăn kéo thì trang chuyển sang **danh mục** và nó THAY THẾ trang tổng
quan; quay lại bằng mục "Tổng quan" ở đầu ngăn kéo.

`window.KID_VIEW` (`"tongquan"` | `"danhmuc"`) là cầu nối giữa hai IIFE — khối
dashboard và khối Karofi ID không dùng chung phạm vi. Trạng thái **không** lưu
localStorage: mở cổng ra là để xem số, nên mặc định phải luôn là trang tổng
quan chứ không phải nhóm công việc lần trước.

Ngăn kéo dùng `position: fixed` + `translateX`, KHÔNG dùng `display: none`: nó
trượt ra đè lên nội dung nên mở/đóng không đẩy lệch bố cục bên phải — nếu đẩy
thì lưới số liệu tính lại số cột mỗi lần bấm nút.

`veTrangDanhMuc()` tự chặn khi `body.kid-limited`: người rút gọn quyền không có
nút mở ngăn kéo, nhưng CSS chỉ ẩn hiển thị nên cần một lớp chặn ở JS.

**Media query khổ nhỏ phải nằm SAU quy tắc gốc mà nó ghi đè.** Bản cũ đặt
`.kid-apps { padding: 18px 16px 20px }` trong media query ở ĐẦU file, còn quy
tắc gốc `padding: 20px 28px 22px` viết sau đó — cùng độ ưu tiên, quy tắc sau
thắng, nên đệm khổ nhỏ chưa bao giờ có tác dụng. Lỗi chỉ lộ ra khi khối số liệu
ra đời và hai lưới lệch nhau 12px.

## Số liệu tổng quan

Khối `.kid-sum` gọi **thẳng backend của từng app**, không qua Karofi ID:

| Tấm | Endpoint | Yêu cầu | Phản hồi |
|---|---|---|---|
| Sale Forecast | `getPortalStats` | `{action, token}` | object thẳng / `{error}` |
| OEM Portal | `getPortalStats` | `{fn, args:[token]}` | `{result}` / `{error}` |
| Export Hub | `api_portalStats` | `{fn, args:[token]}` | `{ok:true,…}` / `{ok:false,error}` |

Ba hợp đồng khác nhau; `SUM_APP` là chỗ DUY NHẤT trong file biết sự khác nhau
đó. Đừng "chuẩn hoá" bằng cách sửa ba backend cho giống nhau — hợp đồng của
chúng đang được ba client khác dùng.

Ba lượt gọi **song song và độc lập**: app chậm chỉ làm tấm của nó hiện muộn,
app lỗi chỉ làm tấm của nó báo lỗi. Đừng gộp thành `Promise.all` — backend OEM
có lúc mất 10-30 giây, và chờ cả ba là để cả khối trống suốt thời gian đó.

Cổng **không** có luật phân quyền nào của riêng nó: mỗi backend tự ép phạm vi
theo token. Lọc theo `s.user.apps` chỉ để không gọi vô ích.

**Số cột CỐ ĐỊNH bằng số app của hệ, không `auto-fit`.** `auto-fit` gộp các
track rỗng lại, nên người chỉ được cấp một app thấy một thẻ rộng bằng cả trang
(đo được 1344px ở khổ 1400px). Cột cố định thì thẻ luôn rộng đúng một phần ba,
dù người đó có một, hai hay ba app.

`--kid-so-app` và `--kid-luoi-gap` là **một nguồn cho cả hai lưới** —
`init()` đặt `--kid-so-app` từ `KAROFI_APPS.length` nên thêm app thứ tư không
phải sửa CSS. Hai lưới bắt buộc dùng chung hai biến đó (khai một lần ở
`.kid-app-grid, .kid-sum-grid`), và hai section phải cùng đệm ngang.

Số **THẺ** thì theo quyền của từng người (`appMoDuoc()`):

| Số app | Bố cục |
|---|---|
| 1 | một track rộng 1/3, `justify-content: center` (lớp `.kid-luoi-1`) |
| 2 | cột 1 và 2, không di chuyển, vẫn rộng 1/3 |
| 3 | kín hàng |
| 0 | không thẻ nào, chỉ còn dòng nhắc đi xin quyền |

Ở ≤780px hạ về 2 cột (thẻ đơn lẻ rộng 1/2), ở ≤520px về 1 cột và **bỏ luôn
phép căn giữa** — căn giữa một track rộng 100% chỉ thêm một lớp tính toán.

App **chưa được cấp quyền** gom thành một dòng chữ `.kid-app-khoa` dưới lưới,
không còn là thẻ mờ trong lưới. Vẫn phải nói ra chứ không xoá hẳn: người đáng
lẽ được cấp một app mà chưa được cấp thì cần biết app đó tồn tại để đi xin
quyền. **Chưa đăng nhập thì vẫn hiện đủ ba thẻ và vẫn bấm được** — mỗi app còn
màn hình đăng nhập riêng, chặn đường đó là bước lùi.

Cách kiểm: `getBoundingClientRect()` của `.kid-app` và `.kid-sum-panel`, hai
mảng phải giống nhau từng số. `test/portal-stub.py` bên Karofi ID có sẵn bốn
tài khoản cho bốn trường hợp: `hai.cao` (3 app), `hai.app` (2), `ashley` (1),
`khong.app` (0).

Bảng kênh × tháng của tấm Sale Forecast có vùng cuộn ngang RIÊNG
(`.kid-sum-scroll`) và tấm phải có `min-width: 0`. Thiếu một trong hai thì bảng
đó đẩy rộng cả trang và kéo lệch cả thanh trên cùng — mặc định của grid item là
`min-content`.

`TEN_TAT_KENH` chỉ để ĐỔI CÁCH VIẾT mã kênh (`XK` -> `Export`), không để lọc:
mã lạ vẫn hiện nguyên mã. Mã kênh của FC vốn đã là dạng viết tắt (OEM, GT2, 3T,
NSKX) nên dùng thẳng mã; `name` bên đó là tên đầy đủ và làm cột đầu rộng gấp
đôi phần số.

Thử trên máy: `test/portal-stub.py` bên Karofi ID giả lập cả ba backend (đặt
`EXPORT_LOI = True` để xem nhánh một tấm hỏng).

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
