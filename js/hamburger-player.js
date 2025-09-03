// hamburger-player.js
(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    var body = document.body;
    var userBtn = document.querySelector('.user-btn');
    var userDropdown = document.querySelector('.user-dropdown');

    // Safe toggler for hamburger/nav
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        var expanded = hamburger.classList.toggle('active');
        navLinks.classList.toggle('active', expanded);
        body.classList.toggle('nav-open', expanded);
        // set ARIA for accessibility if present
        try {
          hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        } catch (err) {}
      });

      // Close nav if a link clicked (common expectation on mobile)
      navLinks.addEventListener('click', function (e) {
        var target = e.target;
        // If clicked on a link or inside a nav link, close nav
        if (target.closest && target.closest('a')) {
          hamburger.classList.remove('active');
          navLinks.classList.remove('active');
          body.classList.remove('nav-open');
          try { hamburger.setAttribute('aria-expanded', 'false'); } catch (err) {}
        }
      });

      // Close nav on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          hamburger.classList.remove('active');
          navLinks.classList.remove('active');
          body.classList.remove('nav-open');
        }
      });

      // Click outside to close nav
      document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target.closest('.nav-links') && !target.closest('.hamburger')) {
          hamburger.classList.remove('active');
          navLinks.classList.remove('active');
          body.classList.remove('nav-open');
        }
      });
    }

    // User menu toggling (accounts for mobile where dropdown becomes static)
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var shown = userDropdown.classList.toggle('show');
        // if nav is in mobile mode, keep nav open (don't change)
      });

      // click outside closes the user dropdown
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.user-menu')) {
          userDropdown.classList.remove('show');
        }
      });

      // close on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') userDropdown.classList.remove('show');
      });
    }

    /* ====== Mobile player tap/overlay fix ======
       Problem: some overlays or parent containers prevent taps from reaching the <video>.
       Fix approach:
       - On touch screens (<=768px) forward taps on .player-wrapper to the first inner <video>.
       - Don't interfere on desktop.
       - This is conservative and won't break desktop behavior.
    */
    function isMobileWidth() {
      return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    }

    var playerWrappers = Array.prototype.slice.call(document.querySelectorAll('.player-wrapper'));
    playerWrappers.forEach(function (wrapper) {
      // find the actual <video> element OR element with class "video-player" that is <video>
      var video = wrapper.querySelector('video') || wrapper.querySelector('.video-player video') || null;

      // if there's no video element, exit
      if (!video) {
        // If your player is not a <video> tag but uses a JS player,
        // we still add a tap handler that dispatches a click event to the wrapper
        // which many players listen for; this is fallback.
        wrapper.addEventListener('click', function (ev) {
          if (!isMobileWidth()) return;
          // dispatch a synthetic click which many players use to toggle play
          var synthetic = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
          wrapper.dispatchEvent(synthetic);
        });
        return;
      }

      // On mobile we forward taps to the video and toggle play/pause
      function onTapForward(ev) {
        if (!isMobileWidth()) return;
        // If the tap happened on a control element inside the wrapper, let it pass
        if (ev.target.closest && ev.target.closest('.player-controls')) return;

        // if video is paused -> play, else pause
        // use try/catch because some DRM or cross-origin players may block direct play()
        try {
          if (video.paused) {
            var promise = video.play();
            // If browser returns a promise, silence errors
            if (promise && promise.catch) promise.catch(function () {});
          } else {
            video.pause();
          }
        } catch (err) {
          // If we can't programmatically play, dispatch a click on the video element
          try { video.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch (err2) {}
        }
        // remove overlay class if you have one: let CSS know overlay can hide (non-destructive)
        var overlay = wrapper.querySelector('.play-button-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      }

      // Use touchend and click to be safe across devices
      wrapper.addEventListener('touchend', function (e) {
        onTapForward(e);
      }, { passive: true });

      wrapper.addEventListener('click', function (e) {
        onTapForward(e);
      });
    });

    // Keep behavior after window resize (optional best-effort)
    window.addEventListener('resize', function () {
      // no-op for now, but kept to allow future expansion if needed.
    });
  });
})();
