/**
 * _worker.js — bộ định tuyến của cổng VHKD trên Cloudflare Pages.
 *
 * VÌ SAO CẦN: bốn trang (cổng, FC, OEM, export) BẮT BUỘC phải cùng một origin.
 * Đăng nhập một lần dựa hoàn toàn vào `localStorage['karofi.session']`, mà
 * localStorage chia theo origin — tách thành fc.karofiglobal.com,
 * oem.karofiglobal.com… là SSO gãy ngay, và phải viết cơ chế chuyền token qua
 * URL, tức đụng lại vào lớp xác thực. Xem đầu `karofi-session-core.js` của
 * Karofi ID, nó nói thẳng điều này.
 *
 * Nhưng mỗi kho là một project Pages riêng (để giữ CI độc lập). Nên cần một
 * lớp mỏng gộp bốn project về một tên miền theo ĐÚNG cấu trúc đường dẫn cũ:
 *
 *     ops.karofiglobal.com/                    -> chính project này
 *     ops.karofiglobal.com/FC/                 -> project FC
 *     ops.karofiglobal.com/OEM/                -> project OEM
 *     ops.karofiglobal.com/export/pi-app.html  -> project export
 *
 * Giữ nguyên đường dẫn nghĩa là `href` trong `karofi-apps.js` của Karofi ID
 * KHÔNG phải sửa một dòng nào, và ba bản sao của nó trong ba app cũng vậy.
 *
 * VÌ SAO KHÔNG PHẢI MỘT WORKER ĐỨNG RIÊNG: Worker Custom Domain đòi cả zone
 * `karofiglobal.com` phải nằm trong tài khoản Cloudflare. Pages thì chỉ cần
 * một bản ghi CNAME cho tên miền phụ. Đặt bộ định tuyến bên trong Pages nên
 * IT chỉ phải thêm đúng một CNAME, không đụng gì tới DNS của công ty.
 *
 * ĐÁNH ĐỔI, nói rõ: project này thành điểm hỏng chung của cả bốn trang. Trước
 * đây GitHub Pages phục vụ bốn thư mục độc lập; giờ mọi request đều đi qua đây.
 * Chấp nhận được vì nó vốn đã là cổng đăng nhập — hỏng nó thì ba app kia cũng
 * không ai vào được. Nhưng đây là thay đổi thật về hình dạng rủi ro.
 */

/**
 * Tiền tố đường dẫn -> địa chỉ project Pages tương ứng.
 *
 * Địa chỉ `*.pages.dev` KHÔNG phải bí mật và vẫn mở công khai sau khi đóng
 * private bốn kho — đóng private là để giấu MÃ NGUỒN, không phải giấu trang
 * đã dựng. Bốn trang này vốn công khai từ đầu.
 */
const DICH = [
  { tienTo: '/FC',     goc: 'https://karofi-fc.pages.dev' },
  { tienTo: '/OEM',    goc: 'https://karofi-oem.pages.dev' },
  { tienTo: '/export', goc: 'https://karofi-export.pages.dev' }
];

/** Tìm đích theo tiền tố. Chỉ khớp ở ranh giới đoạn đường dẫn. */
export function timDich(duongDan, bang) {
  for (const d of (bang || DICH)) {
    // Phải so ở RANH GIỚI: '/FCxyz' không được coi là thuộc '/FC'. Dùng
    // startsWith trần là '/exports-cu' rơi vào project export.
    if (duongDan === d.tienTo || duongDan.startsWith(d.tienTo + '/')) return d;
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const dich = timDich(url.pathname);

    // Không thuộc app nào -> file của chính cổng.
    if (!dich) return env.ASSETS.fetch(request);

    // '/FC' (thiếu gạch chéo cuối) -> chuyển về '/FC/'. Không làm bước này thì
    // trang con nạp được nhưng mọi tài nguyên tương đối của nó hỏng, vì Vite
    // dựng với base './' nên 'assets/x.js' sẽ giải ra '/assets/x.js' thay vì
    // '/FC/assets/x.js'. Triệu chứng là trang trắng, không báo lỗi gì.
    if (url.pathname === dich.tienTo) {
      return Response.redirect(url.origin + dich.tienTo + '/' + url.search, 301);
    }

    // Cắt tiền tố: '/FC/assets/x.js' -> '/assets/x.js' trên project FC.
    const duongDanGoc = url.pathname.slice(dich.tienTo.length) || '/';
    const dia = new URL(duongDanGoc + url.search, dich.goc);

    // Chuyển tiếp nguyên method, header và body — GET/HEAD không có body.
    const coBody = request.method !== 'GET' && request.method !== 'HEAD';
    const chuyenTiep = new Request(dia, {
      method: request.method,
      headers: request.headers,
      body: coBody ? request.body : undefined,
      // `duplex: 'half'` bắt buộc khi body là luồng. Cloudflare bỏ qua được,
      // nhưng bộ fetch của Node thì ném lỗi thẳng — và bài test chạy bằng Node.
      // Khai luôn để một file chạy đúng ở cả hai nơi, thay vì có một nhánh chỉ
      // được kiểm trên production.
      ...(coBody ? { duplex: 'half' } : {}),
      redirect: 'manual'
    });

    const res = await fetch(chuyenTiep);

    // Chuyển hướng do project đích trả về đang nói theo hệ đường dẫn CỦA NÓ
    // ('/' , '/index.html'). Phải gắn lại tiền tố, nếu không người dùng bị đá
    // ra khỏi /FC/ về gốc cổng — và vòng lặp đó rất khó đoán ra khi gỡ lỗi.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (loc) {
        const sau = new URL(loc, dia);
        if (sau.origin === dich.goc) {
          const h = new Headers(res.headers);
          h.set('location', dich.tienTo + sau.pathname + sau.search);
          return new Response(res.body, { status: res.status, headers: h });
        }
      }
    }
    return res;
  }
};
