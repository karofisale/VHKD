# Chuyển 4 trang sang Cloudflare Pages

Trạng thái: **chưa chuyển**. GitHub Pages vẫn đang phục vụ. Tài liệu này là
quy trình; làm xong tới đâu tick tới đó.

## Ràng buộc quyết định mọi thứ: BỐN TRANG PHẢI CÙNG MỘT ORIGIN

Đăng nhập một lần dựa hoàn toàn vào `localStorage['karofi.session']`, mà
localStorage **chia theo origin**. `karofi-session-core.js` của Karofi ID nói
thẳng ở đầu file:

> *"cổng VHKD và ba app đều nằm trên cùng origin karofisale.github.io nên dùng
> chung một kho localStorage. Không cookie, không cross-domain."*

⇒ Tách thành `fc.karofiglobal.com`, `oem.karofiglobal.com`… là **SSO gãy**.
Mỗi tên miền con có kho riêng, người dùng phải đăng nhập lại ở từng app. Muốn
làm vậy thì phải viết cơ chế chuyền token qua URL — tức đụng lại vào lớp xác
thực vừa cắt sang Supabase ngày 21/09/2026. Không đáng.

⇒ Giữ nguyên cấu trúc đường dẫn:

```
ops.karofiglobal.com/                    cổng VHKD
ops.karofiglobal.com/FC/                 Sale Forecast
ops.karofiglobal.com/OEM/                OEM Portal
ops.karofiglobal.com/export/pi-app.html  Export Hub
```

Nhờ giữ nguyên, `href` trong `Karofi-ID/web/karofi-apps.js` **không phải sửa
dòng nào**, và ba bản sao của nó trong ba app cũng vậy.

## Vì sao bộ định tuyến nằm TRONG Pages, không phải Worker riêng

| | Tên miền phụ, DNS ở nhà cung cấp khác |
|---|---|
| Cloudflare **Pages** custom domain | ✅ chỉ cần một bản ghi CNAME |
| Cloudflare **Worker** custom domain | ❌ đòi cả zone `karofiglobal.com` nằm trong tài khoản Cloudflare |

Nên `_worker.js` nằm trong chính project Pages này (Pages Advanced mode). Hệ
quả: **IT chỉ phải thêm đúng một CNAME**, không đụng gì tới DNS công ty.

**Đánh đổi, nói rõ:** project này thành điểm hỏng chung của cả bốn trang. Trước
đây GitHub Pages phục vụ bốn thư mục độc lập. Chấp nhận được vì nó vốn đã là
cổng đăng nhập — hỏng nó thì ba app kia cũng không ai vào được — nhưng đây là
thay đổi thật về hình dạng rủi ro, không phải chi tiết kỹ thuật.

## Bốn project Pages

Tạo ở Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
(tài khoản `karofisale` đã nối sẵn).

| Kho | Tên project | Root directory | Build command | Output directory |
|---|---|---|---|---|
| `VHKD` | `karofi-vhkd` | `/` | *(để trống)* | `/` |
| `FC` | `karofi-fc` | `client` | `npm ci && npm run build` | `dist` |
| `OEM` | `karofi-oem` | `/` | `npm ci && npm run build` | `dist` |
| `export` | `karofi-export` | `/` | *(để trống)* | `/` |

Tên project phải khớp **đúng** bảng này — `_worker.js` gọi thẳng
`karofi-fc.pages.dev` / `karofi-oem.pages.dev` / `karofi-export.pages.dev`.
Đặt tên khác thì sửa hằng `DICH` ở đầu `_worker.js`, và
`Karofi-ID/test/dinh-tuyen-cloudflare.test.js` sẽ đỏ trước khi kịp sai.

Cả hai app Vite đều dựng với `base: './'` (đường dẫn tương đối) nên **chạy đúng
ở bất kỳ đường dẫn nào** — không phải sửa cấu hình build.

## Thứ tự làm — đừng đảo

1. [ ] Tạo 3 project `karofi-fc`, `karofi-oem`, `karofi-export`. Kiểm từng cái
       mở được bằng địa chỉ `*.pages.dev` của nó.
2. [ ] Tạo project `karofi-vhkd`. `_worker.js` tự động có hiệu lực.
3. [ ] Kiểm trên `karofi-vhkd.pages.dev`: mở `/`, `/FC/`, `/OEM/`,
       `/export/pi-app.html`. **Đăng nhập một lần rồi sang cả ba app** — đây là
       phép thử thật sự, không phải việc trang có mở được hay không.
4. [ ] Thêm custom domain `ops.karofiglobal.com` vào project `karofi-vhkd`.
       Cloudflare đưa ra một bản ghi CNAME — gửi IT (xem mẫu dưới).
5. [ ] Chờ chứng chỉ cấp xong, kiểm lại toàn bộ mục 3 trên tên miền thật.
6. [ ] Báo người dùng địa chỉ mới. Giữ GitHub Pages chạy song song ít nhất
       một tuần — hai bên phục vụ cùng một nội dung, không xung đột gì.
7. [ ] Sau khi yên: đóng private 4 kho, xoá `.github/workflows/deploy.yml` của
       FC và OEM, tắt GitHub Pages.

**Đừng làm bước 7 trước bước 5.** Đóng private là GitHub Pages tắt ngay (gói
miễn phí không phục vụ kho private) — mất đường lùi đúng lúc chưa chắc bên mới
đã chạy.

## Nhờ IT thêm bản ghi

> Nhờ team IT thêm giúp một bản ghi DNS cho tên miền `karofiglobal.com`:
>
> - **Loại**: CNAME
> - **Tên**: `ops`
> - **Giá trị**: `karofi-vhkd.pages.dev`
> - **TTL**: mặc định
>
> Đây là bản ghi cho **một tên miền phụ**, không thay đổi nameserver và không
> ảnh hưởng gì tới email hay website chính của `karofiglobal.com`.

Nếu Cloudflare đưa ra một giá trị CNAME khác với `karofi-vhkd.pages.dev` thì
dùng đúng giá trị nó đưa.

## Đường lùi

Chưa xoá GitHub Pages thì đường lùi là **không làm gì cả**: địa chỉ
`karofisale.github.io/VHKD/` vẫn chạy y nguyên, vì nội dung hai bên giống hệt
và không bên nào biết bên kia tồn tại.

Sau khi đã tắt GitHub Pages: bật lại Pages trong Settings của từng kho và mở
public lại. Mất vài phút, không mất dữ liệu — mọi dữ liệu nằm ở Supabase và
Google Sheet, không có gì trong bốn kho này.
