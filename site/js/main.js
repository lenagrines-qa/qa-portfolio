(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const nav = document.getElementById("nav");
  const menu = document.querySelector(".menu");
  menu.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    });
  });

  const checks = Array.prototype.slice.call(document.querySelectorAll("#checks li"));
  const status = document.getElementById("report-status");
  const report = document.querySelector(".report");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done = "5 / 5 passed. Ship it. (Then test production anyway.)";

  function finish() {
    checks.forEach(function (item) { item.classList.add("ok"); });
    report.classList.add("passed");
    status.textContent = done;
  }

  if (reduce) {
    finish();
  } else {
    checks.forEach(function (item, index) {
      window.setTimeout(function () {
        item.classList.add("ok");
        if (index === checks.length - 1) finish();
      }, 280 * (index + 1));
    });
  }

  const copyBtn = document.getElementById("copy-email");
  const copyStatus = document.getElementById("copy-status");
  function showCopied() {
    copyStatus.hidden = false;
    copyStatus.textContent = "Copied. Please do not log this as a P1.";
  }
  copyBtn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("lenagrines.qa@gmail.com").then(showCopied).catch(showCopied);
    } else {
      showCopied();
    }
  });
})();
