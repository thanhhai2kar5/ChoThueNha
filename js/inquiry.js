/* =====================================================
   Inquiry — yêu cầu quan tâm (demo frontend minh bạch)
   Nạp TRƯỚC js/main.js trong index.html.
   Phụ thuộc:
     - js/ui.js (window.UI)
     - js/listings.js (window.Listings: byId)
===================================================== */
(function () {
    "use strict";

    var modal, form, successEl, propInput, nameInput, phoneInput, noteInput;

    function open(id) {
        var p = window.Listings.byId(id);
        if (!p) return;
        propInput.value = p.name + " — " + p.price + "/tháng";
        nameInput.value = "";
        phoneInput.value = "";
        noteInput.value = "";
        form.hidden = false;
        successEl.hidden = true;
        modal.hidden = false;
        document.body.classList.add("inquiry-open");
        nameInput.focus();
    }

    function close() {
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove("inquiry-open");
    }

    function submit(e) {
        e.preventDefault();
        if (!nameInput.value.trim() || !phoneInput.value.trim()) {
            UI.toast("Vui lòng nhập họ tên và số điện thoại.");
            return;
        }
        form.hidden = true;
        successEl.hidden = false;
    }

    document.addEventListener("DOMContentLoaded", function () {
        modal = document.getElementById("inquiryModal");
        form = document.getElementById("inquiryForm");
        successEl = document.getElementById("inquirySuccess");
        propInput = document.getElementById("iqProperty");
        nameInput = document.getElementById("iqName");
        phoneInput = document.getElementById("iqPhone");
        noteInput = document.getElementById("iqNote");

        if (form) form.addEventListener("submit", submit);

        document.addEventListener("click", function (e) {
            var closeEl = e.target.closest ? e.target.closest("[data-inquiry-close]") : null;
            if (closeEl) close();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && modal && !modal.hidden) close();
        });
    });

    /* =====================================================
       API public
    ===================================================== */
    window.Inquiry = {
        open: open,
        close: close
    };
})();