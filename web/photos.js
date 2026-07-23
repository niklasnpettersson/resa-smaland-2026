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

  const LocalStore = {
    async addPhoto(file, caption = "") {
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
    },

    async listPhotos() {
      const db = await openDb();
      const photos = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).getAll();
        request.onsuccess = () => resolve(request.result ?? []);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return photos
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((photo) => ({
          id: photo.id,
          caption: photo.caption,
          createdAt: photo.createdAt,
          fileName: photo.fileName,
          blob: photo.blob,
          storagePath: null,
          imageUrl: null,
        }));
    },

    async getPhoto(id) {
      const db = await openDb();
      const photo = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).get(id);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      if (!photo) return null;
      return {
        id: photo.id,
        caption: photo.caption,
        createdAt: photo.createdAt,
        fileName: photo.fileName,
        blob: photo.blob,
        storagePath: null,
        imageUrl: null,
      };
    },

    async updateCaption(id, caption) {
      const db = await openDb();
      const photo = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).get(id);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
      if (!photo) {
        db.close();
        return;
      }
      photo.caption = caption.trim();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).put(photo);
      });
      db.close();
    },

    async deletePhoto(id) {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).delete(id);
      });
      db.close();
    },
  };

  const CloudStore = {
    storagePath(fileName) {
      const folder = window.SupabaseClient.TRIP_FOLDER;
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      return `${folder}/${crypto.randomUUID()}-${safeName || "bild.jpg"}`;
    },

    publicUrl(storagePath) {
      const client = window.SupabaseClient.getClient();
      const { data } = client.storage
        .from(window.SupabaseClient.BUCKET)
        .getPublicUrl(storagePath);
      return data.publicUrl;
    },

    async addPhoto(file, caption = "") {
      const blob = await compressImage(file);
      const fileName = file.name || `resa-${Date.now()}.jpg`;
      const storagePath = this.storagePath(fileName.endsWith(".jpg") ? fileName : `${fileName}.jpg`);
      const client = window.SupabaseClient.getClient();

      const { error: uploadError } = await client.storage
        .from(window.SupabaseClient.BUCKET)
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (uploadError) {
        throw new Error(`Uppladdning misslyckades: ${uploadError.message}`);
      }

      const { data, error } = await client
        .from("trip_photos")
        .insert({ storage_path: storagePath, caption: caption.trim() })
        .select("id, storage_path, caption, created_at")
        .single();
      if (error) {
        throw new Error(`Bilden laddades upp men kunde inte sparas i listan: ${error.message}`);
      }

      return data.id;
    },

    async listPhotos() {
      const client = window.SupabaseClient.getClient();
      const { data, error } = await client
        .from("trip_photos")
        .select("id, storage_path, caption, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Kunde inte läsa bildlistan: ${error.message}`);

      return (data ?? []).map((row) => ({
        id: row.id,
        caption: row.caption,
        createdAt: row.created_at,
        fileName: row.storage_path.split("/").pop() || "resa-bild.jpg",
        blob: null,
        storagePath: row.storage_path,
        imageUrl: this.publicUrl(row.storage_path),
      }));
    },

    async getPhoto(id) {
      const client = window.SupabaseClient.getClient();
      const { data, error } = await client
        .from("trip_photos")
        .select("id, storage_path, caption, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        caption: data.caption,
        createdAt: data.created_at,
        fileName: data.storage_path.split("/").pop() || "resa-bild.jpg",
        blob: null,
        storagePath: data.storage_path,
        imageUrl: this.publicUrl(data.storage_path),
      };
    },

    async updateCaption(id, caption) {
      const client = window.SupabaseClient.getClient();
      const { error } = await client.from("trip_photos").update({ caption: caption.trim() }).eq("id", id);
      if (error) throw error;
    },

    async deletePhoto(id) {
      const photo = await this.getPhoto(id);
      if (!photo) return;
      const client = window.SupabaseClient.getClient();

      const { error: storageError } = await client.storage
        .from(window.SupabaseClient.BUCKET)
        .remove([photo.storagePath]);
      if (storageError) throw storageError;

      const { error } = await client.from("trip_photos").delete().eq("id", id);
      if (error) throw error;
    },
  };

  window.PhotoStore = {
    isCloudEnabled() {
      return Boolean(window.SupabaseClient?.isConfigured());
    },

    // Signed in = may upload/edit. Guests can still view cloud photos.
    isCloudActive() {
      return this.isCloudEnabled() && window.TripAuth?.isSignedIn();
    },

    storageMode() {
      if (this.isCloudActive()) return "cloud";
      if (this.isCloudEnabled()) return "cloud-read";
      return "local";
    },

    async addPhoto(file, caption = "") {
      if (this.isCloudEnabled() && !window.TripAuth?.isSignedIn()) {
        throw new Error("Bara Niklas & Elin kan ladda upp bilder — logga in först.");
      }
      const store = this.isCloudActive() ? CloudStore : LocalStore;
      return store.addPhoto(file, caption);
    },

    listPhotos() {
      if (this.isCloudEnabled()) {
        return CloudStore.listPhotos().then(async (cloudPhotos) => {
          if (cloudPhotos.length) return cloudPhotos;
          return LocalStore.listPhotos();
        });
      }
      return LocalStore.listPhotos();
    },

    listLocalPhotos() {
      return LocalStore.listPhotos();
    },

    getPhoto(id) {
      const store = this.isCloudEnabled() ? CloudStore : LocalStore;
      return store.getPhoto(id);
    },

    updateCaption(id, caption) {
      if (this.isCloudEnabled() && !window.TripAuth?.isSignedIn()) {
        return Promise.reject(new Error("Logga in för att ändra bildtexter."));
      }
      const store = this.isCloudActive() ? CloudStore : LocalStore;
      return store.updateCaption(id, caption);
    },

    deletePhoto(id) {
      if (this.isCloudEnabled() && !window.TripAuth?.isSignedIn()) {
        return Promise.reject(new Error("Logga in för att ta bort bilder."));
      }
      const store = this.isCloudActive() ? CloudStore : LocalStore;
      return store.deletePhoto(id);
    },

    refreshGallery: null,
  };
})();
