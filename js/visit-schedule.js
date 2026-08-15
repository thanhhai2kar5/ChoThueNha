/* =====================================================
   Visit Schedule — lịch xem nhà (demo, chỉ lưu trên thiết bị)
   Nạp SAU js/inquiry.js, TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/ui.js (window.UI)
     - js/listings.js (window.Listings: byId)
===================================================== */
(function () {
    "use strict";

    var KEY = "chothuenha:visit-schedules";
    var SLOTS = ["09:00–10:00", "10:30–11:30", "14:00–15:00", "16:00–17:00"];

    var records = [];
    var bookingModal, listModal, dateInput, propertyNameEl, propertyPriceEl, visitContent, countEl;
    var confirmLayer, confirmSummary;
    var selectedTime = "";
    var currentPropertyId = null;
    var lastOpener = null;
    var pendingCancelId = null;
    var lastCancelBtn = null;

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function isValidRecord(r) {
        return r && typeof r.id === "string" && typeof r.propertyId === "string" &&
            typeof r.propertyName === "string" && typeof r.propertyPrice === "string" &&
            typeof r.date === "string" && typeof r.time === "string" &&
            SLOTS.indexOf(r.time) !== -1;
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

    function getAll() {
        return records.slice().sort(function (a, b) {
            var d = a.date.localeCompare(b.date);
            return d !== 0 ? d : a.time.localeCompare(b.time);
        });
    }

    function count() {
        return records.length;
    }

    function isValidDate(s) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
        var p = s.split("-");
        var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
        var dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    }

    function formatViDate(s) {
        var p = s.split("-");
        var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
        if (!y || !m || !d) return s;
        var dt = new Date(y, m - 1, d);
        var wd = dt.toLocaleDateString("vi-VN", { weekday: "long" });
        wd = wd.charAt(0).toUpperCase() + wd.slice(1);
        return wd + ", ngày " + d + " tháng " + m + " năm " + y;
    }

    function renderCount() {
        if (countEl) countEl.textContent = String(count());
    }

    function selectSlot(time) {
        if (SLOTS.indexOf(time) === -1) return;
        selectedTime = time;
        var btns = bookingModal ? bookingModal.querySelectorAll("[data-visit-time]") : [];
        for (var i = 0; i < btns.length; i++) {
            var on = btns[i].getAttribute("data-visit-time") === time;
            btns[i].setAttribute("aria-pressed", on ? "true" : "false");
            btns[i].classList.toggle("active", on);
        }
    }

    function clearSlotSelection() {
        selectedTime = "";
        var btns = bookingModal ? bookingModal.querySelectorAll("[data-visit-time]") : [];
        for (var i = 0; i < btns.length; i++) {
            btns[i].setAttribute("aria-pressed", "false");
            btns[i].classList.remove("active");
        }
    }

    function saveBooking() {
        if (!currentPropertyId) return;
        var p = window.Listings.byId(currentPropertyId);
        if (!p) return;
        var date = dateInput ? dateInput.value : "";
        if (!date) {
            UI.toast("Vui lòng chọn ngày xem.");
            return;
        }
        if (!isValidDate(date)) {
            UI.toast("Ngày xem không hợp lệ.");
            return;
        }
        if (date < todayStr()) {
            UI.toast("Ngày xem không thể trước hôm nay.");
            return;
        }
        if (!selectedTime) {
            UI.toast("Vui lòng chọn một khung giờ xem.");
            return;
        }
        var dup = records.some(function (r) {
            return r.propertyId === currentPropertyId && r.date === date && r.time === selectedTime;
        });
        if (dup) {
            UI.toast("Bạn đã đặt lịch xem căn này vào khung giờ này rồi.");
            return;
        }
        records.push({
            id: "vs-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            propertyId: p.id,
            propertyName: p.name,
            propertyPrice: p.price,
            date: date,
            time: selectedTime,
            createdAt: new Date().toISOString()
        });
        save();
        renderCount();
        close();
        UI.dispatch("visit:changed");
        UI.toast("Đã lưu lịch xem " + p.name + ".");
    }

    function cancel(id) {
        var idx = -1;
        for (var i = 0; i < records.length; i++) {
            if (records[i].id === id) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return;
        var rec = records[idx];
        pendingCancelId = id;
        if (confirmSummary) {
            confirmSummary.textContent = formatViDate(rec.date) + " · " + rec.time + " — " + rec.propertyName;
        }
        if (confirmLayer) {
            confirmLayer.hidden = false;
            var keepBtn = confirmLayer.querySelector("[data-visit-keep]");
            if (keepBtn && keepBtn.focus) {
                keepBtn.focus();
            }
        }
    }

    function confirmCancel() {
        if (!pendingCancelId) return;
        var idx = -1;
        for (var i = 0; i < records.length; i++) {
            if (records[i].id === pendingCancelId) {
                idx = i;
                break;
            }
        }
        pendingCancelId = null;
        lastCancelBtn = null;
        if (idx === -1) {
            if (confirmLayer) confirmLayer.hidden = true;
            return;
        }
        var rec = records[idx];
        records.splice(idx, 1);
        save();
        renderCount();
        renderList();
        UI.dispatch("visit:changed");
        if (confirmLayer) confirmLayer.hidden = true;
        UI.toast("Đã hủy lịch xem " + rec.propertyName + ".");
        var explore = visitContent && visitContent.querySelector ? visitContent.querySelector("[data-visit-explore]") : null;
        if (explore && explore.focus) {
            explore.focus();
            return;
        }
        var card = listModal ? listModal.querySelector(".inquiry-card") : null;
        if (card && card.focus) card.focus();
    }

    function dismissConfirm() {
        pendingCancelId = null;
        if (confirmLayer) confirmLayer.hidden = true;
        if (lastCancelBtn && lastCancelBtn.focus) {
            try { lastCancelBtn.focus(); } catch (e) {}
        }
        lastCancelBtn = null;
    }

    function open(propertyId) {
        var p = window.Listings.byId(propertyId);
        if (!p) {
            UI.toast("Không tìm thấy căn này.");
            return;
        }
        closeList();
        currentPropertyId = p.id;
        if (propertyNameEl) propertyNameEl.textContent = p.name;
        if (propertyPriceEl) propertyPriceEl.textContent = p.price + " / tháng";
        selectedTime = "";
        if (dateInput) {
            dateInput.value = "";
            dateInput.min = todayStr();
        }
        clearSlotSelection();
        lastOpener = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
        bookingModal.hidden = false;
        document.body.classList.add("visit-open");
        if (dateInput && dateInput.focus) {
            dateInput.focus();
        } else {
            var card = bookingModal.querySelector(".inquiry-card");
            if (card && card.focus) card.focus();
        }
    }

    function close() {
        if (!bookingModal) return;
        bookingModal.hidden = true;
        document.body.classList.remove("visit-open");
        if (lastOpener && lastOpener.focus) {
            try { lastOpener.focus(); } catch (e) {}
        }
        lastOpener = null;
    }

    function renderList() {
        if (!visitContent) return;
        var list = getAll();
        if (list.length === 0) {
            visitContent.innerHTML =
                '<div class="visit-empty">' +
                '<h3>Bạn chưa có lịch xem nào</h3>' +
                '<p>Khi tìm được căn phù hợp, hãy chọn một khung giờ để lưu lịch xem tại đây.</p>' +
                '<button type="button" class="btn btn-coral" data-visit-explore>Khám phá danh sách</button>' +
                '</div>';
            return;
        }
        visitContent.innerHTML = list.map(function (r) {
            return '<div class="visit-item">' +
                '<div class="visit-item-main">' +
                '<strong class="visit-item-name">' + UI.esc(r.propertyName) + '</strong>' +
                '<span class="visit-item-price">' + UI.esc(r.propertyPrice) + ' / tháng</span>' +
                '<span class="visit-item-when">' + formatViDate(r.date) + ' · ' + UI.esc(r.time) + '</span>' +
                '</div>' +
                '<button type="button" class="btn btn-outline btn-sm visit-cancel" data-visit-cancel="' + r.id + '">Hủy lịch</button>' +
                '</div>';
        }).join("");
    }

    function openList() {
        close();
        renderList();
        lastOpener = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null;
        listModal.hidden = false;
        document.body.classList.add("visit-open");
        var card = listModal.querySelector(".inquiry-card");
        if (card && card.focus) card.focus();
    }

    function closeList() {
        if (!listModal) return;
        listModal.hidden = true;
        if (confirmLayer) confirmLayer.hidden = true;
        pendingCancelId = null;
        lastCancelBtn = null;
        document.body.classList.remove("visit-open");
        if (lastOpener && lastOpener.focus) {
            try { lastOpener.focus(); } catch (e) {}
        }
        lastOpener = null;
    }

    document.addEventListener("DOMContentLoaded", function () {
        bookingModal = document.getElementById("visitModal");
        listModal = document.getElementById("visitListModal");
        dateInput = document.getElementById("visitDate");
        propertyNameEl = document.getElementById("visitPropertyName");
        propertyPriceEl = document.getElementById("visitPropertyPrice");
        visitContent = document.getElementById("visitListContent");
        countEl = document.getElementById("visitCount");
        confirmLayer = document.getElementById("visitConfirm");
        confirmSummary = document.getElementById("visitConfirmSummary");
        var visitToggle = document.getElementById("visitToggle");
        if (visitToggle) visitToggle.addEventListener("click", openList);

        document.addEventListener("click", function (e) {
            var t = e.target;
            var cy = t.closest ? t.closest("[data-visit-confirm-yes]") : null;
            if (cy) {
                e.preventDefault();
                confirmCancel();
                return;
            }
            var kp = t.closest ? t.closest("[data-visit-keep]") : null;
            if (kp) {
                e.preventDefault();
                dismissConfirm();
                return;
            }
            var cf = t.closest ? t.closest("[data-visit-confirm-close]") : null;
            if (cf) {
                e.preventDefault();
                dismissConfirm();
                return;
            }
            if (confirmLayer && !confirmLayer.hidden && t.closest && t.closest("[data-visit-list-close]")) {
                e.preventDefault();
                dismissConfirm();
                return;
            }
            var sl = t.closest ? t.closest("[data-visit-time]") : null;
            if (sl) {
                e.preventDefault();
                selectSlot(sl.getAttribute("data-visit-time"));
                return;
            }
            var sv = t.closest ? t.closest("[data-visit-save]") : null;
            if (sv) {
                e.preventDefault();
                saveBooking();
                return;
            }
            var cn = t.closest ? t.closest("[data-visit-cancel]") : null;
            if (cn) {
                e.preventDefault();
                lastCancelBtn = cn;
                cancel(cn.getAttribute("data-visit-cancel"));
                return;
            }
            var ex = t.closest ? t.closest("[data-visit-explore]") : null;
            if (ex) {
                e.preventDefault();
                closeList();
                var ds = document.getElementById("danh-sach");
                if (ds && ds.scrollIntoView) ds.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            var cb = t.closest ? t.closest("[data-visit-close]") : null;
            if (cb) {
                e.preventDefault();
                close();
                return;
            }
            var cl = t.closest ? t.closest("[data-visit-list-close]") : null;
            if (cl) {
                e.preventDefault();
                closeList();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if (confirmLayer && !confirmLayer.hidden) {
                dismissConfirm();
                return;
            }
            if (bookingModal && !bookingModal.hidden) {
                close();
            } else if (listModal && !listModal.hidden) {
                closeList();
            }
        });

        load();
        renderCount();
    });

    /* =====================================================
       API public
    ===================================================== */
    window.VisitSchedule = {
        open: open,
        close: close,
        openList: openList,
        getAll: getAll,
        cancel: cancel
    };
})();