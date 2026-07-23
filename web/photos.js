(function () {
  const DB_NAME = "resa-smaland-photos-v1";
  const STORE = "photos";
  const DB_VERSION = 1;

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
    });
  }

  async function compressImage(file, maxWidth = 1200) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("Kunde inte komprimera bilden.");
    return blob;
  }

  async function addPhoto(file, caption = "") {
    const blob = await compressImage(file);
    const photo = {
      id: crypto.randomUUID(),
      caption: caption.trim(),
      createdAt: new Date().toISOString(),
      blob,
      mimeType: "image/jpeg",
      fileName: file.name || `resa-${Date.now()}.jpg`,
    };

    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(photo);
    });
    db.close();
    return photo.id;
  }

  async function listPhotos() {
    const db = await openDb();
    const photos = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function getPhoto(id) {
    const db = await openDb();
    const photo = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return photo;
  }

  async function updateCaption(id, caption) {
    const photo = await getPhoto(id);
    if (!photo) return;
    photo.caption = caption.trim();
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(photo);
    });
    db.close();
  }

  async function deletePhoto(id) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(id);
    });
    db.close();
  }

  window.PhotoStore = {
    addPhoto,
    listPhotos,
    getPhoto,
    updateCaption,
    deletePhoto,
  };
})();
