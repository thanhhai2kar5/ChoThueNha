/* =====================================================
   Main — điều phối + UI chung (slideshow, header scroll,
   menu mobile, event delegation, routing).
   Nạp CUỐI cùng trong index.html.
   Phụ thuộc:
     - js/data/properties.js (global `properties`)
     - js/listings.js (window.Listings: byId, applyFilter)
     - js/detail.js (window.Detail: openProperty, closeDetail)
     - js/favorites.js (window.Favorites)
     - js/filters.js (window.Filters)
===================================================== */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var L = window.Listings;
        var D = window.Detail;

        var homeView = document.getElementById("homeView");

        /* =====================================================
           Slideshow (discovery canvas)
        ===================================================== */
        var slidesData = [
            {
                title: "Một nơi ở /<br>không chỉ để ở.",
                desc: "Căn hộ cao cấp và villa riêng tư, được tuyển chọn cho nhu cầu ở dài hạn, gia đình hoặc phong cách sống yên tĩnh.",
                ids: ["can-ho-hoang-thanh", "can-ho-song-huong"]
            },
            {
                title: "Căn hộ đón sáng /<br>giữa lòng thành phố.",
                desc: "Nội thất đầy đủ tiện nghi, vị trí thuận tiện, phù hợp với nhịp sống năng động của thành phố.",
                ids: ["can-ho-ngoc-anh", "can-ho-an-cuu"]
            },
            {
                title: "Một khoảng riêng /<br>để trở về.",
                desc: "Villa có sân vườn, ánh sáng tự nhiên và không gian rộng rãi dành cho gia đình và sự yên tĩnh.",
                ids: ["villa-thuy-bieu", "villa-kim-long"]
            }
        ];

        var heroSlides = document.querySelectorAll(".hero-slide");
        var titleEl = document.getElementById("heroTitle");
        var descEl = document.getElementById("heroDesc");
        var teaserList = document.getElementById("teaserList");
        var countEl = document.getElementById("heroCount");
        var dotsContainer = document.getElementById("dots");
        var prevBtn = document.getElementById("prevSlide");
        var nextBtn = document.getElementById("nextSlide");
        var currentSlide = 0;
        var slideInterval = 5000;
        var timer;

        slidesData.forEach(function (_, index) {
            var dot = document.createElement("button");
            dot.className = "dot" + (index === 0 ? " active" : "");
            dot.setAttribute("aria-label", "Chuyển đến slide " + (index + 1));
            dot.addEventListener("click", function () {
                goToSlide(index);
                restartTimer();
            });
            dotsContainer.appendChild(dot);
        });

        var dots = dotsContainer.querySelectorAll(".dot");

        function renderTeasers(ids) {
            teaserList.innerHTML = "";
            ids.forEach(function (id) {
                var p = L.byId(id);
                if (!p) return;
                var teaser = document.createElement("div");
                teaser.className = "teaser";
                teaser.setAttribute("aria-hidden", "true");

                var thumb = document.createElement("span");
                thumb.className = "teaser-thumb";
                var img = document.createElement("img");
                img.src = p.images[0].src;
                img.alt = p.images[0].alt;
                img.loading = "lazy";
                thumb.appendChild(img);

                var body = document.createElement("span");
                body.className = "teaser-body";
                var type = document.createElement("span");
                type.className = "teaser-type";
                type.textContent = p.type;
                var name = document.createElement("span");
                name.className = "teaser-name";
                name.textContent = p.name;
                body.appendChild(type);
                body.appendChild(name);

                var price = document.createElement("span");
                price.className = "teaser-price";
                price.innerHTML = p.price + "<small>/tháng</small>";

                teaser.appendChild(thumb);
                teaser.appendChild(body);
                teaser.appendChild(price);
                teaserList.appendChild(teaser);
            });
        }

        function goToSlide(index) {
            heroSlides[currentSlide].classList.remove("active");
            dots[currentSlide].classList.remove("active");
            currentSlide = (index + slidesData.length) % slidesData.length;
            heroSlides[currentSlide].classList.add("active");
            dots[currentSlide].classList.add("active");

            var slide = slidesData[currentSlide];
            titleEl.classList.remove("swap");
            void titleEl.offsetWidth;
            titleEl.classList.add("swap");
            titleEl.innerHTML = slide.title;
            descEl.textContent = slide.desc;
            countEl.textContent = ("0" + (currentSlide + 1)) + " / 0" + slidesData.length;
            renderTeasers(slide.ids);
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function restartTimer() {
            clearInterval(timer);
            timer = setInterval(nextSlide, slideInterval);
        }

        prevBtn.addEventListener("click", function () {
            goToSlide(currentSlide - 1);
            restartTimer();
        });

        nextBtn.addEventListener("click", function () {
            goToSlide(currentSlide + 1);
            restartTimer();
        });

        restartTimer();

        /* =====================================================
           Header scroll state
        ===================================================== */
        var header = document.getElementById("siteHeader");

        function updateHeader() {
            header.classList.toggle("scrolled", window.scrollY > 10);
        }

        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();

        /* =====================================================
           Menu mobile
        ===================================================== */
        var navToggle = document.getElementById("navToggle");
        var nav = document.getElementById("mainNav");

        navToggle.addEventListener("click", function () {
            nav.classList.toggle("open");
            navToggle.classList.toggle("open");
        });

        nav.querySelectorAll(".nav-link").forEach(function (link) {
            link.addEventListener("click", function () {
                nav.classList.remove("open");
                navToggle.classList.remove("open");
                if (!homeView.hidden) D.closeDetail();
            });
        });

        /* =====================================================
           Event delegation: cards, filters, fav, hash anchors
           (renderList mặc định đã chạy trong js/listings.js)
        ===================================================== */
        document.addEventListener("click", function (e) {
            var fav = e.target.closest(".fav");
            if (fav) {
                e.preventDefault();
                e.stopPropagation();
                var favCard = fav.closest("[data-property]");
                if (favCard && window.Favorites) {
                    window.Favorites.toggle(favCard.getAttribute("data-property"));
                }
                return;
            }

            var filterEl = e.target.closest("[data-filter]");
            if (filterEl) {
                e.preventDefault();
                if (window.Filters) {
                    window.Filters.setFilter(filterEl.getAttribute("data-filter"));
                } else {
                    L.applyFilter(filterEl.getAttribute("data-filter"));
                }
                return;
            }

            var propEl = e.target.closest("[data-property]");
            if (propEl) {
                e.preventDefault();
                D.openProperty(propEl.getAttribute("data-property"));
                return;
            }

            var anchor = e.target.closest("a[href^='#']");
            if (anchor && !homeView.hidden) {
                D.closeDetail();
            }
        });

        document.addEventListener("keydown", function (e) {
            var el = e.target;
            if (el && el.hasAttribute && el.hasAttribute("data-property") && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                D.openProperty(el.getAttribute("data-property"));
            }
        });

        /* =====================================================
           Init (routing qua syncRoute trong js/detail.js)
        ===================================================== */
        renderTeasers(slidesData[0].ids);
    });
})();