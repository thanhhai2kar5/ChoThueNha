# Huế Stay Marketplace

**Huế Stay Marketplace** là website tĩnh giới thiệu căn hộ và villa cho thuê dài hạn tại Huế. Dự án tập trung vào hành trình của người thuê: khám phá, lọc, lưu, so sánh, xem chi tiết, đặt lịch xem và chuẩn bị câu hỏi trước buổi xem.

> Đây là bản demo frontend. Website không có backend, không tạo tài khoản, không thu tiền và không gửi yêu cầu/liên hệ/lịch xem tới bên thứ ba.

## Công nghệ và nguyên tắc

Dự án dùng **HTML + CSS + JavaScript thuần** theo phong cách ES5/IIFE, không framework, không build step và không có package manager. Các module phơi API qua `window.*` để website vẫn chạy được khi mở bằng `file://` hoặc một static server đơn giản.

| Thành phần | Quy ước |
| --- | --- |
| Dữ liệu căn nhà | `js/data/properties.js` là nguồn dữ liệu duy nhất gồm 10 căn; không sửa dữ liệu khi phát triển UI/logic. |
| JavaScript | Module IIFE + global API; thứ tự nạp script là thứ tự phụ thuộc. |
| Giao diện | Hệ Ink–Coral–Cream, typography editorial, responsive desktop/tablet/mobile. |
| Lưu dữ liệu cá nhân | Chỉ dùng `localStorage` trên thiết bị; không gửi dữ liệu ra ngoài. |

## Tính năng hiện có

| Nhóm trải nghiệm | Khả năng |
| --- | --- |
| **Khám phá** | Hero slideshow, tìm kiếm, lọc theo loại nhà/trạng thái/ngân sách, sắp xếp, active chips, URL query state và Bộ sưu tập theo nhu cầu sống. |
| **Bộ sưu tập theo nhu cầu** | Các lối tắt Gần trung tâm, Nhiều ánh sáng, Phù hợp gia đình và Có thể nhận nhà sớm; tất cả tái sử dụng filter và URL hiện có. |
| **Căn đã lưu** | Lưu/bỏ lưu, Saved view, empty state, header count và localStorage key `chothuenha:favorites`. |
| **So sánh** | Chọn tối đa 3 căn, compare bar, panel có header sticky, giá thấp nhất/diện tích lớn nhất, chỉ hiện khác biệt, bỏ căn và xem chi tiết. |
| **Trang chi tiết** | Gallery, breadcrumb, tóm tắt nhanh, thông tin thuê, tiện ích, khu vực xung quanh, checklist đi xem nhà, căn tương tự và CTA theo trạng thái. |
| **Bản đồ khu vực** | Google Maps theo khu vực tham khảo của căn, kèm link mở Maps. Không khẳng định vị trí hay địa chỉ chính xác. |
| **Lịch xem nhà** | Chọn ngày/khung giờ, xem/hủy lịch, empty state, focus management và localStorage key `chothuenha:visit-schedules`. |
| **Câu hỏi trước khi xem** | Lưu câu hỏi riêng theo từng căn, gợi ý câu hỏi trung tính, xóa câu hỏi và localStorage key `chothuenha:viewing-questions`. |
| **Yêu cầu quan tâm** | Form demo minh bạch, không gửi dữ liệu thật. |
| **Routing và responsive** | Deep link `#property=<id>`, back/forward, detail state, keyboard/Escape và layout responsive. |

## Chạy website

Mở thư mục `ChoThueNha` trong terminal. Cách thuận tiện nhất là chạy static server:

```powershell
py -m http.server 8000
```

Sau đó mở [http://localhost:8000](http://localhost:8000). Bạn cũng có thể mở `index.html` trực tiếp, tuy nhiên static server giúp kiểm tra link, Google Maps và browser behavior ổn định hơn.

## Kiểm tra trước khi commit

Tại PowerShell trong thư mục dự án, chạy kiểm tra cú pháp cho toàn bộ module:

```powershell
Get-ChildItem js\*.js, js\data\*.js | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

git diff --check
git status --short
```

Sau đó test tay các luồng chính: filter/URL reload, saved homes, compare, detail/back-forward, lịch xem, câu hỏi trước khi xem, Google Maps và mobile khoảng 390px.

## Cấu trúc thư mục

```text
index.html                    Toàn bộ markup; script nạp cuối body theo thứ tự phụ thuộc
css/style.css                 Design system, desktop/tablet/mobile responsive
js/data/properties.js         Nguồn dữ liệu duy nhất: global `properties`
js/ui.js                      Toast, escape HTML và CustomEvent helper
js/listings.js                Render card/list và helper dữ liệu
js/favorites.js               Căn đã lưu bằng localStorage
js/filters.js                 Search, filter, budget, sort, URL state và Saved view
js/collections.js             Bộ sưu tập theo nhu cầu sống
js/concierge.js               Phiếu tìm nơi ở trong 60 giây
js/compare.js                 Compare bar/panel và bảng so sánh
js/detail.js                  Trang detail, gallery, map tham khảo và CTA state
js/inquiry.js                 Form quan tâm demo minh bạch
js/visit-schedule.js          Lịch xem nhà local-only
js/viewing-questions.js       Câu hỏi trước khi xem theo từng căn
js/main.js                    Điều phối header, hero, delegation và routing
```

## Thứ tự nạp module

Các module không dùng `import/export`; chúng được nạp theo thứ tự dưới đây ở cuối `index.html`:

```text
properties → ui → listings → favorites → filters → collections → concierge
→ compare → detail → inquiry → visit-schedule → viewing-questions → main
```

Không đổi thứ tự này tùy tiện. Module phía sau chỉ nên gọi API đã được module phía trước công khai qua `window.*`.

## Dữ liệu căn nhà

Mỗi căn trong `properties` có schema:

```text
id, type, status, availableDate, name, ward, location, price, area,
bedrooms, bathrooms, contract, furnished, featured, description,
features[], nearby[], images[]
```

Khi thêm căn mới, chỉ thêm đúng schema vào `properties.js`. Không hardcode dữ liệu căn ở UI, không bịa review/rating/testimonial và không đưa địa chỉ chính xác vào map nếu dữ liệu nguồn không xác nhận.

## Quy trình Git khi cùng phát triển

Mọi thay đổi được phát triển trên nhánh `developer` theo vòng lặp:

```text
OpenCode sửa → kiểm tra syntax + test Live Server → git commit → git push origin developer → review commit
```

Khi một đợt thay đổi đã được review, nhánh `developer` được đưa lên `main`. Không commit `.env`, token, `node_modules`, ảnh chụp màn hình hay file tạm.

## Tài liệu liên quan

- `AGENTS.md`: nguyên tắc kiến trúc và các hành vi không được phá.
- `PROGRESS.md`: lịch sử phát triển, feature đã hoàn thành và lưu ý kỹ thuật cho phiên sau.
