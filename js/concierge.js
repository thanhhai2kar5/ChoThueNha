/* =====================================================
   Concierge — "Phiếu tìm nơi ở trong 60 giây" (UI hướng dẫn inline)
   Nạp SAU js/filters.js, TRƯỚC js/compare.js trong index.html.
   Phụ thuộc:
     - js/filters.js (window.Filters: applyDiscovery, getDiscoveryState)
   Chỉ sở hữu UI state tạm; không render card, không duplicate logic lọc/giá.
===================================================== */
(function () {
    "use strict";

    var section, panel, step1, step2, progress, done, startBtn, applyBtn;

    var PRIORITY_KINDS = ["Căn hộ", "Villa", "available", "center", "light", "family"];

    var selectedKind = "";
    var selectedPrice = "";
    var opened = false;
    var completed = false;

    function syncChoices() {
        if (!section) return;
        var kinds = section.querySelectorAll("[data-concierge-kind]");
        kinds.forEach(function (btn) {
            var on = btn.getAttribute("data-concierge-kind") === selectedKind;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var prices = section.querySelectorAll("[data-concierge-price]");
        prices.forEach(function (btn) {
            var on = btn.getAttribute("data-concierge-price") === selectedPrice;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (applyBtn) applyBtn.disabled = !selectedKind;
    }

    function renderStep() {
        if (!progress || !opened) return;
        progress.textContent = completed ? "Đã hoàn thành" : (selectedKind ? "Bước 2/2" : "Bước 1/2");
    }

    function showQuestion() {
        if (!panel) return;
        panel.hidden = false;
        if (done) done.hidden = true;
        if (step1) step1.hidden = false;
        if (step2) step2.hidden = !selectedKind;
        completed = false;
        renderStep();
        syncChoices();
    }

    function showCompleted() {
        if (!panel) return;
        panel.hidden = true;
        if (done) done.hidden = false;
        completed = true;
        renderStep();
    }

    function open() {
        if (!section) return;
        opened = true;
        if (startBtn) startBtn.hidden = true;
        showQuestion();
        var qEl = panel && panel.querySelector(".concierge-question");
        if (qEl && qEl.scrollIntoView) qEl.scrollIntoView({ behavior: "smooth", block: "start" });
        var first = section.querySelector("[data-concierge-kind]");
        if (first && first.focus) first.focus();
    }

    function reset() {
        if (!section) return;
        selectedKind = "";
        selectedPrice = "";
        opened = false;
        completed = false;
        if (panel) panel.hidden = true;
        if (done) done.hidden = true;
        if (startBtn) startBtn.hidden = false;
        renderStep();
        syncChoices();
    }

    function getState() {
        return { selectedKind: selectedKind, selectedPrice: selectedPrice, opened: opened, completed: completed };
    }

    function selectKind(value) {
        selectedKind = value;
        showQuestion();
        var firstPrice = step2 && step2.querySelector("[data-concierge-price]");
        if (firstPrice && firstPrice.focus) firstPrice.focus();
    }

    function selectPrice(value) {
        selectedPrice = selectedPrice === value ? "" : value;
        syncChoices();
    }

    function apply() {
        if (!selectedKind) return;
        if (!window.Filters || !window.Filters.applyDiscovery) return;
        window.Filters.applyDiscovery(selectedKind, selectedPrice);
        showCompleted();
    }

    function viewResults() {
        var ds = document.getElementById("danh-sach");
        if (ds && ds.scrollIntoView) ds.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function initFromUrl() {
        if (!window.Filters || !window.Filters.getDiscoveryState) return;
        var st = window.Filters.getDiscoveryState();
        if (PRIORITY_KINDS.indexOf(st.kind) !== -1) {
            selectedKind = st.kind;
            selectedPrice = st.priceRange || "";
            if (/[?&](filter|price)=/.test(location.search)) {
                opened = true;
                if (startBtn) startBtn.hidden = true;
                showCompleted();
            }
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        section = document.getElementById("conciergeSection");
        if (!section) return;
        panel = document.getElementById("conciergePanel");
        step1 = document.getElementById("conciergeStep1");
        step2 = document.getElementById("conciergeStep2");
        progress = section.querySelector(".concierge-progress");
        done = document.getElementById("conciergeDone");
        startBtn = section.querySelector("[data-concierge-start]");
        applyBtn = section.querySelector("[data-concierge-apply]");

        section.addEventListener("click", function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            var start = t.closest("[data-concierge-start]");
            if (start) { e.preventDefault(); open(); return; }
            var kind = t.closest("[data-concierge-kind]");
            if (kind) { e.preventDefault(); selectKind(kind.getAttribute("data-concierge-kind")); return; }
            var price = t.closest("[data-concierge-price]");
            if (price) { e.preventDefault(); selectPrice(price.getAttribute("data-concierge-price")); return; }
            var ab = t.closest("[data-concierge-apply]");
            if (ab) { e.preventDefault(); apply(); return; }
            var rb = t.closest("[data-concierge-reset]");
            if (rb) { e.preventDefault(); reset(); return; }
            var edit = t.closest("[data-concierge-edit]");
            if (edit) { e.preventDefault(); open(); return; }
            var view = t.closest("[data-concierge-view-results]");
            if (view) { e.preventDefault(); viewResults(); return; }
        });

        initFromUrl();
    });

    /* =====================================================
       API public
    ===================================================== */
    window.Concierge = {
        open: open,
        reset: reset,
        getState: getState
    };
})();
