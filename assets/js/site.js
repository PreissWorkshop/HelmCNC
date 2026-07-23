/* HelmCNC homepage — client behaviour. No dependencies.
   Three concerns: the FAQ accordion, decode-safe video playback,
   and the interactive phone pendant (one per mount, independent state). */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     1 · FAQ — single-open accordion
     ══════════════════════════════════════════════════════════ */

  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-item__q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var wasOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
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

  /* ══════════════════════════════════════════════════════════
     2 · Video — decode-safe playback

     Three clips playing at once can blow a browser's video-decode
     budget and black them all out (MEDIA_ERR_DECODE). So: the poster
     is painted on the wrapper (CSS), the clip itself stays at
     opacity 0 until it is genuinely playing, and only the clip in
     view is allowed to run. A failed clip fades back to its poster —
     a video is never a black box.
     ══════════════════════════════════════════════════════════ */

  var videos = Array.prototype.slice.call(document.querySelectorAll('video.js-video'));

  if (videos.length) {
    var inView = typeof Set === 'function' ? new Set() : null;
    var seen = [];                              // fallback membership test
    var isInView = function (v) { return inView ? inView.has(v) : seen.indexOf(v) !== -1; };
    var addInView = function (v) { if (inView) inView.add(v); else if (seen.indexOf(v) === -1) seen.push(v); };
    var delInView = function (v) {
      if (inView) inView.delete(v);
      else { var i = seen.indexOf(v); if (i !== -1) seen.splice(i, 1); }
    };

    var tryPlay = function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* blocked — the poster stands in */ });
    };

    videos.forEach(function (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;

      // The observer decides what plays, not the autoplay attribute.
      v.autoplay = false;
      v.removeAttribute('autoplay');
      try { v.pause(); } catch (e) {}

      // The wrapper already shows the poster, so drop the attribute and
      // fade the clip in over it once frames are actually arriving.
      v.removeAttribute('poster');
      v.style.transition = 'opacity .35s ease';
      v.style.opacity = '0';

      var show = function () { v.style.opacity = '1'; };
      v.addEventListener('playing', show);
      v.addEventListener('timeupdate', function () { if (v.currentTime > 0.05) show(); });

      var retried = false;
      v.addEventListener('error', function () {
        v.style.opacity = '0';
        if (retried) return;
        retried = true;
        setTimeout(function () {
          try {
            v.load();
            if (isInView(v)) tryPlay(v);
          } catch (e) {}
        }, 800);
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting && en.intersectionRatio >= 0.35) {
            addInView(v);
            tryPlay(v);
          } else {
            delInView(v);
            try { v.pause(); } catch (e) {}
          }
        });
      }, { threshold: [0, 0.35, 0.6] });
      videos.forEach(function (v) { io.observe(v); });
    } else {
      // No observer: fall back to the old behaviour rather than no video.
      videos.forEach(function (v) { addInView(v); tryPlay(v); });
    }
  }

  /* ══════════════════════════════════════════════════════════
     3 · Interactive pendant

     The markup lives once, in the Pendant section, so it still
     renders without JavaScript. Here we clone it into the hero
     mount and wire each copy up with its own state — the two
     phones are operated independently.
     ══════════════════════════════════════════════════════════ */

  var source = document.querySelector('[data-pendant-source] .pendant');
  if (source) {
    var mounts = document.querySelectorAll('[data-pendant-clone]');
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].children.length) continue;
      mounts[i].appendChild(source.cloneNode(true));
    }
    Array.prototype.slice.call(document.querySelectorAll('.pendant')).forEach(initPendant);
  }

  function initPendant(root) {
    var state = {
      tab: 'JOG', jogMode: 'CONT', running: true,
      feed: 100, spindle: 100, speed: 8, estop: false
    };
    var base = { x: 0, y: 0, z: 74 };

    var $  = function (sel) { return root.querySelector(sel); };
    var $$ = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

    var panes     = $$('.pdt-pane');
    var tabs      = $$('.pdt-tabs__tab');
    var modeBtns  = $$('.pdt-modes__btn');
    var stateChip = $('[data-state-chip]');
    var stateText = $('[data-state-text]');
    var runFill   = $('[data-run-fill]');
    var runState  = $('[data-run-state]');
    var runBtn    = $('[data-run-toggle]');
    var runIcon   = $('[data-run-icon]');
    var runLabel  = $('[data-run-label]');
    var estopBtn  = $('[data-estop]');
    var estopText = $('[data-estop-text]');

    /* ---- render ---- */

    function render() {
      panes.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-pane') === state.tab);
      });
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === state.tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      modeBtns.forEach(function (m) {
        var on = m.getAttribute('data-mode') === state.jogMode;
        m.classList.toggle('is-on', on);
        m.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var label = state.estop ? 'STOP'
                : (state.tab === 'RUN' && state.running ? 'RUN' : 'IDLE');
      if (stateChip) stateChip.setAttribute('data-state', label);
      if (stateText) stateText.textContent = label;

      if (runFill)  runFill.classList.toggle('is-running', state.running);
      if (runState) runState.textContent = state.running ? 'running' : 'paused';
      if (runBtn) {
        runBtn.classList.toggle('is-running', state.running);
        if (runIcon)  runIcon.textContent  = state.running ? '❚❚' : '▶';
        if (runLabel) runLabel.textContent = state.running ? 'PAUSE' : 'RESUME';
      }

      if (estopBtn) {
        estopBtn.classList.toggle('is-tripped', state.estop);
        estopBtn.setAttribute('aria-pressed', state.estop ? 'true' : 'false');
      }
      if (estopText) estopText.textContent = state.estop ? 'RESET' : 'E-STOP';
    }

    /* ---- discrete controls ---- */

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        state.tab = t.getAttribute('data-tab');
        render();
      });
    });

    modeBtns.forEach(function (m) {
      m.addEventListener('click', function () {
        state.jogMode = m.getAttribute('data-mode');
        render();
      });
    });

    if (runBtn) runBtn.addEventListener('click', function () {
      state.running = !state.running;
      state.estop = false;
      render();
    });

    if (estopBtn) estopBtn.addEventListener('click', function () {
      state.estop = !state.estop;
      state.running = false;
      render();
    });

    $$('.pdt-row').forEach(function (row) {
      var t;
      row.addEventListener('click', function () {
        row.classList.add('is-pressed');
        clearTimeout(t);
        t = setTimeout(function () { row.classList.remove('is-pressed'); }, 280);
      });
    });

    /* ---- sliders ---- */

    $$('.pdt-slider').forEach(function (track) {
      var key = track.getAttribute('data-slider');
      var min = parseFloat(track.getAttribute('data-min'));
      var max = parseFloat(track.getAttribute('data-max'));
      var fill   = track.querySelector('.pdt-slider__fill');
      var handle = track.querySelector('.pdt-slider__handle');
      var out    = root.querySelector('[data-out="' + key + '"]');
      var dragging = false;

      function apply(val) {
        val = Math.max(min, Math.min(max, val));
        state[key] = val;
        var pct = (((val - min) / (max - min)) * 100).toFixed(1) + '%';
        if (fill)   fill.style.width = pct;
        if (handle) handle.style.left = pct;
        if (out)    out.textContent = val + '%';
        track.setAttribute('aria-valuenow', val);
        track.setAttribute('aria-valuetext', val + ' percent');
      }

      function fromPointer(e) {
        var r = track.getBoundingClientRect();
        var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        // snap to 5 — same feel as the hardware overrides
        apply(Math.round((min + f * (max - min)) / 5) * 5);
      }

      track.addEventListener('pointerdown', function (e) {
        dragging = true;
        track.classList.add('is-dragging');
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
        fromPointer(e);
      });
      track.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        e.preventDefault();
        fromPointer(e);
      });
      var release = function () { dragging = false; track.classList.remove('is-dragging'); };
      track.addEventListener('pointerup', release);
      track.addEventListener('pointercancel', release);

      track.addEventListener('keydown', function (e) {
        var v = state[key], step = 5;
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') v -= step;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
        else if (e.key === 'PageDown') v -= step * 5;
        else if (e.key === 'PageUp')   v += step * 5;
        else if (e.key === 'Home') v = min;
        else if (e.key === 'End')  v = max;
        else return;
        e.preventDefault();
        apply(v);
      });
    });

    /* ---- jog joystick + Z stick ----
       Both idle-drift on their own in CSS, take a direct drag, and
       spring back to centre on release. Dragging writes the transform
       straight to the element so it tracks the finger with no lag. */

    function dro(axis, value) {
      var el = root.querySelector('[data-dro="' + axis + '"]');
      if (el) el.textContent = value.toFixed(3);
    }

    function grabbable(el, onDown, onMove, onUp) {
      if (!el) return;
      var active = false;
      el.addEventListener('pointerdown', function (e) {
        active = true;
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        el.style.animation = 'none';
        el.style.transition = 'none';
        el.style.cursor = 'grabbing';
        onDown(e);
      });
      el.addEventListener('pointermove', function (e) {
        if (!active) return;
        e.preventDefault();
        onMove(e);
      });
      var release = function () {
        if (!active) return;
        active = false;
        el.style.cursor = 'grab';
        el.style.transition = 'transform .34s cubic-bezier(.34,1.4,.5,1)';
        onUp();
        clearTimeout(el.__springT);
        el.__springT = setTimeout(function () {
          el.style.transition = 'none';
          el.style.transform = '';
          el.style.animation = '';        // hand the idle drift back to CSS
        }, 360);
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
    }

    var knob = $('[data-joy]');
    var knobR = 0;
    grabbable(knob,
      function (e) {
        var r = knob.parentElement.getBoundingClientRect();
        knobR = Math.max(20, r.width * 0.30);
        moveKnob(e);
      },
      function (e) { moveKnob(e); },
      function () {
        knob.style.transform = 'translate(0px, 0px)';
        dro('X', base.x); dro('Y', base.y);
      });

    function moveKnob(e) {
      var r = knob.parentElement.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > knobR) { dx = dx / d * knobR; dy = dy / d * knobR; }
      knob.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
      dro('X', base.x + (dx / knobR) * 25);
      dro('Y', base.y + (-dy / knobR) * 25);
    }

    var zgrip = $('[data-zstick]');
    var zR = 0;
    grabbable(zgrip,
      function (e) {
        var r = zgrip.parentElement.getBoundingClientRect();
        zR = Math.max(20, r.height * 0.34);
        moveZ(e);
      },
      function (e) { moveZ(e); },
      function () {
        zgrip.style.transform = 'translateY(0px)';
        dro('Z', base.z);
      });

    function moveZ(e) {
      var r = zgrip.parentElement.getBoundingClientRect();
      var dy = e.clientY - (r.top + r.height / 2);
      dy = Math.max(-zR, Math.min(zR, dy));
      zgrip.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
      dro('Z', base.z + (-(dy / zR) * 20));
    }

    render();
  }
})();
