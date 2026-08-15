/* =====================================================
   Collections — "Bộ sưu tập theo nhu cầu sống" (cầu nối khám phá nhanh)
   Nạp SAU js/filters.js, TRƯỚC js/concierge.js trong index.html.
   Phụ thuộc:
     - js/filters.js (window.Filters: applyDiscovery)
   Chỉ kích hoạt bộ lọc hiện có; không render card, không lọc song song.
===================================================== */
(function () {
    "use strict";

    var section;
    var activeTimer;

    function activate(kind) {
        if (window.Filters && typeof window.Filters.applyDiscovery === "function") {
            window.Filters.applyDiscovery(kind, "");
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        section = document.getElementById("livingCollections");
        if (!section) return;

        section.addEventListener("click", function (e) {
            var card = e.target && e.target.closest ? e.target.closest("[data-collection-kind]") : null;
            if (!card) return;
            activate(card.getAttribute("data-collection-kind"));
            if (activeTimer) clearTimeout(activeTimer);
            card.classList.add("is-active");
            activeTimer = setTimeout(function () {
                card.classList.remove("is-active");
            }, 700);
        });
    });

    window.Collections = { activate: activate };
})();