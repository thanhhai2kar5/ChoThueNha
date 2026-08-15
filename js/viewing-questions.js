/* =====================================================
   Viewing Questions — câu hỏi trước khi xem nhà (ghi chú cá nhân, chỉ lưu trên thiết bị)
   Nạp SAU js/visit-schedule.js, TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/ui.js (window.UI)
     - js/listings.js (window.Listings: byId)
===================================================== */
(function () {
    "use strict";

    var KEY = "chothuenha:viewing-questions";
    var SUGGESTIONS = [
        "Chi phí điện nước được tính thế nào?",
        "Chỗ để xe được sắp xếp ra sao?",
        "Những hạng mục nào được bảo trì?",
        "Điều khoản hợp đồng nào cần lưu ý?"
    ];

    var records = [];
    var modal, propertyNameEl, suggestEl, inputEl, addBtn, listEl;
    var currentPropertyId = null;
    var lastOpener = null;

    function isValidRecord(r) {
        return r && typeof r.id === "string" && typeof r.propertyId === "string" &&
            typeof r.text === "string" && typeof r.createdAt === "number";
    }

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            var arr = raw ? JSON.parse(raw) : [];
            records = Array.isArray(arr) ? arr.filter(isValidRecord) : [];
        } catch (e) {
            records = [];
        }
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(records));
        } catch (e) {}
    }

    function getForProperty(propertyId) {
        return records.filter(function (r) {
            return r.propertyId === propertyId;
        }).sort(function (a, b) {
            return a.createdAt - b.createdAt;
        });
    }

    function countForProperty(propertyId) {
        return getForProperty(propertyId).length;
    }

    function add(propertyId, text) {
        var t = String(text == null ? "" : text).trim();
        if (!t) {
            UI.toast("Vui lòng nhập câu hỏi.");
            return false;
        }
        var dup = records.some(function (r) {
            return r.propertyId === propertyId && r.text.toLowerCase() === t.toLowerCase();
        });
        if (dup) {
            UI.toast("Câu hỏi này đã có trong danh sách.");
            return false;
        }
        records.push({
            id: "vq-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            propertyId: propertyId,
            text: t,
            createdAt: Date.now()
        });
        save();
        renderList();
        UI.dispatch("viewing-questions:changed");
        return true;
    }

    function remove(id) {
        var idx = -1;
        for (var i = 0; i < records.length; i++) {
            if (records[i].id === id) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return;
        records.splice(idx, 1);
        save();
        renderList();
        UI.dispatch("viewing-questions:changed");
    }

    function renderList() {
        if (!listEl) return;
        var list = getForProperty(currentPropertyId);
        if (list.length === 0) {
            listEl.innerHTML =
                '<div class="vq-empty">' +
                '<p>Bạn chưa có câu hỏi nào cho căn này.</p>' +
                '<p>Chọn một gợi ý nhanh bên trên hoặc viết câu hỏi của riêng bạn.</p>' +
                '</div>';
            return;
        }
        listEl.innerHTML = list.map(function (r) {
            return '<div class="vq-row">' +
                '<span class="vq-row-text">' + UI.esc(r.text) + '</span>' +
                '<button type="button" class="vq-remove" data-vq-remove="' + r.id + '" aria-label="Xóa câu hỏi: ' + UI.esc(r.text) + '">&times;</button>' +
                '</div>';
        }).join("");
    }

    function renderSuggestions() {
        if (!suggestEl) return;
        suggestEl.innerHTML = SUGGESTIONS.map(function (s, i) {
            return '<button type="button" class="vq-suggestion" data-vq-suggestion="' + i + '">' + UI.esc(s) + '</button>';
        }).join("");
    }

    function open(propertyId) {
        var p = window.Listings.byId(propertyId);
        if (!p) {
            UI.toast("Không tìm thấy căn này.");
            return;
        }
        currentPropertyId = p.id;
        if (propertyNameEl) propertyNameEl.textContent = p.name;
        if (inputEl) inputEl.value = "";
        renderList();
        lastOpener = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
        modal.hidden = false;
        document.body.classList.add("visit-open");
        if (inputEl && inputEl.focus) {
            inputEl.focus();
        } else {
            var card = modal.querySelector ? modal.querySelector(".inquiry-card") : null;
            if (card && card.focus) card.focus();
        }
    }

    function close() {
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove("visit-open");
        if (lastOpener && lastOpener.focus) {
            try { lastOpener.focus(); } catch (e) {}
        }
        lastOpener = null;
        currentPropertyId = null;
    }

    document.addEventListener("DOMContentLoaded", function () {
        modal = document.getElementById("questionsModal");
        propertyNameEl = document.getElementById("qPropertyName");
        suggestEl = document.getElementById("qSuggestions");
        inputEl = document.getElementById("qInput");
        addBtn = document.getElementById("qAddBtn");
        listEl = document.getElementById("qList");

        if (addBtn) addBtn.addEventListener("click", function () {
            add(currentPropertyId, inputEl ? inputEl.value : "");
            if (inputEl) inputEl.value = "";
        });

        if (inputEl) inputEl.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                add(currentPropertyId, inputEl.value);
                inputEl.value = "";
            }
        });

        document.addEventListener("click", function (e) {
            var t = e.target;
            var su = t.closest ? t.closest("[data-vq-suggestion]") : null;
            if (su) {
                e.preventDefault();
                if (modal.hidden || !currentPropertyId) return;
                var idx = parseInt(su.getAttribute("data-vq-suggestion"), 10);
                if (SUGGESTIONS[idx]) add(currentPropertyId, SUGGESTIONS[idx]);
                return;
            }
            var rm = t.closest ? t.closest("[data-vq-remove]") : null;
            if (rm) {
                e.preventDefault();
                if (modal.hidden || !currentPropertyId) return;
                remove(rm.getAttribute("data-vq-remove"));
                return;
            }
            var cl = t.closest ? t.closest("[data-vq-close]") : null;
            if (cl) {
                e.preventDefault();
                close();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && modal && !modal.hidden) {
                close();
            }
        });

        renderSuggestions();
        load();
    });

    /* =====================================================
       API public
    ===================================================== */
    window.ViewingQuestions = {
        open: open,
        close: close,
        getForProperty: getForProperty,
        countForProperty: countForProperty,
        add: add,
        remove: remove
    };
})();