# PROGRESS.md — Ghi nhớ tiến độ dự án ChoThuêNhà

> File này ghi lại trạng thái hiện tại: đã xong gì, đang làm gì, cần làm tiếp theo.
> Cập nhật sau mỗi phiên làm việc để session sau (người/AI) nắm được ngay.

## Tổng quan trạng thái

- **Giai đoạn**: Refactor module ĐÃ XONG + Gói nghiệp vụ frontend ĐÃ XONG + Redesign UI
  "Hue Stay Marketplace" ĐÃ XONG + Vòng visual polish ĐÃ XONG + Feature lọc theo ngân sách ĐÃ XONG —
  TẤT CẢ đã commit trong `701a717` (đã verify). Còn lại: "quality polish" (Ưu tiên 2) chưa làm.
- **Trạng thái git**: nhánh `developer`, đồng bộ `origin/developer`. HEAD = `701a717`
  `feat: refine Hue Stay marketplace and add budget filtering`. Thứ tự commits:
  `031ccbd` → `56baa3f` → `3456e44` → `4a64b02` → `701a717`.
  Working tree TRƯỚC task "Phiếu tìm nơi ở" là CLEAN.
- **Môi trường**: không internet, không browser → verify bằng `node --check` + smoke test vm.

## Kiến trúc hiện tại (ĐANG CHẠY)

Thứ tự script (`index.html` cuối body):
`properties.js → ui.js → listings.js → favorites.js → filters.js → concierge.js → compare.js → detail.js → inquiry.js → main.js`

Chuỗi phụ thuộc: `properties → ui → listings → favorites → filters → concierge → compare → detail → inquiry → main`.
`window.UI`, `window.Listings`, `window.Favorites`, `window.Filters`, `window.Concierge`,
`window.Compare`, `window.Detail`, `window.Inquiry` gán tại parse-time (cuối IIFE).
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

### 5. Redesign toàn diện "Hue Stay Marketplace" (UI, không đổi logic JS)
- **Bối cảnh**: user duyệt đổi toàn bộ giao diện sang phong cách light/commercial kiểu marketplace
  thuê dài hạn (cảm hứng cấu trúc Airbnb-VN, KHÔNG copy brand/hình ảnh Airbnb). Được phép thay thế
  `css/style.css` + sửa `index.html` MIỄN LÀ giữ nguyên JS↔DOM contract; KHÔNG sửa `properties.js`,
  KHÔNG thêm asset/ảnh mới, KHÔNG thêm logic mới vào `main.js`. Chỉ UI.
