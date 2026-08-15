# PROGRESS.md — Ghi nhớ tiến độ dự án ChoThuêNhà

> File này ghi lại trạng thái hiện tại: đã xong gì, đang làm gì, cần làm tiếp theo.
> Cập nhật sau mỗi phiên làm việc để session sau (người/AI) nắm được ngay.

## Tổng quan trạng thái

- **Giai đoạn**: Refactor module ĐÃ XONG + Gói nghiệp vụ frontend ĐÃ XONG (đã verify).
  Còn lại: vòng "quality polish" (Ưu tiên 2) chưa làm.
- **Trạng thái git**: nhánh `developer`, đồng bộ `origin/developer`. Đã có commits:
  `56baa3f` (feat: build Hue Home property marketplace — gói nghiệp vụ) trên nền `031ccbd` (Initial commit).
  Working tree CLEAN.
- **Môi trường**: không internet, không browser → verify bằng `node --check` + smoke test vm.

## Kiến trúc hiện tại (ĐANG CHẠY)

Thứ tự script (`index.html` cuối body):
`properties.js → ui.js → listings.js → favorites.js → filters.js → compare.js → detail.js → inquiry.js → main.js`

Chuỗi phụ thuộc: `properties → ui → listings → favorites → filters → compare → detail → inquiry → main`.
`window.UI`, `window.Listings`, `window.Favorites`, `window.Filters`, `window.Compare`,
`window.Detail`, `window.Inquiry` gán tại parse-time (cuối IIFE).
`window.Detail` gồm `openProperty(id)`, `closeDetail()`, `syncRoute()`.

## Đã hoàn thành

### 1. Refactor module (hành vi giữ nguyên 100%)
1. **Dữ liệu** → `js/data/properties.js` (global `var properties`, 10 căn).
2. **Listing** → `js/listings.js` (cardHTML, byId, statusBadgeClass, tabs, SPECIAL,
   setFilter/applyFilter, renderList, getBaseList, getState; phơi `window.Listings`).
3. **Detail** → `js/detail.js` (gallery, breadcrumb, similar, UI.toast, openProperty/closeDetail;
   phơi `window.Detail`). `js/main.js` còn điều phối + UI chung (slideshow, header scroll,
   menu mobile, delegation, keydown, init + hash routing).

### 2. Gói nghiệp vụ frontend (đã code + verify)
- `js/ui.js` — toast, esc (HTML escape), dispatch (CustomEvent). Phơi `window.UI`.
- `js/favorites.js` — localStorage key `chothuenha:favorites`; toggle/isFavorite/count/getIds/
  getList/renderHearts/renderCount; lắng nghe `list:rendered`. Phơi `window.Favorites`.
- `js/filters.js` — search debounce 250ms, sort, URL query `?q=&filter=&sort=` (GIỮ hash),
  active chips + "Xóa tất cả", saved view; lắng nghe `favorites:changed`. Phơi `window.Filters`.
- `js/compare.js` — tối đa 3 căn + toast, compare-bar cố định dưới, panel bảng so sánh;
  `[data-compare]` handler có `stopImmediatePropagation` để không mở detail nhầm. Phơi `window.Compare`.
- `js/inquiry.js` — modal form quan tâm DEMO minh bạch (không gửi dữ liệu thật), prefill căn đang
  xem, validate + success state. Phơi `window.Inquiry`.
- `listings.js`: thêm nút `data-compare` vào card, `getBaseList/getState/setFilter/renderList(list?)`
  + empty state (`[data-clear-filters]`) + dispatch `list:rendered`; tab handler → `Filters.setCategory`
  (fallback `applyFilter`); bỏ duplicate `applyFilter` cũ.
- `detail.js`: `showToast` → `UI.toast`; `dtInterest` → `Inquiry.open(currentId)`; `renderDetail`
  dispatch `list:rendered` (đồng bộ heart/compare ở căn tương tự).
- `main.js`: `.fav` → `Favorites.toggle(id)`; `[data-filter]` → `Filters.setFilter(kind)`.
- `index.html`: fav-toggle + badge header; toolbar search/sort + active chips trong `#danh-sach`;
  compare bar/panel; inquiry modal; nút compare-add ở 3 card tĩnh runway; 9 script tags.
- `css/style.css`: CHỈ THÊM block mới (không sửa CSS cũ).

### Đã verify (sau gói nghiệp vụ)
- `node --check` sạch 9 file JS.
- `verify_listings.js`: render 10, available→7, all→10, tab Villa→4, tab Sắp trống→3,
  cardHTML có data-compare, getBaseList/getState/byId đúng.
- `verify_integration.js` (vm nạp đủ 9 script, stub đủ ID mới + CustomEvent bus + localStorage +
  URLSearchParams): initial 10; search "sông"→4 (chip 1); clearAll→10 (chip 0);
  sort price_asc→first can-ho-ngoc-anh; empty state + `[data-clear-filters]`→10;
  tab Căn hộ→6; filter available→7 + scroll; favorites count 2/favCount 2/saved view 2/unfav→1;
  saved với 0 fav→toast "Chưa có căn nào được lưu."; compare max 3 + toast, panel table,
  `[data-compare]` KHÔNG mở detail (stopImmediatePropagation), clearAll;
  inquiry prefill/empty-toast/success/close; detail vẫn chạy + dtInterest mở inquiry;
  syncUrl giữ hash `#property=`; reload: URL query init (available+price_asc+`q=sông`→3, first
  can-ho-hoang-thanh, input/sort đúng), favorites persist localStorage, hash mở thẳng, back
  trả về `pathname?search`.

