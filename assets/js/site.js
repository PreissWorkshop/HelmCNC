/* HelmCNC homepage — the only three client interactions on the page.
   No dependencies. Everything else is static HTML/CSS. */
(function () {
  'use strict';

  /* ---- 1 · live pendant: one source of markup, cloned into the hero ---- */
  var source = document.querySelector('[data-pendant-source] .pendant');
  if (source) {
    var mounts = document.querySelectorAll('[data-pendant-clone]');
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].children.length) continue;
      var copy = source.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');   // the section copy carries the label
      copy.removeAttribute('role');
      copy.removeAttribute('aria-label');
      mounts[i].appendChild(copy);
    }
  }

  /* ---- 2 · videos: attributes usually suffice, but some browsers need a nudge ---- */
  var vids = document.querySelectorAll('video.js-autoplay');
  for (var v = 0; v < vids.length; v++) {
    (function (el) {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.loop = true;
      var p = el.play && el.play();
      if (p && p.catch) p.catch(function () { /* blocked — poster stands in */ });
    })(vids[v]);
  }

  /* ---- 3 · FAQ: single-open accordion ---- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-item__q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var wasOpen = item.classList.contains('is-open');
      items.forEach(function (other) {
        other.classList.remove('is-open');
        var b = other.querySelector('.faq-item__q');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
