# ChoThuêNhà

Bộ sưu tập không gian sống được tuyển chọn tại Huế — căn hộ cao cấp và villa riêng tư cho thuê dài hạn.

Website **static, không build**: HTML + CSS + JavaScript thuần (vanilla, ES5-style). Không framework,
không backend, không package manager. Mở trực tiếp bằng `file://` hoặc serve tĩnh là chạy được.

## Tính năng

- Hero slideshow (tự chạy 5s, dots, prev/next) kèm teaser căn nổi bật.
- Bộ sưu tập căn hộ + villa (section runway, villa band).
- Danh sách tuyển chọn với filter tab và quick-discovery chip:
  Tất cả (10) · Căn hộ (6) · Villa (4) · Đang trống (7) · Sắp trống (3) ·
  Gần trung tâm (4) · Nhiều ánh sáng (4) · Không gian cho gia đình (6).
- Trang chi tiết từng căn: gallery 1 ảnh chính + 3 thumbnail, breadcrumb, thông tin thuê,
  tiện ích, khu vực xung quanh, 3 căn tương tự, nút "Quan tâm căn này".
- Routing bằng URL hash `#property=<id>`: mở thẳng khi load, nút quay lại trả về danh sách.
- Responsive đầy đủ (breakpoint tablet 1099px, mobile 767px), thiết kế editorial Ink–Coral–Cream.

## Chạy thử

```bash
# Cách 1: mở trực tiếp
start index.html

# Cách 2: serve tĩnh (khuyên dùng)
python -m http.server 8000
# rồi mở http://localhost:8000
```

## Cấu trúc thư mục

```
index.html                # Toàn bộ markup; script nạp cuối body:
                          # properties.js → listings.js → detail.js → main.js
css/style.css             # Design system + responsive (~1900 dòng)
js/data/properties.js     # NGUỒN DỮ LIỆU DUY NHẤT: global `properties` (10 căn)
js/listings.js            # Render danh sách + filter tab -> window.Listings
js/detail.js              # Detail view + gallery + toast -> window.Detail
js/main.js                # Điều phối: slideshow, header, menu, delegation, hash routing
```

### API module

| Module | API |
| ------ | --- |
| `listings.js` | `window.Listings`: `statusBadgeClass`, `byId`, `cardHTML`, `renderList`, `applyFilter`, `PIN/AREA/BED/BATH_SVG` |
| `detail.js` | `window.Detail`: `openProperty(id)`, `closeDetail()` |
| `properties.js` | global `var properties` |

## Thêm một căn mới (chỉ sửa dữ liệu, không sửa logic)

Thêm 1 phần tử vào mảng `properties` trong `js/data/properties.js` theo đúng schema:

```
id (duy nhất), type ("Căn hộ"|"Villa"), status, availableDate, name, ward, location,
price (chuỗi, VD "12 triệu"), area (số), bedrooms, bathrooms, contract, furnished,
featured (bool), description (có thể xuống dòng "\n\n"), features[], nearby[], images[] (4 ảnh {src, alt})
```

Lưu ý: ảnh đang dùng Unsplash (chỉ chạy khi có internet); `price` là chuỗi nên sort giá phải parse số.

## Kiểm tra

Không có test framework; verify bằng Node thuần:

```bash
node --check js/*.js js/data/*.js            # syntax
node C:\SQL_SE~1\opencode\verify_listings.js # render + filter (smoke test vm)
node C:\SQL_SE~1\opencode\verify_integration.js # tích hợp 4 module (smoke test vm)
```

## Định hướng tiếp theo

Xem `PROGRESS.md` để biết trạng thái đầy đủ. Hiện tại gói nghiệp vụ frontend
(tìm kiếm/sắp xếp, căn đã lưu, so sánh, yêu cầu quan tâm — demo minh bạch) đã được yêu cầu
nhưng chưa triển khai.

## Ghi chú

- Nội dung 100% tiếng Việt.
- Chưa có backend; các form (nếu có sau này) chỉ là demo frontend minh bạch — không gửi dữ liệu thật.
- Xem thêm `AGENTS.md` cho quy ước khi AI/hiên phiên làm việc trên code này.