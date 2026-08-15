/* =====================================================
   Detail — detail view, gallery, breadcrumb, quay lại
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/data/properties.js (global `properties`)
     - js/ui.js (window.UI: toast, dispatch)
     - js/listings.js (window.Listings: byId, statusBadgeClass, cardHTML, AREA_SVG, BED_SVG, BATH_SVG, PIN_SVG)
===================================================== */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var L = window.Listings;

        /* =====================================================
           Icons dành riêng cho detail view (features)
           Icons thẻ card nằm trong js/listings.js
        ===================================================== */
        var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>';
        var SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.9 4.9l1.4 1.4"></path><path d="M17.7 17.7l1.4 1.4"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.9 19.1l1.4-1.4"></path><path d="M17.7 6.3l1.4-1.4"></path></svg>';
        var WIND_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h9a3 3 0 1 0-3-3"></path><path d="M3 12h14a3 3 0 1 1-3 3"></path><path d="M3 16h6a2.5 2.5 0 1 1-2.5 2.5"></path></svg>';
        var FLAME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3.5 5 5 5 9.5a5 5 0 0 1-10 0C7 8 11 6.5 12 3z"></path></svg>';
        var WASHER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2"></rect><circle cx="12" cy="7" r="1.5"></circle><path d="M9 12h6"></path><path d="M9 16h6"></path></svg>';
        var FRIDGE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="1.5"></rect><path d="M6 10h12"></path><path d="M9 13v3"></path></svg>';
        var CAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"></path><path d="M3 11h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"></path></svg>';
        var TREE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.03a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"></path><path d="M12 19v3"></path></svg>';
        var WAVES_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0 2.7-1.2 4 0 2.7 1.2 4 0"></path><path d="M2 14c1.3-1.2 2.7-1.2 4 0s2.7 1.2 4 0 2.7-1.2 4 0 2.7-1.2 4 0 2.7 1.2 4 0"></path></svg>';
        var SHIELD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
        var BUILDING_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1.5"></rect><path d="M9 21v-3h6v3"></path><path d="M8 8h8"></path></svg>';
        var HOME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11L12 4l9 7"></path><path d="M5 9.5V21h14V9.5"></path></svg>';

        var FEATURE_ICONS = {
            "Ban công": SUN_SVG,
            "Ban công nhỏ": SUN_SVG,
            "Cửa sổ lớn": SUN_SVG,
            "Bếp riêng": FLAME_SVG,
            "Thang máy": BUILDING_SVG,
            "Điều hòa": WIND_SVG,
            "Máy giặt": WASHER_SVG,
            "Tủ lạnh": FRIDGE_SVG,
            "Chỗ để xe": CAR_SVG,
            "Sân vườn": TREE_SVG,
            "Hồ bơi": WAVES_SVG,
            "Bảo vệ trực": SHIELD_SVG,
            "Hiên nhà": HOME_SVG
        };

        /* =====================================================
           DOM refs
        ===================================================== */
        var homeView = document.getElementById("homeView");
        var detailView = document.getElementById("detailView");
        var lastScroll = 0;
        var currentId = null;

        /* =====================================================
           Detail view
        ===================================================== */
        var galleryMain = document.getElementById("galleryMain");
        var galleryBadge = document.getElementById("galleryBadge");
        var galleryThumbs = document.getElementById("galleryThumbs");
        var crumbType = document.getElementById("crumbType");
        var crumbName = document.getElementById("crumbName");
        var dtType = document.getElementById("dtType");
        var dtStatus = document.getElementById("dtStatus");
        var dtName = document.getElementById("dtName");
        var dtLocText = document.getElementById("dtLocText");
        var dtPrice = document.getElementById("dtPrice");
        var dtMeta = document.getElementById("dtMeta");
        var dtFacts = document.getElementById("dtFacts");
        var dtRent = document.getElementById("dtRent");
        var dtDesc = document.getElementById("dtDesc");
        var dtFeatures = document.getElementById("dtFeatures");
        var dtNearby = document.getElementById("dtNearby");
        var dtMapFrame = document.getElementById("dtMapFrame");
        var dtMapLink = document.getElementById("dtMapLink");
        var dtMapCopy = document.getElementById("dtMapCopy");
        var dtMapNote = document.getElementById("dtMapNote");
        var dtSimilar = document.getElementById("dtSimilar");
        var dtSavedState = document.getElementById("dtSavedState");
        var dtVisitState = document.getElementById("dtVisitState");
        var dtSave = document.getElementById("dtSave");
        var dtSaveLabel = document.getElementById("dtSaveLabel");
        var dtVisit = document.getElementById("dtVisit");

        function getSimilar(p) {
            var same = properties.filter(function (x) { return x.id !== p.id && x.type === p.type; });
            var others = properties.filter(function (x) { return x.id !== p.id && x.type !== p.type; });
            return same.concat(others).slice(0, 3);
        }

        function hasSchedule(id) {
            var vs = window.VisitSchedule;
            if (!vs || typeof vs.getAll !== "function") return false;
            return vs.getAll().some(function (r) { return r.propertyId === id; });
        }

        function updateMyState() {
            if (!currentId) return;
            var saved = !!(window.Favorites && window.Favorites.isFavorite(currentId));
            var scheduled = hasSchedule(currentId);
            if (dtSavedState) {
                dtSavedState.textContent = saved ? "Đã lưu căn này" : "Chưa lưu";
                dtSavedState.classList.toggle("is-active", saved);
            }
            if (dtVisitState) {
                dtVisitState.textContent = scheduled ? "Đã có lịch xem" : "Chưa đặt lịch";
                dtVisitState.classList.toggle("is-active", scheduled);
            }
            if (dtSave) {
                dtSave.setAttribute("aria-pressed", saved ? "true" : "false");
                if (dtSaveLabel) dtSaveLabel.textContent = saved ? "Đã lưu" : "Lưu căn này";
            }
            if (dtVisit) {
                dtVisit.textContent = scheduled ? "Xem lịch đã lưu" : "Đặt lịch xem";
            }
        }

        function renderDetail(p) {
            crumbType.textContent = p.type;
            crumbName.textContent = p.name;

            galleryMain.src = p.images[0].src;
            galleryMain.alt = p.images[0].alt;
            galleryBadge.textContent = p.status;
            galleryBadge.className = "badge " + L.statusBadgeClass(p.status);

            galleryThumbs.innerHTML = "";
            p.images.forEach(function (img, i) {
                var thumb = document.createElement("button");
                thumb.type = "button";
                thumb.className = "gallery-thumb" + (i === 0 ? " active" : "");
                thumb.setAttribute("aria-label", "Xem ảnh " + (i + 1) + " của " + p.name);
                thumb.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '">';
                thumb.addEventListener("click", function () {
                    galleryMain.src = img.src;
                    galleryMain.alt = img.alt;
                    galleryThumbs.querySelectorAll(".gallery-thumb").forEach(function (t) {
                        t.classList.remove("active");
                    });
                    thumb.classList.add("active");
                });
                galleryThumbs.appendChild(thumb);
            });

            dtType.textContent = p.type;
            dtStatus.textContent = p.status;
            dtName.textContent = p.name;
            dtLocText.textContent = p.location;
            dtPrice.innerHTML = "<strong>" + p.price + "</strong><small>/tháng</small>";

            dtMeta.innerHTML =
                '<li>' + L.AREA_SVG + ' ' + p.area + ' m²</li>' +
                '<li>' + L.BED_SVG + ' ' + p.bedrooms + ' PN</li>' +
                '<li>' + L.BATH_SVG + ' ' + p.bathrooms + ' phòng tắm</li>';

            dtRent.innerHTML =
                '<li><span>Hợp đồng</span><strong>' + UI.esc(p.contract) + '</strong></li>' +
                '<li><span>Nội thất</span><strong>' + UI.esc(p.furnished) + '</strong></li>' +
                '<li><span>Nhận nhà</span><strong>' + UI.esc(p.availableDate) + '</strong></li>';

            dtFacts.innerHTML =
                '<div class="detail-fact"><dt>Trạng thái</dt><dd>' + UI.esc(p.status) + '</dd></div>' +
                '<div class="detail-fact"><dt>Vị trí</dt><dd>' + UI.esc(p.location) + '</dd></div>' +
                '<div class="detail-fact"><dt>Nhận nhà</dt><dd>' + UI.esc(p.availableDate) + '</dd></div>' +
                '<div class="detail-fact"><dt>Hợp đồng</dt><dd>' + UI.esc(p.contract) + '</dd></div>' +
                '<div class="detail-fact"><dt>Nội thất</dt><dd>' + UI.esc(p.furnished) + '</dd></div>';

            dtDesc.innerHTML = p.description.split("\n\n").map(function (para) {
                return "<p>" + para + "</p>";
            }).join("");

            dtFeatures.innerHTML = p.features.map(function (f) {
                var icon = FEATURE_ICONS[f] || ICON_CHECK;
                return "<li>" + icon + "<span>" + f + "</span></li>";
            }).join("");

            dtNearby.innerHTML = p.nearby.map(function (n) {
                return "<li>" + L.PIN_SVG + " " + n + "</li>";
            }).join("");

            var mapQuery = encodeURIComponent(p.location + ", Huế, Việt Nam");
            if (dtMapFrame) {
                dtMapFrame.src = "https://www.google.com/maps?q=" + mapQuery + "&output=embed";
                dtMapFrame.title = "Bản đồ khu vực " + p.name;
            }
            if (dtMapLink) {
                dtMapLink.href = "https://www.google.com/maps/search/?api=1&query=" + mapQuery;
            }
            if (dtMapCopy) {
                dtMapCopy.textContent = "Khu vực tham khảo: " + p.location + ".";
            }
            if (dtMapNote) {
                dtMapNote.textContent = "Bản đồ chỉ thể hiện khu vực tham khảo, không phải vị trí chính xác của căn. Địa điểm thực tế nên được xác nhận khi xem nhà.";
            }

            dtSimilar.innerHTML = getSimilar(p).map(L.cardHTML).join("");

            updateMyState();
            UI.dispatch("list:rendered");
        }

        function showDetail(p) {
            currentId = p.id;
            renderDetail(p);
            homeView.hidden = true;
            detailView.hidden = false;
            window.scrollTo(0, 0);
        }

        function showHome() {
            detailView.hidden = true;
            homeView.hidden = false;
            if (lastScroll) window.scrollTo(0, lastScroll);
        }

        function openProperty(id) {
            var p = L.byId(id);
            if (!p) return;
            var target = location.pathname + location.search + "#property=" + id;
            if (location.hash !== "#property=" + id) {
                if (homeView.hidden === false) lastScroll = window.scrollY;
                if (history.pushState) {
                    history.pushState(null, "", target);
                } else if (history.replaceState) {
                    history.replaceState(null, "", target);
                }
            }
            showDetail(p);
        }

        function closeDetail() {
            if (homeView.hidden === false) {
                if (location.hash && history.replaceState) {
                    history.replaceState(null, "", location.pathname + location.search);
                }
                window.scrollTo(0, lastScroll);
                return;
            }
            var url = location.pathname + location.search;
            if (history.pushState) {
                history.pushState(null, "", url);
            } else if (history.replaceState) {
                history.replaceState(null, "", url);
            }
            showHome();
        }

        function syncRoute() {
            var match = location.hash.match(/^#property=(.+)$/);
            var id = match ? decodeURIComponent(match[1]) : null;
            var p = id ? L.byId(id) : null;
            if (p) {
                if (!detailView.hidden && currentId === p.id) return;
                showDetail(p);
            } else {
                if (detailView.hidden) return;
                showHome();
            }
        }

        document.getElementById("detailBack").addEventListener("click", closeDetail);
        window.addEventListener("popstate", syncRoute);
        window.addEventListener("hashchange", syncRoute);
        syncRoute();

        document.getElementById("dtVisit").addEventListener("click", function () {
            if (!window.VisitSchedule) {
                UI.toast("Tính năng lịch xem đang được hoàn thiện.");
                return;
            }
            if (hasSchedule(currentId)) {
                window.VisitSchedule.openList();
            } else {
                window.VisitSchedule.open(currentId);
            }
        });
        document.getElementById("dtSave").addEventListener("click", function () {
            if (!window.Favorites) {
                UI.toast("Tính năng lưu đang được hoàn thiện.");
                return;
            }
            window.Favorites.toggle(currentId);
            updateMyState();
        });
        document.getElementById("dtInterest").addEventListener("click", function () {
            if (window.Inquiry) {
                window.Inquiry.open(currentId);
            } else {
                UI.toast("Tính năng liên hệ đang được hoàn thiện.");
            }
        });
        document.getElementById("dtShare").addEventListener("click", function () {
            var url = location.href.split("#")[0] + "#property=" + encodeURIComponent(currentId);
            var done = function () { UI.toast("Đã sao chép liên kết của căn này."); };
            var fail = function () { UI.toast("Chưa sao chép được tự động — liên kết nằm ở thanh địa chỉ trình duyệt."); };
            if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(done, fail);
                return;
            }
            try {
                var ta = document.createElement("textarea");
                ta.value = url;
                ta.setAttribute("readonly", "");
                document.body.appendChild(ta);
                ta.select();
                var ok = document.execCommand ? document.execCommand("copy") : false;
                document.body.removeChild(ta);
                if (ok) {
                    done();
                } else {
                    fail();
                }
            } catch (e) {
                fail();
            }
        });

        document.addEventListener("favorites:changed", updateMyState);
        document.addEventListener("visit:changed", updateMyState);

        /* =====================================================
           API public cho js/main.js (delegation + routing)
        ===================================================== */
        window.Detail = {
            openProperty: openProperty,
            closeDetail: closeDetail,
            syncRoute: syncRoute
        };
    });
})();
