# AGENTS.md — Hướng dẫn cho AI session làm việc trên ChoThuêNhà

## Giới thiệu nhanh

ChoThuêNhà là marketplace tĩnh (static, không build) giới thiệu căn hộ & villa cho thuê tại Huế.
Toàn bộ là **HTML + CSS + JavaScript thuần** (vanilla, ES5-style), **không framework, không backend,
không build step, không package.json**. Mở bằng `file://` hoặc serve tĩnh là chạy được
(vì vậy module là script global + IIFE, KHÔNG dùng ES modules — ES modules vỡ trên file://).

## Nguyên tắc VÀNG (bắt buộc)

1. **Đọc toàn bộ file liên quan trước khi sửa.** Không đoán dựa trên tên file.
2. **Giữ nguyên tuyệt đối:** giao diện, responsive layout, URL hash `#property=<id>`,
   nội dung tiếng Việt, dữ liệu `properties`, và mọi hành vi đang hoạt động.
   Chỉ thêm UI/logic cần thiết; không redesign, không đổi nội dung dữ liệu.
3. **Tách logic theo module.** Không nhồi feature mới vào `js/main.js`.
   Module mới = IIFE + phơi `window.XXX`.
4. **Không thêm comment** vào code trừ khi được yêu cầu (các file hiện có đã có sẵn
   comment tiêu đề module — giữ nguyên phong cách đó, không thêm lặt vặt).
5. **Không thêm backend, database, tài khoản, thanh toán, form gửi dữ liệu thật,
   review/rating/testimonial hoặc social proof giả.** Form liên hệ (nếu làm) phải là
   demo minh bạch, ghi rõ "không gửi dữ liệu thật".
6. **Chỉ commit khi người dùng yêu cầu.**

## Cấu trúc & trách nhiệm

```
index.html              # Toàn bộ markup; script nạp CUỐI body theo thứ tự:
                        # properties.js → listings.js → detail.js → main.js
css/style.css           # Design system Ink–Coral–Cream, layout editorial, responsive
                        # (breakpoints: 1099px, 767px), ~1900 dòng
js/data/properties.js   # NGUỒN DỮ LIỆU DUY NHẤT: global `var properties` (10 căn).
                        # KHÔNG SỬA nội dung dữ liệu. Chỉ là dữ liệu, không logic.
js/listings.js          # cardHTML, byId, statusBadgeClass, filter tabs, SPECIAL filters,
                        # applyFilter, renderList. Phơi window.Listings.
js/detail.js            # Detail view: gallery, breadcrumb, similar, toast, openProperty/
                        # closeDetail, icons detail + FEATURE_ICONS. Phơi window.Detail.
js/main.js              # Điều phối + UI chung: hero slideshow, header scroll, menu mobile,
                        # event delegation, keydown, init + hash routing. Không phơi gì.
```

### Thứ tự nạp & phụ thuộc (quan trọng)
- Mỗi module IIFE đăng ký handler `DOMContentLoaded` **tại thời điểm parse script**.
  Thứ tự chạy = thứ tự tag script. Module sau được phép gọi API của module trước.
- Chuỗi phụ thuộc hiện tại:
  `properties (data) → listings (cần properties) → detail (cần Listings) → main (cần Listings + Detail)`.
- `window.Listings` và `window.Detail` được gán tại parse-time (cuối IIFE), nên bất kỳ
  module nào nạp sau đều dùng được ngay trong `DOMContentLoaded`.

## API module hiện có

- `window.Listings` = `{ statusBadgeClass, byId, cardHTML, renderList, applyFilter,
  PIN_SVG, AREA_SVG, BED_SVG, BATH_SVG }`
- `window.Detail` = `{ openProperty(id), closeDetail() }`
- `properties` = mảng global 10 căn (không cần import)

## Cấu trúc dữ liệu properties (1 phần tử)

`{ id, type ("Căn hộ"|"Villa"), status, availableDate, name, ward, location,
price (chuỗi, VD "12 triệu"), area (số), bedrooms, bathrooms, contract, furnished,
featured (bool), description, features[], nearby[], images[] (4 ảnh {src, alt}) }`

## Hành vi phải giữ nguyên (đã hoạt động)

- Hero slideshow: tự chạy 5s, dots, prev/next, thanh teaser.
- Mobile hamburger: `#navToggle` toggle class `open` trên `#mainNav`.
- Filter tab & quick-discovery chip: click → `data-filter` → lọc + scroll mượt tới `#danh-sach`.
  Đếm: Tất cả 10 / Căn hộ 6 / Villa 4 / Đang trống 7 / Sắp trống 3 /
  center (Trung tâm) 4 / light (Ánh sáng) 4 / family (Gia đình) 6.
- Mở detail: click card hoặc Enter trên `[data-property]` → `Detail.openProperty(id)`.
- URL hash `#property=<id>`: mở thẳng khi load trang, back button xoá hash + trả về list.
- Gallery: 1 ảnh chính + 3 thumb; badge, breadcrumb, meta, rent box, features grid,
  nearby list, 3 căn tương tự.
- Toast `#toast` (showToast trong detail.js).
- Nút trái tim `.fav`: hiện chỉ `preventDefault + stopPropagation` (chưa có chức năng).

## Caveats / quirk đã biết (KHÔNG tự ý "sửa" nếu chưa có quyết định thiết kế)

- Trong main.js, branch anchor delegated và handler nav-link gọi `D.closeDetail()`
  khi điều kiện `!homeView.hidden` đúng (tức khi home ĐANG hiển thị). Đây là hành vi
  gốc có vẻ ngược logic nhưng vẫn đang chạy đúng thực tế; nếu sửa phải kiểm tra
  cuộn + đóng detail trên cả desktop/mobile.
- Khi click `.fav`/so sánh nằm TRONG thẻ card (`[data-property]`), phải `stopImmediatePropagation`
  hoặc xử lý trước branch mở detail trong delegation, nếu không sẽ mở detail nhầm.
- `price` là chuỗi ("9,5 triệu"); nếu cần sort theo giá phải parse số
  (`parseFloat(price.replace(/[^\d.,]/g,"").replace(",","."))`).

## Môi trường phát triển (giới hạn)

- **KHÔNG có internet / browser** trong môi trường. KHÔNG cố fetch ảnh Unsplash hay
  mở trình duyệt để render-check — sẽ fail.
- Verify bằng:
  - Syntax: `node --check js/*.js js/data/*.js`
  - Smoke test vm (nằm NGOÀI repo): `node C:\SQL_SE~1\opencode\verify_listings.js`
    và `node C:\SQL_SE~1\opencode\verify_integration.js` (nạp toàn bộ script vào vm
    với DOM stub). Nếu thêm module mới, PHẢI cập nhật `verify_integration.js`
    (thêm script + id stub + test tương ứng).
- Không cài package, không `npm install`. Chỉ code thuần + node để chạy test.

## Checklist trước khi báo cáo hoàn thành

1. `node --check` sạch toàn bộ JS.
2. Chạy `verify_integration.js` → tất cả dòng khớp kỳ vọng.
3. Grep xác nhận không còn tham chiếu module cũ sót (VD main.js không gọi thẳng
   detail DOM, v.v.).
4. Không đổi nội dung `properties.js`, không đổi CSS cũ (chỉ thêm).