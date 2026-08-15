/* =====================================================
   Favorites — căn đã lưu (localStorage) + đồng bộ trái tim
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/data/properties.js (global `properties`)
     - js/ui.js (window.UI)
===================================================== */
(function () {
    "use strict";

    var KEY = "chothuenha:favorites";
    var ids = [];
    var favToggle, favCount;

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            ids = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(ids)) ids = [];
        } catch (e) {
            ids = [];
        }
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(ids));
        } catch (e) {}
    }

    function isFavorite(id) {
        return ids.indexOf(id) !== -1;
    }

    function count() {
        return ids.length;
    }

    function getIds() {
        return ids.slice();
    }

    function getList() {
        return properties.filter(function (p) {
            return isFavorite(p.id);
        });
    }

    function renderHearts() {
        document.querySelectorAll(".fav").forEach(function (btn) {
            var card = btn.closest("[data-property]");
            var id = card ? card.getAttribute("data-property") : null;
            if (id) btn.classList.toggle("active", isFavorite(id));
        });
    }

    function renderCount() {
        if (favCount) favCount.textContent = String(count());
    }

    function toggle(id) {
        var idx = ids.indexOf(id);
        if (idx === -1) {
            ids.push(id);
        } else {
            ids.splice(idx, 1);
        }
        save();
        renderHearts();
        renderCount();
        UI.dispatch("favorites:changed");
    }

    document.addEventListener("DOMContentLoaded", function () {
        load();
        favToggle = document.getElementById("favToggle");
        favCount = document.getElementById("favCount");
        document.addEventListener("list:rendered", renderHearts);
        renderHearts();
        renderCount();
    });

    /* =====================================================
       API public
    ===================================================== */
    window.Favorites = {
        toggle: toggle,
        isFavorite: isFavorite,
        count: count,
        getIds: getIds,
        getList: getList,
        renderHearts: renderHearts,
        renderCount: renderCount
    };
})();