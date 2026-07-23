(function () {
  const STORAGE_KEY = "resa-smaland-music-muted-v1";
  const DEFAULT_VOLUME = 0.4;

  function $(sel) {
    return document.querySelector(sel);
  }

  function setMutedPref(muted) {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  }

  function updateUi(playing, needsGesture) {
    const btn = $("#btn-trip-music");
    const label = $("#trip-music-label");
    const overlay = $("#music-start-overlay");
    if (!btn || !label) return;

    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.classList.toggle("is-playing", playing);
    btn.classList.toggle("needs-gesture", Boolean(needsGesture) && !playing);

    if (overlay) {
      overlay.hidden = playing || !needsGesture;
    }

    if (needsGesture && !playing) {
      label.textContent = "Tryck för musik";
    } else if (playing) {
      label.textContent = "Pausa musik";
    } else {
      label.textContent = "Spela musik";
    }
  }

  async function tryPlay(audio) {
    audio.muted = false;
    audio.volume = DEFAULT_VOLUME;
    await audio.play();
    setMutedPref(false);
    updateUi(true, false);
  }

  async function pause(audio) {
    audio.pause();
    setMutedPref(true);
    updateUi(false, false);
  }

  function hideOverlay() {
    const overlay = $("#music-start-overlay");
    if (overlay) overlay.hidden = true;
  }

  function initMusic() {
    const audio = $("#trip-music");
    const btn = $("#btn-trip-music");
    if (!audio || !btn) return;

    let gestureBound = false;

    const startFromGesture = async () => {
      if (!audio.paused) {
        hideOverlay();
        return;
      }
      try {
        await tryPlay(audio);
        hideOverlay();
      } catch {
        updateUi(false, true);
      }
    };

    const bindGestureFallback = () => {
      if (gestureBound) return;
      gestureBound = true;
      updateUi(false, true);

      const onGesture = async (event) => {
        if (event.target.closest("#btn-trip-music")) return;
        document.removeEventListener("pointerdown", onGesture, true);
        document.removeEventListener("keydown", onGesture, true);
        await startFromGesture();
      };

      document.addEventListener("pointerdown", onGesture, true);
      document.addEventListener("keydown", onGesture, true);
    };

    $("#music-start-overlay")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await startFromGesture();
    });

    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        if (audio.paused) {
          await tryPlay(audio);
          hideOverlay();
        } else {
          await pause(audio);
        }
      } catch {
        updateUi(false, true);
        bindGestureFallback();
      }
    });

    audio.addEventListener("play", () => {
      hideOverlay();
      updateUi(true, false);
    });
    audio.addEventListener("pause", () => {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        updateUi(false, false);
      } else {
        updateUi(false, true);
      }
    });
    audio.addEventListener("error", () => {
      hideOverlay();
      updateUi(false, false);
      const label = $("#trip-music-label");
      if (label) label.textContent = "Musikfil saknas";
      btn.disabled = true;
    });

    // Always try to start immediately on every visit.
    audio.setAttribute("autoplay", "");
    audio.load();

    let started = false;
    const attempt = () => {
      if (started || !audio.paused) return;
      started = true;
      tryPlay(audio).catch(() => {
        started = false;
        bindGestureFallback();
      });
    };

    if (audio.readyState >= 2) {
      attempt();
    } else {
      audio.addEventListener("canplay", attempt, { once: true });
      setTimeout(attempt, 400);
    }
  }

  window.TripMusic = { initMusic };
})();
