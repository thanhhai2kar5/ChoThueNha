/* =====================================================
   Listings — render danh sách + lọc (module danh sách)
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc: js/data/properties.js (global `properties`).
===================================================== */
(function () {
    "use strict";

    /* =====================================================
       Icons thẻ card (PIN/AREA/BED/BATH được detail dùng lại)
    ===================================================== */
    var PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    var AREA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>';
    var BED_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"></path><path d="M2 20v-3"></path><path d="M22 20v-3"></path><path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path></svg>';
    var BATH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"></path><path d="M4 12V7a2 2 0 0 1 2-2c1 0 1.5.5 2 1"></path></svg>';
    var HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 2-3.5 2-5.5A5.5 5.5 0 0 0 15.5 3 5.5 5.5 0 0 0 12 4.7 5.5 5.5 0 0 0 8.5 3 5.5 5.5 0 0 0 3 8.5c0 2 .5 4 2 5.5l7 7z"></path></svg>';
    var COMPARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="12" height="12" rx="2"></rect><rect x="3" y="9" width="12" height="12" rx="2"></rect></svg>';

    /* =====================================================
       Helper dùng chung (detail view cũng dùng)
    ===================================================== */
    function statusBadgeClass(status) {
        if (status.indexOf("Đang trống") === 0 || status === "Nhận nhà ngay") return "badge-available";
        return "badge-upcoming";
    }

    function byId(id) {
        for (var i = 0; i < properties.length; i++) {
            if (properties[i].id === id) return properties[i];
        }
        return null;
    }

    /* =====================================================
       Trạng thái danh sách
    ===================================================== */
    var resultsCount, categoryTabs, tabButtons, propertyList, danhSach;
    var activeCat = "all";
    var specialFilter = null;
    var specialKind = null;

    var SPECIAL = {
        available: properties.filter(function (p) {
            return p.status.indexOf("Đang trống") === 0 || p.status === "Nhận nhà ngay";
        }),
        center: properties.filter(function (p) {
            return p.type === "Căn hộ" && ["Phú Hội", "Vĩnh Ninh", "An Cựu"].indexOf(p.ward) !== -1;
        }),
        light: properties.filter(function (p) {
            return p.featured;
        }),
        family: properties.filter(function (p) {
            return p.type === "Villa" || p.bedrooms >= 3;
        })
    };

    function cardHTML(p) {
        return '<article class="list-card" data-property="' + p.id + '" role="button" tabindex="0">' +
            '<div class="card-media">' +
                '<img src="' + p.images[0].src + '" alt="' + p.images[0].alt + '" loading="lazy">' +
                '<span class="badge ' + statusBadgeClass(p.status) + '">' + p.status + '</span>' +
                '<button class="fav" type="button" aria-label="Lưu ' + p.name + '">' + HEART_SVG + '</button>' +
                '<button class="compare-add" type="button" data-compare="' + p.id + '" aria-label="So sánh ' + p.name + '">' + COMPARE_SVG + '<span>So sánh</span></button>' +
            '</div>' +
            '<div class="card-info">' +
                '<span class="type-label">' + p.type + '</span>' +
                '<h3>' + p.name + '</h3>' +
                '<p class="card-loc">' + PIN_SVG + '<span>' + p.location + '</span></p>' +
                '<div class="card-price"><strong>' + p.price + '</strong><small>/tháng</small></div>' +
                '<ul class="card-meta">' +
                    '<li>' + AREA_SVG + ' ' + p.area + ' m²</li>' +
                    '<li>' + BED_SVG + ' ' + p.bedrooms + ' PN</li>' +
                    '<li>' + BATH_SVG + ' ' + p.bathrooms + ' phòng tắm</li>' +
                '</ul>' +
                '<button class="btn btn-view" type="button">Xem không gian</button>' +
            '</div>' +
        '</article>';
    }

    function getFiltered() {
        if (specialFilter) return specialFilter;
        var list = properties.slice();
        if (activeCat === "Căn hộ") list = list.filter(function (p) { return p.type === "Căn hộ"; });
        else if (activeCat === "Villa") list = list.filter(function (p) { return p.type === "Villa"; });
        else if (activeCat === "Đang trống") list = list.filter(function (p) { return p.status.indexOf("Đang trống") === 0 || p.status === "Nhận nhà ngay"; });
        else if (activeCat === "Sắp trống") list = list.filter(function (p) { return p.status.indexOf("Sắp trống") === 0; });
        return list;
    }

    function renderList(list) {
        if (!list) list = getFiltered();
        if (list.length === 0) {
            resultsCount.textContent = "0 nơi ở phù hợp";
            propertyList.innerHTML =
                '<div class="list-empty"><p>Không có căn nào phù hợp với bộ lọc hiện tại.</p>' +
                '<button type="button" class="btn btn-outline" data-clear-filters>Xóa bộ lọc</button></div>';
        } else {
            resultsCount.textContent = list.length + " nơi ở đang được giới thiệu";
            propertyList.innerHTML = list.map(cardHTML).join("");
        }
        UI.dispatch("list:rendered");
    }

    function getBaseList() {
        return getFiltered().slice();
    }

    function getState() {
        return { cat: activeCat, special: specialKind };
    }

    function setFilter(kind) {
        if (kind === "all") {
            activeCat = "all";
            specialFilter = null;
            specialKind = null;
            setActiveTab("all");
        } else if (kind === "villa") {
            activeCat = "Villa";
            specialFilter = null;
            specialKind = null;
            setActiveTab("Villa");
        } else if (kind === "Căn hộ" || kind === "Villa" || kind === "Đang trống" || kind === "Sắp trống") {
            activeCat = kind;
            specialFilter = null;
            specialKind = null;
            setActiveTab(kind);
        } else {
            activeCat = null;
            specialFilter = SPECIAL[kind] || [];
            specialKind = kind;
            setActiveTab(null);
        }
    }

    function setActiveTab(cat) {
        tabButtons.forEach(function (b) {
            var on = cat !== null && b.getAttribute("data-cat") === cat;
            b.classList.toggle("active", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
        });
    }

    function applyFilter(kind) {
        setFilter(kind);
        renderList();
        danhSach.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function init() {
        resultsCount = document.getElementById("resultsCount");
        categoryTabs = document.getElementById("categoryTabs");
        tabButtons = categoryTabs.querySelectorAll(".tab");
        propertyList = document.getElementById("propertyList");
        danhSach = document.getElementById("danh-sach");

        tabButtons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (window.Filters) {
                    window.Filters.setCategory(btn.getAttribute("data-cat"));
                } else {
                    applyFilter(btn.getAttribute("data-cat"));
                }
            });
        });

        renderList();
    }

    document.addEventListener("DOMContentLoaded", init);

    /* =====================================================
       API public cho js/main.js (detail view dùng lại một phần)
    ===================================================== */
    window.Listings = {
        statusBadgeClass: statusBadgeClass,
        byId: byId,
        cardHTML: cardHTML,
        renderList: renderList,
        getBaseList: getBaseList,
        getState: getState,
        setFilter: setFilter,
        applyFilter: applyFilter,
        PIN_SVG: PIN_SVG,
        AREA_SVG: AREA_SVG,
        BED_SVG: BED_SVG,
        BATH_SVG: BATH_SVG
    };
})();