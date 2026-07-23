(function () {
  const STORAGE_KEY = "resa-smaland-music-muted-v1";
  const DEFAULT_VOLUME = 0.35;

  function $(sel) {
    return document.querySelector(sel);
  }

  function wasMuted() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function setMutedPref(muted) {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  }

  function updateUi(playing, needsGesture) {
    const btn = $("#btn-trip-music");
    const label = $("#trip-music-label");
    if (!btn || !label) return;

    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.classList.toggle("is-playing", playing);
    btn.classList.toggle("needs-gesture", Boolean(needsGesture) && !playing);

    if (needsGesture && !playing) {
      label.textContent = "Tryck för musik";
    } else if (playing) {
      label.textContent = "Pausa musik";
    } else {
      label.textContent = "Spela musik";
    }
  }

  async function tryPlay(audio) {
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

  function initMusic() {
    const audio = $("#trip-music");
    const btn = $("#btn-trip-music");
    if (!audio || !btn) return;

    let gestureBound = false;

    const bindGestureFallback = () => {
      if (gestureBound || wasMuted()) return;
      gestureBound = true;
      const startOnGesture = async () => {
        document.removeEventListener("pointerdown", startOnGesture);
        document.removeEventListener("keydown", startOnGesture);
        if (wasMuted() || !audio.paused) return;
        try {
          await tryPlay(audio);
        } catch {
          updateUi(false, true);
        }
      };
      document.addEventListener("pointerdown", startOnGesture, { once: true });
      document.addEventListener("keydown", startOnGesture, { once: true });
    };

    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        if (audio.paused) {
          await tryPlay(audio);
        } else {
          await pause(audio);
        }
      } catch {
        updateUi(false, true);
      }
    });

    audio.addEventListener("play", () => updateUi(true, false));
    audio.addEventListener("pause", () => {
      if (!wasMuted()) updateUi(false, true);
      else updateUi(false, false);
    });
    audio.addEventListener("error", () => {
      updateUi(false, false);
      const label = $("#trip-music-label");
      if (label) label.textContent = "Musikfil saknas";
      btn.disabled = true;
      btn.title = "Lägg en MP3 i web/audio/resa-theme.mp3";
    });

    if (wasMuted()) {
      updateUi(false, false);
      return;
    }

    tryPlay(audio).catch(() => {
      updateUi(false, true);
      bindGestureFallback();
    });
  }

  window.TripMusic = { initMusic };
})();
