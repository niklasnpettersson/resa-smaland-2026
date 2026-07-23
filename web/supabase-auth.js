(function () {
  function $(sel) {
    return document.querySelector(sel);
  }

  function isSignedIn() {
    return Boolean(window.__resaAuthSession);
  }

  function updateAuthUi() {
    const panel = $("#photo-auth-panel");
    const uploadCard = $("#photo-upload-card");
    const signedIn = isSignedIn();
    const cloud = window.SupabaseClient?.isConfigured();

    if (!panel || !uploadCard) return;

    if (!cloud) {
      panel.hidden = true;
      uploadCard.hidden = false;
      return;
    }

    panel.hidden = signedIn;
    uploadCard.hidden = !signedIn;

    const signOutRow = $("#photo-signout-row");
    if (signOutRow) signOutRow.hidden = !signedIn;

    const status = $("#photo-auth-status");
    if (status) {
      status.hidden = !signedIn;
      if (signedIn) {
        status.textContent = `Inloggad: ${window.__resaAuthSession.user.email}`;
      }
    }
  }

  async function refreshSession() {
    if (!window.SupabaseClient?.isConfigured()) return null;
    const client = window.SupabaseClient.getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    window.__resaAuthSession = data.session;
    updateAuthUi();
    return data.session;
  }

  async function signIn(email, password) {
    const client = window.SupabaseClient.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.__resaAuthSession = data.session;
    updateAuthUi();
    if (window.PhotoStore?.refreshGallery) {
      await window.PhotoStore.refreshGallery();
    }
    return data.session;
  }

  async function signOut() {
    if (!window.SupabaseClient?.isConfigured()) return;
    const client = window.SupabaseClient.getClient();
    await client.auth.signOut();
    window.__resaAuthSession = null;
    updateAuthUi();
    if (window.PhotoStore?.refreshGallery) {
      await window.PhotoStore.refreshGallery();
    }
  }

  function initAuth() {
    if (!window.SupabaseClient?.isConfigured()) {
      updateAuthUi();
      return;
    }

    const form = $("#photo-auth-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = $("#photo-auth-message");
      const email = $("#photo-auth-email").value.trim();
      const password = $("#photo-auth-password").value;

      status.textContent = "Loggar in…";
      try {
        await signIn(email, password);
        status.textContent = "Inloggad! Bilderna delas nu i molnet.";
        $("#photo-auth-password").value = "";
      } catch (error) {
        status.textContent =
          error instanceof Error ? error.message : "Kunde inte logga in.";
      }
    });

    $("#btn-photo-sign-out")?.addEventListener("click", async () => {
      await signOut();
      $("#photo-auth-message").textContent = "Utloggad.";
    });

    const client = window.SupabaseClient.getClient();
    client.auth.onAuthStateChange((_event, session) => {
      window.__resaAuthSession = session;
      updateAuthUi();
      if (window.PhotoStore?.refreshGallery) {
        window.PhotoStore.refreshGallery();
      }
    });

    refreshSession()
      .then(() => {
        if (window.PhotoStore?.refreshGallery) {
          return window.PhotoStore.refreshGallery();
        }
        return null;
      })
      .catch(() => {
        $("#photo-auth-message").textContent =
          "Kunde inte läsa inloggning. Försök logga in igen.";
      });
  }

  window.TripAuth = {
    isSignedIn,
    refreshSession,
    signIn,
    signOut,
    updateAuthUi,
    initAuth,
  };
})();
