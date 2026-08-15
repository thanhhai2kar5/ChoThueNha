/* =====================================================
   UI — tiện ích dùng chung (toast, escape, custom event)
   Nạp TRƯỚC các module khác trong index.html.
   Phụ thuộc: không (chỉ dùng DOM global).
===================================================== */
(function () {
    "use strict";

    var toastEl = document.getElementById("toast");
    var toastTimer;

    function toast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove("show");
        }, 2600);
    }

    function esc(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function dispatch(name) {
        if (typeof CustomEvent !== "undefined" && document.dispatchEvent) {
            document.dispatchEvent(new CustomEvent(name));
        }
    }

    /* =====================================================
       API public
    ===================================================== */
    window.UI = {
        toast: toast,
        esc: esc,
        dispatch: dispatch
    };
})();