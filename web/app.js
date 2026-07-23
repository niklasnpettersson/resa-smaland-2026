(function () {
  const STORAGE_KEYS = {
    notes: "resa-smaland-notes-v1",
    checklist: "resa-smaland-checklist-v1",
    packing: "resa-smaland-packing-v1",
    draft: "resa-smaland-draft-v1",
  };

  let activeDayId = TRIP_DATA.days[0].id;
  let editingNoteId = null;
  let saveTimer = null;
  let currentPosition = null;
  const photoObjectUrls = new Map();

  const $ = (sel) => document.querySelector(sel);

  function mapsUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function mapsCoordsUrl(lat, lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
  }

  function getTodayDayId() {
    const today = new Date();
    const id = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    return TRIP_DATA.days.some((day) => day.id === id) ? id : null;
  }

  function getPlacesWithCoords() {
    return Object.entries(TRIP_DATA.addresses)
      .filter(([, addr]) => typeof addr.lat === "number" && typeof addr.lng === "number")
      .map(([key, addr]) => ({ key, ...addr }));
  }

  function findNearestPlace(lat, lng) {
    return getPlacesWithCoords()
      .map((place) => ({ ...place, distanceKm: haversineKm(lat, lng, place.lat, place.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString("sv-SE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setSaveStatus(state) {
    const el = $("#save-status");
    if (!el) return;
    if (state === "pending") {
      el.textContent = "Sparar…";
      el.classList.add("is-pending");
    } else {
      el.textContent = "Sparat";
      el.classList.remove("is-pending");
    }
  }

  function renderQuote() {
    const quotes = TRIP_DATA.smalandQuotes;
    if (!quotes?.length) return;
    const box = $("#header-quote");
    const textEl = $("#header-quote-text");
    const byEl = $("#header-quote-by");
    if (!box || !textEl || !byEl) return;

    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    textEl.textContent = `”${quote.text}”`;
    byEl.textContent = `— ${quote.by}`;
    box.hidden = false;
  }

  function renderOverview() {
    const timeline = $("#overview-timeline");
    timeline.innerHTML = TRIP_DATA.overview
      .map(
        (item) => `
        <li>
          <div class="timeline-date">
            ${item.date}
            <span class="timeline-weekday">${item.weekday}</span>
          </div>
          <div>
            <strong>${item.title}</strong><br />
            <span class="help-text">${item.summary}</span>
          </div>
        </li>`
      )
      .join("");
  }

  function renderChecklist() {
    const saved = loadJson(STORAGE_KEYS.checklist, {});
    const list = $("#pre-trip-checklist");
    list.innerHTML = TRIP_DATA.preTripChecklist
      .map((text, index) => {
        const id = `check-${index}`;
        const checked = Boolean(saved[text]);
        return `
          <li>
            <label class="check-label" for="${id}">
              <input type="checkbox" id="${id}" data-item="${escapeAttr(text)}" ${checked ? "checked" : ""} />
              <span class="${checked ? "done" : ""}">${text}</span>
            </label>
          </li>`;
      })
      .join("");

    list.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
      const state = loadJson(STORAGE_KEYS.checklist, {});
      state[input.dataset.item] = input.checked;
      saveJson(STORAGE_KEYS.checklist, state);
      input.nextElementSibling?.classList.toggle("done", input.checked);
    });
  }

  function renderDayPicker() {
    const picker = $("#day-picker");
    picker.innerHTML = TRIP_DATA.days
      .map(
        (day) => `
        <button type="button" class="day-chip ${day.id === activeDayId ? "is-active" : ""}" data-day="${day.id}">
          ${day.label}
        </button>`
      )
      .join("");
  }

  function getDayIndex(dayId = activeDayId) {
    return TRIP_DATA.days.findIndex((day) => day.id === dayId);
  }

  function updateDaySwipeHint() {
    const hint = $("#day-swipe-hint");
    if (!hint) return;
    const index = getDayIndex();
    const day = TRIP_DATA.days[index];
    if (!day) return;
    hint.textContent = `Dag ${index + 1} av ${TRIP_DATA.days.length} · svep för att byta`;
  }

  function selectDay(dayId, swipeDirection = 0) {
    if (dayId === activeDayId) return;

    const content = $("#day-swipe-content");
    if (content && swipeDirection !== 0) {
      content.classList.remove("slide-from-left", "slide-from-right");
      void content.offsetWidth;
      content.classList.add(swipeDirection > 0 ? "slide-from-left" : "slide-from-right");
    }

    activeDayId = dayId;
    renderDayPicker();
    renderDayContent();
    updateDaySwipeHint();

    const activeChip = document.querySelector(`[data-day="${dayId}"]`);
    activeChip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function selectAdjacentDay(offset) {
    const index = getDayIndex();
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= TRIP_DATA.days.length) return false;
    selectDay(TRIP_DATA.days[nextIndex].id, offset);
    return true;
  }

  function renderDayContent() {
    const day = TRIP_DATA.days.find((d) => d.id === activeDayId) ?? TRIP_DATA.days[0];
    const content = $("#day-content");
    content.innerHTML = `
      <div class="day-emoji" aria-hidden="true">${day.emoji}</div>
      <h3>${day.title}</h3>
      <ul class="day-items">
        ${day.items.map((item) => `<li>${item}</li>`).join("")}
      </ul>`;

    const addressList = $("#day-addresses");
    if (!day.addresses.length) {
      addressList.innerHTML = `<li class="help-text">Inga särskilda adresser den här dagen.</li>`;
      return;
    }

    addressList.innerHTML = day.addresses
      .map((key) => renderAddressItem(TRIP_DATA.addresses[key]))
      .join("");
  }

  function renderAddressItem(addr) {
    if (!addr) return "";
    return `
      <li>
        <span class="address-name">${addr.name}</span>
        <span class="address-text">${addr.address}</span>
        <a class="map-link" href="${mapsUrl(addr.maps)}" target="_blank" rel="noopener noreferrer">Öppna i kartor</a>
      </li>`;
  }

  function renderMer() {
    $("#all-addresses").innerHTML = Object.values(TRIP_DATA.addresses)
      .map((addr) => renderAddressItem(addr))
      .join("");

    $("#distances-table").innerHTML = TRIP_DATA.distances
      .map((row) => `<tr><td>${row.route}</td><td>${row.distance}</td><td>${row.time}</td></tr>`)
      .join("");

    $("#ev-tips").innerHTML = TRIP_DATA.evTips.map((tip) => `<li>${tip}</li>`).join("");
    $("#useful-links").innerHTML = TRIP_DATA.links
      .map((link) => `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a></li>`)
      .join("");
  }

  function packingItemKey(personId, item) {
    return `${personId}|${item}`;
  }

  function countPacked(person, state) {
    let total = 0;
    let done = 0;
    for (const group of person.groups) {
      for (const item of group.items) {
        total += 1;
        if (state[packingItemKey(person.id, item)]) done += 1;
      }
    }
    return { done, total };
  }

  function renderPacking() {
    const container = $("#packing-sections");
    if (!container) return;
    const state = loadJson(STORAGE_KEYS.packing, {});

    container.innerHTML = TRIP_DATA.packing
      .map((person) => {
        const { done, total } = countPacked(person, state);
        const groupsHtml = person.groups
          .map((group) => {
            const itemsHtml = group.items
              .map((item) => {
                const key = packingItemKey(person.id, item);
                const checked = Boolean(state[key]);
                return `
                  <li>
                    <label class="check-label">
                      <input type="checkbox" data-pack-key="${escapeAttr(key)}" data-pack-person="${person.id}" ${checked ? "checked" : ""} />
                      <span class="${checked ? "done" : ""}">${item}</span>
                    </label>
                  </li>`;
              })
              .join("");
            return `
              <h4 class="packing-group-title">${group.title}</h4>
              <ul class="checklist">${itemsHtml}</ul>`;
          })
          .join("");

        return `
          <article class="card packing-card" data-packing-person="${person.id}">
            <div class="card-header-row">
              <h3>${person.emoji} Packlista ${person.name}</h3>
              <span class="save-status" data-pack-count="${person.id}">${done} av ${total} packat</span>
            </div>
            ${groupsHtml}
          </article>`;
      })
      .join("");

    container.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
      const key = input.dataset.packKey;
      if (!key) return;

      const saved = loadJson(STORAGE_KEYS.packing, {});
      saved[key] = input.checked;
      saveJson(STORAGE_KEYS.packing, saved);
      input.nextElementSibling?.classList.toggle("done", input.checked);

      const personId = input.dataset.packPerson;
      const person = TRIP_DATA.packing.find((p) => p.id === personId);
      const countEl = $(`[data-pack-count="${personId}"]`);
      if (person && countEl) {
        const { done, total } = countPacked(person, saved);
        countEl.textContent = `${done} av ${total} packat`;
      }
    });
  }

  function getNotes() {
    return loadJson(STORAGE_KEYS.notes, []);
  }

  function saveNotes(notes) {
    saveJson(STORAGE_KEYS.notes, notes);
    setSaveStatus("saved");
  }

  function saveDraft() {
    const draft = {
      id: editingNoteId,
      title: $("#note-title").value.trim(),
      body: $("#note-body").value,
    };
    saveJson(STORAGE_KEYS.draft, draft);
    setSaveStatus("saved");
  }

  function loadDraft() {
    const draft = loadJson(STORAGE_KEYS.draft, null);
    if (!draft) return;
    editingNoteId = draft.id;
    $("#note-title").value = draft.title || "";
    $("#note-body").value = draft.body || "";
  }

  function scheduleAutoSave() {
    setSaveStatus("pending");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveDraft();
      persistCurrentNote(false);
    }, 600);
  }

  function persistCurrentNote(showFeedback = true) {
    const title = $("#note-title").value.trim();
    const body = $("#note-body").value.trim();
    if (!title && !body) return;

    const notes = getNotes();
    const now = new Date().toISOString();

    if (editingNoteId) {
      const index = notes.findIndex((n) => n.id === editingNoteId);
      if (index >= 0) {
        notes[index] = { ...notes[index], title, body, updatedAt: now };
      }
    } else {
      editingNoteId = crypto.randomUUID();
      notes.unshift({ id: editingNoteId, title, body, createdAt: now, updatedAt: now });
    }

    saveNotes(notes);
    saveDraft();
    renderNotesList();
    if (showFeedback) setSaveStatus("saved");
  }

  function clearEditor() {
    editingNoteId = null;
    $("#note-title").value = "";
    $("#note-body").value = "";
    localStorage.removeItem(STORAGE_KEYS.draft);
    setSaveStatus("saved");
  }

  function renderNotesList() {
    const notes = getNotes();
    const list = $("#notes-list");
    const empty = $("#notes-empty");

    if (!notes.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.innerHTML = notes
      .map((note) => {
        const heading = note.title || "Utan rubrik";
        const preview = note.body.length > 120 ? `${note.body.slice(0, 120)}…` : note.body;
        return `
          <li>
            <div class="note-item-title">${escapeHtml(heading)}</div>
            <div class="note-item-meta">${formatDate(note.updatedAt || note.createdAt)}</div>
            <div class="note-item-preview">${escapeHtml(preview)}</div>
            <div class="note-actions">
              <button type="button" data-edit="${note.id}">Redigera</button>
              <button type="button" data-delete="${note.id}" class="btn-danger">Ta bort</button>
            </div>
          </li>`;
      })
      .join("");
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    const notes = getNotes();
    const lines = [
      "Resa Småland 2026 – Anteckningar",
      `Exporterad: ${new Date().toLocaleString("sv-SE")}`,
      "",
    ];

    if (!notes.length) {
      lines.push("(Inga anteckningar sparade)");
    } else {
      notes.forEach((note, index) => {
        lines.push(`--- Anteckning ${index + 1} ---`);
        lines.push(`Rubrik: ${note.title || "Utan rubrik"}`);
        lines.push(`Uppdaterad: ${formatDate(note.updatedAt || note.createdAt)}`);
        lines.push("");
        lines.push(note.body);
        lines.push("");
      });
    }

    downloadFile("resa-smaland-anteckningar.txt", lines.join("\n"), "text/plain;charset=utf-8");
  }

  function downloadJson() {
    const payload = {
      trip: "Resa Småland 2026",
      exportedAt: new Date().toISOString(),
      notes: getNotes(),
    };
    downloadFile(
      "resa-smaland-anteckningar.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  function escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(text) {
    return text.replaceAll('"', "&quot;");
  }

  function initLocation() {
    const todayId = getTodayDayId();
    if (todayId) {
      selectDay(todayId);
      const day = TRIP_DATA.days.find((d) => d.id === todayId);
      const todayEl = $("#location-today");
      todayEl.hidden = false;
      todayEl.textContent = `Idag i planen: ${day.title}`;
    }

    $("#btn-update-location").addEventListener("click", requestLocation);

    if ("geolocation" in navigator) {
      requestLocation();
    } else {
      setLocationStatus("Din webbläsare stödjer inte GPS.", "error");
    }
  }

  function setLocationStatus(message, state = "idle") {
    const status = $("#location-status");
    const badge = $("#location-badge");
    status.textContent = message;
    badge.className = "location-badge";
    if (state === "loading") badge.classList.add("is-loading");
    if (state === "ok") badge.classList.add("is-ok");
    if (state === "error") badge.classList.add("is-error");
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Din webbläsare stödjer inte GPS.", "error");
      return;
    }

    setLocationStatus("Söker er plats…", "loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentPosition = pos;
        renderLocation(pos);
      },
      (err) => {
        const messages = {
          1: "Plats nekad. Tillåt platsåtkomst i webbläsaren.",
          2: "Kunde inte hitta platsen just nu.",
          3: "GPS tog för lång tid. Försök igen.",
        };
        setLocationStatus(messages[err.code] ?? "Kunde inte läsa GPS.", "error");
        $("#location-nearest").hidden = true;
        $("#btn-open-maps").hidden = true;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function renderLocation(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    const nearest = findNearestPlace(latitude, longitude);
    const accuracyText = accuracy ? ` (±${Math.round(accuracy)} m)` : "";

    setLocationStatus(
      `Ni är ungefär här: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracyText}`,
      "ok"
    );

    const nearestEl = $("#location-nearest");
    nearestEl.hidden = false;
    nearestEl.innerHTML = nearest
      ? `<strong>Närmast:</strong> ${nearest.name} – ca ${formatDistance(nearest.distanceKm)} bort`
      : "";

    const mapsBtn = $("#btn-open-maps");
    mapsBtn.hidden = false;
    mapsBtn.href = mapsCoordsUrl(latitude, longitude);
  }

  function revokePhotoUrls() {
    photoObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    photoObjectUrls.clear();
  }

  async function renderPhotoGallery() {
    const grid = $("#photo-grid");
    const empty = $("#photos-empty");
    const downloadRow = $("#photo-download-row");
    const countEl = $("#photo-count");
    const modeHint = $("#photo-storage-mode");

    revokePhotoUrls();

    if (window.TripAuth?.refreshSession) {
      await window.TripAuth.refreshSession().catch(() => null);
    }

    let photos = [];
    try {
      photos = await window.PhotoStore.listPhotos();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte hämta bilder.";
      if (grid) grid.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.textContent = message;
      }
      if (downloadRow) downloadRow.hidden = true;
      if (countEl) countEl.textContent = "0 bilder";
      return;
    }

    countEl.textContent = `${photos.length} bild${photos.length === 1 ? "" : "er"}`;

    const mode = window.PhotoStore.storageMode();
    const canEdit = mode !== "cloud-read";

    if (modeHint) {
      const showingLocalFallback =
        mode === "cloud" && photos.length > 0 && photos.every((photo) => photo.blob && !photo.imageUrl);

      if (showingLocalFallback) {
        modeHint.textContent =
          "Bilderna finns bara på den här telefonen. Ladda upp igen (medan du är inloggad) för att dela i molnet.";
      } else {
        modeHint.textContent =
          mode === "cloud"
            ? "Molnläge — ni ser samma bilder och kan ladda upp."
            : mode === "cloud-read"
              ? "Gästläge — alla kan titta. Bara Niklas & Elin kan ladda upp."
              : "Lokalt läge — bilderna finns bara i den här telefonen.";
      }
    }

    if (!photos.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      if (window.PhotoStore.isCloudActive()) {
        empty.textContent = "Inga molnbilder ännu. Ladda upp en bild ovan (medan du är inloggad).";
      } else if (mode === "cloud-read") {
        empty.textContent = "Inga bilder ännu — kika tillbaka snart!";
      } else {
        empty.textContent = "Inga bilder ännu. Ladda upp ovan!";
      }
      downloadRow.hidden = true;
      return;
    }

    empty.hidden = true;
    downloadRow.hidden = false;
    grid.innerHTML = photos
      .map((photo) => {
        const url = photo.imageUrl || URL.createObjectURL(photo.blob);
        if (!photo.imageUrl) {
          photoObjectUrls.set(photo.id, url);
        }
        const captionHtml = canEdit
          ? `<input type="text" class="text-input photo-caption-input" data-caption="${photo.id}" value="${escapeAttr(photo.caption || "")}" placeholder="Bildtext…" />`
          : photo.caption
            ? `<p class="photo-caption-static">${escapeAttr(photo.caption)}</p>`
            : "";
        const actionsHtml = canEdit
          ? `<div class="photo-card-actions">
                <button type="button" data-download-photo="${photo.id}">Ladda ner</button>
                <button type="button" data-delete-photo="${photo.id}" class="btn-danger">Ta bort</button>
              </div>`
          : `<div class="photo-card-actions">
                <button type="button" data-download-photo="${photo.id}">Ladda ner</button>
              </div>`;
        return `
          <figure class="photo-card" data-photo-id="${photo.id}">
            <img src="${url}" alt="${escapeAttr(photo.caption || "Resebild")}" loading="lazy" />
            <figcaption>
              ${captionHtml}
              ${actionsHtml}
            </figcaption>
          </figure>`;
      })
      .join("");
  }

  async function handlePhotoUpload(file) {
    const status = $("#photo-upload-status");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      status.textContent = "Välj en bildfil.";
      return;
    }

    status.textContent = "Sparar bild…";
    try {
      if (window.TripAuth?.refreshSession) {
        await window.TripAuth.refreshSession();
      }
      if (window.PhotoStore.isCloudEnabled() && !window.TripAuth?.isSignedIn()) {
        throw new Error("Du måste logga in under Bilder innan du laddar upp.");
      }

      const caption = $("#photo-caption").value;
      await window.PhotoStore.addPhoto(file, caption);
      $("#photo-caption").value = "";
      $("#photo-input").value = "";
      status.textContent = window.PhotoStore.isCloudActive()
        ? "Bilden är sparad i molnet!"
        : "Bilden är sparad lokalt på telefonen.";
      await renderPhotoGallery();
      const count = (await window.PhotoStore.listPhotos()).length;
      if (window.PhotoStore.isCloudActive() && count === 0) {
        status.textContent =
          "Uppladdningen lyckades inte synkas. Tryck Uppdatera galleri eller ladda upp igen.";
      }
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Kunde inte spara bilden.";
    }
  }

  async function downloadAllPhotos() {
    const photos = await window.PhotoStore.listPhotos();
    if (!photos.length) return;

    for (const [index, photo] of photos.entries()) {
      if (photo.blob) {
        const url = URL.createObjectURL(photo.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = photo.fileName || `resa-bild-${index + 1}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (photo.imageUrl) {
        const link = document.createElement("a");
        link.href = photo.imageUrl;
        link.download = photo.fileName || `resa-bild-${index + 1}.jpg`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  function initPhotos() {
    $("#photo-input").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      handlePhotoUpload(file);
    });

    $("#btn-download-all-photos").addEventListener("click", downloadAllPhotos);

    $("#photo-grid").addEventListener("click", async (event) => {
      const downloadBtn = event.target.closest("[data-download-photo]");
      const deleteBtn = event.target.closest("[data-delete-photo]");

      if (downloadBtn) {
        const photo = await window.PhotoStore.getPhoto(downloadBtn.dataset.downloadPhoto);
        if (!photo) return;
        if (photo.blob) {
          const url = URL.createObjectURL(photo.blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = photo.fileName || "resa-bild.jpg";
          link.click();
          URL.revokeObjectURL(url);
          return;
        }
        if (photo.imageUrl) {
          const link = document.createElement("a");
          link.href = photo.imageUrl;
          link.download = photo.fileName || "resa-bild.jpg";
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.click();
        }
        return;
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.deletePhoto;
        if (!confirm("Ta bort bilden?")) return;
        await window.PhotoStore.deletePhoto(id);
        await renderPhotoGallery();
      }
    });

    $("#photo-grid").addEventListener(
      "change",
      async (event) => {
        const input = event.target.closest("[data-caption]");
        if (!input) return;
        await window.PhotoStore.updateCaption(input.dataset.caption, input.value);
      },
      true
    );

    $("#btn-refresh-photos")?.addEventListener("click", async () => {
      const status = $("#photo-upload-status");
      if (status) status.textContent = "Hämtar bilder…";
      try {
        if (window.TripAuth?.refreshSession) {
          await window.TripAuth.refreshSession();
        }
        await renderPhotoGallery();
        if (status) status.textContent = "";
      } catch (error) {
        if (status) {
          status.textContent =
            error instanceof Error ? error.message : "Kunde inte hämta bilder.";
        }
      }
    });

    window.PhotoStore.refreshGallery = renderPhotoGallery;
  }

  function initTabs() {
    const buttons = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab-panel");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
        panels.forEach((panel) => {
          const isActive = panel.id === `tab-${tab}`;
          panel.classList.toggle("is-active", isActive);
          panel.hidden = !isActive;
        });
      });
    });
  }

  function initNotes() {
    loadDraft();
    renderNotesList();

    $("#note-title").addEventListener("input", scheduleAutoSave);
    $("#note-body").addEventListener("input", scheduleAutoSave);
    $("#btn-save-note").addEventListener("click", () => persistCurrentNote(true));
    $("#btn-new-note").addEventListener("click", clearEditor);
    $("#btn-download-txt").addEventListener("click", downloadTxt);
    $("#btn-download-json").addEventListener("click", downloadJson);

    $("#notes-list").addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit]");
      const deleteBtn = event.target.closest("[data-delete]");

      if (editBtn) {
        const note = getNotes().find((n) => n.id === editBtn.dataset.edit);
        if (!note) return;
        editingNoteId = note.id;
        $("#note-title").value = note.title || "";
        $("#note-body").value = note.body || "";
        saveDraft();
        document.querySelector('[data-tab="anteckningar"]').click();
        $("#note-body").focus();
        return;
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.delete;
        const notes = getNotes().filter((n) => n.id !== id);
        saveNotes(notes);
        if (editingNoteId === id) clearEditor();
        renderNotesList();
      }
    });
  }

  function initDayPicker() {
    $("#day-picker").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-day]");
      if (!btn) return;
      selectDay(btn.dataset.day);
    });
    updateDaySwipeHint();
  }

  function initDaySwipe() {
    const area = $("#day-swipe-area");
    const content = $("#day-swipe-content");
    if (!area || !content) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let isHorizontal = false;

    area.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        tracking = true;
        isHorizontal = false;
        content.classList.remove("slide-from-left", "slide-from-right");
        content.style.transition = "none";
      },
      { passive: true }
    );

    area.addEventListener(
      "touchmove",
      (event) => {
        if (!tracking || event.touches.length !== 1) return;

        const dx = event.touches[0].clientX - startX;
        const dy = event.touches[0].clientY - startY;

        if (!isHorizontal) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          isHorizontal = Math.abs(dx) > Math.abs(dy);
        }

        if (!isHorizontal) return;

        const atFirst = getDayIndex() === 0;
        const atLast = getDayIndex() === TRIP_DATA.days.length - 1;
        let offset = dx;
        if ((atFirst && dx > 0) || (atLast && dx < 0)) offset = dx * 0.35;

        content.style.transform = `translateX(${offset}px)`;
      },
      { passive: true }
    );

    area.addEventListener(
      "touchend",
      (event) => {
        if (!tracking) return;
        tracking = false;
        content.style.transition = "";

        const endX = event.changedTouches[0]?.clientX ?? startX;
        const dx = endX - startX;
        content.style.transform = "";

        if (!isHorizontal || Math.abs(dx) < 60) return;

        if (dx < 0) {
          selectAdjacentDay(1);
        } else {
          selectAdjacentDay(-1);
        }
      },
      { passive: true }
    );
  }

  function init() {
    renderQuote();
    renderOverview();
    renderChecklist();
    renderDayPicker();
    renderDayContent();
    renderMer();
    renderPacking();
    initDayPicker();
    initDaySwipe();
    initLocation();
    window.TripAuth?.initAuth();
    initPhotos();
    initTabs();
    initNotes();
    window.TripMusic?.initMusic();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