### Hành vi đang chạy (giữ nguyên)
- Hero slideshow 5s + dots + prev/next + teaser; hamburger mobile; filter tab + chip quick-discovery
  (Tất cả 10 / Căn hộ 6 / Villa 4 / Đang trống 7 / Sắp trống 3 / center 4 / light 4 / family 6);
  hash detail + back; gallery 1+3 thumb; breadcrumb; 3 căn tương tự; toast; trái tim `.fav` giờ
  toggle Favorites (fill coral khi active + badge #favCount).

### 3. Fix overlay compare/inquiry bị hiện dù có `hidden`
- Nguyên nhân: `.compare-panel` và `.inquiry` khai báo `display: flex`, ghi đè UA `[hidden] { display: none }`
  (specificity ngang nhau, rule sau thắng) → hai lớp modal luôn hiển thị chồng lên nhau, chặn click.
- Sửa: thêm ở CUỐI `css/style.css`:
  `.compare-panel[hidden], .inquiry[hidden] { display: none !important; }`
  (specificity (0,2,0) + !important). JS so sánh (`panel.hidden`) & inquiry (`modal.hidden`) không đổi.
- Verify: `node --check` sạch; smoke test vm vẫn pass; grep CSS xác nhận rule nằm cuối file, CSS cũ không đổi.

### 4. Routing detail: pushState + syncRoute (Back/Forward đồng bộ)
- Trước: `Detail.openProperty()` dùng `history.replaceState` → mở căn không tạo history entry,
  Back/Forward + hash `#property=<id>` không đồng bộ.
- Sau (trong `js/detail.js`, tách 3 trách nhiệm):
  - `showDetail(p)` / `showHome()` — chỉ render/đổi view, KHÔNG ghi history; `showHome()` khôi phục
    `lastScroll` (lưu khi mở detail từ list).
  - `openProperty(id)` — user click card → `history.pushState(pathname + search + "#property=<id>")`
    (giữ query filter/search/sort); fallback `replaceState`; không ghi đè `lastScroll` nếu đang ở detail.
  - `closeDetail()` — nút "Quay lại" → `pushState(pathname + search)` (bỏ hash) + `showHome()`;
    nếu home đang hiện (nav-link/anchor) chỉ `replaceState` xoá hash + giữ hành vi scroll cũ.
  - `syncRoute()` — đọc `location.hash`, `Listings.byId`, render detail/home tương ứng; KHÔNG ghi history
    (không lặp entry/loop). Gắn `popstate` + `hashchange`; gọi 1 lần ở init.
- `js/main.js`: BỎ đoạn init đọc hash cũ; delegation card/keydown/Enter vẫn gọi `D.openProperty(id)`.
- Verify `verify_integration.js` (thêm test): push URL giữ query + hash; Back → home giữ filter, khôi
  phục scroll (0,640); Forward → mở đúng căn; nút back tạo entry home (query không mất) rồi Browser
  Back mở lại detail; hash thủ công đồng bộ; hash id lỗi → home (không trắng màn); không lặp history.

## Còn lại — Ưu tiên 2: Vòng "quality polish" (từng được yêu cầu, chưa làm)
Breadcrumb có "Khám phá"; back button giữ nguyên bộ lọc; thẻ quick-facts; feature-grid 3/2/1 col;
sticky summary chỉ ≥1024px; nút trái tim toggle + toast (đã có toggle, còn toast copy);
toast copy "Tính năng đang được hoàn thiện trong phiên bản tiếp theo." (dùng cho dtShare);
results count theo ngữ cảnh lọc (đã theo list dài, còn empty state). → Không gấp.

## Caveats / quirk chưa xử lý (đã xác nhận, KHÔNG sửa tuỳ tiện)
- Delegation anchor + nav-link gọi `D.closeDetail()` khi `!homeView.hidden` (home đang hiện) — hành vi
  gốc có vẻ ngược logic nhưng chạy đúng thực tế.
- Nút so sánh nằm TRONG card `[data-property]` phải `stopImmediatePropagation`, nếu không mở detail nhầm.
- `dtShare` hiện chỉ toast.
- `price` là chuỗi; sort giá phải parse `parseFloat(price.replace(/[^\d.,]/g,"").replace(",","."))`.

## Cách verify khi làm tiếp
1. Syntax (PowerShell không mở rộng glob — chạy từng file): `node --check js\data\properties.js`,
   `node --check js\ui.js`, `node --check js\listings.js`, `node --check js\favorites.js`,
   `node --check js\filters.js`, `node --check js\compare.js`, `node --check js\detail.js`,
   `node --check js\inquiry.js`, `node --check js\main.js`; sau đó `git diff --check`.
2. `node C:\SQL_SE~1\opencode\verify_listings.js`
3. `node C:\SQL_SE~1\opencode\verify_integration.js` (cập nhật nếu thêm module/ID mới)
4. Grep: không còn tham chiếu module cũ sót; `properties.js` & CSS cũ không đổi nội dung.