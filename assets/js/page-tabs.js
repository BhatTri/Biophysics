/* page-tabs.js — highlights the in-page tab (.p-tabs a[href="#id"]) of the section on screen. */
(function () {
  "use strict";
  const links = Array.prototype.slice.call(document.querySelectorAll('.p-tabs a[href^="#"]'));
  if (!links.length || !("IntersectionObserver" in window)) return;
  const byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove("active"); });
      if (window.scrollY < 150) return;   // still at the top of the page: nothing highlighted
      const a = byId[e.target.id];
      if (a) {
        a.classList.add("active");
        const bar = a.parentElement;   // keep the active tab visible on narrow screens (horizontal only)
        if (a.offsetLeft < bar.scrollLeft || a.offsetLeft + a.offsetWidth > bar.scrollLeft + bar.clientWidth) {
          bar.scrollLeft = a.offsetLeft - 16;
        }
      }
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  Object.keys(byId).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
})();
window.addEventListener("scroll", function () {
  if (window.scrollY < 150) document.querySelectorAll(".p-tabs a.active").forEach(function (a) { a.classList.remove("active"); });
}, { passive: true });
