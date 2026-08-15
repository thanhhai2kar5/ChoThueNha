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
    var panelCard, diffToggle, summaryEl, countText, tableScroll;
    var diffOnly = false;
    var lastOpener = null;

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
        UI.dispatch("compare:changed");
    }

    function clearAll() {
        selected = [];
        renderBar();
        renderToggles();
        close();
        UI.dispatch("compare:changed");
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
        lastOpener = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : (openBtn || null);
        renderTable();
        panel.hidden = false;
        document.body.classList.add("compare-open");
        if (panelCard) {
            try { panelCard.scrollTop = 0; } catch (e) {}
        }
        if (tableScroll) {
            try { tableScroll.scrollTop = 0; } catch (e) {}
        }
        if (panelCard && panelCard.focus) {
            try { panelCard.focus(); } catch (e) {}
        }
    }

    function close(restore) {
        if (!panel) return;
        panel.hidden = true;
        document.body.classList.remove("compare-open");
        if (restore !== false && lastOpener && lastOpener.focus) {
            try { lastOpener.focus(); } catch (e) {}
        }
        lastOpener = null;
    }

    function priceNum(p) {
        var n = parseFloat(String(p.price).replace(/[^\d.,]/g, "").replace(",", "."));
        return isNaN(n) ? 0 : n;
    }

    function renderSummary(ps) {
        if (!summaryEl) return;
        if (ps.length < 2) {
            summaryEl.innerHTML = "";
            return;
        }
        var minPricePs = [], minPrice = null;
        var maxAreaPs = [], maxArea = null;
        ps.forEach(function (p) {
            var np = priceNum(p);
            if (minPrice === null || np < minPrice) {
                minPrice = np;
                minPricePs = [p];
            } else if (np === minPrice) {
                minPricePs.push(p);
            }
            if (maxArea === null || p.area > maxArea) {
                maxArea = p.area;
                maxAreaPs = [p];
            } else if (p.area === maxArea) {
                maxAreaPs.push(p);
            }
        });
        var names = function (arr) {
            return arr.map(function (p) { return p.name; }).join(", ");
        };
        summaryEl.innerHTML =
            '<div class="cmp-summary">' +
            '<span class="cmp-summary-label">Điểm cần so sánh</span>' +
            '<span class="cmp-chip"><strong>Giá thuê thấp nhất</strong>' +
            '<span class="cmp-chip-value">' + minPricePs[0].price + ' / tháng</span>' +
            '<span class="cmp-chip-name">' + UI.esc(names(minPricePs)) + '</span></span>' +
            '<span class="cmp-chip"><strong>Diện tích lớn nhất</strong>' +
            '<span class="cmp-chip-value">' + maxArea + ' m²</span>' +
            '<span class="cmp-chip-name">' + UI.esc(names(maxAreaPs)) + '</span></span>' +
            '</div>';
    }

    function getFocusables() {
        var card = panelCard || panel;
        if (!card || !card.querySelectorAll) return [];
        var all = card.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])");
        var list = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].disabled) continue;
            list.push(all[i]);
        }
        return list;
    }

    function trapFocus(e) {
        var f = getFocusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        var active = document.activeElement;
        var idx = active ? f.indexOf(active) : -1;
        if (e.shiftKey) {
            if (idx === -1 || idx === 0) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (idx === -1 || idx === f.length - 1) {
                e.preventDefault();
                first.focus();
            }
        }
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
        if (countText) countText.textContent = ps.length + "/" + MAX + " căn";
        renderSummary(ps);
        var html = '<div class="cmp-row cmp-head-row">' +
            '<span class="cmp-label">So sánh</span>' +
            ps.map(function (p) {
                return '<span class="cmp-cell">' +
                    '<img class="cmp-img" src="' + p.images[0].src + '" alt="' + p.images[0].alt + '">' +
                    '<strong>' + p.name + '</strong>' +
                    '<div class="cmp-head-actions">' +
                    '<button type="button" class="cmp-detail" data-compare-detail="' + p.id + '" aria-label="Xem chi tiết ' + p.name + '">Xem chi tiết</button>' +
                    '<button type="button" class="cmp-remove" data-compare-remove="' + p.id + '" aria-label="Bỏ ' + p.name + ' khỏi so sánh">&times;</button>' +
                    '</div></span>';
            }).join("") +
            '</div>';
        ROWS.forEach(function (row) {
            var vals = ps.map(function (p) { return row.get(p); });
            var identical = ps.length > 1 && vals.every(function (v) { return v === vals[0]; });
            var isKey = row.label === "Giá thuê" || row.label === "Diện tích";
            if (diffOnly && !isKey && identical) return;
            html += '<div class="cmp-row"><span class="cmp-label">' + row.label + '</span>' +
                ps.map(function (p, i) {
                    var differ = ps.some(function (q, j) { return j !== i && vals[j] !== vals[i]; });
                    return '<span class="cmp-cell' + (differ ? ' cmp-diff' : '') + '">' + row.get(p) + '</span>';
                }).join("") +
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
        panelCard = panel ? panel.querySelector(".compare-panel-card") : null;
        tableScroll = panel ? panel.querySelector(".compare-table-scroll") : null;
        summaryEl = document.getElementById("compareSummary");
        diffToggle = document.getElementById("compareDiffToggle");
        countText = document.getElementById("comparePanelCount");

        document.addEventListener("list:rendered", renderToggles);

        if (diffToggle) diffToggle.addEventListener("click", function () {
            diffOnly = !diffOnly;
            if (diffToggle) diffToggle.setAttribute("aria-pressed", diffOnly ? "true" : "false");
            renderTable();
        });

        document.addEventListener("click", function (e) {
            var btn = e.target.closest ? e.target.closest("[data-compare]") : null;
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggle(btn.getAttribute("data-compare"));
                return;
            }
            var det = e.target.closest ? e.target.closest("[data-compare-detail]") : null;
            if (det) {
                e.preventDefault();
                close(false);
                if (window.Detail && window.Detail.openProperty) {
                    window.Detail.openProperty(det.getAttribute("data-compare-detail"));
                }
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

        document.addEventListener("keydown", function (e) {
            if (!panel || panel.hidden) return;
            if (e.key === "Escape") {
                close();
                return;
            }
            if (e.key === "Tab") trapFocus(e);
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