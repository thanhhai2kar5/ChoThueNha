/* =====================================================
   Compare — so sánh tối đa 3 căn + thanh & bảng so sánh
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/ui.js (window.UI)
     - js/listings.js (window.Listings: byId)
===================================================== */
(function () {
    "use strict";

    var MAX = 3;
    var selected = [];
    var bar, countEl, listEl, openBtn, clearBtn, panel, closeBtn, table;

    function isSelected(id) {
        return selected.indexOf(id) !== -1;
    }

    function getSelected() {
        return selected.slice();
    }

    function count() {
        return selected.length;
    }

    function toggle(id) {
        var idx = selected.indexOf(id);
        if (idx === -1) {
            if (selected.length >= MAX) {
                UI.toast("Chỉ so sánh được tối đa " + MAX + " căn.");
                return;
            }
            selected.push(id);
            UI.toast("Đã thêm vào danh sách so sánh.");
        } else {
            selected.splice(idx, 1);
        }
        renderBar();
        renderToggles();
    }

    function clearAll() {
        selected = [];
        renderBar();
        renderToggles();
        close();
    }

    function renderToggles() {
        document.querySelectorAll("[data-compare]").forEach(function (btn) {
            btn.classList.toggle("added", isSelected(btn.getAttribute("data-compare")));
        });
    }

    function renderBar() {
        if (!bar) return;
        if (selected.length === 0) {
            bar.hidden = true;
            document.body.classList.remove("compare-bar-active");
            return;
        }
        bar.hidden = false;
        document.body.classList.add("compare-bar-active");
        countEl.textContent = String(selected.length);
        listEl.innerHTML = "";
        selected.forEach(function (id) {
            var p = window.Listings.byId(id);
            if (!p) return;
            var item = document.createElement("span");
            item.className = "compare-chip-item";
            item.innerHTML = '<img src="' + p.images[0].src + '" alt="">' +
                '<span class="compare-chip-name">' + p.name + '</span>' +
                '<button type="button" class="compare-chip-remove" aria-label="Bỏ ' + p.name + ' khỏi so sánh">&times;</button>';
            item.querySelector(".compare-chip-remove").addEventListener("click", function (e) {
                e.stopPropagation();
                toggle(id);
            });
            listEl.appendChild(item);
        });
    }

    function open() {
        if (selected.length < 2) {
            UI.toast("Chọn ít nhất 2 căn để so sánh.");
            return;
        }
        renderTable();
        panel.hidden = false;
        document.body.classList.add("compare-open");
    }

    function close() {
        if (!panel) return;
        panel.hidden = true;
        document.body.classList.remove("compare-open");
    }

    var ROWS = [
        { label: "Loại", get: function (p) { return p.type; } },
        { label: "Trạng thái", get: function (p) { return p.status; } },
        { label: "Giá thuê", get: function (p) { return p.price + " / tháng"; } },
        { label: "Diện tích", get: function (p) { return p.area + " m²"; } },
        { label: "Phòng ngủ", get: function (p) { return p.bedrooms + " PN"; } },
        { label: "Phòng tắm", get: function (p) { return p.bathrooms + " phòng"; } },
        { label: "Hợp đồng", get: function (p) { return p.contract; } },
        { label: "Nội thất", get: function (p) { return p.furnished; } },
        { label: "Nhận nhà", get: function (p) { return p.availableDate; } },
        { label: "Tiện ích", get: function (p) { return p.features.join(" · "); } },
        { label: "Khu vực", get: function (p) { return p.location; } }
    ];

    function renderTable() {
        if (!table) return;
        var ps = selected.map(function (id) { return window.Listings.byId(id); }).filter(Boolean);
        var html = '<div class="cmp-row cmp-head-row">' +
            '<span class="cmp-label">So sánh</span>' +
            ps.map(function (p) {
                return '<span class="cmp-cell">' +
                    '<img class="cmp-img" src="' + p.images[0].src + '" alt="' + p.images[0].alt + '">' +
                    '<strong>' + p.name + '</strong>' +
                    '<button type="button" class="cmp-remove" data-compare-remove="' + p.id + '" aria-label="Bỏ ' + p.name + '">&times;</button>' +
                    '</span>';
            }).join("") +
            '</div>';
        ROWS.forEach(function (row) {
            html += '<div class="cmp-row"><span class="cmp-label">' + row.label + '</span>' +
                ps.map(function (p) { return '<span class="cmp-cell">' + row.get(p) + '</span>'; }).join("") +
                '</div>';
        });
        table.innerHTML = html;
        table.style.gridTemplateColumns = "minmax(150px, auto) repeat(" + ps.length + ", 1fr)";
    }

    document.addEventListener("DOMContentLoaded", function () {
        bar = document.getElementById("compareBar");
        countEl = document.getElementById("compareCount");
        listEl = document.getElementById("compareList");
        openBtn = document.getElementById("compareOpen");
        clearBtn = document.getElementById("compareClear");
        panel = document.getElementById("comparePanel");
        closeBtn = document.getElementById("compareClose");
        table = document.getElementById("compareTable");

        document.addEventListener("list:rendered", renderToggles);

        document.addEventListener("click", function (e) {
            var btn = e.target.closest ? e.target.closest("[data-compare]") : null;
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggle(btn.getAttribute("data-compare"));
                return;
            }
            var rm = e.target.closest ? e.target.closest("[data-compare-remove]") : null;
            if (rm) {
                e.preventDefault();
                toggle(rm.getAttribute("data-compare-remove"));
                if (count() < 2) close();
                return;
            }
            var closeEl = e.target.closest ? e.target.closest("[data-compare-close]") : null;
            if (closeEl) {
                e.preventDefault();
                close();
            }
        });

        if (openBtn) openBtn.addEventListener("click", open);
        if (clearBtn) clearBtn.addEventListener("click", clearAll);
        if (closeBtn) closeBtn.addEventListener("click", close);

        renderBar();
        renderToggles();
    });

    /* =====================================================
       API public
    ===================================================== */
    window.Compare = {
        toggle: toggle,
        clearAll: clearAll,
        isSelected: isSelected,
        getSelected: getSelected,
        count: count,
        open: open,
        close: close,
        renderBar: renderBar,
        renderToggles: renderToggles
    };
})();