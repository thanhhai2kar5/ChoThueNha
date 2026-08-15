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
    var searchInput, sortSelect, chipsWrap, priceWrap, savedContext, favToggle;
    var q = "";
    var sort = "default";
    var priceRange = "";
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

    var PRICE_RANGES = [
        { value: "under_10", label: "Dưới 10 triệu", lt: 10 },
        { value: "10_15", label: "10 – 15 triệu", gte: 10, lte: 15 },
        { value: "15_20", label: "15 – 20 triệu", gt: 15, lte: 20 },
        { value: "20_30", label: "20 – 30 triệu", gt: 20, lte: 30 },
        { value: "over_30", label: "Trên 30 triệu", gt: 30 }
    ];

    function priceRangeByValue(value) {
        for (var i = 0; i < PRICE_RANGES.length; i++) {
            if (PRICE_RANGES[i].value === value) return PRICE_RANGES[i];
        }
        return null;
    }

    function matchesPriceRange(p) {
        if (!priceRange) return true;
        var r = priceRangeByValue(priceRange);
        if (!r) return true;
        var v = priceNum(p);
        if (r.gte != null && v < r.gte) return false;
        if (r.gt != null && v <= r.gt) return false;
        if (r.lte != null && v > r.lte) return false;
        if (r.lt != null && v >= r.lt) return false;
        return true;
    }

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
        var list = base.filter(function (p) {
            return matchQuery(p) && matchesPriceRange(p);
        });
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
        L.renderList(list, savedView ? { emptyVariant: "saved" } : undefined);
        renderChips();
        renderPriceButtons();
        renderSavedContext();
        syncUrl();
        if (scroll) {
            var ds = document.getElementById("danh-sach");
            if (ds && ds.scrollIntoView) ds.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function setFilter(kind) {
        if (kind === "saved") {
            savedView = true;
            L.setFilter("all");
        } else {
            savedView = false;
            L.setFilter(kind);
        }
        apply(true);
    }

    function renderSavedContext() {
        if (savedContext) savedContext.hidden = !savedView;
        if (favToggle) favToggle.setAttribute("aria-pressed", savedView ? "true" : "false");
    }

    function exitSavedView() {
        if (!savedView) return;
        savedView = false;
        L.setFilter("all");
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

    function setPriceRange(value) {
        if (priceRange === value || !priceRangeByValue(value)) {
            priceRange = "";
        } else {
            priceRange = value;
        }
        apply(false);
    }

    var DISCOVERY_KINDS = ["Căn hộ", "Villa", "available", "center", "light", "family", "all"];

    function applyDiscovery(kind, range) {
        kind = DISCOVERY_KINDS.indexOf(kind) === -1 ? "all" : kind;
        savedView = false;
        L.setFilter(kind);
        priceRange = priceRangeByValue(range) ? range : "";
        apply(true);
    }

    function getDiscoveryState() {
        if (!L) return { kind: "all", priceRange: priceRange };
        var st = L.getState();
        var kind;
        if (savedView) {
            kind = "saved";
        } else if (st.special) {
            kind = st.special;
        } else if (st.cat && st.cat !== "all") {
            kind = st.cat;
        } else {
            kind = "all";
        }
        return { kind: kind, priceRange: priceRange };
    }

    function renderPriceButtons() {
        if (!priceWrap) return;
        var btns = priceWrap.querySelectorAll("[data-price-range]");
        btns.forEach(function (btn) {
            var on = btn.getAttribute("data-price-range") === priceRange;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
    }

    function clearAll() {
        q = "";
        sort = "default";
        priceRange = "";
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
        if (priceRange) {
            var pr = priceRangeByValue(priceRange);
            if (pr) chips.push({ label: "Ngân sách: " + pr.label, clear: function () { setPriceRange(priceRange); } });
        }

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
        if (priceRange) params.set("price", priceRange); else params.delete("price");
        var qs = params.toString();
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }

    function applyUrlParams() {
        var params = new URLSearchParams(location.search);
        q = params.get("q") || "";
        if (searchInput) searchInput.value = q;
        sort = SORT_LABELS[params.get("sort")] ? params.get("sort") : "default";
        if (sortSelect) sortSelect.value = sort;
        priceRange = priceRangeByValue(params.get("price")) ? params.get("price") : "";
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
        priceWrap = document.getElementById("priceRangeGroup");
        savedContext = document.getElementById("savedContext");
        favToggle = document.getElementById("favToggle");

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
                return;
            }
            var ex = e.target.closest ? e.target.closest("[data-exit-saved]") : null;
            if (ex) {
                e.preventDefault();
                exitSavedView();
                return;
            }
            var pr = e.target.closest ? e.target.closest("[data-price-range]") : null;
            if (pr) {
                e.preventDefault();
                setPriceRange(pr.getAttribute("data-price-range"));
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
        setPriceRange: setPriceRange,
        applyDiscovery: applyDiscovery,
        getDiscoveryState: getDiscoveryState,
        exitSavedView: exitSavedView,
        clearAll: clearAll,
        getState: function () {
            return { q: q, sort: sort, priceRange: priceRange, savedView: savedView };
        }
    };
})();