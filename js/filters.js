/* =====================================================
   Filters — tìm kiếm, sắp xếp, URL query, active chips
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/data/properties.js (global `properties`)
     - js/ui.js (window.UI)
     - js/listings.js (window.Listings: setFilter, getBaseList, getState, renderList)
     - js/favorites.js (window.Favorites: getList, count)
===================================================== */
(function () {
    "use strict";

    var L;
    var searchInput, sortSelect, chipsWrap;
    var q = "";
    var sort = "default";
    var savedView = false;
    var debounceTimer;

    var SPECIAL_LABELS = {
        available: "Căn đang trống",
        center: "Gần trung tâm",
        light: "Nhiều ánh sáng",
        family: "Không gian cho gia đình",
        saved: "Đã lưu"
    };

    var SORT_LABELS = {
        price_asc: "Giá thấp → cao",
        price_desc: "Giá cao → thấp",
        area_asc: "Diện tích nhỏ → lớn",
        area_desc: "Diện tích lớn → nhỏ",
        beds_desc: "Nhiều phòng ngủ nhất"
    };

    function priceNum(p) {
        var n = parseFloat(String(p.price).replace(/[^\d.,]/g, "").replace(",", "."));
        return isNaN(n) ? 0 : n;
    }

    function matchQuery(p) {
        if (!q) return true;
        var hay = [p.name, p.type, p.location, p.ward, p.status, p.price, p.contract, p.furnished]
            .concat(p.features, p.nearby, p.description)
            .join(" ").toLowerCase();
        return hay.indexOf(q.toLowerCase()) !== -1;
    }

    function apply(scroll) {
        var base = savedView ? window.Favorites.getList() : L.getBaseList();
        var list = base.filter(matchQuery);
        if (sort !== "default") {
            var fns = {
                price_asc: function (a, b) { return priceNum(a) - priceNum(b); },
                price_desc: function (a, b) { return priceNum(b) - priceNum(a); },
                area_asc: function (a, b) { return a.area - b.area; },
                area_desc: function (a, b) { return b.area - a.area; },
                beds_desc: function (a, b) { return b.bedrooms - a.bedrooms; }
            };
            list = list.slice().sort(fns[sort]);
        }
        L.renderList(list);
        renderChips();
        syncUrl();
        if (scroll) {
            var ds = document.getElementById("danh-sach");
            if (ds && ds.scrollIntoView) ds.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function setFilter(kind) {
        if (kind === "saved") {
            if (window.Favorites.count() === 0) {
                UI.toast("Chưa có căn nào được lưu.");
                return;
            }
            savedView = true;
            L.setFilter("all");
        } else {
            savedView = false;
            L.setFilter(kind);
        }
        apply(true);
    }

    function setCategory(cat) {
        savedView = false;
        L.setFilter(cat);
        apply(false);
    }

    function setSearch(value) {
        q = (value || "").trim();
        if (searchInput) searchInput.value = q;
        apply(false);
    }

    function setSort(value) {
        sort = SORT_LABELS[value] ? value : "default";
        if (sortSelect) sortSelect.value = sort;
        apply(false);
    }

    function clearAll() {
        q = "";
        sort = "default";
        savedView = false;
        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "default";
        L.setFilter("all");
        apply(false);
    }

    function renderChips() {
        if (!chipsWrap) return;
        chipsWrap.innerHTML = "";
        var chips = [];
        var st = L.getState();
        if (savedView) {
            chips.push({ label: SPECIAL_LABELS.saved, clear: clearAll });
        } else if (st.special && SPECIAL_LABELS[st.special]) {
            chips.push({ label: SPECIAL_LABELS[st.special], clear: clearAll });
        } else if (st.cat && st.cat !== "all") {
            chips.push({ label: st.cat, clear: clearAll });
        }
        if (q) chips.push({ label: "Tìm: “" + UI.esc(q) + "”", clear: function () { setSearch(""); } });
        if (sort !== "default") chips.push({ label: SORT_LABELS[sort], clear: function () { setSort("default"); } });

        chips.forEach(function (c) {
            var el = document.createElement("button");
            el.type = "button";
            el.className = "chip";
            el.innerHTML = c.label + '<span aria-hidden="true">&times;</span>';
            el.addEventListener("click", function () { c.clear(); });
            chipsWrap.appendChild(el);
        });
        if (chips.length > 1) {
            var all = document.createElement("button");
            all.type = "button";
            all.className = "chip chip-clear";
            all.textContent = "Xóa tất cả";
            all.addEventListener("click", clearAll);
            chipsWrap.appendChild(all);
        }
    }

    function syncUrl() {
        if (!history.replaceState) return;
        var params = new URLSearchParams(location.search);
        if (q) params.set("q", q); else params.delete("q");
        var st = L.getState();
        var kind = savedView ? "saved" : (st.special || (st.cat && st.cat !== "all" ? st.cat : ""));
        if (kind) params.set("filter", kind); else params.delete("filter");
        if (sort !== "default") params.set("sort", sort); else params.delete("sort");
        var qs = params.toString();
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }

    function applyUrlParams() {
        var params = new URLSearchParams(location.search);
        q = params.get("q") || "";
        if (searchInput) searchInput.value = q;
        sort = SORT_LABELS[params.get("sort")] ? params.get("sort") : "default";
        if (sortSelect) sortSelect.value = sort;
        var kind = params.get("filter");
        if (kind === "saved") {
            savedView = true;
            L.setFilter("all");
        } else if (kind) {
            savedView = false;
            L.setFilter(kind);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        L = window.Listings;
        searchInput = document.getElementById("searchInput");
        sortSelect = document.getElementById("sortSelect");
        chipsWrap = document.getElementById("activeChips");

        if (searchInput) {
            searchInput.addEventListener("input", function () {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function () {
                    setSearch(searchInput.value);
                }, 250);
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener("change", function () {
                setSort(sortSelect.value);
            });
        }

        document.addEventListener("click", function (e) {
            var cl = e.target.closest ? e.target.closest("[data-clear-filters]") : null;
            if (cl) {
                e.preventDefault();
                clearAll();
            }
        });

        document.addEventListener("favorites:changed", function () {
            if (savedView) apply(false);
        });

        applyUrlParams();
        apply(false);
    });

    /* =====================================================
       API public
    ===================================================== */
    window.Filters = {
        setFilter: setFilter,
        setCategory: setCategory,
        setSearch: setSearch,
        setSort: setSort,
        clearAll: clearAll,
        getState: function () {
            return { q: q, sort: sort, savedView: savedView };
        }
    };
})();