- **Cái mới trong `css/style.css`** (viết lại toàn bộ, ~409 rule, giữ variable ở `:root` đầu file):
  - Palette light: nền trắng `#FFFFFF` + mist `#F7F7F5`, chữ ink `#16243A`, line `#E7E7E3`,
    accent coral brick `#C9564B` (KHÔNG dùng đỏ/hồng #FF385C), teal `#2F746D` dùng ít (badge "available").
  - Giữ font Fraunces (heading serif) + Be Vietnam Pro (body sans), radius 12–18px, bóng/viền mảnh.
  - Search hub: card nổi đè lên hero (`margin-top: -34px`, `z-index: 30`) chứa `#searchInput` + `#sortSelect`
    + nút "Tìm không gian" (`data-filter="all"`).
  - Tabs dạng pill; list-grid 4→3→2→1 cột (breakpoint 1280/767/480); header 76px sticky trắng có
    backdrop blur + class `.scrolled`; footer mới (brand + links + demo note).
  - Detail: gallery trái + summary sticky phải (sticky chỉ ≥1024px, thả xuống dưới khi <1024px);
    feature-grid 3→2 cột; modal/toast/compare-bar restyle theo light theme.
  - Vẫn giữ: hero slideshow (hero-canvas split visual+panel, teaser rail, dots, prev/next), villa band
    dark ink, runway 3 card tĩnh (featured + 2 sub), keyframes `fadeUp`/`.swap`, `prefers-reduced-motion`,
    override `[hidden]`, `:focus-visible` accent, `[data-property]{cursor:pointer}`.
- **Thay đổi trong `index.html`**: giữ 100% 55 ID contract + mọi data-attribute; bỏ toolbar
  search/sort cũ trong `#danh-sach` (chuyển thành search-hub sau hero); thêm footer; đổi tiêu đề/logo
  thành "Hue Stay"; script order KHÔNG đổi (9 tags).
- **Verify**: `node --check` sạch 9 file JS; `verify_listings.js` + `verify_integration.js` đều pass
  (đầy đủ 18 section, kể cả routing); grep xác nhận 55 ID contract + các attr (`data-filter`, `data-compare`,
  `data-cat`, `data-property`, `data-compare-close`, `data-inquiry-close`, `dtLoc`...) còn nguyên;
  hero-slide ×3, nav-link ×4; CSS brace 409/409 balanced; `git diff --check` OK.
- **Git**: đã commit trong `701a717` (gộp cùng mục 6 và 7). (Lưu ý: commit `4a64b02 fix: sync
  property detail with browser history` chứa phần routing của mục 4 — thứ tự commit hiện tại:
  `031ccbd` → `56baa3f` → `3456e44` → `4a64b02` → `701a717`.)

### 6. Vòng visual polish (sau redesign, chỉ UI + 1 thay đổi JS tối thiểu)
- **A. Header "Đã lưu" (#favToggle)**: trước đây KHÔNG có CSS riêng → heart to/đen, chữ dồn.
  Thêm base style: pill `inline-flex` 44px, heart 20px, nhãn "Đã lưu" + badge `.fav-count` (nền accent)
  cùng hàng; hover accent-soft. Mobile (≤767px): label ẩn, toggle thành vòng 44px + badge đếm
  `position:absolute` nổi góc trên-phải. Count vẫn từ `Favorites` (localStorage, #favCount).
- **B. Compare bar đè nội dung**: `renderBar()` trong `js/compare.js` giờ thêm/gỡ
  `body.compare-bar-active` (khi `selected.length>0`); CSS `body.compare-bar-active { padding-bottom: 108px }`
  để nội dung/footer/detail cuộn hết dưới bar. Bar cao hơn (padding 14px, ~72–80px). Mobile ≤767px:
  `compare-bar-inner` `nowrap` 1 hàng, chips `overflow-x:auto`, nút ≥44px, không bể 2 dòng.
  Không dùng polling/duplicate listener.
- **C. Card chuẩn hoá**: `.card-featured` + `.list-card` `display:flex; flex-direction:column`;
  `.list-card .card-info` flex cột, `.btn-view` `margin-top:auto`; `.btn-view` đổi từ nút đỏ to
  hover-reveal (gây lệch giữa các card) → nút "Xem không gian" nhẹ (nền accent-soft + border, luôn hiện,
  arrow `→` qua `::after`). Giữ label "Xem không gian" (test contract trong verify_listings).
  Title `.list-card h3` clamp 2 dòng; `.card-loc` 1 dòng ellipsis; meta line-height đồng nhất.
  Grid đổi breakpoint: 4 cột ≥1280 / 3 cột 1024–1279 (@1279px) / 2 cột 768–1023 (@1023px) / 1 cột <768
  (@767px giờ 1 cột).
- **D. Hierarchy**: thống nhất section padding 80px (desktop) / 56px (mobile) cho
  `.section/.discovery/.section-villa/.concierge`; giảm `.section-index` 5.5rem→3.8rem (mobile 3rem),
  opacity 0.16→0.13; hero-canvas 580→560px (≤1280 vẫn 520px); CTA concierge đổi copy
  "Bắt đầu hành trình 60 giây" → "Khám phá không gian phù hợp" (bỏ lời hứa hão).
- **E. Responsive/a11y**: `body { overflow-x: clip }` chống tràn ngang 390/768/1280/1440;
  header chống tràn 768–1024 (CTA đổi `cta-full`→`cta-short` + nav-link gọn hơn ở ≤1024px).
  Kiểm tra mọi `outline:none` đều có focus replacement (:focus-within hoặc box-shadow) — đã có sẵn.
  Motion chỉ transform/opacity + `prefers-reduced-motion` (giữ nguyên).
- **Verify**: `node --check` sạch 9 file JS; CSS brace 429/429 balanced; `git diff --check` OK (chỉ
  warning LF/CRLF); `verify_listings.js` pass (counts 10/7/4/3 + cardHTML contract); `verify_integration.js`
  pass đủ 18 section (body stub có `classList` nên class mới không crash). Working tree chưa commit.
  → Đã commit trong `701a717`.

### 7. Feature: lọc theo ngân sách thuê / tháng (budget price filter)
- **Yêu cầu**: thêm lọc giá theo 5 khoảng cố định, single-select (bấm lại để bỏ chọn),
  không nút "Tất cả" (không chọn = không lọc), cập nhật danh sách + active chips + URL `price` param
  + khôi phục khi reload, an toàn khi giá trị URL không hợp lệ. KHÔNG sửa `properties.js`, không
  framework/backend, không đổi search/category/special/sort/saved/routing/favorites/compare/detail/inquiry.
- **Quy tắc khoảng** (label → điều kiện trên `priceNum(p)`):
  `under_10` Dưới 10 triệu `<10`; `10_15` 10–15 triệu `>=10 && <=15`; `15_20` 15–20 triệu `>15 && <=20`;
  `20_30` 20–30 triệu `>20 && <=30`; `over_30` Trên 30 triệu `>30`.
  Số lượng theo dữ liệu: 1 / 4 / 3 / 2 / 0 (over_30 → empty state + "Xóa bộ lọc").
- **`js/filters.js`**:
  - State: `var priceRange = ""` (chỉ trong Filters, KHÔNG đụng Listings); `priceWrap` ref
    `#priceRangeGroup`. `PRICE_RANGES` config (value/label/gt/gte/lt/lte) + `priceRangeByValue(value)`
    + `matchesPriceRange(p)` (no-op khi `!priceRange`; không dùng if-chain dài).
  - `apply()`: `base.filter(p => matchQuery(p) && matchesPriceRange(p))` (lọc q + giá ĐỒNG THỜI trên
    base saved-or-list), rồi sort/render; thêm `renderPriceButtons()` sau `renderChips()`.
  - `setPriceRange(value)` — toggle: reset `""` nếu `priceRange === value` hoặc giá trị không hợp lệ;
    public qua `Filters.setPriceRange`. `renderPriceButtons()` chỉ đồng bộ UI từ state
    (toggle `.active` + `aria-pressed`) — chạy sau URL init/setPriceRange/clearAll thông qua `apply()`.
  - `clearAll()` reset `priceRange`; `renderChips()` thêm chip "Ngân sách: <label>" có X chỉ xoá price;
  - `syncUrl()` set/delete param `price` (giữ `q`/`filter`/`sort`/hash); `applyUrlParams()` validate
    `price` qua `priceRangeByValue` (`?price=abc`/`?price=999` bị bỏ qua, không crash).
  - DOMContentLoaded: `priceWrap = getElementById("priceRangeGroup")`; delegation `[data-price-range]`
    nằm CÙNG listener click với `[data-clear-filters]` (thêm `return` sau clearAll).
  - `getState()` giờ trả `{ q, sort, priceRange, savedView }` (backward compatible).
- **`index.html`**: block `div.budget-group#priceRangeGroup` (giữa `.tabs#categoryTabs` và
  `.active-chips#activeChips`): label "Ngân sách thuê / tháng" + 5 `<button class="budget-pill"
  data-price-range=... aria-pressed="false">`. KHÔNG inline onclick; không đổi ID/contract cũ.
- **`css/style.css`** (CHỈ thêm, sau `.tab.active`): `.budget-group` flex wrap (label + options),
  `.budget-options` gap 8px wrap, `.budget-pill` 40px min-height, border-radius 999px, border line,
  hover accent, `.active` = nền ink + trắng (đồng hệ tab). Mobile ≤767px: group thành cột,
  `.budget-options` `nowrap + overflow-x:auto + max-width:100%`, pill `flex:none` (không tràn 390px).
- **`verify_integration.js`** (mở rộng): stub `priceRangeGroup` + 5 `budgetBtns` (data-price-range,
  querySelectorAll override); đổi `const Filters/Favorites` → `let` + re-capture sau reload (section 16)
  để test không dùng instance cũ; thêm section 19 (clearAll→10; under_10→1 first can-ho-ngoc-anh
  + pills true,false,…; toggle off→10 pills false; 10_15→4; combo search "Căn hộ"+category Căn hộ
  + 10_15 + sort price_asc→4 first can-ho-kim-long-garden; saved 20_30→1 villa-thuy-bieu; unfav→empty;
  clear-filters→10/price ""; chip "Ngân sách:" chỉ xoá price (giữ q); `setPriceRange("abc")`→"" không
  crash; delegation `[data-price-range]`→10_15/4) và section 20 (reload `?filter=Villa&price=20_30&sort=price_asc`
  → priceRange 20_30, cat Villa, cards 2, first villa-thuy-bieu, pill[3] aria-pressed true;
  `?price=abc` và `?price=999` → "" không crash).
- **Verify**: `node --check` sạch 9 file; `git diff --check` OK (chỉ warning LF/CRLF);
  `verify_listings.js` pass; `verify_integration.js` pass đủ 20 section ("smoke test done").
  → Đã commit trong `701a717`. (Caveat: smoke test stub — event target phải có `closest` như `tgt()`;
  inline object literal trong 1 trường hợp bị mất thuộc tính khi chạy trong harness → dùng `tgt()`.)

### 8. Feature: "Phiếu tìm nơi ở trong 60 giây" (Home Finder questionnaire, UI hướng dẫn inline)
- **Yêu cầu**: bổ sung module `js/concierge.js` (IIFE, nạp SAU `filters.js`, TRƯỚC `compare.js`) +
  section hướng dẫn inline (không modal/overlay) ở cuối home view. User chọn 1 ưu tiên (bắt buộc),
  bước 2 tùy chọn chọn mức giá → "Xem gợi ý phù hợp" áp dụng lọc qua API nguyên tử mới. KHÔNG modal,
  KHÔNG duplicate logic lọc/giá, KHÔNG sửa `properties.js`, không đổi search/tabs/special/sort/saved/
  routing/favorites/compare/detail/inquiry. Giữ nguyên mọi ID/data-attribute cũ.
- **`js/filters.js`** — thêm 2 API công khai (KHÔNG đổi `getState()`, `PRICE_RANGES`, `priceNum()`,
  sort logic, card rendering):
  - `Filters.applyDiscovery(kind, range)`: kind hợp lệ = `"Căn hộ","Villa","available","center","light",
    "family","all"` (không hợp lệ ⇒ `"all"`); range chỉ nhận qua `priceRangeByValue()` (rỗng/không hợp lệ
    ⇒ `""`). Set filter + priceRange CÙNG LÚC + `savedView=false`, gọi `apply(true)` MỘT LẦN
    (KHÔNG `setFilter()` rồi `setPriceRange()` — render 2 lần). Dùng lại `syncUrl()` (giữ `q`/`sort`/hash).
  - `Filters.getDiscoveryState()` (read-only) → `{ kind, priceRange }`: `savedView` ⇒ `"saved"`,
    else special hoặc category hoặc `"all"` + `priceRange` hiện tại.
- **`js/concierge.js`** (module mới): chỉ dùng `window.Filters`; tự sở hữu UI state tạm
  (`selectedKind`, `selectedPrice`, `opened`/`completed`); KHÔNG render card, KHÔNG duplicate logic giá.
  Delegation phạm vi section `[data-concierge-start]` `[data-concierge-kind]` `[data-concierge-price]`
  `[data-concierge-apply]` `[data-concierge-reset]` `[data-concierge-edit]`
  `[data-concierge-view-results]`; no-op an toàn khi section vắng. Auto-advance sang bước 2 sau khi
  chọn ưu tiên; nút apply disabled khi chưa có `selectedKind`; apply chỉ gọi
  `Filters.applyDiscovery(selectedKind, selectedPrice)` rồi hiện state hoàn thành; reset về bước 1,
  KHÔNG đổi lọc hiện tại của list; view-results chỉ smooth-scroll `#danh-sach`; reload prefill từ
  `getDiscoveryState()` nếu hợp lệ nhưng KHÔNG tự mở trừ khi URL có param `filter`/`price`
  (regex `/[?&](filter|price)=/`). Chỉ phơi `window.Concierge = { open, reset, getState }`.
- **`index.html`**: section cũ (h2 "Chưa rõ căn nào hợp với bạn?" + CTA anchor) thành panel hướng dẫn:
  collapsed = title + desc "Chọn một vài ưu tiên, HueStay sẽ đưa bạn đến danh sách phù hợp." + nút
  "Bắt đầu phiếu tìm nơi ở"; khi mở hiện "Bước 1/2" (6 nút ưu tiên: "Căn hộ tiện nghi"=`Căn hộ`,
  "Villa riêng tư"=`Villa`, "Có thể nhận nhà sớm"=`available`, "Gần trung tâm"=`center`,
  "Nhiều ánh sáng"=`light`, "Phù hợp gia đình"=`family`) + "Bước 2/2" (6 mức giá: "Không giới hạn"=`""`,
  "Dưới 10 triệu"=`under_10`, "10 – 15 triệu"=`10_15`, "15 – 20 triệu"=`15_20`,
  "20 – 30 triệu"=`20_30`, "Trên 30 triệu"=`over_30`) + footer "Làm lại" / "Xem gợi ý phù hợp";
  sau apply: "Đã cập nhật gợi ý theo ưu tiên của bạn." + "Điều chỉnh lại" + "Xem danh sách".
  Thêm script tag `concierge.js` giữa `filters.js` và `compare.js`.
- **`css/style.css`** (CHỈ thêm, không sửa CSS cũ): card gọn nền sáng, nút option ≥44px
  (focus/active rõ ràng), progress, grid options 2 cột desktop / 1 cột tại 390px (@480px),
  không tràn ngang.
- **`verify_integration.js`** (mở rộng): thêm `concierge.js` vào `SCRIPTS`; stub `conciergeSection`
  + `conciergePanel/Step1/Step2/Done` + querySelector/querySelectorAll override; thêm section 21:
  apply disabled khi chưa chọn ưu tiên; "Căn hộ" + `10_15` → cat Căn hộ, price 10_15, 4 card;
  center + không chọn giá → filter center, price ""; reset chỉ đổi UI (list giữ nguyên); reload
  URL hợp lệ `?filter=center&price=10_15` → prefill + auto-open; reload URL không hợp lệ
  `?filter=abc&price=xyz` → không crash, collapsed.
- **Trạng thái**: ĐANG LÀM (chưa commit — chờ review Live Server).

## Còn lại — Ưu tiên 2: Vòng "quality polish" (từng được yêu cầu, chưa làm)
Breadcrumb có "Khám phá"; back button giữ nguyên bộ lọc; thẻ quick-facts;
nút trái tim toggle + toast (đã có toggle, còn toast copy);
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
   `node --check js\filters.js`, `node --check js\concierge.js`, `node --check js\compare.js`,
   `node --check js\detail.js`, `node --check js\inquiry.js`, `node --check js\main.js`;
   sau đó `git diff --check`.
2. `node C:\SQL_SE~1\opencode\verify_listings.js`
3. `node C:\SQL_SE~1\opencode\verify_integration.js` (cập nhật nếu thêm module/ID mới)
4. Grep: không còn tham chiếu module cũ sót; `properties.js` & CSS cũ không đổi nội dung.